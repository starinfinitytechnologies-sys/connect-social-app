import React from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Avatar, VerifiedBadge } from './Avatar';
import RatingStars from './RatingStars';
import { useApp } from '../context/AppContext';
import { formatDistance, formatPrice } from '../utils/geo';
import { buildEnquiryMessage, openWhatsApp } from '../utils/whatsapp';
import { COLORS, RADIUS, SHADOWS } from '../theme';

const TAG_STYLES = {
  gold: { background: COLORS.goldSoft, text: '#92400E', border: COLORS.goldBorder },
  info: { background: COLORS.infoSoft, text: COLORS.info, border: '#BFDBFE' },
  premium: { background: COLORS.premiumSoft, text: COLORS.premium, border: COLORS.premiumBorder },
  success: { background: COLORS.successSoft, text: COLORS.success, border: COLORS.successBorder },
  primary: { background: COLORS.primarySoft, text: COLORS.primary, border: '#D9D3FF' },
};

function Tag({ tag }) {
  const tone = TAG_STYLES[tag.tone] || TAG_STYLES.primary;

  return (
    <View
      style={[
        styles.tag,
        { backgroundColor: tone.background, borderColor: tone.border },
      ]}
    >
      {tag.id === 'sponsored' ? (
        <Ionicons name="megaphone-outline" size={9} color={tone.text} />
      ) : null}
      <Text style={[styles.tagText, { color: tone.text }]}>{tag.label}</Text>
    </View>
  );
}

