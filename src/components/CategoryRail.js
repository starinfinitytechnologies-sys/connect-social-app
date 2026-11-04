import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { CATEGORIES } from '../data/categories';
import { COLORS, RADIUS, SHADOWS } from '../theme';

function AllCategoryCard({ active, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      accessibilityLabel="Show all categories"
      style={({ pressed }) => [pressed && styles.pressed]}
    >
      <LinearGradient
        colors={active ? ['#6D5DFF', '#4F3BF0'] : ['#F2EFFF', '#FFFFFF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.card, active && styles.cardActive]}
      >
        <View style={[styles.iconWrap, active && styles.iconWrapActive]}>
          <Ionicons
            name="grid-outline"
            size={19}
            color={active ? COLORS.surface : COLORS.primary}
          />
        </View>
        <Text numberOfLines={2} style={[styles.name, active && styles.nameActive]}>
          All services
        </Text>
      </LinearGradient>
    </Pressable>
  );
}

export default function CategoryRail({ activeCategoryId, onSelect, counts = {} }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.content}
    >
      <AllCategoryCard
        active={!activeCategoryId}
        onPress={() => onSelect(null)}
      />

      {CATEGORIES.map((category) => {
        const active = activeCategoryId === category.id;
        const count = counts[category.id] || 0;

        return (
          <Pressable
            key={category.id}
            onPress={() => onSelect(active ? null : category.id)}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            accessibilityLabel={`${category.name}, ${count} professionals nearby`}
            style={({ pressed }) => [pressed && styles.pressed]}
          >
            <LinearGradient
              colors={active ? [category.color, category.color] : [category.soft, '#FFFFFF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.card, active && styles.cardActive]}
            >
              <View style={[styles.iconWrap, active && styles.iconWrapActive]}>
                <Ionicons
                  name={category.icon}
                  size={19}
                  color={active ? COLORS.surface : category.color}
                />
              </View>
              <Text numberOfLines={2} style={[styles.name, active && styles.nameActive]}>
                {category.name}
              </Text>
              <Text style={[styles.count, active && styles.countActive]}>
                {count} nearby
              </Text>
            </LinearGradient>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 4,
    gap: 10,
  },
  card: {
    width: 112,
    minHeight: 112,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: 'space-between',
  },
  cardActive: {
    borderColor: 'transparent',
    ...SHADOWS.floating,
    shadowOpacity: 0.18,
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  iconWrapActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderColor: 'rgba(255, 255, 255, 0.28)',
  },
  name: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: '800',
    lineHeight: 16,
    letterSpacing: -0.1,
  },
  nameActive: {
    color: COLORS.surface,
  },
  count: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: '600',
    marginTop: 4,
  },
  countActive: {
    color: 'rgba(255, 255, 255, 0.78)',
  },
  pressed: {
    opacity: 0.82,
    transform: [{ scale: 0.985 }],
  },
});
