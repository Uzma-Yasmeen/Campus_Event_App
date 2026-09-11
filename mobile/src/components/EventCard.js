import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { theme } from '../theme';
import { imageUrl } from '../api/client';
import { Tag } from './ui';

export function formatDate(value) {
  const d = new Date(value);
  if (isNaN(d)) return '';
  return d.toLocaleString(undefined, {
    weekday: 'short', day: 'numeric', month: 'short',
    hour: '2-digit', minute: '2-digit'
  });
}

export default function EventCard({ event, onPress }) {
  const uri = imageUrl(event.image);
  const count = (event.participants || []).length;

  return (
    <TouchableOpacity style={s.card} onPress={onPress} activeOpacity={0.85}>
      {uri ? <Image source={{ uri }} style={s.image} /> : null}
      <View style={s.body}>
        <View style={s.head}>
          <Text style={s.title} numberOfLines={2}>{event.title}</Text>
          <Tag text={event.category || 'Other'} />
        </View>
        <Text style={s.meta}>{formatDate(event.date)}</Text>
        {event.location ? <Text style={s.meta}>{event.location}</Text> : null}
        {event.description ? (
          <Text style={s.desc} numberOfLines={2}>{event.description}</Text>
        ) : null}
        <View style={s.foot}>
          <Tag text={`${count} registered`} />
        </View>
      </View>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius,
    marginBottom: 12,
    overflow: 'hidden'
  },
  image: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: '#eceae5'
  },
  body: { padding: 14 },
  head: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 5 },
  title: { fontSize: 15, fontWeight: '600', color: theme.colors.text, flex: 1 },
  meta: { fontSize: 13, color: theme.colors.muted },
  desc: { fontSize: 14, color: theme.colors.muted, marginTop: 8 },
  foot: { marginTop: 12 }
});
