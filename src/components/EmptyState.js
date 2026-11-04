import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SHADOWS } from '../theme';

export default function EmptyState({
  icon = 'search-outline',
  title,
  description,
  actionLabel,
  onAction,
  compact = false,
}) {
  return (
    <View style={[styles.card, compact && styles.cardCompact]}>
      <View style={styles.iconWrap}>
        <Ionicons name={icon} size={24} color={COLORS.primary} />
      </View>
      <Text style={styles.title}>{title}</Text>
      {description ? <Text style={styles.description}>{description}</Text> : null}
      {actionLabel && onAction ? (
        <Pressable
          onPress={onAction}
          accessibilityRole="button"
          style={({ pressed }) => [styles.action, pressed && styles.pressed]}
        >
          <Text style={styles.actionText}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 20,
    marginTop: 12,
    paddingHorizontal: 24,
    paddingVertical: 30,
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.card,
  },
  cardCompact: {
    marginHorizontal: 0,
    marginTop: 0,
  },
  iconWrap: {
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor: COLORS.primaryFaint,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  title: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
    textAlign: 'center',
  },
  description: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 18,
    textAlign: 'center',
    marginTop: 6,
    maxWidth: 290,
  },
  action: {
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.primary,
    ...SHADOWS.floating,
    shadowOpacity: 0.18,
  },
  actionText: {
    color: COLORS.surface,
    fontSize: 12,
    fontWeight: '800',
  },
  pressed: {
    opacity: 0.8,
  },
});
