import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { COLORS } from '../theme';

export function Avatar({
  initials,
  size = 52,
  background = '#E0E7FF',
  color = '#4338CA',
  online = false,
  style,
}) {
  const dotSize = Math.max(10, Math.round(size * 0.2));

  return (
    <View style={[{ width: size, height: size }, style]}>
      <View
        style={[
          styles.circle,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: background,
          },
        ]}
      >
        <Text style={[styles.initials, { color, fontSize: Math.round(size * 0.34) }]}>
          {initials}
        </Text>
      </View>
      {online ? (
        <View
          style={[
            styles.onlineDot,
            {
              width: dotSize,
              height: dotSize,
              borderRadius: dotSize / 2,
              borderWidth: size >= 40 ? 2 : 1.5,
            },
          ]}
        />
      ) : null}
    </View>
  );
}

export function VerifiedBadge({ size = 15 }) {
  return (
    <View
      style={[
        styles.verifiedBadge,
        { width: size, height: size, borderRadius: size / 2 },
      ]}
    >
      <Text style={[styles.verifiedText, { fontSize: Math.round(size * 0.6) }]}>✓</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  onlineDot: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.success,
    borderColor: COLORS.surface,
  },
  verifiedBadge: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
  },
  verifiedText: {
    color: COLORS.surface,
    fontWeight: '800',
    lineHeight: 14,
  },
});
