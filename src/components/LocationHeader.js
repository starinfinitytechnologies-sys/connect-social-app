import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useApp } from '../context/AppContext';
import { COLORS, RADIUS, SHADOWS } from '../theme';
import { Avatar } from './Avatar';

export default function LocationHeader() {
  const {
    currentUser,
    locationLabel,
    locationStatus,
    isRefreshingLocation,
    refreshLocation,
  } = useApp();

  const isLive = locationStatus === 'granted';
  const isLoading = locationStatus === 'loading' || isRefreshingLocation;
  const actionLabel = isLive ? 'LIVE' : isLoading ? 'LOCATING' : 'RETRY';

  return (
    <View style={styles.wrapper}>
      <View style={styles.art} />

      <View style={styles.topRow}>
        <View style={styles.headingBlock}>
          <Text style={styles.kicker}>NEARBY PROFESSIONALS</Text>
          <Text style={styles.title}>Discover</Text>
          <Text style={styles.subtitle}>Build your local professional circle.</Text>
        </View>

        <Avatar
          initials={currentUser.initials}
          size={48}
          background={currentUser.avatarSoft}
          color={currentUser.avatarColor}
          style={styles.profileAvatar}
        />
      </View>

      <Pressable
        onPress={refreshLocation}
        disabled={isLoading}
        accessibilityRole="button"
        accessibilityLabel="Refresh your current location"
        style={styles.locationChip}
      >
        <View style={[styles.statusDot, !isLive && styles.statusDotMuted]} />
        <Text numberOfLines={1} style={styles.locationText}>
          {locationLabel}
        </Text>

        {isLoading ? (
          <ActivityIndicator size="small" color={COLORS.primary} style={styles.spinner} />
        ) : null}

        <View style={[styles.livePill, !isLive && styles.livePillMuted]}>
          <Text style={[styles.liveText, !isLive && styles.liveTextMuted]}>{actionLabel}</Text>
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingTop: 10,
    paddingBottom: 2,
    overflow: 'hidden',
  },
  art: {
    position: 'absolute',
    top: -90,
    right: -70,
    width: 210,
    height: 210,
    borderRadius: 105,
    backgroundColor: COLORS.primarySoft,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  headingBlock: {
    flex: 1,
    paddingRight: 14,
  },
  kicker: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.4,
  },
  title: {
    color: COLORS.text,
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.7,
    marginTop: 6,
  },
  subtitle: {
    color: COLORS.textMuted,
    fontSize: 14,
    fontWeight: '500',
    marginTop: 5,
    lineHeight: 20,
  },
  profileAvatar: {
    marginTop: 8,
  },
  locationChip: {
    marginHorizontal: 20,
    marginTop: 20,
    paddingLeft: 14,
    paddingRight: 8,
    paddingVertical: 8,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    ...SHADOWS.soft,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.success,
    marginRight: 9,
  },
  statusDotMuted: {
    backgroundColor: COLORS.textSubtle,
  },
  locationText: {
    flex: 1,
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '600',
    marginRight: 8,
  },
  spinner: {
    marginRight: 8,
  },
  livePill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.successSoft,
  },
  livePillMuted: {
    backgroundColor: COLORS.surfaceMuted,
  },
  liveText: {
    color: COLORS.success,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  liveTextMuted: {
    color: COLORS.textMuted,
  },
});
