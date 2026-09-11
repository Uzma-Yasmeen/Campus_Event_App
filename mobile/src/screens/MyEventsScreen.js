import React, { useCallback, useState } from 'react';
import { FlatList, StyleSheet, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { theme } from '../theme';
import { api } from '../api/client';
import EventCard from '../components/EventCard';
import { Empty, Note } from '../components/ui';
import { useAuth } from '../context/AuthContext';

export default function MyEventsScreen({ navigation }) {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setError('');
    try {
      const all = await api.listEvents();
      setEvents(all.filter((ev) => (ev.participants || []).some((p) => String(p) === String(user.id))));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user.id]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  return (
    <FlatList
      style={s.flex}
      contentContainerStyle={s.wrap}
      data={events}
      keyExtractor={(e) => e._id}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={() => { setLoading(true); load(); }} />}
      ListHeaderComponent={<Note message={error} />}
      ListEmptyComponent={!loading ? <Empty text="You have not registered for any events yet." /> : null}
      renderItem={({ item }) => (
        <EventCard event={item} onPress={() => navigation.navigate('EventDetails', { event: item })} />
      )}
    />
  );
}

const s = StyleSheet.create({
  flex: { flex: 1, backgroundColor: theme.colors.bg },
  wrap: { padding: 14 }
});
