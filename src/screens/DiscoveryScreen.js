import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import CategoryTabs from '../components/CategoryTabs';
import LocationHeader from '../components/LocationHeader';
import UserCard from '../components/UserCard';
import { useApp } from '../context/AppContext';
import { CATEGORIES } from '../data/mockData';
import { COLORS, RADIUS, SHADOWS } from '../theme';

export default function DiscoveryScreen() {
  const { professionals, creditLabel, isPremium, openPaywall } = useApp();
  const [activeCategory, setActiveCategory] = useState('All');

  const filteredProfessionals = useMemo(() => {
    if (activeCategory === 'All') return professionals;

    return professionals.filter(
      (professional) => professional.category === activeCategory
    );
  }, [activeCategory, professionals]);

  const renderItem = ({ item }) => <UserCard professional={item} />;

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <FlatList
        data={filteredProfessionals}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View>
            <LocationHeader />

            <View style={styles.toolbar}>
              <View style={styles.toolbarCopy}>
                <Text numberOfLines={1} style={styles.toolbarTitle}>
                  {activeCategory === 'All' ? 'All professionals' : activeCategory}
                </Text>
                <Text style={styles.toolbarSubtitle}>
                  {filteredProfessionals.length}{' '}
                  {filteredProfessionals.length === 1 ? 'professional' : 'professionals'} nearby
                </Text>
              </View>

              <Pressable
                onPress={openPaywall}
                accessibilityRole="button"
                accessibilityLabel="View membership options"
                style={[styles.creditsPill, isPremium && styles.creditsPillPro]}
              >
                <View
                  style={[styles.creditsDot, isPremium && styles.creditsDotPro]}
                />
                <Text style={[styles.creditsText, isPremium && styles.creditsTextPro]}>
                  {isPremium ? 'PRO · Unlimited' : creditLabel}
                </Text>
              </Pressable>
            </View>

            <CategoryTabs
              categories={CATEGORIES}
              activeCategory={activeCategory}
              onChange={setActiveCategory}
            />
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyCard}>
            <View style={styles.emptyIcon}>
              <View style={styles.emptyIconInner} />
            </View>
            <Text style={styles.emptyTitle}>No one here yet</Text>
            <Text style={styles.emptyText}>
              There are no {activeCategory.toLowerCase()} professionals nearby right now.
            </Text>
            <Pressable
              onPress={() => setActiveCategory('All')}
              style={styles.emptyButton}
            >
              <Text style={styles.emptyButtonText}>Show all professionals</Text>
            </Pressable>
          </View>
        }
        ListFooterComponent={<View style={styles.footerSpace} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  listContent: {
    paddingBottom: 18,
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 24,
    gap: 12,
  },
  toolbarCopy: {
    flex: 1,
  },
  toolbarTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  toolbarSubtitle: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '500',
    marginTop: 3,
  },
  creditsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.soft,
  },
  creditsPillPro: {
    backgroundColor: COLORS.premiumSoft,
    borderColor: '#DDD6FE',
  },
  creditsDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.gold,
    marginRight: 6,
  },
  creditsDotPro: {
    backgroundColor: COLORS.premium,
  },
  creditsText: {
    color: COLORS.text,
    fontSize: 11,
    fontWeight: '700',
  },
  creditsTextPro: {
    color: COLORS.premium,
  },
  emptyCard: {
    marginHorizontal: 20,
    marginTop: 18,
    padding: 26,
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.card,
  },
  emptyIcon: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: COLORS.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyIconInner: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 3,
    borderColor: COLORS.primary,
  },
  emptyTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '700',
  },
  emptyText: {
    color: COLORS.textMuted,
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 6,
  },
  emptyButton: {
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.primarySoft,
  },
  emptyButtonText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  footerSpace: {
    height: 12,
  },
});
