import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Avatar, VerifiedBadge } from '../components/Avatar';
import { useApp } from '../context/AppContext';
import { CATEGORY_META } from '../data/mockData';
import { COLORS, RADIUS, SHADOWS } from '../theme';

function SectionHeader({ title, count }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.countPill}>
        <Text style={styles.countText}>{count}</Text>
      </View>
    </View>
  );
}

function RequestCard({ professional, onAccept, onDecline }) {
  const category = CATEGORY_META[professional.category] || {
    color: COLORS.primary,
    soft: COLORS.primarySoft,
  };

  return (
    <View style={styles.requestCard}>
      <View style={styles.requestProfile}>
        <Avatar
          initials={professional.initials}
          size={52}
          background={professional.avatarSoft}
          color={professional.avatarColor}
          online={professional.online}
        />

        <View style={styles.requestInfo}>
          <View style={styles.nameRow}>
            <Text numberOfLines={1} style={styles.name}>
              {professional.name}
            </Text>
            {professional.verified ? <VerifiedBadge size={14} /> : null}
          </View>

          <View style={styles.requestMetaRow}>
            <View style={[styles.professionPill, { backgroundColor: category.soft }]}>
              <Text numberOfLines={1} style={[styles.professionText, { color: category.color }]}>
                {professional.profession}
              </Text>
            </View>
            <Text style={styles.distance}>{professional.distanceKm.toFixed(1)} km</Text>
          </View>

          <Text style={styles.requestPrompt}>Wants to connect with you</Text>
        </View>
      </View>

      <View style={styles.requestActions}>
        <Pressable
          onPress={() => onAccept(professional.id)}
          accessibilityRole="button"
          style={({ pressed }) => [styles.acceptButton, pressed && styles.buttonPressed]}
        >
          <Text style={styles.acceptText}>Accept</Text>
        </Pressable>

        <Pressable
          onPress={() => onDecline(professional.id)}
          accessibilityRole="button"
          style={({ pressed }) => [styles.declineButton, pressed && styles.buttonPressed]}
        >
          <Text style={styles.declineText}>Decline</Text>
        </Pressable>
      </View>
    </View>
  );
}

function getPreview(professional) {
  const messages = professional.relation?.messages || [];
  const lastMessage = messages[messages.length - 1];

  if (!lastMessage) {
    return 'Say hello to start the conversation';
  }

  return `${lastMessage.sender === 'me' ? 'You: ' : ''}${lastMessage.text}`;
}

