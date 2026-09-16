import React from 'react';
import { Image } from 'react-native';

/**
 * The Campus Events mark.
 *
 * Shares a single source file with the rest of the brand; replace
 * mobile/assets/logo.png to change it everywhere in the app.
 */
export default function Logo({ size = 28, style }) {
  return (
    <Image
      source={require('../../assets/logo.png')}
      style={[{ width: size, height: size, resizeMode: 'contain' }, style]}
      accessibilityIgnoresInvertColors
    />
  );
}
