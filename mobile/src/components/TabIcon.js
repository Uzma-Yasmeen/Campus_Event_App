import React from 'react';
import { View, StyleSheet } from 'react-native';

/**
 * Small geometric tab glyphs drawn with plain views, so the app does not
 * depend on an icon font or SVG library.
 */
export default function TabIcon({ name, color, size = 20 }) {
  const bar = { backgroundColor: color, borderRadius: 1 };

  if (name === 'Events') {
    return (
      <View style={[s.box, { width: size, height: size, borderColor: color }]}>
        <View style={[s.headerBand, { backgroundColor: color }]} />
      </View>
    );
  }

  if (name === 'Registered') {
    return (
      <View style={{ width: size, height: size, justifyContent: 'center' }}>
        <View style={[bar, s.line, { width: size }]} />
        <View style={[bar, s.line, { width: size * 0.75 }]} />
        <View style={[bar, s.line, { width: size * 0.5 }]} />
      </View>
    );
  }

  if (name === 'Create') {
    return (
      <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
        <View style={[bar, { width: size, height: 2 }]} />
        <View style={[bar, { width: 2, height: size, position: 'absolute' }]} />
      </View>
    );
  }

  // Profile
  return (
    <View style={{ width: size, height: size, alignItems: 'center' }}>
      <View style={[s.head, { borderColor: color, width: size * 0.42, height: size * 0.42 }]} />
      <View style={[s.shoulders, { borderColor: color, width: size * 0.82, height: size * 0.42 }]} />
    </View>
  );
}

const s = StyleSheet.create({
  box: { borderWidth: 1.6, borderRadius: 3, overflow: 'hidden' },
  headerBand: { height: 3.5, width: '100%' },
  line: { height: 2, marginVertical: 2 },
  head: { borderWidth: 1.6, borderRadius: 99, marginTop: 1 },
  shoulders: { borderWidth: 1.6, borderTopWidth: 0, borderBottomLeftRadius: 99, borderBottomRightRadius: 99, marginTop: 2 }
});
