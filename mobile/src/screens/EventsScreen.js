import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl, TouchableOpacity } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { theme } from '../theme';
import { api } from '../api/client';
import EventCard from '../components/EventCard';
import { Empty, Note } from '../components/ui';

export default function EventsScreen({ navigation }) {
  const [events, setEvents] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filter, setFilter] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (category) => {
    setError('');
    try {
      const data = await api.listEvents(category ? { category } : {});
      setEvents(data);
    } catch (err) {
      setError(err.message);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load(filter);
      api.categories().then(setCategories).catch(() => {});
    }, [filter, load])
  );

  return (
    <View style={s.flex}>
      {categories.length > 0 && (
        <View style={s.filterBar}>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={['All', ...categories]}
            keyExtractor={(c) => c}
            contentContainerStyle={s.filterContent}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[s.chip, (filter || 'All') === item && s.chipActive]}
                onPress={() => { setLoading(true); setFilter(item === 'All' ? null : item); }}
              >
                <Text style={[s.chipText, (filter || 'All') === item && s.chipTextActive]}>{item}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      )}

      <FlatList
        data={events}
        keyExtractor={(e) => e._id}
        contentContainerStyle={s.list}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={() => { setLoading(true); load(filter); }} />}
        ListHeaderComponent={<Note message={error} />}
        ListEmptyComponent={!loading ? <Empty text="No events scheduled yet." /> : null}
        renderItem={({ item }) => (
          <EventCard
            event={item}
            onPress={() => navigation.navigate('EventDetails', { event: item })}
          />
        )}
      />
    </View>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1, backgroundColor: theme.colors.bg },
  filterBar: { borderBottomWidth: 1, borderBottomColor: theme.colors.border, backgroundColor: theme.colors.surface },
  filterContent: { paddingHorizontal: 14, paddingVertical: 10, gap: 8 },
  list: { padding: 14 },
  chip: {
    borderWidth: 1,
    borderColor: theme.colors.borderStrong,
    borderRadius: theme.radius,
    paddingHorizontal: 11,
    paddingVertical: 6,
    backgroundColor: theme.colors.surface
  },
  chipActive: { backgroundColor: theme.colors.ink, borderColor: theme.colors.ink },
  chipText: { fontSize: 13, color: theme.colors.text },
  chipTextActive: { color: '#fff' }
});
