import React from 'react';
import { View, StyleSheet } from 'react-native';
import { theme } from '../theme';

/**
 * The Campus Events mark: a calendar body with a marked date.
 * Drawn with plain views so the app needs no SVG dependency.
 */
export default function Logo({ size = 26, color = theme.colors.ink }) {
  const stroke = Math.max(1.6, size * 0.075);
  const bodyTop = size * 0.11;
  const postHeight = size * 0.16;
  const dot = size * 0.19;

  return (
    <View style={{ width: size, height: size }}>
      {/* binding posts */}
      <View style={[s.posts, { height: postHeight, paddingHorizontal: size * 0.21 }]}>
        <View style={{ width: stroke, height: postHeight, backgroundColor: color, borderRadius: stroke }} />
        <View style={{ width: stroke, height: postHeight, backgroundColor: color, borderRadius: stroke }} />
      </View>

      {/* calendar body */}
      <View
        style={{
          position: 'absolute',
          top: bodyTop,
          left: 0,
          right: 0,
          bottom: 0,
          borderWidth: stroke,
          borderColor: color,
          borderRadius: size * 0.12,
          overflow: 'hidden'
        }}
      >
        {/* header band */}
        <View style={{ height: size * 0.19, borderBottomWidth: stroke, borderBottomColor: color }} />

        {/* the marked date */}
        <View style={s.center}>
          <View style={{ width: dot, height: dot, borderRadius: dot / 2, backgroundColor: color }} />
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  posts: { flexDirection: 'row', justifyContent: 'space-between' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' }
});
