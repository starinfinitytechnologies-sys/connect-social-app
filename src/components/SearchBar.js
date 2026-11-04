import React from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SHADOWS } from '../theme';

export default function SearchBar({
  value,
  onChangeText,
  placeholder = 'Search name, profession or service',
  onFilterPress,
  filterCount = 0,
  onSubmitEditing,
}) {
  return (
    <View style={styles.shell}>
      <View style={styles.inputRow}>
        <Ionicons name="search" size={19} color={COLORS.textSubtle} />
        <TextInput
          value={value}
          onChangeText={onChangeText}
          onSubmitEditing={onSubmitEditing}
          placeholder={placeholder}
          placeholderTextColor={COLORS.textSubtle}
          style={styles.input}
          returnKeyType="search"
          autoCapitalize="none"
          autoCorrect={false}
          accessibilityLabel="Search professionals"
        />
        {value ? (
          <Pressable
            onPress={() => onChangeText('')}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Clear search"
            style={styles.clearButton}
          >
            <Ionicons name="close" size={15} color={COLORS.textMuted} />
          </Pressable>
        ) : null}
      </View>

      {onFilterPress ? (
        <Pressable
          onPress={onFilterPress}
          accessibilityRole="button"
          accessibilityLabel={`Open filters${filterCount ? `, ${filterCount} active` : ''}`}
          style={({ pressed }) => [
            styles.filterButton,
            filterCount > 0 && styles.filterButtonActive,
            pressed && styles.pressed,
          ]}
        >
          <Ionicons
            name="options-outline"
            size={20}
            color={filterCount > 0 ? COLORS.surface : COLORS.primary}
          />
          {filterCount > 0 ? (
            <View style={styles.filterCount}>
              <View style={styles.filterCountDot} />
            </View>
          ) : null}
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingHorizontal: 20,
    marginTop: 16,
  },
  inputRow: {
    flex: 1,
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 15,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.soft,
  },
  input: {
    flex: 1,
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '500',
    paddingVertical: 12,
  },
  clearButton: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterButton: {
    width: 50,
    height: 50,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primaryFaint,
    borderWidth: 1,
    borderColor: COLORS.primarySoft,
  },
  filterButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
    ...SHADOWS.soft,
  },
  filterCount: {
    position: 'absolute',
    top: 7,
    right: 8,
  },
  filterCountDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.gold,
    borderWidth: 1,
    borderColor: COLORS.surface,
  },
  pressed: {
    opacity: 0.8,
  },
});
