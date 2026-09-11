import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { theme } from '../theme';
import { Button, Field, Note } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';

export default function RegisterScreen() {
  const { signUp } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [role, setRole] = useState('student');
  const [institutions, setInstitutions] = useState([]);
  const [institution, setInstitution] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.institutions().then(setInstitutions).catch(() => setInstitutions([]));
  }, []);

  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));

  const submit = async () => {
    setError('');
    if (!form.name.trim() || !form.email.trim() || !form.password) {
      setError('All fields are required.');
      return;
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    // Events are scoped per campus, so an account needs an institution.
    if (!institution) {
      setError('Choose your institution.');
      return;
    }
    setBusy(true);
    try {
      await signUp({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        role,
        institution
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView style={s.flex} contentContainerStyle={s.wrap} keyboardShouldPersistTaps="handled">
      <Note message={error} />

      <Field label="Full name" value={form.name} onChangeText={set('name')} autoCapitalize="words" />
      <Field label="Email" value={form.email} onChangeText={set('email')} keyboardType="email-address" />
      <Field
        label="Password"
        value={form.password}
        onChangeText={set('password')}
        secureTextEntry
        hint="At least 6 characters."
      />

      <Text style={s.label}>I am a</Text>
      <View style={s.chips}>
        {['student', 'organizer'].map((r) => (
          <TouchableOpacity
            key={r}
            style={[s.chip, role === r && s.chipActive]}
            onPress={() => setRole(r)}
          >
            <Text style={[s.chipText, role === r && s.chipTextActive]}>
              {r === 'student' ? 'Student' : 'Organizer'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={s.label}>Institution</Text>
      <Text style={s.hint}>You will see events from this campus.</Text>
      <View style={s.chips}>
        {institutions.map((i) => (
          <TouchableOpacity
            key={i._id}
            style={[s.chip, institution === i._id && s.chipActive]}
            onPress={() => setInstitution(institution === i._id ? null : i._id)}
          >
            <Text style={[s.chipText, institution === i._id && s.chipTextActive]}>{i.name}</Text>
          </TouchableOpacity>
        ))}
        {institutions.length === 0 ? <Text style={s.muted}>No institutions available.</Text> : null}
      </View>

      <Button title="Create account" onPress={submit} loading={busy} style={{ marginTop: 8 }} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1, backgroundColor: theme.colors.bg },
  wrap: { padding: 18, paddingBottom: 40 },
  label: { fontSize: 13, fontWeight: '500', color: theme.colors.text, marginBottom: 7 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 18 },
  chip: {
    borderWidth: 1,
    borderColor: theme.colors.borderStrong,
    borderRadius: theme.radius,
    paddingHorizontal: 11,
    paddingVertical: 7,
    backgroundColor: theme.colors.surface
  },
  chipActive: { backgroundColor: theme.colors.ink, borderColor: theme.colors.ink },
  chipText: { fontSize: 14, color: theme.colors.text },
  chipTextActive: { color: '#fff' },
  muted: { color: theme.colors.muted, fontSize: 14 },
  hint: { color: theme.colors.muted, fontSize: 12, marginTop: -3, marginBottom: 8 }
});
