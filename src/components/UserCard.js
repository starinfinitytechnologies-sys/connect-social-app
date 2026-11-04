import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useApp } from '../context/AppContext';
import { CATEGORY_META } from '../data/mockData';
import { COLORS, RADIUS, SHADOWS } from '../theme';
import { Avatar, VerifiedBadge } from './Avatar';

export default function UserCard({ professional }) {
  const navigation = useNavigation();
  const { sendConnectionRequest, openChat } = useApp();

  const relation = professional.relation || {};
  const status = relation.status || 'none';
  const isIncoming = status === 'pending' && relation.direction === 'incoming';
  const category = CATEGORY_META[professional.category] || {
    color: COLORS.primary,
    soft: COLORS.primarySoft,
  };

  let label = 'Request Connection';
  let variant = 'primary';
  let disabled = false;

  if (status === 'accepted') {
    label = 'Message';
    variant = 'accepted';
  } else if (isIncoming) {
    label = 'Review Request';
    variant = 'warning';
  } else if (status === 'pending') {
    label = 'Pending';
    variant = 'muted';
    disabled = true;
  } else if (status === 'declined') {
    label = 'Declined';
    variant = 'muted';
    disabled = true;
  }

  const handleAction = () => {
    if (disabled) return;

    if (status === 'accepted') {
      openChat(professional.id);
      return;
    }

    if (isIncoming) {
      navigation.navigate('Connections');
      return;
    }

    sendConnectionRequest(professional.id);
  };

  return (
    <View style={styles.card}>
      <View style={styles.profileRow}>
        <Avatar
          initials={professional.initials}
          size={58}
          background={professional.avatarSoft}
          color={professional.avatarColor}
          online={professional.online}
        />

        <View style={styles.info}>
          <View style={styles.nameRow}>
            <Text numberOfLines={1} style={styles.name}>
              {professional.name}
            </Text>
            {professional.verified ? <VerifiedBadge /> : null}
          </View>

          <Text numberOfLines={1} style={styles.headline}>
            {professional.headline}
          </Text>

          <View style={styles.metaRow}>
            <View style={[styles.professionPill, { backgroundColor: category.soft }]}>
              <Text numberOfLines={1} style={[styles.professionText, { color: category.color }]}>
                {professional.profession}
              </Text>
            </View>
            <Text style={styles.distance}>{professional.distanceKm.toFixed(1)} km away</Text>
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <View style={styles.activity}>
          <View
            style={[
              styles.activityDot,
              { backgroundColor: professional.online ? COLORS.success : COLORS.textSubtle },
            ]}
          />
          <Text style={styles.activityText}>
            {professional.online ? 'Online now' : 'Recently active'}
          </Text>
        </View>

        <Pressable
          onPress={handleAction}
          disabled={disabled}
          accessibilityRole="button"
          accessibilityLabel={`${label} with ${professional.name}`}
          style={({ pressed }) => [
            styles.actionButton,
            styles[`${variant}Button`],
            pressed && !disabled && styles.actionPressed,
          ]}
        >
          <Text style={[styles.actionText, styles[`${variant}Text`]]}>{label}</Text>
        </Pressable>
      </View>
    </View>
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
  profileRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  info: {
    flex: 1,
    marginLeft: 13,
    paddingTop: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  name: {
    color: COLORS.text,
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.2,
    flexShrink: 1,
  },
  headline: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '500',
    marginTop: 3,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    flexWrap: 'wrap',
  },
  professionPill: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
    maxWidth: 170,
  },
  professionText: {
    fontSize: 11,
    fontWeight: '700',
  },
  distance: {
    color: COLORS.textSubtle,
    fontSize: 11,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    marginTop: 14,
    paddingTop: 12,
    gap: 10,
  },
  activity: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
  },
  activityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  activityText: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  actionButton: {
    minHeight: 38,
    paddingHorizontal: 15,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionPressed: {
    opacity: 0.78,
    transform: [{ scale: 0.98 }],
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    ...SHADOWS.floating,
  },
  primaryText: {
    color: COLORS.surface,
  },
  acceptedButton: {
    backgroundColor: COLORS.successSoft,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  acceptedText: {
    color: COLORS.success,
  },
  warningButton: {
    backgroundColor: COLORS.warningSoft,
    borderWidth: 1,
    borderColor: '#FCD34D',
  },
  warningText: {
    color: COLORS.warning,
  },
  mutedButton: {
    backgroundColor: COLORS.surfaceMuted,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  mutedText: {
    color: COLORS.textSubtle,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.1,
  },
});
