import React, { useEffect, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { COLORS, RADIUS } from '../theme';

export default function SkeletonCard({ count = 3 }) {
  const [opacity] = useState(() => new Animated.Value(0.5));

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 750,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.45,
          duration: 750,
          useNativeDriver: true,
        }),
      ])
    );

    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <View>
      {Array.from({ length: count }).map((_, index) => (
        <Animated.View key={index} style={[styles.card, { opacity }]}>
          <View style={styles.topRow}>
            <View style={styles.avatar} />
            <View style={styles.identity}>
              <View style={styles.lineWide} />
              <View style={styles.lineShort} />
              <View style={styles.pill} />
            </View>
          </View>
          <View style={styles.bodyLine} />
          <View style={styles.bodyLineShort} />
          <View style={styles.footer} />
        </Animated.View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.backgroundDeep,
  },
  identity: {
    flex: 1,
    gap: 7,
  },
  lineWide: {
    width: '62%',
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.backgroundDeep,
  },
  lineShort: {
    width: '40%',
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.surfaceMuted,
  },
  pill: {
    width: 82,
    height: 18,
    borderRadius: 9,
    backgroundColor: COLORS.primaryFaint,
  },
  bodyLine: {
    marginTop: 16,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.backgroundDeep,
  },
  bodyLineShort: {
    marginTop: 7,
    width: '64%',
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.surfaceMuted,
  },
  footer: {
    marginTop: 16,
    height: 38,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surfaceMuted,
  },
});
