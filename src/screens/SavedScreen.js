import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Avatar, VerifiedBadge } from '../components/Avatar';
import EmptyState from '../components/EmptyState';
import ProfessionalCard from '../components/ProfessionalCard';
import { useApp } from '../context/AppContext';
import { COLORS, RADIUS, SHADOWS } from '../theme';

const TABS = [
  { id: 'saved', label: 'Saved', icon: 'bookmark-outline' },
  { id: 'enquiries', label: 'Enquiries', icon: 'mail-outline' },
  { id: 'viewed', label: 'Recently viewed', icon: 'time-outline' },
];

function formatEnquiryDate(value) {
  try {
    return new Date(value).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return 'Recently';
  }
}

function EnquiryCard({ enquiry, professional, onOpen }) {
  if (!professional) return null;

  return (
    <Pressable
      onPress={onOpen}
      accessibilityRole="button"
      accessibilityLabel={`Open enquiry with ${professional.name}`}
      style={({ pressed }) => [styles.enquiryCard, pressed && styles.pressed]}
    >
      <View style={styles.enquiryHeader}>
        <Avatar
          initials={professional.initials}
          uri={professional.avatarUrl}
          size={44}
          background={professional.avatarSoft}
          color={professional.avatarColor}
          online={professional.online}
        />

        <View style={styles.enquiryIdentity}>
          <View style={styles.nameRow}>
            <Text numberOfLines={1} style={styles.enquiryName}>
              {professional.name}
            </Text>
            {professional.verified ? (
              <VerifiedBadge size={12} level={professional.verificationLevel} />
            ) : null}
          </View>
          <Text numberOfLines={1} style={styles.enquiryProfession}>
            {professional.profession}
          </Text>
        </View>

        <View style={styles.statusPill}>
          <View style={styles.statusDot} />
          <Text style={styles.statusText}>Recorded</Text>
        </View>
      </View>

      {enquiry.serviceName ? (
        <View style={styles.serviceTag}>
          <Ionicons name="pricetag-outline" size={10} color={COLORS.primary} />
          <Text style={styles.serviceTagText}>{enquiry.serviceName}</Text>
        </View>
      ) : null}

      <Text numberOfLines={2} style={styles.enquiryMessage}>
        {enquiry.message}
      </Text>

      <View style={styles.enquiryFooter}>
        <Text style={styles.enquiryDate}>{formatEnquiryDate(enquiry.createdAt)}</Text>
        <View style={styles.openRow}>
          <Text style={styles.openText}>Open profile</Text>
          <Ionicons name="arrow-forward" size={12} color={COLORS.primary} />
        </View>
      </View>
    </Pressable>
  );
}

