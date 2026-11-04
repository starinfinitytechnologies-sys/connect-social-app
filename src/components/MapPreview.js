import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { getCategoryById } from '../data/categories';
import { COLORS, RADIUS, SHADOWS } from '../theme';

export default function MapPreview({ professionals, location }) {
  const navigation = useNavigation();

  const points = useMemo(() => {
    if (!professionals.length) return [];

    const latitudes = [
      location?.latitude || 0,
      ...professionals.map((professional) => professional.latitude),
    ];
    const longitudes = [
      location?.longitude || 0,
      ...professionals.map((professional) => professional.longitude),
    ];

    const minLat = Math.min(...latitudes);
    const maxLat = Math.max(...latitudes);
    const minLng = Math.min(...longitudes);
    const maxLng = Math.max(...longitudes);
    const latSpan = Math.max(maxLat - minLat, 0.001);
    const lngSpan = Math.max(maxLng - minLng, 0.001);

    return professionals.slice(0, 14).map((professional) => {
      const left = 10 + ((professional.longitude - minLng) / lngSpan) * 80;
      const top = 12 + ((maxLat - professional.latitude) / latSpan) * 70;

      return { professional, left, top };
    });
  }, [location, professionals]);

  return (
    <View style={styles.card}>
      <LinearGradient
        colors={['#F4F1FF', '#EDF6FF', '#F7FBFF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.canvas}
      >
        <View style={[styles.road, styles.roadHorizontal]} />
        <View style={[styles.road, styles.roadHorizontalAlt]} />
        <View style={[styles.road, styles.roadVertical]} />
        <View style={[styles.road, styles.roadVerticalAlt]} />
        <View style={[styles.road, styles.roadDiagonal]} />
        <View style={styles.park} />

        <View style={styles.centerLabel}>
          <Text style={styles.centerText}>Approx. area view</Text>
        </View>

        <View style={[styles.youPin, { left: '50%', top: '46%' }]}>
          <View style={styles.youPulse}>
            <View style={styles.youDot} />
          </View>
          <Text style={styles.youLabel}>You</Text>
        </View>

        {points.map(({ professional, left, top }) => {
          const category = getCategoryById(professional.categoryId);
          const markerColor = category?.color || COLORS.primary;

          return (
            <Pressable
              key={professional.id}
              onPress={() =>
                navigation.navigate('ProfessionalProfile', {
                  professionalId: professional.id,
                })
              }
              accessibilityRole="button"
              accessibilityLabel={`Open ${professional.name} on the map`}
              style={({ pressed }) => [
                styles.pin,
                { left: `${left}%`, top: `${top}%` },
                professional.sponsored && styles.pinSponsored,
                pressed && styles.pressed,
              ]}
            >
              <View style={[styles.pinBubble, { backgroundColor: markerColor }]}>
                <Text style={styles.pinInitials}>{professional.initials}</Text>
              </View>
              <View style={styles.pinTail} />
            </Pressable>
          );
        })}

        <View style={styles.legend}>
          <View style={styles.legendDot} />
          <Text style={styles.legendText}>Distances are indicative</Text>
        </View>
      </LinearGradient>

      <View style={styles.captionRow}>
        <Ionicons name="information-circle-outline" size={15} color={COLORS.textSubtle} />
        <Text style={styles.caption}>
          Map view shows approximate positions. Open a pin for the full profile.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 20,
    marginTop: 14,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.card,
  },
  canvas: {
    height: 330,
    position: 'relative',
    overflow: 'hidden',
  },
  road: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
  },
  roadHorizontal: {
    left: -20,
    right: -20,
    top: '30%',
    height: 11,
    transform: [{ rotate: '-4deg' }],
  },
  roadHorizontalAlt: {
    left: -20,
    right: -20,
    top: '66%',
    height: 7,
    transform: [{ rotate: '2deg' }],
  },
  roadVertical: {
    top: -20,
    bottom: -20,
    left: '32%',
    width: 9,
    transform: [{ rotate: '5deg' }],
  },
  roadVerticalAlt: {
    top: -20,
    bottom: -20,
    left: '70%',
    width: 6,
    transform: [{ rotate: '-3deg' }],
  },
  roadDiagonal: {
    left: '15%',
    top: '45%',
    width: 220,
    height: 5,
    transform: [{ rotate: '34deg' }],
  },
  park: {
    position: 'absolute',
    right: '9%',
    top: '12%',
    width: 78,
    height: 58,
    borderRadius: 18,
    backgroundColor: 'rgba(16, 185, 129, 0.13)',
  },
  centerLabel: {
    position: 'absolute',
    top: 12,
    left: 12,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: RADIUS.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.86)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.9)',
  },
  centerText: {
    color: COLORS.textMuted,
    fontSize: 9,
    fontWeight: '700',
  },
  youPin: {
    position: 'absolute',
    alignItems: 'center',
    marginLeft: -18,
    marginTop: -18,
    width: 36,
  },
  youPulse: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(91, 75, 255, 0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  youDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.primary,
    borderWidth: 2,
    borderColor: COLORS.surface,
  },
  youLabel: {
    color: COLORS.primary,
    fontSize: 8,
    fontWeight: '800',
    marginTop: 1,
  },
  pin: {
    position: 'absolute',
    width: 34,
    alignItems: 'center',
    marginLeft: -17,
    marginTop: -20,
  },
  pinSponsored: {
    transform: [{ scale: 1.08 }],
  },
  pinBubble: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.surface,
    ...SHADOWS.soft,
  },
  pinInitials: {
    color: COLORS.surface,
    fontSize: 9,
    fontWeight: '800',
  },
  pinTail: {
    width: 0,
    height: 0,
    borderLeftWidth: 4,
    borderRightWidth: 4,
    borderTopWidth: 6,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: COLORS.surface,
    marginTop: -1,
  },
  legend: {
    position: 'absolute',
    bottom: 10,
    left: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: RADIUS.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.88)',
    alignSelf: 'flex-start',
    maxWidth: '70%',
  },
  legendDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
  },
  legendText: {
    color: COLORS.textMuted,
    fontSize: 9,
    fontWeight: '600',
  },
  captionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    paddingHorizontal: 13,
    paddingVertical: 10,
    backgroundColor: COLORS.surface,
  },
  caption: {
    flex: 1,
    color: COLORS.textSubtle,
    fontSize: 10,
    fontWeight: '500',
    lineHeight: 15,
  },
  pressed: {
    opacity: 0.75,
    transform: [{ scale: 0.94 }],
  },
});