export default function ProfessionalCard({ professional, compact = false }) {
  const navigation = useNavigation();
  const { toggleFavourite, isFavourite, relationships, openChat } = useApp();
  const favourite = isFavourite(professional.id);
  const relation = relationships[professional.id] || {};

  const openProfile = () => {
    Haptics.selectionAsync().catch(() => {});
    navigation.navigate('ProfessionalProfile', { professionalId: professional.id });
  };

  const handleFavourite = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    toggleFavourite(professional.id);
  };

  const handleWhatsApp = async () => {
    const result = await openWhatsApp(
      professional.whatsappNumber,
      buildEnquiryMessage(professional)
    );

    if (!result.ok) {
      Alert.alert(
        'WhatsApp unavailable',
        'We could not open WhatsApp on this device. You can still send an enquiry from the profile.'
      );
    }
  };

  const availabilityLabel = professional.online
    ? 'Online now'
    : professional.availabilityStatus === 'available_today'
      ? 'Available today'
      : 'This week';

  const availabilityColor = professional.online
    ? COLORS.online
    : professional.availabilityStatus === 'available_today'
      ? COLORS.success
      : COLORS.textSubtle;

  const canWhatsApp =
    professional.contactVisibility?.whatsapp && professional.whatsappNumber;
  const isConnected = relation.status === 'accepted';

  return (
    <Pressable
      onPress={openProfile}
      accessibilityRole="button"
      accessibilityLabel={`View profile of ${professional.name}, ${professional.profession}`}
      style={({ pressed }) => [
        styles.card,
        compact && styles.cardCompact,
        pressed && styles.cardPressed,
      ]}
    >
      <View style={styles.topRow}>
        <Avatar
          initials={professional.initials}
          uri={professional.avatarUrl}
          size={compact ? 50 : 58}
          background={professional.avatarSoft}
          color={professional.avatarColor}
          online={professional.online}
          ring
        />

        <View style={styles.identity}>
          <View style={styles.nameRow}>
            <Text numberOfLines={1} style={[styles.name, compact && styles.nameCompact]}>
              {professional.name}
            </Text>
            {professional.verified ? (
              <VerifiedBadge
                size={compact ? 13 : 15}
                level={professional.verificationLevel}
              />
            ) : null}
          </View>

          <Text numberOfLines={1} style={styles.profession}>
            {professional.profession}
          </Text>

          {!compact ? (
            <View style={styles.tagRow}>
              {(professional.rankTags || []).slice(0, 2).map((tag) => (
                <Tag key={tag.id} tag={tag} />
              ))}
              {professional.rankTags?.length === 0 ? (
                <Text style={styles.categoryText}>{professional.category}</Text>
              ) : null}
            </View>
          ) : null}
        </View>

        <Pressable
          onPress={handleFavourite}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel={favourite ? 'Remove from saved' : 'Save professional'}
          style={({ pressed }) => [
            styles.favouriteButton,
            favourite && styles.favouriteButtonActive,
            pressed && styles.pressed,
          ]}
        >
          <Ionicons
            name={favourite ? 'heart' : 'heart-outline'}
            size={18}
            color={favourite ? COLORS.danger : COLORS.textSubtle}
          />
        </Pressable>
      </View>

      {!compact ? (
        <Text numberOfLines={2} style={styles.headline}>
          {professional.headline}
        </Text>
      ) : null}

      <View style={styles.metaRow}>
        <RatingStars
          rating={professional.rating}
          reviewCount={professional.reviewCount}
          size={12}
        />

        <View style={styles.metaDivider} />

        <View style={styles.metaItem}>
          <Ionicons name="navigate-outline" size={12} color={COLORS.textSubtle} />
          <Text style={styles.metaText}>{formatDistance(professional.distanceKm)}</Text>
        </View>
      </View>

      <View style={styles.statusRow}>
        <View style={[styles.statusDot, { backgroundColor: availabilityColor }]} />
        <Text style={[styles.statusText, { color: availabilityColor }]}>
          {availabilityLabel}
        </Text>

        {professional.nextSlot && !compact ? (
          <>
            <Text style={styles.dotSeparator}>·</Text>
            <Text numberOfLines={1} style={styles.nextSlot}>
              Next: {professional.nextSlot}
            </Text>
          </>
        ) : null}

        {professional.pricingFrom ? (
          <>
            <Text style={styles.dotSeparator}>·</Text>
            <Text style={styles.price}>From {formatPrice(professional.pricingFrom)}</Text>
          </>
        ) : null}
      </View>

      {compact ? null : (
        <View style={styles.actionsRow}>
          <Pressable
            onPress={openProfile}
            accessibilityRole="button"
            accessibilityLabel={`View profile of ${professional.name}`}
            style={({ pressed }) => [styles.secondaryAction, pressed && styles.pressed]}
          >
            <Text style={styles.secondaryActionText}>View profile</Text>
            <Ionicons name="arrow-forward" size={13} color={COLORS.primary} />
          </Pressable>

          {isConnected ? (
            <Pressable
              onPress={() => openChat(professional.id)}
              accessibilityRole="button"
              style={({ pressed }) => [styles.primaryAction, pressed && styles.pressed]}
            >
              <Ionicons name="chatbubble-ellipses-outline" size={15} color={COLORS.surface} />
              <Text style={styles.primaryActionText}>Message</Text>
            </Pressable>
          ) : canWhatsApp ? (
            <Pressable
              onPress={handleWhatsApp}
              accessibilityRole="button"
              accessibilityLabel={`Contact ${professional.name} on WhatsApp`}
              style={({ pressed }) => [styles.whatsappAction, pressed && styles.pressed]}
            >
              <Ionicons name="logo-whatsapp" size={16} color={COLORS.whatsappDark} />
              <Text style={styles.whatsappActionText}>WhatsApp</Text>
            </Pressable>
          ) : (
            <Pressable
              onPress={openProfile}
              accessibilityRole="button"
              style={({ pressed }) => [styles.primaryAction, pressed && styles.pressed]}
            >
              <Ionicons name="person-add-outline" size={15} color={COLORS.surface} />
              <Text style={styles.primaryActionText}>Connect</Text>
            </Pressable>
          )}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.card,
  },
  cardCompact: {
    width: 264,
    marginHorizontal: 0,
    marginBottom: 0,
    padding: 14,
  },
  cardPressed: {
    opacity: 0.94,
    transform: [{ scale: 0.995 }],
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  identity: {
    flex: 1,
    paddingTop: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  name: {
    color: COLORS.text,
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.35,
    flexShrink: 1,
  },
  nameCompact: {
    fontSize: 15,
  },
  profession: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  categoryText: {
    color: COLORS.textSubtle,
    fontSize: 10,
    fontWeight: '600',
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 7,
    flexWrap: 'wrap',
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
  },
  tagText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.1,
  },
  favouriteButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surfaceMuted,
  },
  favouriteButtonActive: {
    backgroundColor: COLORS.dangerSoft,
  },
  headline: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 18,
    marginTop: 12,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    marginTop: 11,
    flexWrap: 'wrap',
  },
  metaDivider: {
    width: 1,
    height: 12,
    backgroundColor: COLORS.border,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 9,
    flexWrap: 'wrap',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  dotSeparator: {
    color: COLORS.borderStrong,
    fontSize: 12,
    marginHorizontal: 6,
  },
  nextSlot: {
    color: COLORS.textSubtle,
    fontSize: 10,
    fontWeight: '600',
    flexShrink: 1,
  },
  price: {
    color: COLORS.text,
    fontSize: 10,
    fontWeight: '800',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  secondaryAction: {
    flex: 1,
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primaryFaint,
    borderWidth: 1,
    borderColor: COLORS.primarySoft,
  },
  secondaryActionText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '800',
  },
  primaryAction: {
    flex: 1,
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primary,
    ...SHADOWS.floating,
    shadowOpacity: 0.18,
  },
  primaryActionText: {
    color: COLORS.surface,
    fontSize: 12,
    fontWeight: '800',
  },
  whatsappAction: {
    flex: 1,
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.whatsappSoft,
    borderWidth: 1,
    borderColor: '#BFEBD2',
  },
  whatsappActionText: {
    color: COLORS.whatsappDark,
    fontSize: 12,
    fontWeight: '800',
  },
  pressed: {
    opacity: 0.78,
  },
});
