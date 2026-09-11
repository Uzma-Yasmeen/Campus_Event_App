import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Image } from 'react-native';
import { theme } from '../theme';
import { api, imageUrl } from '../api/client';
import { Button, Field, Note } from '../components/ui';
import { useAuth } from '../context/AuthContext';

function initials(name) {
  return String(name || '?').trim().split(/\s+/).slice(0, 2).map((p) => p[0]).join('').toUpperCase();
}

export default function ProfileScreen() {
  const { user, isOrganizer, signOut, updateUser } = useAuth();

  const [form, setForm] = useState({ name: user.name || '', email: user.email || '' });
  const [passwords, setPasswords] = useState({ oldPassword: '', newPassword: '' });
  const [note, setNote] = useState(null);
  const [busy, setBusy] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    api.profile()
      .then((me) => setForm({ name: me.name || '', email: me.email || '' }))
      .catch(() => {});
  }, []);

  const saveProfile = async () => {
    setNote(null);
    if (!form.name.trim() || !form.email.trim()) {
      setNote({ kind: 'error', message: 'Name and email are required.' });
      return;
    }
    setBusy(true);
    try {
      const updated = await api.updateProfile({ name: form.name.trim(), email: form.email.trim() });
      updateUser({ name: updated.name, email: updated.email });
      setNote({ kind: 'ok', message: 'Profile updated.' });
    } catch (err) {
      setNote({ kind: 'error', message: err.message });
    } finally {
      setBusy(false);
    }
  };

  const savePassword = async () => {
    setNote(null);
    if (!passwords.oldPassword || !passwords.newPassword) {
      setNote({ kind: 'error', message: 'Enter both your current and new password.' });
      return;
    }
    if (passwords.newPassword.length < 6) {
      setNote({ kind: 'error', message: 'New password must be at least 6 characters.' });
      return;
    }
    setSavingPassword(true);
    try {
      await api.changePassword(passwords);
      setPasswords({ oldPassword: '', newPassword: '' });
      setNote({ kind: 'ok', message: 'Password updated.' });
    } catch (err) {
      setNote({ kind: 'error', message: err.message });
    } finally {
      setSavingPassword(false);
    }
  };

  const institutionName = user.institution && user.institution.name;

  return (
    <ScrollView style={s.flex} contentContainerStyle={s.wrap} keyboardShouldPersistTaps="handled">
      <View style={s.identity}>
        {user.avatar ? (
          <Image source={{ uri: imageUrl(user.avatar) }} style={s.avatar} />
        ) : (
          <View style={[s.avatar, s.avatarFallback]}>
            <Text style={s.avatarText}>{initials(user.name)}</Text>
          </View>
        )}
        <View style={{ flex: 1 }}>
          <Text style={s.name}>{user.name}</Text>
          <Text style={s.meta}>{user.email}</Text>
          <View style={s.badge}>
            <Text style={s.badgeText}>{isOrganizer ? 'Organizer' : 'Participant'}</Text>
          </View>
          {institutionName ? <Text style={s.meta}>{institutionName}</Text> : null}
        </View>
      </View>

      {note ? <Note message={note.message} kind={note.kind} /> : null}

      <Text style={s.section}>Account details</Text>
      <Field label="Full name" value={form.name} onChangeText={(v) => setForm((f) => ({ ...f, name: v }))} autoCapitalize="words" />
      <Field label="Email" value={form.email} onChangeText={(v) => setForm((f) => ({ ...f, email: v }))} keyboardType="email-address" />
      <Button title="Save changes" onPress={saveProfile} loading={busy} />

      <Text style={s.section}>Change password</Text>
      <Field
        label="Current password"
        value={passwords.oldPassword}
        onChangeText={(v) => setPasswords((p) => ({ ...p, oldPassword: v }))}
        secureTextEntry
      />
      <Field
        label="New password"
        value={passwords.newPassword}
        onChangeText={(v) => setPasswords((p) => ({ ...p, newPassword: v }))}
        secureTextEntry
        hint="At least 6 characters."
      />
      <Button title="Update password" onPress={savePassword} loading={savingPassword} />

      <View style={s.divider} />
      <Button title="Sign out" variant="secondary" onPress={signOut} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1, backgroundColor: theme.colors.bg },
  wrap: { padding: 18, paddingBottom: 40 },
  identity: { flexDirection: 'row', gap: 14, alignItems: 'center', marginBottom: 22 },
  avatar: { width: 56, height: 56, borderRadius: 28, borderWidth: 1, borderColor: theme.colors.border },
  avatarFallback: { backgroundColor: theme.colors.ink, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontSize: 18, fontWeight: '600' },
  name: { fontSize: 17, fontWeight: '600', color: theme.colors.text },
  meta: { fontSize: 13, color: theme.colors.muted, marginTop: 2 },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: '#f3f2ef',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 3,
    paddingHorizontal: 7,
    paddingVertical: 2,
    marginTop: 6
  },
  badgeText: { fontSize: 12, color: theme.colors.muted },
  section: { fontSize: 15, fontWeight: '600', color: theme.colors.text, marginTop: 26, marginBottom: 12 },
  divider: { height: 1, backgroundColor: theme.colors.border, marginVertical: 26 }
});
