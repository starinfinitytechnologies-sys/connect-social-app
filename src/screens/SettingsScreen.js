import React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Avatar } from '../components/Avatar';
import { useApp } from '../context/AppContext';
import { COLORS, RADIUS, SHADOWS } from '../theme';

export default function SettingsScreen() {
  const {
    currentUser,
    isPremium,
    credits,
    setPremium,
    openPaywall,
    resetDemo,
    locationLabel,
  } = useApp();

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <View style={styles.header}>
          <Text style={styles.kicker}>ACCOUNT</Text>
          <Text style={styles.title}>Settings</Text>
          <Text style={styles.subtitle}>
            Manage your membership and test the connection experience.
          </Text>
        </View>

        <View style={styles.profileCard}>
          <Avatar
            initials={currentUser.initials}
            size={62}
            background={currentUser.avatarSoft}
            color={currentUser.avatarColor}
          />

          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{currentUser.name}</Text>
            <Text style={styles.profileRole}>{currentUser.profession}</Text>
            <View style={styles.profileLocation}>
              <View style={styles.locationDot} />
              <Text numberOfLines={1} style={styles.profileLocationText}>
                {locationLabel}
              </Text>
            </View>
          </View>

          <View style={[styles.planPill, isPremium && styles.planPillPro]}>
            <Text style={[styles.planPillText, isPremium && styles.planPillTextPro]}>
              {isPremium ? 'PRO' : 'FREE'}
            </Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Membership</Text>

        <View style={styles.membershipCard}>
          <View style={styles.membershipTopRow}>
            <View style={styles.membershipCopy}>
              <Text style={styles.membershipKicker}>
                {isPremium ? 'PREMIUM PRO MEMBER' : 'FREE MEMBER'}
              </Text>
              <Text style={styles.membershipTitle}>
                {isPremium ? 'Unlimited connections' : `${credits} credits remaining`}
              </Text>
            </View>

            <View style={styles.membershipBadge}>
              <Text style={styles.membershipBadgeText}>{isPremium ? 'PRO' : 'FREE'}</Text>
            </View>
          </View>

          <Text style={styles.membershipDescription}>
            {isPremium
              ? 'Priority local search and unlimited connection requests are active.'
              : 'Each connection request uses one credit. Upgrade for unlimited local networking.'}
          </Text>

          <View style={styles.membershipStats}>
            <View style={styles.membershipStat}>
              <Text style={styles.membershipStatLabel}>Plan</Text>
              <Text style={styles.membershipStatValue}>
                {isPremium ? 'Monthly Pro' : 'Free'}
              </Text>
            </View>
            <View style={styles.membershipStatDivider} />
            <View style={styles.membershipStat}>
              <Text style={styles.membershipStatLabel}>Connects</Text>
              <Text style={styles.membershipStatValue}>
                {isPremium ? 'Unlimited' : credits}
              </Text>
            </View>
          </View>

          <Pressable
            onPress={openPaywall}
            style={({ pressed }) => [styles.membershipButton, pressed && styles.pressed]}
          >
            <Text style={styles.membershipButtonText}>
              {isPremium ? 'Manage membership' : 'Upgrade to Pro'}
            </Text>
          </Pressable>
        </View>

        <Text style={styles.sectionTitle}>Testing</Text>

        <View style={styles.settingsCard}>
          <View style={styles.settingRow}>
            <View style={styles.settingCopy}>
              <Text style={styles.settingTitle}>Simulate Premium Pro</Text>
              <Text style={styles.settingDescription}>
                Switch between Free and Premium account states instantly.
              </Text>
            </View>

            <Switch
              value={isPremium}
              onValueChange={setPremium}
              trackColor={{ false: COLORS.borderStrong, true: '#A5B4FC' }}
              thumbColor={isPremium ? COLORS.primary : COLORS.surface}
              ios_backgroundColor={COLORS.borderStrong}
            />
          </View>

          <View style={styles.divider} />

          <Pressable
            onPress={resetDemo}
            style={({ pressed }) => [styles.settingRow, pressed && styles.pressed]}
          >
            <View style={styles.settingCopy}>
              <Text style={styles.settingTitle}>Reset demo data</Text>
              <Text style={styles.settingDescription}>
                Restore 3 credits, pending requests, and sample chats.
              </Text>
            </View>
            <Text style={styles.resetGlyph}>↺</Text>
          </Pressable>
        </View>

        <Text style={styles.sectionTitle}>Preferences</Text>

        <View style={styles.settingsCard}>
          <View style={styles.settingRow}>
            <View style={styles.settingCopy}>
              <Text style={styles.settingTitle}>Distance units</Text>
              <Text style={styles.settingDescription}>
                Show nearby professionals in kilometers.
              </Text>
            </View>
            <View style={styles.valuePill}>
              <Text style={styles.valuePillText}>km</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.settingRow}>
            <View style={styles.settingCopy}>
              <Text style={styles.settingTitle}>Private messaging</Text>
              <Text style={styles.settingDescription}>
                Only accepted connections can start a chat.
              </Text>
            </View>
            <View style={styles.onPill}>
              <Text style={styles.onPillText}>ON</Text>
            </View>
          </View>
        </View>

        <Text style={styles.footer}>Connect Local · v1.0.0</Text>
        <View style={styles.bottomSpace} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    paddingBottom: 20,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
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
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 20,
    padding: 16,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.card,
  },
  profileInfo: {
    flex: 1,
    marginLeft: 13,
    marginRight: 8,
  },
  profileName: {
    color: COLORS.text,
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  profileRole: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '500',
    marginTop: 3,
  },
  profileLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 7,
  },
  locationDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.success,
    marginRight: 6,
  },
  profileLocationText: {
    color: COLORS.textSubtle,
    fontSize: 11,
    fontWeight: '600',
    flexShrink: 1,
  },
  planPill: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.surfaceMuted,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  planPillPro: {
    backgroundColor: COLORS.premiumSoft,
    borderColor: '#DDD6FE',
  },
  planPillText: {
    color: COLORS.textSubtle,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
  },
  planPillTextPro: {
    color: COLORS.premium,
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.2,
    paddingHorizontal: 20,
    marginTop: 26,
    marginBottom: 10,
  },
  membershipCard: {
    marginHorizontal: 20,
    padding: 18,
    borderRadius: RADIUS.lg,
    backgroundColor: '#312E81',
    ...SHADOWS.card,
    shadowColor: '#312E81',
    shadowOpacity: 0.22,
    elevation: 6,
  },
  membershipTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  membershipCopy: {
    flex: 1,
  },
  membershipKicker: {
    color: '#C7D2FE',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.3,
  },
  membershipTitle: {
    color: COLORS.surface,
    fontSize: 21,
    fontWeight: '800',
    letterSpacing: -0.4,
    marginTop: 7,
  },
  membershipBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
  },
  membershipBadgeText: {
    color: '#E0E7FF',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
  },
  membershipDescription: {
    color: '#C7D2FE',
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 18,
    marginTop: 8,
  },
  membershipStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: RADIUS.md,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  membershipStat: {
    flex: 1,
  },
  membershipStatLabel: {
    color: '#A5B4FC',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  membershipStatValue: {
    color: COLORS.surface,
    fontSize: 14,
    fontWeight: '800',
    marginTop: 3,
  },
  membershipStatDivider: {
    width: 1,
    height: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    marginHorizontal: 14,
  },
  membershipButton: {
    marginTop: 16,
    minHeight: 44,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  membershipButtonText: {
    color: '#312E81',
    fontSize: 13,
    fontWeight: '800',
  },
  settingsCard: {
    marginHorizontal: 20,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 16,
    ...SHADOWS.soft,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
  },
  settingCopy: {
    flex: 1,
    marginRight: 14,
  },
  settingTitle: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '700',
  },
  settingDescription: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '500',
    lineHeight: 16,
    marginTop: 3,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
  },
  resetGlyph: {
    color: COLORS.primary,
    fontSize: 21,
    fontWeight: '600',
  },
  valuePill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.primarySoft,
  },
  valuePillText: {
    color: COLORS.primary,
    fontSize: 10,
    fontWeight: '800',
  },
  onPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.successSoft,
  },
  onPillText: {
    color: COLORS.success,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  pressed: {
    opacity: 0.76,
  },
  footer: {
    color: COLORS.textSubtle,
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 26,
  },
  bottomSpace: {
    height: 16,
  },
});
