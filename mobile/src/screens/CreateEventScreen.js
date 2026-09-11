import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Image, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { theme } from '../theme';
import { api, imageUrl } from '../api/client';
import { Button, Field, Note } from '../components/ui';
import { useAuth } from '../context/AuthContext';

/** Build the multipart file entry React Native expects. */
function filePart(asset, fallbackName) {
  return {
    uri: Platform.OS === 'ios' ? asset.uri.replace('file://', '') : asset.uri,
    name: asset.fileName || fallbackName,
    type: asset.mimeType || 'image/jpeg'
  };
}

export default function CreateEventScreen({ route, navigation }) {
  const { user, isOrganizer } = useAuth();
  const eventId = route.params && route.params.eventId;
  const isEdit = !!eventId;

  const [form, setForm] = useState({
    title: '', description: '', location: '', date: '', registrationUrl: ''
  });
  const [categories, setCategories] = useState([]);
  const [category, setCategory] = useState('Other');
  const [image, setImage] = useState(null);
  const [qrFile, setQrFile] = useState(null);
  const [existingQr, setExistingQr] = useState(null);
  const [note, setNote] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.categories().then(setCategories).catch(() => setCategories(['Other']));
  }, []);

  // Load the event being edited.
  useEffect(() => {
    if (!isEdit) return;
    api.getEvent(eventId)
      .then((ev) => {
        const d = new Date(ev.date);
        const pad = (n) => String(n).padStart(2, '0');
        setForm({
          title: ev.title || '',
          description: ev.description || '',
          location: ev.location || '',
          registrationUrl: ev.registrationUrl || '',
          date: isNaN(d) ? '' :
            `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
        });
        setCategory(ev.category || 'Other');
        setExistingQr(ev.qrImage ? { uri: imageUrl(ev.qrImage), source: ev.qrSource } : null);
      })
      .catch((err) => setNote({ kind: 'error', message: err.message }));
  }, [eventId, isEdit]);

  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));

  const pick = async (setter) => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setNote({ kind: 'error', message: 'Photo library permission is required.' });
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8
    });
    if (!result.canceled) setter(result.assets[0]);
  };

  const submit = async () => {
    setNote(null);

    if (!form.title.trim() || !form.date.trim()) {
      setNote({ kind: 'error', message: 'Title and date are required.' });
      return;
    }
    const parsed = new Date(form.date.trim().replace(' ', 'T'));
    if (isNaN(parsed)) {
      setNote({ kind: 'error', message: 'Use the date format YYYY-MM-DD HH:MM.' });
      return;
    }

    const fd = new FormData();
    fd.append('title', form.title.trim());
    fd.append('description', form.description.trim());
    fd.append('location', form.location.trim());
    fd.append('category', category);
    fd.append('date', parsed.toISOString());
    fd.append('registrationUrl', form.registrationUrl.trim());
    if (image) fd.append('image', filePart(image, `event-${Date.now()}.jpg`));
    if (qrFile) fd.append('qrImage', filePart(qrFile, `qr-${Date.now()}.png`));

    setBusy(true);
    try {
      if (isEdit) {
        await api.updateEvent(eventId, fd);
        setNote({ kind: 'ok', message: 'Changes saved.' });
      } else {
        await api.createEvent(fd);
        setForm({ title: '', description: '', location: '', date: '', registrationUrl: '' });
        setImage(null);
        setQrFile(null);
        setNote({ kind: 'ok', message: 'Event published.' });
      }
      navigation.navigate('Events');
    } catch (err) {
      setNote({ kind: 'error', message: err.message });
    } finally {
      setBusy(false);
    }
  };

  if (!isOrganizer) {
    return (
      <View style={s.center}>
        <Text style={s.muted}>Only organiser accounts can publish events.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={s.flex} contentContainerStyle={s.wrap} keyboardShouldPersistTaps="handled">
      {note ? <Note message={note.message} kind={note.kind} /> : null}

      <Field label="Title" value={form.title} onChangeText={set('title')} autoCapitalize="sentences" />
      <Field
        label="Description"
        value={form.description}
        onChangeText={set('description')}
        multiline
        autoCapitalize="sentences"
        style={s.textarea}
      />

      <Text style={s.label}>Category</Text>
      <View style={s.chips}>
        {categories.map((c) => (
          <TouchableOpacity
            key={c}
            style={[s.chip, category === c && s.chipActive]}
            onPress={() => setCategory(c)}
          >
            <Text style={[s.chipText, category === c && s.chipTextActive]}>{c}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Field
        label="Date and time"
        value={form.date}
        onChangeText={set('date')}
        placeholder="2026-11-14 09:00"
        hint="Format: YYYY-MM-DD HH:MM"
      />
      <Field label="Location" value={form.location} onChangeText={set('location')} autoCapitalize="sentences" />

      <Text style={s.label}>Institution</Text>
      <Text style={s.hint}>
        {(user.institution && user.institution.name) || 'Not set'} — events are visible to
        your campus only.
      </Text>

      <Text style={s.section}>Registration &amp; QR code</Text>
      <Text style={s.hint}>
        Every event gets a QR code. Paste a registration link and one is generated for you,
        or upload a code you already have.
      </Text>

      <Field
        label="Registration form link"
        value={form.registrationUrl}
        onChangeText={set('registrationUrl')}
        placeholder="https://forms.gle/..."
        keyboardType="url"
      />

      {existingQr && !qrFile ? (
        <View style={s.qrRow}>
          <Image source={{ uri: existingQr.uri }} style={s.qrPreview} />
          <Text style={s.muted}>
            {existingQr.source === 'uploaded' ? 'Your uploaded code.' : 'Generated from the link.'}
          </Text>
        </View>
      ) : null}

      {qrFile ? <Image source={{ uri: qrFile.uri }} style={s.qrPreview} /> : null}
      <Button
        title={qrFile ? 'Change QR image' : 'Upload your own QR code'}
        variant="secondary"
        onPress={() => pick(setQrFile)}
        style={{ marginBottom: 18 }}
      />

      <Text style={s.label}>Cover image</Text>
      {image ? <Image source={{ uri: image.uri }} style={s.preview} /> : null}
      <Button
        title={image ? 'Change image' : 'Choose an image'}
        variant="secondary"
        onPress={() => pick(setImage)}
        style={{ marginBottom: 18 }}
      />

      <Button title={isEdit ? 'Save changes' : 'Publish event'} onPress={submit} loading={busy} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1, backgroundColor: theme.colors.bg },
  wrap: { padding: 18, paddingBottom: 40 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.bg, padding: 24 },
  muted: { color: theme.colors.muted, fontSize: 14 },
  hint: { color: theme.colors.muted, fontSize: 13, marginBottom: 14 },
  label: { fontSize: 13, fontWeight: '500', color: theme.colors.text, marginBottom: 7 },
  section: { fontSize: 15, fontWeight: '600', color: theme.colors.text, marginTop: 8, marginBottom: 4 },
  textarea: { height: 90, textAlignVertical: 'top' },
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
  preview: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: theme.radius,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 10
  },
  qrRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  qrPreview: {
    width: 90,
    height: 90,
    borderRadius: theme.radius,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: '#fff',
    marginBottom: 10
  }
});
