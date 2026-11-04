import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme';

export function Avatar({
  initials,
  uri,
  size = 52,
  background = '#E0E7FF',
  color = '#4338CA',
  online = false,
  status,
  ring = false,
  style,
}) {
  const dotSize = Math.max(10, Math.round(size * 0.2));
  const isOnline = status ? status === 'online' : online;

  return (
    <View
      style={[{ width: size, height: size }, style]}
      accessible
      accessibilityRole="image"
      accessibilityLabel={initials ? `Profile picture ${initials}` : 'Profile picture'}
    >
      <View
        style={[
          styles.circle,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: background,
          },
          ring && styles.ring,
        ]}
      >
        {uri ? (
          <Image
            source={{ uri }}
            style={{ width: size, height: size, borderRadius: size / 2 }}
          />
        ) : (
          <Text style={[styles.initials, { color, fontSize: Math.round(size * 0.34) }]}>
            {initials}
          </Text>
        )}
      </View>
      {isOnline ? (
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

export function VerifiedBadge({ size = 15, level = 'identity' }) {
  const isQualified = level === 'qualification';
  const backgroundColor = isQualified ? COLORS.primary : COLORS.info;

  return (
    <View
      style={[
        styles.verifiedBadge,
        { width: size, height: size, borderRadius: size / 2, backgroundColor },
      ]}
      accessible
      accessibilityLabel={
        isQualified ? 'Identity and qualification verified' : 'Identity verified'
      }
    >
      <Ionicons name="checkmark" size={Math.round(size * 0.68)} color={COLORS.surface} />
    </View>
  );
}

export function VerificationBadge({ professional, size = 16 }) {
  if (!professional?.verified) return null;
  return (
    <VerifiedBadge
      size={size}
      level={professional.verificationLevel || 'identity'}
    />
  );
}

const styles = StyleSheet.create({
  circle: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  ring: {
    borderWidth: 2,
    borderColor: COLORS.surface,
  },
  initials: {
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  onlineDot: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.online,
    borderColor: COLORS.surface,
  },
  verifiedBadge: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