export default function ConnectionsScreen() {
  const navigation = useNavigation();
  const {
    incomingRequests,
    outgoingRequests,
    connections,
    acceptRequest,
    declineRequest,
    openChat,
    isPremium,
    credits,
    openPaywall,
  } = useApp();

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <View style={styles.header}>
          <Text style={styles.kicker}>INBOX & NETWORK</Text>
          <Text style={styles.title}>Connections</Text>
          <Text style={styles.subtitle}>
            Review requests before you open a private chat.
          </Text>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statTile}>
            <Text style={[styles.statValue, { color: COLORS.primary }]}>
              {incomingRequests.length}
            </Text>
            <Text style={styles.statLabel}>Requests</Text>
          </View>

          <View style={styles.statTile}>
            <Text style={[styles.statValue, { color: COLORS.success }]}>
              {connections.length}
            </Text>
            <Text style={styles.statLabel}>Connected</Text>
          </View>

          <Pressable
            onPress={openPaywall}
            style={({ pressed }) => [styles.statTile, pressed && styles.buttonPressed]}
          >
            <Text style={[styles.statValue, { color: isPremium ? COLORS.premium : COLORS.gold }]}>
              {isPremium ? 'PRO' : credits}
            </Text>
            <Text style={styles.statLabel}>{isPremium ? 'Membership' : 'Credits'}</Text>
          </Pressable>
        </View>

        <SectionHeader title="Connection requests" count={incomingRequests.length} />

        {incomingRequests.length > 0 ? (
          incomingRequests.map((professional) => (
            <RequestCard
              key={professional.id}
              professional={professional}
              onAccept={acceptRequest}
              onDecline={declineRequest}
            />
          ))
        ) : (
          <View style={styles.emptyRequestCard}>
            <View style={styles.emptyRequestIcon}>
              <View style={styles.emptyRequestLine} />
              <View style={[styles.emptyRequestLine, styles.emptyRequestLineShort]} />
            </View>
            <View style={styles.emptyRequestCopy}>
              <Text style={styles.emptyRequestTitle}>You are all caught up</Text>
              <Text style={styles.emptyRequestText}>New requests will land here for review.</Text>
            </View>
          </View>
        )}

        {outgoingRequests.length > 0 ? (
          <View>
            <SectionHeader title="Sent requests" count={outgoingRequests.length} />

            {outgoingRequests.map((professional) => (
              <View key={professional.id} style={styles.sentRow}>
                <Avatar
                  initials={professional.initials}
                  size={40}
                  background={professional.avatarSoft}
                  color={professional.avatarColor}
                />
                <View style={styles.sentInfo}>
                  <Text numberOfLines={1} style={styles.sentName}>
                    {professional.name}
                  </Text>
                  <Text numberOfLines={1} style={styles.sentMeta}>
                    {professional.profession}
                  </Text>
                </View>
                <View style={styles.pendingPill}>
                  <View style={styles.pendingDot} />
                  <Text style={styles.pendingText}>Pending</Text>
                </View>
              </View>
            ))}
          </View>
        ) : null}

        <SectionHeader title="Your network" count={connections.length} />

        {connections.length > 0 ? (
          connections.map((professional) => (
            <Pressable
              key={professional.id}
              onPress={() => openChat(professional.id)}
              accessibilityRole="button"
              accessibilityLabel={`Message ${professional.name}`}
              style={({ pressed }) => [styles.networkRow, pressed && styles.networkRowPressed]}
            >
              <Avatar
                initials={professional.initials}
                size={46}
                background={professional.avatarSoft}
                color={professional.avatarColor}
                online={professional.online}
              />

              <View style={styles.networkInfo}>
                <View style={styles.nameRow}>
                  <Text numberOfLines={1} style={styles.name}>
                    {professional.name}
                  </Text>
                  {professional.verified ? <VerifiedBadge size={13} /> : null}
                </View>
                <Text numberOfLines={1} style={styles.preview}>
                  {getPreview(professional)}
                </Text>
              </View>

              <View style={styles.messagePill}>
                <Text style={styles.messagePillText}>Message</Text>
              </View>
            </Pressable>
          ))
        ) : (
          <View style={styles.emptyNetworkCard}>
            <Text style={styles.emptyRequestTitle}>Your network starts here</Text>
            <Text style={styles.emptyRequestText}>
              Accept a request or send your first connection from Discover.
            </Text>
            <Pressable
              onPress={() => navigation.navigate('Discover')}
              style={styles.discoverButton}
            >
              <Text style={styles.discoverButtonText}>Find professionals</Text>
            </Pressable>
          </View>
        )}

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
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 20,
    marginTop: 20,
  },
  statTile: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    ...SHADOWS.soft,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  statLabel: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: '700',
    marginTop: 3,
    letterSpacing: 0.2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    marginTop: 24,
    marginBottom: 10,
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  countPill: {
    minWidth: 22,
    height: 22,
    paddingHorizontal: 7,
    borderRadius: 11,
    backgroundColor: COLORS.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countText: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: '800',
  },
  requestCard: {
    backgroundColor: COLORS.surface,
    marginHorizontal: 20,
    marginBottom: 10,
    padding: 16,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.card,
  },
  requestProfile: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  requestInfo: {
    flex: 1,
    marginLeft: 12,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  name: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
    flexShrink: 1,
  },
  requestMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginTop: 6,
  },
  professionPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
    maxWidth: 180,
  },
  professionText: {
    fontSize: 10,
    fontWeight: '700',
  },
  distance: {
    color: COLORS.textSubtle,
    fontSize: 10,
    fontWeight: '600',
  },
  requestPrompt: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '500',
    marginTop: 6,
  },
  requestActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  acceptButton: {
    flex: 1,
    minHeight: 42,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.floating,
  },
  acceptText: {
    color: COLORS.surface,
    fontSize: 13,
    fontWeight: '700',
  },
  declineButton: {
    flex: 1,
    minHeight: 42,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  declineText: {
    color: COLORS.textMuted,
    fontSize: 13,
    fontWeight: '700',
  },
  buttonPressed: {
    opacity: 0.78,
  },
  emptyRequestCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    padding: 16,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.soft,
  },
  emptyRequestIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: COLORS.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  emptyRequestLine: {
    width: 18,
    height: 3,
    borderRadius: 2,
    backgroundColor: COLORS.primary,
    opacity: 0.7,
  },
  emptyRequestLineShort: {
    width: 11,
    opacity: 0.4,
  },
  emptyRequestCopy: {
    flex: 1,
    marginLeft: 12,
  },
  emptyRequestTitle: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '700',
  },
  emptyRequestText: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '500',
    marginTop: 3,
    lineHeight: 16,
  },
  sentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 8,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sentInfo: {
    flex: 1,
    marginLeft: 10,
  },
  sentName: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '700',
  },
  sentMeta: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  pendingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.warningSoft,
  },
  pendingDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: COLORS.warning,
    marginRight: 5,
  },
  pendingText: {
    color: COLORS.warning,
    fontSize: 10,
    fontWeight: '700',
  },
  networkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 9,
    padding: 14,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.card,
  },
  networkRowPressed: {
    opacity: 0.82,
  },
  networkInfo: {
    flex: 1,
    marginLeft: 11,
    marginRight: 8,
  },
  preview: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '500',
    marginTop: 4,
  },
  messagePill: {
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.primarySoft,
  },
  messagePillText: {
    color: COLORS.primary,
    fontSize: 10,
    fontWeight: '800',
  },
  emptyNetworkCard: {
    marginHorizontal: 20,
    padding: 22,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    ...SHADOWS.soft,
  },
  discoverButton: {
    marginTop: 14,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.primarySoft,
  },
  discoverButtonText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  bottomSpace: {
    height: 16,
  },
});
