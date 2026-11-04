import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useNavigation } from '@react-navigation/native';
import { Avatar } from '../components/Avatar';
import CategoryRail from '../components/CategoryRail';
import EmptyState from '../components/EmptyState';
import FilterSheet from '../components/FilterSheet';
import LocationSelector from '../components/LocationSelector';
import MapPreview from '../components/MapPreview';
import ProfessionalCard from '../components/ProfessionalCard';
import SearchBar from '../components/SearchBar';
import SectionHeader from '../components/SectionHeader';
import SkeletonCard from '../components/SkeletonCard';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { getCategoryById } from '../data/categories';
import {
  DEFAULT_FILTERS,
  SORT_OPTIONS,
  countActiveFilters,
  filterProfessionals,
  getTrendingNearby,
  matchesFilters,
  matchesQuery,
  rankProfessionals,
} from '../utils/ranking';
import { COLORS, RADIUS, SHADOWS } from '../theme';

const PAGE_SIZE = 6;

function SortChip({ option, active, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected: active }}
      style={({ pressed }) => [
        styles.sortChip,
        active && styles.sortChipActive,
        pressed && styles.pressed,
      ]}
    >
      <Ionicons
        name={option.icon}
        size={12}
        color={active ? COLORS.primary : COLORS.textSubtle}
      />
      <Text style={[styles.sortChipText, active && styles.sortChipTextActive]}>
        {option.label}
      </Text>
    </Pressable>
  );
}

