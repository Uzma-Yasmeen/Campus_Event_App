import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { theme } from '../theme';
import { api } from '../api/client';
import { Empty, Note } from '../components/ui';

export default function ParticipantsScreen({ route }) {
  const { eventId } = route.params;
  const [people, setPeople] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.participants(eventId)
      .then(setPeople)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [eventId]);

  return (
    <FlatList
      style={s.flex}
      contentContainerStyle={s.wrap}
      data={people}
      keyExtractor={(p) => p._id}
      ListHeaderComponent={<Note message={error} />}
      ListEmptyComponent={!loading ? <Empty text="No registrations yet." /> : null}
      renderItem={({ item }) => (
        <View style={s.row}>
          <Text style={s.name}>{item.name}</Text>
          <Text style={s.email}>{item.email}</Text>
        </View>
      )}
    />
  );
}

const s = StyleSheet.create({
  flex: { flex: 1, backgroundColor: theme.colors.bg },
  wrap: { padding: 14 },
  row: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius,
    padding: 13,
    marginBottom: 8
  },
  name: { fontSize: 15, fontWeight: '500', color: theme.colors.text },
  email: { fontSize: 13, color: theme.colors.muted, marginTop: 2 }
});