export default function SavedScreen() {
  const navigation = useNavigation();
  const {
    currentUser,
    favourites,
    enquiries,
    recentlyViewed,
    professionalMap,
    connections,
  } = useApp();
  const [activeTab, setActiveTab] = useState('saved');

  const openProfile = (professionalId) =>
    navigation.navigate('ProfessionalProfile', { professionalId });

  const enquiryItems = useMemo(
    () =>
      enquiries
        .map((enquiry) => ({
          enquiry,
          professional: professionalMap[enquiry.professionalId],
        }))
        .filter((item) => item.professional),
    [enquiries, professionalMap]
  );

  const stats = [
    { id: 'saved', value: favourites.length, label: 'Saved' },
    { id: 'enquiries', value: enquiries.length, label: 'Enquiries' },
    { id: 'connections', value: connections.length, label: 'Connections' },
  ];

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.headerCopy}>
              <Text style={styles.overline}>YOUR SPACE</Text>
              <Text style={styles.title}>Saved & enquiries</Text>
              <Text style={styles.subtitle}>
                Keep track of professionals and the conversations you started.
              </Text>
            </View>

            <Avatar
              initials={currentUser.initials}
              size={44}
              background={currentUser.avatarSoft}
              color={currentUser.avatarColor}
              ring
            />
          </View>

          <View style={styles.statsRow}>
            {stats.map((stat) => (
              <View key={stat.id} style={styles.statTile}>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.tabBar}>
          {TABS.map((tab) => {
            const active = activeTab === tab.id;

            return (
              <Pressable
                key={tab.id}
                onPress={() => setActiveTab(tab.id)}
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}
                style={[styles.tab, active && styles.tabActive]}
              >
                <Ionicons
                  name={tab.icon}
                  size={14}
                  color={active ? COLORS.primary : COLORS.textSubtle}
                />
                <Text style={[styles.tabText, active && styles.tabTextActive]}>
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {activeTab === 'saved' ? (
          favourites.length ? (
            <View style={styles.list}>
              {favourites.map((professional) => (
                <ProfessionalCard
                  key={professional.id}
                  professional={professional}
                />
              ))}
            </View>
          ) : (
            <EmptyState
              icon="heart-outline"
              title="No saved professionals yet"
              description="Tap the heart on a profile or card to keep it here for later."
              actionLabel="Discover professionals"
              onAction={() => navigation.navigate('Discover')}
            />
          )
        ) : null}

        {activeTab === 'enquiries' ? (
          enquiryItems.length ? (
            <View style={styles.list}>
              {enquiryItems.map(({ enquiry, professional }) => (
                <EnquiryCard
                  key={enquiry.id}
                  enquiry={enquiry}
                  professional={professional}
                  onOpen={() => openProfile(professional.id)}
                />
              ))}
            </View>
          ) : (
            <EmptyState
              icon="mail-open-outline"
              title="No enquiries yet"
              description="When you send an enquiry from a profile, it will appear here with the service and date."
              actionLabel="Find someone nearby"
              onAction={() => navigation.navigate('Discover')}
            />
          )
        ) : null}

        {activeTab === 'viewed' ? (
          recentlyViewed.length ? (
            <View style={styles.list}>
              {recentlyViewed.map((professional) => (
                <ProfessionalCard
                  key={professional.id}
                  professional={professional}
                />
              ))}
            </View>
          ) : (
            <EmptyState
              icon="time-outline"
              title="Nothing viewed yet"
              description="Profiles you open will be kept here so you can come back to them quickly."
              actionLabel="Start exploring"
              onAction={() => navigation.navigate('Discover')}
            />
          )
        ) : null}

        <View style={styles.footer}>
          <Ionicons name="shield-checkmark-outline" size={13} color={COLORS.textSubtle} />
          <Text style={styles.footerText}>
            Saved profiles and enquiries are private to your account.
          </Text>
        </View>
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
    paddingBottom: 28,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  headerCopy: {
    flex: 1,
  },
  overline: {
    color: COLORS.primary,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.3,
  },
  title: {
    color: COLORS.text,
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.6,
    marginTop: 5,
  },
  subtitle: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 18,
    marginTop: 5,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 9,
    marginTop: 18,
  },
  statTile: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    ...SHADOWS.soft,
  },
  statValue: {
    color: COLORS.primary,
    fontSize: 21,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  statLabel: {
    color: COLORS.textMuted,
    fontSize: 9,
    fontWeight: '700',
    marginTop: 2,
  },
  tabBar: {
    flexDirection: 'row',
    gap: 5,
    marginHorizontal: 20,
    marginTop: 18,
    marginBottom: 14,
    padding: 4,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
    borderRadius: RADIUS.pill,
  },
  tabActive: {
    backgroundColor: COLORS.primaryFaint,
  },
  tabText: {
    color: COLORS.textSubtle,
    fontSize: 9,
    fontWeight: '700',
  },
  tabTextActive: {
    color: COLORS.primary,
  },
  list: {
    marginTop: 2,
  },
  enquiryCard: {
    marginHorizontal: 20,
    marginBottom: 10,
    padding: 14,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.card,
  },
  enquiryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  enquiryIdentity: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  enquiryName: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '800',
    flexShrink: 1,
  },
  enquiryProfession: {
    color: COLORS.primary,
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.successSoft,
  },
  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: COLORS.success,
  },
  statusText: {
    color: COLORS.success,
    fontSize: 8,
    fontWeight: '800',
  },
  serviceTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    marginTop: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.primaryFaint,
  },
  serviceTagText: {
    color: COLORS.primary,
    fontSize: 9,
    fontWeight: '700',
  },
  enquiryMessage: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '500',
    lineHeight: 17,
    marginTop: 8,
  },
  enquiryFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 11,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  enquiryDate: {
    color: COLORS.textSubtle,
    fontSize: 9,
    fontWeight: '600',
  },
  openRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  openText: {
    color: COLORS.primary,
    fontSize: 9,
    fontWeight: '800',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    marginTop: 22,
    paddingHorizontal: 20,
  },
  footerText: {
    color: COLORS.textSubtle,
    fontSize: 9,
    fontWeight: '500',
  },
  pressed: {
    opacity: 0.8,
  },
});
