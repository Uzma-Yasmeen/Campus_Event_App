import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, TextInput, FlatList, StyleSheet, RefreshControl, TouchableOpacity } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { theme } from '../theme';
import { api } from '../api/client';
import EventCard from '../components/EventCard';
import { Empty, Note } from '../components/ui';

export default function EventsScreen({ navigation }) {
  const [events, setEvents] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filter, setFilter] = useState(null);
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (category, q) => {
    setError('');
    try {
      const data = await api.listEvents({ category: category || '', q: (q || '').trim() });
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
      load(filter, query);
      api.categories().then(setCategories).catch(() => {});
    }, [filter, query, load])
  );

  // Wait for a pause in typing rather than calling the API on every keystroke.
  useEffect(() => {
    const timer = setTimeout(() => load(filter, query), 250);
    return () => clearTimeout(timer);
  }, [query, filter, load]);

  return (
    <View style={s.flex}>
      <View style={s.searchWrap}>
        <TextInput
          style={s.search}
          value={query}
          onChangeText={setQuery}
          placeholder="Search by title, category or venue"
          placeholderTextColor={theme.colors.muted}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
      </View>

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
  searchWrap: {
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 10
  },
  search: {
    borderWidth: 1,
    borderColor: theme.colors.borderStrong,
    borderRadius: theme.radius,
    backgroundColor: theme.colors.bg,
    paddingHorizontal: 11,
    paddingVertical: 9,
    fontSize: 15,
    color: theme.colors.text
  },
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