function SubcategoryRail({ category, activeSubcategoryId, onSelect }) {
  if (!category) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.subcategoryContent}
    >
      {category.subcategories.map((subcategory) => {
        const active = activeSubcategoryId === subcategory.id;

        return (
          <Pressable
            key={subcategory.id}
            onPress={() => onSelect(active ? null : subcategory.id)}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            style={({ pressed }) => [
              styles.subcategoryChip,
              active && styles.subcategoryChipActive,
              pressed && styles.pressed,
            ]}
          >
            <Text
              style={[
                styles.subcategoryText,
                active && styles.subcategoryTextActive,
              ]}
            >
              {subcategory.name}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

export default function DiscoveryScreen() {
  const navigation = useNavigation();
  const {
    currentUser,
    hydrated,
    professionals,
    blockedIds,
    locationLabel,
    locationStatus,
    selectedLocation,
    isRefreshingLocation,
    refreshLocation,
    recentlyViewed,
    pendingCount,
    creditLabel,
    isPaid,
    openPaywall,
  } = useApp();
  const { configured: backendConfigured } = useAuth();

  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [activeCategoryId, setActiveCategoryId] = useState(null);
  const [activeSubcategoryId, setActiveSubcategoryId] = useState(null);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [sort, setSort] = useState('recommended');
  const [viewMode, setViewMode] = useState('list');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [locationVisible, setLocationVisible] = useState(false);
  const [filtersVisible, setFiltersVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query.trim()), 180);
    return () => clearTimeout(timer);
  }, [query]);

  const activeCategory = getCategoryById(activeCategoryId);
  const activeFilterCount = countActiveFilters(filters);
  const hasFilters = activeFilterCount > 0;
  const showRails = !debouncedQuery && !activeCategoryId && !hasFilters;

  const categoryCounts = useMemo(
    () =>
      professionals.reduce((accumulator, professional) => {
        if (blockedIds.includes(professional.id)) return accumulator;
        if (!matchesQuery(professional, debouncedQuery)) return accumulator;
        if (!matchesFilters(professional, filters)) return accumulator;
        accumulator[professional.categoryId] =
          (accumulator[professional.categoryId] || 0) + 1;
        return accumulator;
      }, {}),
    [blockedIds, debouncedQuery, filters, professionals]
  );

  const rankedProfessionals = useMemo(() => {
    const filtered = filterProfessionals({
      professionals,
      query: debouncedQuery,
      categoryId: activeCategoryId,
      subcategoryId: activeSubcategoryId,
      filters,
      blockedIds,
    });

    return rankProfessionals({
      professionals: filtered,
      categoryId: activeCategoryId,
      subcategoryId: activeSubcategoryId,
      filters,
      sort,
    });
  }, [
    activeCategoryId,
    activeSubcategoryId,
    blockedIds,
    debouncedQuery,
    filters,
    professionals,
    sort,
  ]);

  const visibleProfessionals = rankedProfessionals.slice(0, visibleCount);
  const hasMore = visibleCount < rankedProfessionals.length;

  const trendingNearby = useMemo(
    () => getTrendingNearby(professionals.filter((item) => !blockedIds.includes(item.id)), 6),
    [blockedIds, professionals]
  );

  const recentProfessionals = useMemo(
    () => recentlyViewed.filter((item) => !blockedIds.includes(item.id)).slice(0, 6),
    [blockedIds, recentlyViewed]
  );

  const resetAll = () => {
    setQuery('');
    setDebouncedQuery('');
    setActiveCategoryId(null);
    setActiveSubcategoryId(null);
    setFilters(DEFAULT_FILTERS);
    setSort('recommended');
    setVisibleCount(PAGE_SIZE);
  };

  const handleCategorySelect = (categoryId) => {
    Haptics.selectionAsync().catch(() => {});
    setActiveCategoryId(categoryId);
    setActiveSubcategoryId(null);
    setVisibleCount(PAGE_SIZE);
  };

  const handleSubcategorySelect = (subcategoryId) => {
    Haptics.selectionAsync().catch(() => {});
    setActiveSubcategoryId(subcategoryId);
    setVisibleCount(PAGE_SIZE);
  };

  const handleQueryChange = (text) => {
    setQuery(text);
    setVisibleCount(PAGE_SIZE);
  };

  const handleApplyFilters = (nextFilters) => {
    setFilters(nextFilters);
    setVisibleCount(PAGE_SIZE);
  };

  const handleSortChange = (nextSort) => {
    setSort(nextSort);
    setVisibleCount(PAGE_SIZE);
  };

  const handleLoadMore = () => {
    if (!hasMore) return;
    setVisibleCount((current) =>
      Math.min(current + PAGE_SIZE, rankedProfessionals.length)
    );
  };

  const handleRefresh = async () => {
    await refreshLocation();
  };

  const resultTitle = activeCategory ? activeCategory.name : 'Professionals near you';
  const resultSubtitle = activeCategory
    ? `${rankedProfessionals.length} ${
        rankedProfessionals.length === 1 ? 'professional' : 'professionals'
      } in this category`
    : `${rankedProfessionals.length} ${
        rankedProfessionals.length === 1 ? 'professional' : 'professionals'
      } ranked for ${locationLabel}`;

  const header = (
    <View>
      <LinearGradient
        colors={['#F4F1FF', '#F8F9FF', '#F6F7FB']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.hero}
      >
        <View style={styles.brandRow}>
          <View style={styles.brandMark}>
            <Ionicons name="location" size={20} color={COLORS.surface} />
          </View>

          <View style={styles.brandCopy}>
            <Text style={styles.brandName}>CONNECT LOCAL</Text>
            <Text numberOfLines={1} style={styles.greeting}>
              Hi {currentUser.firstName}, find trusted help nearby.
            </Text>
          </View>

          <Pressable
            onPress={openPaywall}
            accessibilityRole="button"
            accessibilityLabel="View credits and membership"
            style={({ pressed }) => [
              styles.creditsPill,
              isPaid && styles.creditsPillPaid,
              pressed && styles.pressed,
            ]}
          >
            <Ionicons
              name={isPaid ? 'diamond' : 'flash'}
              size={12}
              color={isPaid ? COLORS.premium : COLORS.gold}
            />
            <Text style={[styles.creditsText, isPaid && styles.creditsTextPaid]}>
              {isPaid ? 'PRO' : creditLabel}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => navigation.navigate('Settings')}
            accessibilityRole="button"
            accessibilityLabel="Open your account"
            style={({ pressed }) => [pressed && styles.pressed]}
          >
            <Avatar
              initials={currentUser.initials}
              size={40}
              background={currentUser.avatarSoft}
              color={currentUser.avatarColor}
              ring
            />
          </Pressable>
        </View>

        <Pressable
          onPress={() => setLocationVisible(true)}
          accessibilityRole="button"
          accessibilityLabel={`Change location. Current location ${locationLabel}`}
          style={({ pressed }) => [styles.locationCard, pressed && styles.pressed]}
        >
          <View style={styles.locationIcon}>
            <Ionicons name="navigate" size={16} color={COLORS.primary} />
          </View>

          <View style={styles.locationCopy}>
            <Text style={styles.locationOverline}>
              {locationStatus === 'granted' ? 'CURRENT LOCATION' : 'SERVICE AREA'}
            </Text>
            <Text numberOfLines={1} style={styles.locationValue}>
              {locationLabel}
            </Text>
          </View>

          {isRefreshingLocation ? (
            <ActivityIndicator size="small" color={COLORS.primary} />
          ) : (
            <View style={styles.changePill}>
              <Text style={styles.changeText}>Change</Text>
              <Ionicons name="chevron-down" size={12} color={COLORS.primary} />
            </View>
          )}
        </Pressable>

        <View style={styles.headlineRow}>
          <View style={styles.headlineCopy}>
            <Text style={styles.heroTitle}>Discover professionals</Text>
            <Text style={styles.heroSubtitle}>
              Verified locals for legal, home, health, finance and more.
            </Text>
          </View>

          <Pressable
            onPress={() => navigation.navigate('Connections')}
            accessibilityRole="button"
            accessibilityLabel={`Open connections${pendingCount ? `, ${pendingCount} pending` : ''}`}
            style={({ pressed }) => [styles.bellButton, pressed && styles.pressed]}
          >
            <Ionicons name="notifications-outline" size={19} color={COLORS.text} />
            {pendingCount > 0 ? (
              <View style={styles.bellBadge}>
                <Text style={styles.bellBadgeText}>{pendingCount}</Text>
              </View>
            ) : null}
          </Pressable>
        </View>
      </LinearGradient>

      {backendConfigured ? (
        <View style={styles.previewNotice}>
          <Ionicons name="flask-outline" size={14} color={COLORS.warning} />
          <Text style={styles.previewNoticeText}>
            Preview listings: these profiles are sample data until professional
            onboarding goes live.
          </Text>
        </View>
      ) : null}

      <SearchBar
        value={query}
        onChangeText={handleQueryChange}
        onFilterPress={() => setFiltersVisible(true)}
        filterCount={activeFilterCount}
      />

      <CategoryRail
        activeCategoryId={activeCategoryId}
        onSelect={handleCategorySelect}
        counts={categoryCounts}
      />

      <SubcategoryRail
        category={activeCategory}
        activeSubcategoryId={activeSubcategoryId}
        onSelect={handleSubcategorySelect}
      />

      {showRails && recentProfessionals.length > 0 ? (
        <>
          <SectionHeader
            title="Recently viewed"
            subtitle="Pick up where you left off"
          />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.railContent}
          >
            {recentProfessionals.map((professional) => (
              <ProfessionalCard
                key={professional.id}
                professional={professional}
                compact
              />
            ))}
          </ScrollView>
        </>
      ) : null}

      {showRails && trendingNearby.length > 0 ? (
        <>
          <SectionHeader
            title="Trending nearby"
            subtitle="Getting the most genuine enquiries this week"
          />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.railContent}
          >
            {trendingNearby.map((professional) => (
              <ProfessionalCard
                key={professional.id}
                professional={professional}
                compact
              />
            ))}
          </ScrollView>
        </>
      ) : null}

      <View style={styles.resultsHeader}>
        <View style={styles.resultsCopy}>
          <Text style={styles.resultsTitle}>{resultTitle}</Text>
          <Text style={styles.resultsSubtitle}>{resultSubtitle}</Text>
        </View>

        <View style={styles.viewToggle}>
          <Pressable
            onPress={() => setViewMode('list')}
            accessibilityRole="button"
            accessibilityState={{ selected: viewMode === 'list' }}
            accessibilityLabel="List view"
            style={[styles.viewButton, viewMode === 'list' && styles.viewButtonActive]}
          >
            <Ionicons
              name="list"
              size={16}
              color={viewMode === 'list' ? COLORS.primary : COLORS.textSubtle}
            />
          </Pressable>
          <Pressable
            onPress={() => setViewMode('map')}
            accessibilityRole="button"
            accessibilityState={{ selected: viewMode === 'map' }}
            accessibilityLabel="Map view"
            style={[styles.viewButton, viewMode === 'map' && styles.viewButtonActive]}
          >
            <Ionicons
              name="map-outline"
              size={16}
              color={viewMode === 'map' ? COLORS.primary : COLORS.textSubtle}
            />
          </Pressable>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.sortContent}
      >
        {SORT_OPTIONS.map((option) => (
          <SortChip
            key={option.id}
            option={option}
            active={sort === option.id}
            onPress={() => handleSortChange(option.id)}
          />
        ))}

        {hasFilters ? (
          <Pressable
            onPress={() => setFilters(DEFAULT_FILTERS)}
            accessibilityRole="button"
            style={({ pressed }) => [styles.clearFilter, pressed && styles.pressed]}
          >
            <Ionicons name="close" size={12} color={COLORS.danger} />
            <Text style={styles.clearFilterText}>Clear filters</Text>
          </Pressable>
        ) : null}
      </ScrollView>

      {viewMode === 'map' ? (
        <MapPreview
          professionals={rankedProfessionals.slice(0, 14)}
          location={selectedLocation}
        />
      ) : null}
    </View>
  );

  const emptyComponent = !hydrated ? (
    <SkeletonCard count={3} />
  ) : viewMode === 'map' ? null : (
    <EmptyState
      icon="search-outline"
      title="No professionals match yet"
      description={
        hasFilters || debouncedQuery || activeCategoryId
          ? 'Try widening the distance, clearing a filter or searching a different service.'
          : `There are no professionals listed around ${locationLabel} yet.`
      }
      actionLabel="Reset search"
      onAction={resetAll}
    />
  );

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <FlatList
        data={viewMode === 'list' && hydrated ? visibleProfessionals : []}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ProfessionalCard professional={item} />}
        ListHeaderComponent={header}
        ListEmptyComponent={emptyComponent}
        ListFooterComponent={
          viewMode === 'list' && rankedProfessionals.length > 0 ? (
            <View style={styles.footer}>
              {hasMore ? (
                <Pressable
                  onPress={handleLoadMore}
                  accessibilityRole="button"
                  style={({ pressed }) => [styles.loadMore, pressed && styles.pressed]}
                >
                  <Text style={styles.loadMoreText}>Load more professionals</Text>
                  <Ionicons name="chevron-down" size={14} color={COLORS.primary} />
                </Pressable>
              ) : (
                <Text style={styles.footerText}>
                  You have seen all {rankedProfessionals.length} matches in this area.
                </Text>
              )}
            </View>
          ) : (
            <View style={styles.bottomSpace} />
          )
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshingLocation}
            onRefresh={handleRefresh}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled"
      />

      <LocationSelector
        visible={locationVisible}
        onClose={() => setLocationVisible(false)}
      />
      <FilterSheet
        visible={filtersVisible}
        onClose={() => setFiltersVisible(false)}
        filters={filters}
        onApply={handleApplyFilters}
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
    paddingBottom: 24,
  },
  hero: {
    paddingTop: 10,
    paddingBottom: 16,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    overflow: 'hidden',
  },
  previewNotice: {
    marginHorizontal: 20,
    marginTop: 12,
    paddingVertical: 9,
    paddingHorizontal: 11,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 7,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.warningSoft,
    borderWidth: 1,
    borderColor: COLORS.warningBorder,
  },
  previewNoticeText: {
    flex: 1,
    color: COLORS.warning,
    fontSize: 10,
    fontWeight: '600',
    lineHeight: 15,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 20,
  },
  brandMark: {
    width: 38,
    height: 38,
    borderRadius: 13,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.floating,
    shadowOpacity: 0.2,
  },
  brandCopy: {
    flex: 1,
  },
  brandName: {
    color: COLORS.primary,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  greeting: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  creditsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 7,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  creditsPillPaid: {
    backgroundColor: COLORS.premiumSoft,
    borderColor: COLORS.premiumBorder,
  },
  creditsText: {
    color: COLORS.text,
    fontSize: 10,
    fontWeight: '800',
  },
  creditsTextPaid: {
    color: COLORS.premium,
  },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 20,
    marginTop: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.soft,
  },
  locationIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: COLORS.primaryFaint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationCopy: {
    flex: 1,
  },
  locationOverline: {
    color: COLORS.textSubtle,
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1,
  },
  locationValue: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '800',
    marginTop: 2,
  },
  changePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.primaryFaint,
  },
  changeText: {
    color: COLORS.primary,
    fontSize: 10,
    fontWeight: '800',
  },
  headlineRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
    paddingHorizontal: 20,
    marginTop: 18,
  },
  headlineCopy: {
    flex: 1,
  },
  heroTitle: {
    color: COLORS.text,
    fontSize: 27,
    fontWeight: '800',
    letterSpacing: -0.7,
    lineHeight: 32,
  },
  heroSubtitle: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 18,
    marginTop: 4,
  },
  bellButton: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellBadge: {
    position: 'absolute',
    top: -3,
    right: -3,
    minWidth: 17,
    height: 17,
    paddingHorizontal: 4,
    borderRadius: 9,
    backgroundColor: COLORS.danger,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.surface,
  },
  bellBadgeText: {
    color: COLORS.surface,
    fontSize: 8,
    fontWeight: '900',
  },
  subcategoryContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    gap: 7,
  },
  subcategoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  subcategoryChipActive: {
    backgroundColor: COLORS.primarySoft,
    borderColor: '#D6D0FF',
  },
  subcategoryText: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '700',
  },
  subcategoryTextActive: {
    color: COLORS.primary,
  },
  railContent: {
    paddingHorizontal: 20,
    paddingBottom: 4,
    gap: 10,
  },
  resultsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 20,
    marginTop: 26,
  },
  resultsCopy: {
    flex: 1,
  },
  resultsTitle: {
    color: COLORS.text,
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  resultsSubtitle: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '500',
    marginTop: 3,
  },
  viewToggle: {
    flexDirection: 'row',
    padding: 3,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  viewButton: {
    width: 34,
    height: 30,
    borderRadius: RADIUS.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewButtonActive: {
    backgroundColor: COLORS.primarySoft,
  },
  sortContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 4,
    gap: 7,
  },
  sortChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sortChipActive: {
    backgroundColor: COLORS.primaryFaint,
    borderColor: COLORS.primarySoft,
  },
  sortChipText: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: '700',
  },
  sortChipTextActive: {
    color: COLORS.primary,
  },
  clearFilter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.dangerSoft,
    borderWidth: 1,
    borderColor: COLORS.dangerBorder,
  },
  clearFilterText: {
    color: COLORS.danger,
    fontSize: 10,
    fontWeight: '800',
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 8,
    alignItems: 'center',
  },
  loadMore: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    minHeight: 44,
    alignSelf: 'stretch',
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  loadMoreText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '800',
  },
  footerText: {
    color: COLORS.textSubtle,
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
    paddingVertical: 6,
  },
  bottomSpace: {
    height: 16,
  },
  pressed: {
    opacity: 0.8,
  },
});
