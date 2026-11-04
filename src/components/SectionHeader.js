import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS } from '../theme';

export default function SectionHeader({
  title,
  subtitle,
  actionLabel,
  onAction,
  compact = false,
}) {
  return (
    <View style={[styles.row, compact && styles.rowCompact]}>
      <View style={styles.copy}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>

      {actionLabel && onAction ? (
        <Pressable
          onPress={onAction}
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
          style={({ pressed }) => [styles.action, pressed && styles.pressed]}
        >
          <Text style={styles.actionText}>{actionLabel}</Text>
          <Ionicons name="chevron-forward" size={13} color={COLORS.primary} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 26,
    marginBottom: 12,
    gap: 12,
  },
  rowCompact: {
    marginTop: 18,
    marginBottom: 10,
  },
  copy: {
    flex: 1,
  },
  title: {
    color: COLORS.text,
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.25,
  },
  subtitle: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '500',
    marginTop: 3,
    lineHeight: 17,
  },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.primaryFaint,
  },
  actionText: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: '800',
  },
  pressed: {
    opacity: 0.7,
  },
});
