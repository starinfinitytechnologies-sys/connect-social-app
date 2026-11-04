import React, { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import {
  DEFAULT_FILTERS,
  DISTANCE_OPTIONS,
  PRICE_OPTIONS,
  RATING_OPTIONS,
} from '../utils/ranking';
import { COLORS, RADIUS, SHADOWS } from '../theme';

function FilterSection({ title, description, children }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {description ? <Text style={styles.sectionDescription}>{description}</Text> : null}
      <View style={styles.chipWrap}>{children}</View>
    </View>
  );
}

function ChoiceChip({ label, active, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected: active }}
      style={({ pressed }) => [
        styles.chip,
        active && styles.chipActive,
        pressed && styles.pressed,
      ]}
    >
      {active ? (
        <Ionicons name="checkmark" size={12} color={COLORS.surface} />
      ) : null}
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

export default function FilterSheet({ visible, onClose, filters, onApply }) {
  const insets = useSafeAreaInsets();
  const [draft, setDraft] = useState(filters || DEFAULT_FILTERS);

  const resetDraft = () => setDraft(filters || DEFAULT_FILTERS);
  const update = (patch) => setDraft((current) => ({ ...current, ...patch }));

  const handleApply = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onApply(draft);
    onClose();
  };

  const handleReset = () => {
    setDraft(DEFAULT_FILTERS);
    Haptics.selectionAsync().catch(() => {});
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onShow={resetDraft}
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close filters"
        />

        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <View style={styles.handle} />

          <View style={styles.header}>
            <View>
              <Text style={styles.overline}>REFINE RESULTS</Text>
              <Text style={styles.title}>Filters</Text>
            </View>
            <Pressable
              onPress={onClose}
              style={styles.closeButton}
              accessibilityRole="button"
              accessibilityLabel="Close filters"
            >
              <Ionicons name="close" size={19} color={COLORS.textMuted} />
            </Pressable>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.content}
          >
            <FilterSection
              title="Distance"
              description="How far are you willing to travel or book?"
            >
              {DISTANCE_OPTIONS.map((distance) => (
                <ChoiceChip
                  key={distance}
                  label={distance >= 50 ? '50+ km' : `Within ${distance} km`}
                  active={draft.maxDistanceKm === distance}
                  onPress={() => update({ maxDistanceKm: distance })}
                />
              ))}
            </FilterSection>

            <FilterSection title="Customer rating">
              {RATING_OPTIONS.map((rating) => (
                <ChoiceChip
                  key={rating}
                  label={rating === 0 ? 'Any rating' : `${rating}+ stars`}
                  active={draft.minRating === rating}
                  onPress={() => update({ minRating: rating })}
                />
              ))}
            </FilterSection>

            <FilterSection
              title="Availability"
              description="Availability is self-reported by professionals."
            >
              <View style={styles.switchRow}>
                <View style={styles.switchCopy}>
                  <Text style={styles.switchTitle}>Available today</Text>
                  <Text style={styles.switchDescription}>
                    Show professionals with a same-day slot.
                  </Text>
                </View>
                <Switch
                  value={draft.availableOnly}
                  onValueChange={(value) => update({ availableOnly: value })}
                  trackColor={{ false: COLORS.borderStrong, true: '#B9AEFF' }}
                  thumbColor={draft.availableOnly ? COLORS.primary : COLORS.surface}
                  ios_backgroundColor={COLORS.borderStrong}
                />
              </View>

              <View style={styles.switchRow}>
                <View style={styles.switchCopy}>
                  <Text style={styles.switchTitle}>Online now</Text>
                  <Text style={styles.switchDescription}>
                    Only professionals who are currently active.
                  </Text>
                </View>
                <Switch
                  value={draft.onlineOnly}
                  onValueChange={(value) => update({ onlineOnly: value })}
                  trackColor={{ false: COLORS.borderStrong, true: '#B9AEFF' }}
                  thumbColor={draft.onlineOnly ? COLORS.primary : COLORS.surface}
                  ios_backgroundColor={COLORS.borderStrong}
                />
              </View>
            </FilterSection>

            <FilterSection
              title="Trust"
              description="Verification means identity or documents were reviewed by our team."
            >
              <View style={styles.switchRow}>
                <View style={styles.switchCopy}>
                  <Text style={styles.switchTitle}>Verified professionals only</Text>
                  <Text style={styles.switchDescription}>
                    Identity or qualification verification completed.
                  </Text>
                </View>
                <Switch
                  value={draft.verifiedOnly}
                  onValueChange={(value) => update({ verifiedOnly: value })}
                  trackColor={{ false: COLORS.borderStrong, true: '#B9AEFF' }}
                  thumbColor={draft.verifiedOnly ? COLORS.primary : COLORS.surface}
                  ios_backgroundColor={COLORS.borderStrong}
                />
              </View>
            </FilterSection>

            <FilterSection title="Starting price" description="Based on the lowest published service.">
              {PRICE_OPTIONS.map((price) => (
                <ChoiceChip
                  key={price.id}
                  label={price.label}
                  active={draft.maxPrice === price.maxPrice}
                  onPress={() => update({ maxPrice: price.maxPrice })}
                />
              ))}
            </FilterSection>
          </ScrollView>

          <View style={styles.footer}>
            <Pressable
              onPress={handleReset}
              accessibilityRole="button"
              style={({ pressed }) => [styles.resetButton, pressed && styles.pressed]}
            >
              <Ionicons name="refresh-outline" size={16} color={COLORS.textMuted} />
              <Text style={styles.resetText}>Reset</Text>
            </Pressable>

            <Pressable
              onPress={handleApply}
              accessibilityRole="button"
              style={({ pressed }) => [styles.applyButton, pressed && styles.pressed]}
            >
              <Text style={styles.applyText}>Show results</Text>
              <Ionicons name="arrow-forward" size={16} color={COLORS.surface} />
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'flex-end',
  },
  sheet: {
    maxHeight: '90%',
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    paddingTop: 10,
    ...SHADOWS.card,
  },
  handle: {
    alignSelf: 'center',
    width: 42,
    height: 5,
    borderRadius: 3,
    backgroundColor: COLORS.borderStrong,
    marginBottom: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  overline: {
    color: COLORS.primary,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.3,
  },
  title: {
    color: COLORS.text,
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginTop: 3,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.surfaceMuted,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  section: {
    paddingTop: 16,
    paddingBottom: 4,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    marginTop: 10,
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '800',
  },
  sectionDescription: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '500',
    lineHeight: 16,
    marginTop: 3,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 11,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  chipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  chipText: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  chipTextActive: {
    color: COLORS.surface,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
  },
  switchCopy: {
    flex: 1,
  },
  switchTitle: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '700',
  },
  switchDescription: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '500',
    lineHeight: 16,
    marginTop: 2,
  },
  footer: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  resetButton: {
    minHeight: 50,
    paddingHorizontal: 16,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  resetText: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  applyButton: {
    flex: 1,
    minHeight: 50,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    ...SHADOWS.floating,
  },
  applyText: {
    color: COLORS.surface,
    fontSize: 13,
    fontWeight: '800',
  },
  pressed: {
    opacity: 0.8,
  },
});
