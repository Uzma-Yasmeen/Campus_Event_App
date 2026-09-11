import React, { useState } from 'react';
import { View, Text, Image, ScrollView, StyleSheet, Alert, Linking, TouchableOpacity } from 'react-native';
import { theme } from '../theme';
import { api, imageUrl } from '../api/client';
import { Button, Note, Tag } from '../components/ui';
import { formatDate } from '../components/EventCard';
import { useAuth } from '../context/AuthContext';

export default function EventDetailsScreen({ route, navigation }) {
  const { event } = route.params;
  const { user, isOrganizer } = useAuth();

  const alreadyJoined = (event.participants || []).some((p) => String(p) === String(user.id));
  const isOwner =
    isOrganizer &&
    String(event.organizer && (event.organizer._id || event.organizer)) === String(user.id);

  const [joined, setJoined] = useState(alreadyJoined);
  const [note, setNote] = useState(null);
  const [busy, setBusy] = useState(false);

  const cover = imageUrl(event.image);
  const qr = imageUrl(event.qrImage);

  const join = async () => {
    setBusy(true);
    setNote(null);
    try {
      await api.registerForEvent(event._id);
      setJoined(true);
      setNote({ kind: 'ok', message: 'You are registered for this event.' });
    } catch (err) {
      setNote({ kind: 'error', message: err.message });
    } finally {
      setBusy(false);
    }
  };

  const openForm = () => {
    if (event.registrationUrl) Linking.openURL(event.registrationUrl).catch(() => {});
  };

  const remove = () => {
    Alert.alert('Delete event', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.deleteEvent(event._id);
            navigation.goBack();
          } catch (err) {
            setNote({ kind: 'error', message: err.message });
          }
        }
      }
    ]);
  };

  return (
    <ScrollView style={s.flex} contentContainerStyle={s.wrap}>
      {cover ? <Image source={{ uri: cover }} style={s.image} /> : null}

      <View style={s.head}>
        <Text style={s.title}>{event.title}</Text>
        <Tag text={event.category || 'Other'} />
      </View>

      <Text style={s.meta}>{formatDate(event.date)}</Text>
      {event.location ? <Text style={s.meta}>{event.location}</Text> : null}
      {event.organizer && event.organizer.name ? (
        <Text style={s.meta}>Organised by {event.organizer.name}</Text>
      ) : null}
      {event.institution && event.institution.name ? (
        <Text style={s.meta}>{event.institution.name}</Text>
      ) : null}

      <View style={s.tagRow}>
        <Tag text={`${(event.participants || []).length} registered`} />
      </View>

      <Text style={s.desc}>{event.description || 'No description provided.'}</Text>

      {qr ? (
        <View style={s.qrBlock}>
          <Image source={{ uri: qr }} style={s.qr} />
          <Text style={s.qrLabel}>Scan to register</Text>
          {event.registrationUrl ? (
            <TouchableOpacity onPress={openForm}>
              <Text style={s.link}>Open the registration form</Text>
            </TouchableOpacity>
          ) : (
            <Text style={s.qrNote}>Shows the event details.</Text>
          )}
        </View>
      ) : null}

      {note ? <Note message={note.message} kind={note.kind} /> : null}

      <Button
        title={joined ? 'Registered' : 'Register for this event'}
        onPress={join}
        disabled={joined}
        loading={busy}
      />

      {isOwner ? (
        <>
          <Button
            title="Edit event"
            variant="secondary"
            style={{ marginTop: 10 }}
            onPress={() => navigation.navigate('EditEvent', { eventId: event._id })}
          />
          <Button
            title="View participants"
            variant="secondary"
            style={{ marginTop: 10 }}
            onPress={() => navigation.navigate('Participants', { eventId: event._id })}
          />
          <Button title="Delete event" variant="danger" style={{ marginTop: 10 }} onPress={remove} />
        </>
      ) : null}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1, backgroundColor: theme.colors.bg },
  wrap: { padding: 18, paddingBottom: 40 },
  image: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: theme.radius,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 16,
    backgroundColor: '#eceae5'
  },
  head: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 6 },
  title: { fontSize: 19, fontWeight: '600', color: theme.colors.text, flex: 1 },
  meta: { fontSize: 14, color: theme.colors.muted, marginBottom: 2 },
  tagRow: { marginTop: 10, marginBottom: 14 },
  desc: { fontSize: 15, color: theme.colors.text, lineHeight: 22, marginBottom: 22 },

  qrBlock: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius,
    padding: 18,
    marginBottom: 22
  },
  qr: { width: 170, height: 170, backgroundColor: '#fff' },
  qrLabel: { fontSize: 14, fontWeight: '500', color: theme.colors.text, marginTop: 12 },
  qrNote: { fontSize: 13, color: theme.colors.muted, marginTop: 3 },
  link: { fontSize: 14, color: theme.colors.ink, marginTop: 4, textDecorationLine: 'underline' }
});
