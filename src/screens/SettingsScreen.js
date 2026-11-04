import React from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Avatar } from '../components/Avatar';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { COLORS, RADIUS, SHADOWS } from '../theme';

function SettingRow({ title, description, value, icon, onPress, danger = false }) {
  const content = (
    <>
      {icon ? (
        <View style={styles.settingIcon}>
          <Ionicons name={icon} size={16} color={danger ? COLORS.danger : COLORS.primary} />
        </View>
      ) : null}

      <View style={styles.settingCopy}>
        <Text style={[styles.settingTitle, danger && styles.settingTitleDanger]}>
          {title}
        </Text>
        {description ? <Text style={styles.settingDescription}>{description}</Text> : null}
      </View>

      {value ? (
        <View style={styles.valuePill}>
          <Text style={styles.valuePillText}>{value}</Text>
        </View>
      ) : null}

      {onPress ? (
        <Ionicons name="chevron-forward" size={15} color={COLORS.textSubtle} />
      ) : null}
    </>
  );

  if (!onPress) return <View style={styles.settingRow}>{content}</View>;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [styles.settingRow, pressed && styles.pressed]}
    >
      {content}
    </Pressable>
  );
}

export default function SettingsScreen() {
  const {
    currentUser,
    planName,
    isPaid,
    credits,
    openPaywall,
    setPremium,
    resetDemo,
    locationLabel,
    selectedLocation,
    blockedIds,
    professionalMap,
    unblockUser,
    enquiries,
    favourites,
  } = useApp();
  const {
    configured: backendConfigured,
    user: authUser,
    signOut,
  } = useAuth();

  const handleSignOut = () => {
    Alert.alert(
      'Sign out?',
      'You will need to sign in again to access your saved profiles and enquiries.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign out',
          style: 'destructive',
          onPress: async () => {
            const result = await signOut();
            if (!result.ok) {
              Alert.alert('Could not sign out', result.error);
            }
          },
        },
      ]
    );
  };

  const handleReset = () => {
    Alert.alert(
      'Reset development data?',
      'This clears saved profiles, enquiries, blocks and demo conversations, and restores the original seed data.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Reset', style: 'destructive', onPress: resetDemo },
      ]
    );
  };

  const blockedProfessionals = blockedIds
    .map((professionalId) => professionalMap[professionalId])
    .filter(Boolean);

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <View style={styles.header}>
          <Text style={styles.overline}>ACCOUNT</Text>
          <Text style={styles.title}>Settings</Text>
          <Text style={styles.subtitle}>
            Manage your membership, location privacy and safety preferences.
          </Text>
        </View>

        <View style={styles.profileCard}>
          <Avatar
            initials={currentUser.initials}
            size={62}
            background={currentUser.avatarSoft}
            color={currentUser.avatarColor}
            ring
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

          <View style={[styles.planPill, isPaid && styles.planPillPro]}>
            <Text style={[styles.planPillText, isPaid && styles.planPillTextPro]}>
              {planName.toUpperCase()}
            </Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Account</Text>

        <View style={styles.settingsCard}>
          {backendConfigured ? (
            <>
              <SettingRow
                icon="mail-outline"
                title="Signed in as"
                description="Your account is protected by Supabase authentication."
                value={authUser?.email || 'Unknown email'}
              />
              <View style={styles.divider} />
              <SettingRow
                icon="log-out-outline"
                title="Sign out"
                description="Remove this session from the device."
                onPress={handleSignOut}
                danger
              />
            </>
          ) : (
            <View style={styles.backendNotice}>
              <View style={styles.backendNoticeIcon}>
                <Ionicons name="construct-outline" size={17} color={COLORS.warning} />
              </View>
              <View style={styles.backendNoticeCopy}>
                <Text style={styles.backendNoticeTitle}>Local demo mode</Text>
                <Text style={styles.backendNoticeText}>
                  Supabase is not configured in this build. The app is using local
                  AsyncStorage with seed data. Add the environment variables from
                  .env.example to enable real accounts.
                </Text>
              </View>
            </View>
          )}
        </View>

        <Text style={styles.sectionTitle}>Membership</Text>

        <LinearGradient
          colors={['#3B2FB5', '#221B78']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.membershipCard}
        >
          <View style={styles.membershipTopRow}>
            <View style={styles.membershipCopy}>
              <Text style={styles.membershipKicker}>
                {isPaid ? `${planName.toUpperCase()} MEMBER` : 'FREE MEMBER'}
              </Text>
              <Text style={styles.membershipTitle}>
                {isPaid ? 'Unlimited enquiries' : `${credits} credits remaining`}
              </Text>
            </View>

            <View style={styles.membershipBadge}>
              <Ionicons
                name={isPaid ? 'diamond' : 'flash'}
                size={12}
                color="#E0E7FF"
              />
              <Text style={styles.membershipBadgeText}>
                {isPaid ? planName.toUpperCase() : 'FREE'}
              </Text>
            </View>
          </View>

          <Text style={styles.membershipDescription}>
            {isPaid
              ? 'Paid features are enabled for this development preview. Real billing is not connected yet.'
              : 'Free members receive monthly connection and enquiry credits. Upgrade for better visibility.'}
          </Text>

          <View style={styles.membershipStats}>
            <View style={styles.membershipStat}>
              <Text style={styles.membershipStatLabel}>Plan</Text>
              <Text style={styles.membershipStatValue}>{planName}</Text>
            </View>
            <View style={styles.membershipStatDivider} />
            <View style={styles.membershipStat}>
              <Text style={styles.membershipStatLabel}>Enquiries</Text>
              <Text style={styles.membershipStatValue}>
                {isPaid ? 'Unlimited' : credits}
              </Text>
            </View>
            <View style={styles.membershipStatDivider} />
            <View style={styles.membershipStat}>
              <Text style={styles.membershipStatLabel}>Billing</Text>
              <Text style={styles.membershipStatValue}>
                {isPaid ? 'Preview' : 'Not active'}
              </Text>
            </View>
          </View>

          <Pressable
            onPress={openPaywall}
            accessibilityRole="button"
            style={({ pressed }) => [styles.membershipButton, pressed && styles.pressed]}
          >
            <Text style={styles.membershipButtonText}>
              {isPaid ? 'Compare plans' : 'View plans & credits'}
            </Text>
            <Ionicons name="arrow-forward" size={14} color="#312E81" />
          </Pressable>
        </LinearGradient>

        <Text style={styles.sectionTitle}>Privacy & location</Text>

        <View style={styles.settingsCard}>
          <SettingRow
            icon="navigate-outline"
            title="Discovery area"
            description={
              selectedLocation.source === 'device'
                ? 'Using your device location. Manual selection is also available.'
                : 'Manually selected area. You can switch to device location anytime.'
            }
            value={selectedLocation.label}
          />
          <View style={styles.divider} />
          <SettingRow
            icon="home-outline"
            title="Exact address"
            description="Never shown publicly. Only your selected neighbourhood is used for ranking."
            value="Private"
          />
          <View style={styles.divider} />
          <SettingRow
            icon="eye-off-outline"
            title="Contact visibility"
            description="Professionals and customers choose which contact details are public."
            value="Per profile"
          />
          <View style={styles.divider} />
          <SettingRow
            icon="document-text-outline"
            title="Your enquiries"
            description="Enquiries you send are kept in the Saved tab."
            value={String(enquiries.length)}
          />
        </View>

        <Text style={styles.sectionTitle}>Blocked accounts</Text>

        <View style={styles.settingsCard}>
          {blockedProfessionals.length ? (
            blockedProfessionals.map((professional, index) => (
              <React.Fragment key={professional.id}>
                {index > 0 ? <View style={styles.divider} /> : null}
                <View style={styles.blockedRow}>
                  <Avatar
                    initials={professional.initials}
                    size={38}
                    background={professional.avatarSoft}
                    color={professional.avatarColor}
                  />
                  <View style={styles.blockedCopy}>
                    <Text style={styles.blockedName}>{professional.name}</Text>
                    <Text style={styles.blockedProfession}>{professional.profession}</Text>
                  </View>
                  <Pressable
                    onPress={() => unblockUser(professional.id)}
                    accessibilityRole="button"
                    style={({ pressed }) => [styles.unblockButton, pressed && styles.pressed]}
                  >
                    <Text style={styles.unblockText}>Unblock</Text>
                  </Pressable>
                </View>
              </React.Fragment>
            ))
          ) : (
            <View style={styles.emptyBlocked}>
              <Ionicons name="shield-checkmark-outline" size={20} color={COLORS.success} />
              <Text style={styles.emptyBlockedText}>
                No blocked accounts. Use the flag or block action on a profile if needed.
              </Text>
            </View>
          )}
        </View>

        <Text style={styles.sectionTitle}>Saved privacy</Text>

        <View style={styles.settingsCard}>
          <SettingRow
            icon="heart-outline"
            title="Saved professionals"
            description="Visible only to you on this device."
            value={String(favourites.length)}
          />
          <View style={styles.divider} />
          <SettingRow
            icon="chatbubble-ellipses-outline"
            title="Private messaging"
            description="Only accepted connections can start a chat."
            value="ON"
          />
        </View>

        <Text style={styles.sectionTitle}>Development tools</Text>

        <View style={styles.settingsCard}>
          <View style={styles.settingRow}>
            <View style={styles.settingIcon}>
              <Ionicons name="construct-outline" size={16} color={COLORS.primary} />
            </View>
            <View style={styles.settingCopy}>
              <Text style={styles.settingTitle}>Preview a paid plan</Text>
              <Text style={styles.settingDescription}>
                Switches the local plan state only. This is not a payment or a
                subscription.
              </Text>
            </View>
            <Switch
              value={isPaid}
              onValueChange={setPremium}
              trackColor={{ false: COLORS.borderStrong, true: '#B9AEFF' }}
              thumbColor={isPaid ? COLORS.primary : COLORS.surface}
              ios_backgroundColor={COLORS.borderStrong}
            />
          </View>

          <View style={styles.divider} />

          <SettingRow
            icon="refresh-outline"
            title="Reset development data"
            description="Restore seed profiles, credits and demo conversations."
            onPress={handleReset}
          />
        </View>

        <View style={styles.aboutCard}>
          <View style={styles.aboutRow}>
            <View style={styles.aboutMark}>
              <Ionicons name="location" size={15} color={COLORS.surface} />
            </View>
            <View style={styles.aboutCopy}>
              <Text style={styles.aboutName}>Connect Local</Text>
              <Text style={styles.aboutMeta}>v1.0.0 · Kolkata pilot</Text>
            </View>
          </View>

          <Text style={styles.aboutText}>
            A location-aware professional discovery marketplace. Payments, professional
            dashboards and admin moderation are being built in later phases.
          </Text>

          <View style={styles.aboutBadges}>
            <View style={styles.aboutBadge}>
              <Ionicons name="lock-closed-outline" size={11} color={COLORS.textSubtle} />
              <Text style={styles.aboutBadgeText}>No card details collected</Text>
            </View>
            <View style={styles.aboutBadge}>
              <Ionicons name="shield-outline" size={11} color={COLORS.textSubtle} />
              <Text style={styles.aboutBadgeText}>Payments not connected</Text>
            </View>
          </View>
        </View>

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
    paddingBottom: 24,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  overline: {
    color: COLORS.primary,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.3,
  },
  title: {
    color: COLORS.text,
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -0.7,
    marginTop: 5,
  },
  subtitle: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 18,
    marginTop: 5,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 18,
    padding: 15,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.card,
  },
  profileInfo: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  profileName: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  profileRole: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  profileLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  locationDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.success,
    marginRight: 5,
  },
  profileLocationText: {
    color: COLORS.textSubtle,
    fontSize: 10,
    fontWeight: '600',
    flexShrink: 1,
  },
  planPill: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.surfaceMuted,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  planPillPro: {
    backgroundColor: COLORS.premiumSoft,
    borderColor: COLORS.premiumBorder,
  },
  planPillText: {
    color: COLORS.textSubtle,
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  planPillTextPro: {
    color: COLORS.premium,
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: -0.2,
    paddingHorizontal: 20,
    marginTop: 24,
    marginBottom: 9,
  },
  membershipCard: {
    marginHorizontal: 20,
    padding: 17,
    borderRadius: RADIUS.lg,
    ...SHADOWS.card,
    shadowColor: '#2A2391',
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
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  membershipTitle: {
    color: COLORS.surface,
    fontSize: 21,
    fontWeight: '800',
    letterSpacing: -0.4,
    marginTop: 6,
  },
  membershipBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
  },
  membershipBadgeText: {
    color: '#E0E7FF',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  membershipDescription: {
    color: '#C7D2FE',
    fontSize: 10,
    fontWeight: '500',
    lineHeight: 16,
    marginTop: 8,
  },
  membershipStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderRadius: RADIUS.md,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  membershipStat: {
    flex: 1,
  },
  membershipStatLabel: {
    color: '#A5B4FC',
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  membershipStatValue: {
    color: COLORS.surface,
    fontSize: 12,
    fontWeight: '800',
    marginTop: 3,
  },
  membershipStatDivider: {
    width: 1,
    height: 26,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    marginHorizontal: 10,
  },
  membershipButton: {
    marginTop: 14,
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface,
  },
  membershipButtonText: {
    color: '#312E81',
    fontSize: 12,
    fontWeight: '800',
  },
  settingsCard: {
    marginHorizontal: 20,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 14,
    ...SHADOWS.soft,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 13,
  },
  backendNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 9,
    paddingVertical: 14,
  },
  backendNoticeIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: COLORS.warningSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backendNoticeCopy: {
    flex: 1,
  },
  backendNoticeTitle: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: '700',
  },
  backendNoticeText: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: '500',
    lineHeight: 15,
    marginTop: 3,
  },
  settingIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: COLORS.primaryFaint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingCopy: {
    flex: 1,
  },
  settingTitle: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: '700',
  },
  settingTitleDanger: {
    color: COLORS.danger,
  },
  settingDescription: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: '500',
    lineHeight: 15,
    marginTop: 2,
  },
  valuePill: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.primaryFaint,
    maxWidth: 100,
  },
  valuePillText: {
    color: COLORS.primary,
    fontSize: 8,
    fontWeight: '800',
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
  },
  blockedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 11,
  },
  blockedCopy: {
    flex: 1,
  },
  blockedName: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: '700',
  },
  blockedProfession: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: '500',
    marginTop: 1,
  },
  unblockButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.primaryFaint,
  },
  unblockText: {
    color: COLORS.primary,
    fontSize: 9,
    fontWeight: '800',
  },
  emptyBlocked: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingVertical: 14,
  },
  emptyBlockedText: {
    flex: 1,
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: '500',
    lineHeight: 15,
  },
  aboutCard: {
    marginHorizontal: 20,
    marginTop: 22,
    padding: 15,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  aboutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  aboutMark: {
    width: 32,
    height: 32,
    borderRadius: 11,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aboutCopy: {
    flex: 1,
  },
  aboutName: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '800',
  },
  aboutMeta: {
    color: COLORS.textSubtle,
    fontSize: 9,
    fontWeight: '600',
    marginTop: 1,
  },
  aboutText: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: '500',
    lineHeight: 15,
    marginTop: 10,
  },
  aboutBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
    marginTop: 10,
  },
  aboutBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.surfaceMuted,
  },
  aboutBadgeText: {
    color: COLORS.textSubtle,
    fontSize: 8,
    fontWeight: '700',
  },
  bottomSpace: {
    height: 20,
  },
  pressed: {
    opacity: 0.76,
  },
});
