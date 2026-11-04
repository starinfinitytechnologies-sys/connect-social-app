import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { COLORS, RADIUS, SHADOWS } from '../theme';

export default function CategoryTabs({ categories, activeCategory, onChange }) {
  return (
    <View style={styles.wrapper}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {categories.map((category) => {
          const isActive = category === activeCategory;

          return (
            <Pressable
              key={category}
              onPress={() => onChange(category)}
              accessibilityRole="button"
              accessibilityState={{ selected: isActive }}
              style={[styles.chip, isActive && styles.chipActive]}
            >
              <Text style={[styles.label, isActive && styles.labelActive]}>{category}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginTop: 18,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 6,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
    ...SHADOWS.soft,
    shadowColor: COLORS.primary,
  },
  label: {
    color: COLORS.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  labelActive: {
    color: COLORS.surface,
  },
});
