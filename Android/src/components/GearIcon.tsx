// Flat chunky gear drawn from Views. The ⚙ glyph it replaces was the one
// realistic-looking thing on an otherwise geometric screen, and an emoji gear
// would have dragged in a whole second colour scheme.

import React from 'react';
import { View } from 'react-native';

interface Props {
  size?: number;
  color: string;
  // Shows through the middle of the gear, so it has to match what is behind.
  holeColor: string;
}

// Four bars crossed through the centre read as eight fat teeth.
const BAR_ANGLES = [0, 45, 90, 135];

export default function GearIcon({ size = 26, color, holeColor }: Props) {
  const thickness = Math.round(size * 0.3);
  const body = Math.round(size * 0.68);
  const hole = Math.round(size * 0.26);

  return (
    <View
      style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}
    >
      {BAR_ANGLES.map((angle) => (
        <View
          key={angle}
          style={{
            position: 'absolute',
            width: size,
            height: thickness,
            borderRadius: thickness / 2,
            backgroundColor: color,
            transform: [{ rotate: `${angle}deg` }],
          }}
        />
      ))}
      <View
        style={{
          position: 'absolute',
          width: body,
          height: body,
          borderRadius: body / 2,
          backgroundColor: color,
        }}
      />
      <View
        style={{
          position: 'absolute',
          width: hole,
          height: hole,
          borderRadius: hole / 2,
          backgroundColor: holeColor,
        }}
      />
    </View>
  );
}
