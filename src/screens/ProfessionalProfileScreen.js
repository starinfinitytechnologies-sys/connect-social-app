import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Linking,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Avatar, VerifiedBadge } from '../components/Avatar';
import RatingStars from '../components/RatingStars';
import EnquirySheet from '../components/EnquirySheet';
import EmptyState from '../components/EmptyState';
import { useApp } from '../context/AppContext';
import { getCategoryById } from '../data/categories';
import { formatDistance, formatPrice } from '../utils/geo';
import { buildEnquiryMessage, openExternalUrl, openWhatsApp } from '../utils/whatsapp';
import { COLORS, RADIUS, SHADOWS } from '../theme';

const WEEK_DAYS = [
  { key: 'monday', label: 'Mon', long: 'Monday' },
  { key: 'tuesday', label: 'Tue', long: 'Tuesday' },
  { key: 'wednesday', label: 'Wed', long: 'Wednesday' },
  { key: 'thursday', label: 'Thu', long: 'Thursday' },
  { key: 'friday', label: 'Fri', long: 'Friday' },
  { key: 'saturday', label: 'Sat', long: 'Saturday' },
  { key: 'sunday', label: 'Sun', long: 'Sunday' },
];

function SectionTitle({ title, caption, icon }) {
  return (
    <View style={styles.sectionTitleRow}>
      <View style={styles.sectionTitleIcon}>
        <Ionicons name={icon} size={15} color={COLORS.primary} />
      </View>
      <View style={styles.sectionTitleCopy}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {caption ? <Text style={styles.sectionCaption}>{caption}</Text> : null}
      </View>
    </View>
  );
}

function StatTile({ icon, value, label, tone = COLORS.primary }) {
  return (
    <View style={styles.statTile}>
      <View style={[styles.statIcon, { backgroundColor: `${tone}14` }]}>
        <Ionicons name={icon} size={14} color={tone} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function QuickAction({ icon, label, onPress, active, disabled, tone = COLORS.primary }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled, selected: active }}
      style={({ pressed }) => [styles.quickAction, pressed && styles.pressed]}
    >
      <View
        style={[
          styles.quickIcon,
          active && styles.quickIconActive,
          disabled && styles.quickIconDisabled,
        ]}
      >
        <Ionicons
          name={icon}
          size={19}
          color={active ? COLORS.surface : disabled ? COLORS.textSubtle : tone}
        />
      </View>
      <Text style={[styles.quickLabel, disabled && styles.quickLabelDisabled]}>
        {label}
      </Text>
    </Pressable>
  );
}

function ServiceCard({ service, onEnquire }) {
  return (
    <View style={styles.serviceCard}>
      <View style={styles.serviceHeader}>
        <View style={styles.serviceIcon}>
          <Ionicons name="briefcase-outline" size={15} color={COLORS.primary} />
        </View>
        <View style={styles.serviceCopy}>
          <Text style={styles.serviceName}>{service.name}</Text>
          <Text style={styles.serviceDuration}>{service.duration}</Text>
        </View>
        <View style={styles.servicePriceBlock}>
          <Text style={styles.servicePrice}>{formatPrice(service.price)}</Text>
          <Text style={styles.servicePriceType}>
            {service.priceType === 'from'
              ? 'starting'
              : service.priceType === 'visit'
                ? 'per visit'
                : service.priceType === 'monthly'
                  ? 'per month'
                  : 'fixed'}
          </Text>
        </View>
      </View>

      <Text style={styles.serviceDescription}>{service.description}</Text>

      <Pressable
        onPress={() => onEnquire(service.id)}
        accessibilityRole="button"
        accessibilityLabel={`Enquire about ${service.name}`}
        style={({ pressed }) => [styles.serviceCta, pressed && styles.pressed]}
      >
        <Text style={styles.serviceCtaText}>Enquire about this</Text>
        <Ionicons name="arrow-forward" size={13} color={COLORS.primary} />
      </Pressable>
    </View>
  );
}

function ReviewCard({ item }) {
  return (
    <View style={styles.reviewCard}>
      <View style={styles.reviewHeader}>
        <View style={styles.reviewAvatar}>
          <Text style={styles.reviewAvatarText}>{item.author.charAt(0)}</Text>
        </View>
        <View style={styles.reviewAuthorCopy}>
          <Text style={styles.reviewAuthor}>{item.author}</Text>
          <View style={styles.reviewMetaRow}>
            <RatingStars rating={item.rating} showValue={false} size={10} />
            <Text style={styles.reviewDate}>{item.date}</Text>
          </View>
        </View>
        {item.verifiedInteraction ? (
          <View style={styles.verifiedInteraction}>
            <Ionicons name="shield-checkmark" size={11} color={COLORS.success} />
            <Text style={styles.verifiedInteractionText}>Verified</Text>
          </View>
        ) : null}
      </View>
      <Text style={styles.reviewText}>{item.text}</Text>
    </View>
  );
}

export default function ProfessionalProfileScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const {
    professionalMap,
    recordProfileView,
    toggleFavourite,
    isFavourite,
    sendConnectionRequest,
    openChat,
    reportProfile,
    blockUser,
    blockedIds,
    relationships,
  } = useApp();

  const professionalId = route.params?.professionalId;
  const professional = professionalMap[professionalId];
  const [enquiryVisible, setEnquiryVisible] = useState(false);
  const [initialServiceId, setInitialServiceId] = useState(null);

  useEffect(() => {
    if (professionalId) recordProfileView(professionalId);
  }, [professionalId, recordProfileView]);

  const relation = relationships[professionalId] || { status: 'none' };
  const category = professional ? getCategoryById(professional.categoryId) : null;
  const isBlocked = blockedIds.includes(professionalId);
  const favourite = isFavourite(professionalId);

  const todayIndex = useMemo(() => {
    const index = new Date().getDay();
    return index === 0 ? 6 : index - 1;
  }, []);

  if (!professional) {
    return (
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <EmptyState
          icon="person-outline"
          title="Profile unavailable"
          description="This professional could not be found. They may have removed their profile."
          actionLabel="Go back"
          onAction={() => navigation.goBack()}
        />
      </SafeAreaView>
    );
  }

  const canWhatsApp =
    professional.contactVisibility?.whatsapp && professional.whatsappNumber;
  const hasContact = professional.contactVisibility;
  const isAccepted = relation.status === 'accepted';
  const isIncoming = relation.status === 'pending' && relation.direction === 'incoming';
  const isOutgoing = relation.status === 'pending' && relation.direction === 'outgoing';
  const isDeclined = relation.status === 'declined';

  const openEnquiry = (serviceId = null) => {
    if (isBlocked) return;
    setInitialServiceId(serviceId);
    setEnquiryVisible(true);
  };

  const handleConnect = () => {
    if (isBlocked) return;

    if (isAccepted) {
      openChat(professional.id);
      return;
    }

    if (isIncoming) {
      navigation.navigate('Connections');
      return;
    }

    if (isOutgoing) return;

    if (isDeclined) {
      Alert.alert(
        'Request declined',
        'This connection request was declined. You can still send an enquiry instead.'
      );
      return;
    }

    const result = sendConnectionRequest(professional.id);

    if (result.ok) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      Alert.alert(
        'Connection request sent',
        `${professional.name.split(' ')[0]} will see your request in their connections.`
      );
    }
  };

  const handleMessage = () => {
    if (isAccepted) {
      openChat(professional.id);
      return;
    }

    if (isIncoming) {
      Alert.alert(
        'This professional wants to connect',
        'Accept their request in Connections to start a private chat.',
        [
          { text: 'Later', style: 'cancel' },
          { text: 'Review request', onPress: () => navigation.navigate('Connections') },
        ]
      );
      return;
    }

    Alert.alert(
      'Connect first',
      'Private messaging unlocks after a connection request is accepted.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Send request', onPress: handleConnect },
      ]
    );
  };

  const handleWhatsApp = async () => {
    const result = await openWhatsApp(
      professional.whatsappNumber,
      buildEnquiryMessage(professional)
    );

    if (!result.ok) {
      Alert.alert(
        'WhatsApp unavailable',
        'We could not open WhatsApp on this device. You can send an enquiry in the app instead.'
      );
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `I found ${professional.name} (${professional.profession}) on Connect Local. ${professional.headline}`,
        title: `${professional.name} on Connect Local`,
      });
    } catch {
      // The native share sheet can be dismissed without an error to handle.
    }
  };

  const handleReport = () => {
    Alert.alert(
      'Report this profile',
      'Reports go to the moderation team. Choose the closest reason.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Fake or spam',
          onPress: () => {
            reportProfile(professional.id, 'Fake or spam profile');
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(
              () => {}
            );
            Alert.alert('Report submitted', 'Thank you. Our moderation team will review it.');
          },
        },
        {
          text: 'Misleading info',
          onPress: () => {
            reportProfile(professional.id, 'Misleading credentials or information');
            Alert.alert('Report submitted', 'Thank you. Our moderation team will review it.');
          },
        },
      ]
    );
  };

  const handleBlock = () => {
    Alert.alert(
      'Block this professional?',
      'They will be hidden from your discovery results. You can unblock them from Settings.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Block',
          style: 'destructive',
          onPress: () => {
            blockUser(professional.id);
            navigation.goBack();
          },
        },
      ]
    );
  };

  const openContact = async (type) => {
    const { contact } = professional;

    if (type === 'phone') {
      if (!contact.phone) return;
      Linking.openURL(`tel:${contact.phone}`).catch(() => {
        Alert.alert('Call unavailable', 'This device cannot start a phone call.');
      });
      return;
    }

    if (type === 'email') {
      if (!contact.email) return;
      Linking.openURL(`mailto:${contact.email}`).catch(() => {
        Alert.alert('Email unavailable', 'No email app is configured on this device.');
      });
      return;
    }

    openExternalUrl(contact[type]);
  };

  const connectLabel = isAccepted
    ? 'Message'
    : isIncoming
      ? 'Review request'
      : isOutgoing
        ? 'Request sent'
        : isDeclined
          ? 'Declined'
          : 'Connect';

  const todayHours = professional.workingHours?.[WEEK_DAYS[todayIndex].key] || 'Closed';
  const showPhone = hasContact?.phone && professional.contact?.phone;
  const showEmail = hasContact?.email && professional.contact?.email;

  const socialRows = [
    professional.contact.instagram && {
      id: 'instagram',
      icon: 'logo-instagram',
      label: 'Instagram',
      value: 'View profile',
      onPress: () => openContact('instagram'),
    },
    professional.contact.linkedin && {
      id: 'linkedin',
      icon: 'logo-linkedin',
      label: 'LinkedIn',
      value: 'View profile',
      onPress: () => openContact('linkedin'),
    },
    professional.contact.facebook && {
      id: 'facebook',
      icon: 'logo-facebook',
      label: 'Facebook',
      value: 'View page',
      onPress: () => openContact('facebook'),
    },
    professional.contact.website && {
      id: 'website',
      icon: 'globe-outline',
      label: 'Website',
      value: professional.contact.website.replace(/^https?:\/\//, ''),
      onPress: () => openContact('website'),
    },
  ].filter(Boolean);

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.cover}>
          <LinearGradient
            colors={['#4F3BF0', '#2A2391']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.coverGlow} />
          <View style={[styles.coverRing, { top: -24, right: 42 }]} />
          <View style={[styles.coverRing, { bottom: -50, right: 120 }]} />

          <View style={styles.coverBar}>
            <Pressable
              onPress={() => navigation.goBack()}
              accessibilityRole="button"
              accessibilityLabel="Go back"
              style={styles.coverButton}
            >
              <Ionicons name="arrow-back" size={20} color={COLORS.surface} />
            </Pressable>

            <View style={styles.coverActions}>
              <Pressable
                onPress={handleShare}
                accessibilityRole="button"
                accessibilityLabel="Share profile"
                style={styles.coverButton}
              >
                <Ionicons name="share-social-outline" size={19} color={COLORS.surface} />
              </Pressable>
              <Pressable
                onPress={handleReport}
                accessibilityRole="button"
                accessibilityLabel="Report profile"
                style={styles.coverButton}
              >
                <Ionicons name="flag-outline" size={19} color={COLORS.surface} />
              </Pressable>
            </View>
          </View>

          <View style={styles.coverCaption}>
            <Text style={styles.coverOverline}>
              {professional.category.toUpperCase()}
            </Text>
            <Text numberOfLines={1} style={styles.coverHeadline}>
              {professional.headline}
            </Text>
          </View>
        </View>

        <View style={styles.body}>
          <View style={styles.avatarRow}>
            <View style={styles.avatarFrame}>
              <Avatar
                initials={professional.initials}
                uri={professional.avatarUrl}
                size={88}
                background={professional.avatarSoft}
                color={professional.avatarColor}
                online={professional.online}
                ring
              />
            </View>

            <View style={styles.avatarActions}>
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                  toggleFavourite(professional.id);
                }}
                accessibilityRole="button"
                accessibilityLabel={favourite ? 'Remove from saved' : 'Save profile'}
                style={({ pressed }) => [
                  styles.avatarActionButton,
                  favourite && styles.avatarActionSaved,
                  pressed && styles.pressed,
                ]}
              >
                <Ionicons
                  name={favourite ? 'heart' : 'heart-outline'}
                  size={20}
                  color={favourite ? COLORS.danger : COLORS.text}
                />
              </Pressable>

              <Pressable
                onPress={() => navigation.navigate('Settings')}
                accessibilityRole="button"
                accessibilityLabel="Settings"
                style={styles.avatarActionButton}
              >
                <Ionicons name="ellipsis-horizontal" size={20} color={COLORS.text} />
              </Pressable>
            </View>
          </View>

          <View style={styles.nameRow}>
            <Text style={styles.name}>{professional.name}</Text>
            {professional.verified ? (
              <VerifiedBadge size={17} level={professional.verificationLevel} />
            ) : null}
          </View>

          <Text style={styles.profession}>{professional.profession}</Text>

          <View style={styles.badgeRow}>
            <View style={[styles.categoryPill, { backgroundColor: category?.soft }]}>
              <Ionicons
                name={category?.icon || 'briefcase-outline'}
                size={11}
                color={category?.color || COLORS.primary}
              />
              <Text style={[styles.categoryPillText, { color: category?.color }]}>
                {professional.category}
              </Text>
            </View>

            <View style={styles.availabilityPill}>
              <View
                style={[
                  styles.availabilityDot,
                  {
                    backgroundColor: professional.online
                      ? COLORS.online
                      : COLORS.success,
                  },
                ]}
              />
              <Text style={styles.availabilityText}>
                {professional.online
                  ? 'Online now'
                  : professional.availabilityStatus === 'available_today'
                    ? 'Available today'
                    : 'Available this week'}
              </Text>
            </View>

            {professional.sponsored ? (
              <View style={styles.sponsoredPill}>
                <Ionicons name="megaphone-outline" size={10} color="#92400E" />
                <Text style={styles.sponsoredText}>Sponsored</Text>
              </View>
            ) : null}
          </View>

          <View style={styles.summaryRow}>
            <RatingStars
              rating={professional.rating}
              reviewCount={professional.reviewCount}
              size={13}
            />
            <Text style={styles.summaryDot}>·</Text>
            <View style={styles.summaryItem}>
              <Ionicons name="navigate-outline" size={12} color={COLORS.textSubtle} />
              <Text style={styles.summaryText}>
                {formatDistance(professional.distanceKm)}
              </Text>
            </View>
            <Text style={styles.summaryDot}>·</Text>
            <Text style={styles.summaryText}>{professional.area}</Text>
          </View>

          {isBlocked ? (
            <View style={styles.blockedBanner}>
              <Ionicons name="ban" size={16} color={COLORS.danger} />
              <Text style={styles.blockedText}>
                You blocked this professional. Unblock from Settings to interact again.
              </Text>
            </View>
          ) : null}

          <View style={styles.statsGrid}>
            <StatTile
              icon="chatbubbles-outline"
              value={`${Math.round(professional.responseRate * 100)}%`}
              label="Response rate"
              tone={COLORS.success}
            />
            <StatTile
              icon="checkmark-done-outline"
              value={professional.completedEnquiries}
              label="Completed enquiries"
              tone={COLORS.primary}
            />
            <StatTile
              icon="ribbon-outline"
              value={`${professional.experienceYears} yrs`}
              label="Experience"
              tone={COLORS.accent}
            />
            <StatTile
              icon="calendar-outline"
              value={professional.memberSince}
              label="Member since"
              tone={COLORS.warning}
            />
          </View>

          <View style={styles.quickActions}>
            <QuickAction
              icon={isAccepted ? 'chatbubble-ellipses' : 'person-add'}
              label={connectLabel}
              onPress={handleConnect}
              active={isAccepted}
              disabled={isOutgoing || isDeclined || isBlocked}
            />
            <QuickAction
              icon="chatbubbles-outline"
              label="Message"
              onPress={handleMessage}
              disabled={isBlocked}
            />
            <QuickAction
              icon="logo-whatsapp"
              label="WhatsApp"
              onPress={handleWhatsApp}
              disabled={!canWhatsApp || isBlocked}
              tone={COLORS.whatsappDark}
            />
            <QuickAction
              icon={favourite ? 'heart' : 'heart-outline'}
              label={favourite ? 'Saved' : 'Save'}
              onPress={() => toggleFavourite(professional.id)}
              active={favourite}
            />
          </View>

          {!isBlocked ? (
            <Pressable
              onPress={() => openEnquiry()}
              accessibilityRole="button"
              accessibilityLabel="Send an enquiry to this professional"
              style={({ pressed }) => [styles.primaryCta, pressed && styles.pressed]}
            >
              <LinearGradient
                colors={['#6D5DFF', '#4F3BF0']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.primaryCtaInner}
              >
                <View style={styles.primaryCtaIcon}>
                  <Ionicons name="send" size={16} color={COLORS.surface} />
                </View>
                <View style={styles.primaryCtaCopy}>
                  <Text style={styles.primaryCtaTitle}>Send an enquiry</Text>
                  <Text style={styles.primaryCtaSubtitle}>
                    {professional.nextSlot
                      ? `Next available: ${professional.nextSlot}`
                      : 'Share your requirement and preferred time'}
                  </Text>
                </View>
                <Ionicons name="arrow-forward" size={18} color={COLORS.surface} />
              </LinearGradient>
            </Pressable>
          ) : null}

          <View style={styles.section}>
            <SectionTitle
              title="About"
              caption={professional.headline}
              icon="person-outline"
            />
            <Text style={styles.aboutText}>{professional.bio}</Text>

            <View style={styles.aboutFacts}>
              <View style={styles.factRow}>
                <Text style={styles.factLabel}>Languages</Text>
                <Text style={styles.factValue}>{professional.languages.join(', ')}</Text>
              </View>
              <View style={styles.factDivider} />
              <View style={styles.factRow}>
                <Text style={styles.factLabel}>Service area</Text>
                <Text style={styles.factValue}>
                  {professional.area} · up to {professional.serviceRadiusKm} km
                </Text>
              </View>
              <View style={styles.factDivider} />
              <View style={styles.factRow}>
                <Text style={styles.factLabel}>Typical response</Text>
                <Text style={styles.factValue}>{professional.responseTime}</Text>
              </View>
            </View>
          </View>

          {professional.services?.length ? (
            <View style={styles.section}>
              <SectionTitle
                title="Services & pricing"
                caption="Prices are set by the professional. Confirm scope before payment."
                icon="pricetags-outline"
              />
              <View style={styles.serviceList}>
                {professional.services.map((service) => (
                  <ServiceCard
                    key={service.id}
                    service={service}
                    onEnquire={openEnquiry}
                  />
                ))}
              </View>
            </View>
          ) : null}

          {professional.education?.length ? (
            <View style={styles.section}>
              <SectionTitle
                title="Experience & qualifications"
                caption="Self-reported by the professional unless marked verified."
                icon="school-outline"
              />
              <View style={styles.timelineCard}>
                {professional.education.map((item, index) => (
                  <View key={item.id} style={styles.timelineItem}>
                    <View style={styles.timelineRail}>
                      <View style={styles.timelineDot} />
                      {index < professional.education.length - 1 ? (
                        <View style={styles.timelineLine} />
                      ) : null}
                    </View>
                    <View style={styles.timelineCopy}>
                      <Text style={styles.timelineTitle}>{item.degree}</Text>
                      <Text style={styles.timelineSubtitle}>
                        {item.institute} · {item.year}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          ) : null}

          {professional.certifications?.length ? (
            <View style={styles.section}>
              <SectionTitle
                title="Certifications"
                caption="Documents are reviewed only where the verification badge says so."
                icon="ribbon-outline"
              />
              <View style={styles.certList}>
                {professional.certifications.map((item) => (
                  <View key={item.id} style={styles.certCard}>
                    <View style={styles.certIcon}>
                      <Ionicons name="document-text-outline" size={16} color={COLORS.primary} />
                    </View>
                    <View style={styles.certCopy}>
                      <Text style={styles.certTitle}>{item.title}</Text>
                      <Text style={styles.certSubtitle}>
                        {item.issuer} · {item.year}
                      </Text>
                    </View>
                    {professional.qualificationVerified ? (
                      <View style={styles.certVerified}>
                        <Ionicons name="checkmark" size={10} color={COLORS.success} />
                      </View>
                    ) : null}
                  </View>
                ))}
              </View>
            </View>
          ) : null}

          {professional.portfolio?.length ? (
            <View style={styles.section}>
              <SectionTitle
                title="Portfolio"
                caption="Selected work shared by the professional."
                icon="images-outline"
              />
              <View style={styles.portfolioGrid}>
                {professional.portfolio.map((item) => (
                  <View key={item.id} style={styles.portfolioItem}>
                    <LinearGradient
                      colors={[item.color, `${item.color}CC`]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.portfolioArt}
                    >
                      <Ionicons name="image-outline" size={22} color="rgba(255,255,255,0.86)" />
                    </LinearGradient>
                    <Text numberOfLines={1} style={styles.portfolioTitle}>
                      {item.title}
                    </Text>
                    <Text style={styles.portfolioCategory}>{item.category}</Text>
                  </View>
                ))}
              </View>
            </View>
          ) : null}

          <View style={styles.section}>
            <SectionTitle
              title="Availability"
              caption={`Today: ${todayHours} · ${professional.nextSlot}`}
              icon="calendar-outline"
            />

            <View style={styles.calendarStrip}>
              {WEEK_DAYS.map((day, index) => {
                const hours = professional.workingHours?.[day.key] || 'Closed';
                const closed = hours === 'Closed';
                const isToday = index === todayIndex;
                const date = new Date();
                date.setDate(date.getDate() + (index - todayIndex));

                return (
                  <Pressable
                    key={day.key}
                    onPress={() => openEnquiry()}
                    accessibilityRole="button"
                    accessibilityLabel={`${day.long}, ${closed ? 'closed' : 'request a slot'}`}
                    style={[
                      styles.calendarDay,
                      isToday && styles.calendarDayToday,
                      closed && styles.calendarDayClosed,
                    ]}
                  >
                    <Text style={[styles.calendarWeekday, isToday && styles.calendarTextToday]}>
                      {day.label}
                    </Text>
                    <Text style={[styles.calendarDate, isToday && styles.calendarTextToday]}>
                      {date.getDate()}
                    </Text>
                    <View
                      style={[
                        styles.calendarDot,
                        closed ? styles.calendarDotClosed : styles.calendarDotOpen,
                      ]}
                    />
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.hoursCard}>
              {WEEK_DAYS.map((day) => {
                const hours = professional.workingHours?.[day.key] || 'Closed';
                const isToday = day.key === WEEK_DAYS[todayIndex].key;

                return (
                  <View key={day.key} style={styles.hoursRow}>
                    <Text style={[styles.hoursDay, isToday && styles.hoursDayToday]}>
                      {day.long}
                    </Text>
                    <Text
                      style={[
                        styles.hoursValue,
                        hours === 'Closed' && styles.hoursClosed,
                        isToday && styles.hoursDayToday,
                      ]}
                    >
                      {hours}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>

          <View style={styles.section}>
            <SectionTitle
              title="Customer reviews"
              caption={`${professional.reviewCount} reviews · ${professional.rating.toFixed(1)} average`}
              icon="star-outline"
            />

            <View style={styles.ratingSummary}>
              <View style={styles.ratingBig}>
                <Text style={styles.ratingBigValue}>{professional.rating.toFixed(1)}</Text>
                <RatingStars
                  rating={professional.rating}
                  showValue={false}
                  size={13}
                />
                <Text style={styles.ratingBigCount}>
                  {professional.reviewCount} reviews
                </Text>
              </View>
              <View style={styles.ratingSummaryCopy}>
                <Text style={styles.ratingSummaryTitle}>Verified interactions</Text>
                <Text style={styles.ratingSummaryText}>
                  Reviews are only accepted from customers with a recorded enquiry or
                  completed service.
                </Text>
              </View>
            </View>

            <View style={styles.reviewList}>
              {professional.reviews.slice(0, 3).map((item) => (
                <ReviewCard key={item.id} item={item} />
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <SectionTitle
              title="Contact & social"
              caption="Only details the professional chose to make public are shown."
              icon="call-outline"
            />

            <View style={styles.contactCard}>
              {canWhatsApp ? (
                <Pressable
                  onPress={handleWhatsApp}
                  accessibilityRole="button"
                  accessibilityLabel="Contact on WhatsApp"
                  style={({ pressed }) => [styles.contactRow, pressed && styles.pressed]}
                >
                  <View style={[styles.contactIcon, { backgroundColor: COLORS.whatsappSoft }]}>
                    <Ionicons name="logo-whatsapp" size={17} color={COLORS.whatsappDark} />
                  </View>
                  <View style={styles.contactCopy}>
                    <Text style={styles.contactLabel}>WhatsApp</Text>
                    <Text style={styles.contactValue}>Start a WhatsApp chat</Text>
                  </View>
                  <Ionicons name="arrow-forward" size={15} color={COLORS.textSubtle} />
                </Pressable>
              ) : null}

              {showPhone ? (
                <Pressable
                  onPress={() => openContact('phone')}
                  accessibilityRole="button"
                  style={({ pressed }) => [styles.contactRow, pressed && styles.pressed]}
                >
                  <View style={[styles.contactIcon, { backgroundColor: COLORS.primaryFaint }]}>
                    <Ionicons name="call-outline" size={17} color={COLORS.primary} />
                  </View>
                  <View style={styles.contactCopy}>
                    <Text style={styles.contactLabel}>Phone</Text>
                    <Text style={styles.contactValue}>{professional.contact.phone}</Text>
                  </View>
                  <Ionicons name="arrow-forward" size={15} color={COLORS.textSubtle} />
                </Pressable>
              ) : (
                <View style={styles.contactRow}>
                  <View style={[styles.contactIcon, { backgroundColor: COLORS.surfaceMuted }]}>
                    <Ionicons name="call-outline" size={17} color={COLORS.textSubtle} />
                  </View>
                  <View style={styles.contactCopy}>
                    <Text style={styles.contactLabel}>Phone</Text>
                    <Text style={styles.contactValue}>Hidden by the professional</Text>
                  </View>
                  <Ionicons name="lock-closed" size={13} color={COLORS.textSubtle} />
                </View>
              )}

              {showEmail ? (
                <Pressable
                  onPress={() => openContact('email')}
                  accessibilityRole="button"
                  style={({ pressed }) => [styles.contactRow, pressed && styles.pressed]}
                >
                  <View style={[styles.contactIcon, { backgroundColor: COLORS.infoSoft }]}>
                    <Ionicons name="mail-outline" size={17} color={COLORS.info} />
                  </View>
                  <View style={styles.contactCopy}>
                    <Text style={styles.contactLabel}>Email</Text>
                    <Text style={styles.contactValue}>{professional.contact.email}</Text>
                  </View>
                  <Ionicons name="arrow-forward" size={15} color={COLORS.textSubtle} />
                </Pressable>
              ) : null}

              {hasContact?.social
                ? socialRows.map((row) => (
                    <Pressable
                      key={row.id}
                      onPress={row.onPress}
                      accessibilityRole="button"
                      style={({ pressed }) => [styles.contactRow, pressed && styles.pressed]}
                    >
                      <View style={[styles.contactIcon, { backgroundColor: COLORS.surfaceMuted }]}>
                        <Ionicons name={row.icon} size={17} color={COLORS.text} />
                      </View>
                      <View style={styles.contactCopy}>
                        <Text style={styles.contactLabel}>{row.label}</Text>
                        <Text numberOfLines={1} style={styles.contactValue}>
                          {row.value}
                        </Text>
                      </View>
                      <Ionicons name="open-outline" size={14} color={COLORS.textSubtle} />
                    </Pressable>
                  ))
                : null}
            </View>

            <View style={styles.privacyNote}>
              <Ionicons name="shield-checkmark-outline" size={14} color={COLORS.textSubtle} />
              <Text style={styles.privacyNoteText}>
                We never reveal precise home addresses. Contact details shown here are
                controlled by the professional.
              </Text>
            </View>
          </View>

          <View style={styles.section}>
            <SectionTitle title="Trust & verification" icon="shield-checkmark-outline" />

            <View style={styles.trustCard}>
              <View style={styles.trustRow}>
                <View style={styles.trustIcon}>
                  <Ionicons name="person-circle-outline" size={18} color={COLORS.info} />
                </View>
                <View style={styles.trustCopy}>
                  <Text style={styles.trustTitle}>Identity verification</Text>
                  <Text style={styles.trustText}>
                    {professional.identityVerified
                      ? 'Government identity document reviewed by our team.'
                      : 'Not yet completed. Ask the professional for proof before payment.'}
                  </Text>
                </View>
                <View
                  style={[
                    styles.trustStatus,
                    professional.identityVerified
                      ? styles.trustStatusOn
                      : styles.trustStatusOff,
                  ]}
                >
                  <Text
                    style={[
                      styles.trustStatusText,
                      professional.identityVerified
                        ? styles.trustStatusTextOn
                        : styles.trustStatusTextOff,
                    ]}
                  >
                    {professional.identityVerified ? 'Verified' : 'Pending'}
                  </Text>
                </View>
              </View>

              <View style={styles.trustDivider} />

              <View style={styles.trustRow}>
                <View style={styles.trustIcon}>
                  <Ionicons name="document-text-outline" size={18} color={COLORS.primary} />
                </View>
                <View style={styles.trustCopy}>
                  <Text style={styles.trustTitle}>Qualification check</Text>
                  <Text style={styles.trustText}>
                    {professional.qualificationVerified
                      ? 'Relevant qualification documents reviewed for this category.'
                      : 'Qualification documents have not been reviewed.'}
                  </Text>
                </View>
                <View
                  style={[
                    styles.trustStatus,
                    professional.qualificationVerified
                      ? styles.trustStatusOn
                      : styles.trustStatusOff,
                  ]}
                >
                  <Text
                    style={[
                      styles.trustStatusText,
                      professional.qualificationVerified
                        ? styles.trustStatusTextOn
                        : styles.trustStatusTextOff,
                    ]}
                  >
                    {professional.qualificationVerified ? 'Verified' : 'Not checked'}
                  </Text>
                </View>
              </View>
            </View>

            {category?.regulated ? (
              <View style={styles.disclaimerCard}>
                <View style={styles.disclaimerHeader}>
                  <Ionicons name="alert-circle-outline" size={16} color={COLORS.warning} />
                  <Text style={styles.disclaimerTitle}>Important disclaimer</Text>
                </View>
                <Text style={styles.disclaimerText}>{category.disclaimer}</Text>
              </View>
            ) : null}
          </View>

          <View style={styles.moderationRow}>
            <Pressable
              onPress={handleReport}
              accessibilityRole="button"
              style={({ pressed }) => [styles.moderationButton, pressed && styles.pressed]}
            >
              <Ionicons name="flag-outline" size={14} color={COLORS.textMuted} />
              <Text style={styles.moderationText}>Report profile</Text>
            </Pressable>

            <Pressable
              onPress={handleBlock}
              accessibilityRole="button"
              style={({ pressed }) => [styles.moderationButton, pressed && styles.pressed]}
            >
              <Ionicons name="ban-outline" size={14} color={COLORS.danger} />
              <Text style={[styles.moderationText, { color: COLORS.danger }]}>
                Block user
              </Text>
            </Pressable>
          </View>

          <Text style={styles.footerNote}>
            Profile last updated from professional-supplied information. Report anything
            that looks misleading.
          </Text>
        </View>
      </ScrollView>

      {!isBlocked ? (
        <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 10) }]}>
          <Pressable
            onPress={handleMessage}
            accessibilityRole="button"
            accessibilityLabel="Message professional"
            style={({ pressed }) => [styles.bottomSecondary, pressed && styles.pressed]}
          >
            <Ionicons name="chatbubble-ellipses-outline" size={18} color={COLORS.primary} />
          </Pressable>

          <Pressable
            onPress={() => openEnquiry()}
            accessibilityRole="button"
            accessibilityLabel="Send enquiry"
            style={({ pressed }) => [styles.bottomPrimary, pressed && styles.pressed]}
          >
            <Text style={styles.bottomPrimaryText}>Send enquiry</Text>
          </Pressable>

          {canWhatsApp ? (
            <Pressable
              onPress={handleWhatsApp}
              accessibilityRole="button"
              accessibilityLabel="Contact on WhatsApp"
              style={({ pressed }) => [styles.bottomWhatsapp, pressed && styles.pressed]}
            >
              <Ionicons name="logo-whatsapp" size={20} color={COLORS.surface} />
            </Pressable>
          ) : (
            <Pressable
              onPress={handleShare}
              accessibilityRole="button"
              accessibilityLabel="Share profile"
              style={({ pressed }) => [styles.bottomSecondary, pressed && styles.pressed]}
            >
              <Ionicons name="share-social-outline" size={18} color={COLORS.primary} />
            </Pressable>
          )}
        </View>
      ) : null}

      <EnquirySheet
        visible={enquiryVisible}
        onClose={() => setEnquiryVisible(false)}
        professional={professional}
        initialServiceId={initialServiceId}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  cover: {
    height: 172,
    overflow: 'hidden',
    position: 'relative',
  },
  coverGlow: {
    position: 'absolute',
    top: -70,
    left: -50,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(255, 255, 255, 0.09)',
  },
  coverRing: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 24,
    borderColor: 'rgba(255, 255, 255, 0.07)',
  },
  coverBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  coverActions: {
    flexDirection: 'row',
    gap: 8,
  },
  coverButton: {
    width: 38,
    height: 38,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverCaption: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 44,
  },
  coverOverline: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.4,
  },
  coverHeadline: {
    color: COLORS.surface,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
    marginTop: 4,
  },
  body: {
    marginTop: -34,
    paddingHorizontal: 20,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  avatarFrame: {
    padding: 3,
    borderRadius: 50,
    backgroundColor: COLORS.surface,
    ...SHADOWS.card,
  },
  avatarActions: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 6,
  },
  avatarActionButton: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.soft,
  },
  avatarActionSaved: {
    backgroundColor: COLORS.dangerSoft,
    borderColor: COLORS.dangerBorder,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginTop: 12,
  },
  name: {
    color: COLORS.text,
    fontSize: 27,
    fontWeight: '800',
    letterSpacing: -0.7,
    flexShrink: 1,
  },
  profession: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '700',
    marginTop: 2,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
    marginTop: 10,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: RADIUS.pill,
  },
  categoryPillText: {
    fontSize: 10,
    fontWeight: '800',
  },
  availabilityPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.successSoft,
  },
  availabilityDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  availabilityText: {
    color: COLORS.success,
    fontSize: 10,
    fontWeight: '800',
  },
  sponsoredPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.goldSoft,
    borderWidth: 1,
    borderColor: COLORS.goldBorder,
  },
  sponsoredText: {
    color: '#92400E',
    fontSize: 9,
    fontWeight: '800',
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
    marginTop: 12,
  },
  summaryDot: {
    color: COLORS.borderStrong,
    fontSize: 12,
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  summaryText: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  blockedBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 12,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.dangerSoft,
    borderWidth: 1,
    borderColor: COLORS.dangerBorder,
    marginTop: 14,
  },
  blockedText: {
    flex: 1,
    color: COLORS.danger,
    fontSize: 11,
    fontWeight: '600',
    lineHeight: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 9,
    marginTop: 18,
  },
  statTile: {
    width: '48%',
    flexGrow: 1,
    padding: 12,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.soft,
  },
  statIcon: {
    width: 27,
    height: 27,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statValue: {
    color: COLORS.text,
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  statLabel: {
    color: COLORS.textMuted,
    fontSize: 9,
    fontWeight: '600',
    marginTop: 2,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 18,
    paddingVertical: 4,
  },
  quickAction: {
    alignItems: 'center',
    width: '23%',
  },
  quickIcon: {
    width: 46,
    height: 46,
    borderRadius: 16,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.soft,
  },
  quickIconActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  quickIconDisabled: {
    backgroundColor: COLORS.surfaceMuted,
  },
  quickLabel: {
    color: COLORS.text,
    fontSize: 9,
    fontWeight: '700',
    marginTop: 6,
    textAlign: 'center',
  },
  quickLabelDisabled: {
    color: COLORS.textSubtle,
  },
  primaryCta: {
    marginTop: 16,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    ...SHADOWS.floating,
  },
  primaryCtaInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  primaryCtaIcon: {
    width: 38,
    height: 38,
    borderRadius: 13,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryCtaCopy: {
    flex: 1,
  },
  primaryCtaTitle: {
    color: COLORS.surface,
    fontSize: 14,
    fontWeight: '800',
  },
  primaryCtaSubtitle: {
    color: 'rgba(255, 255, 255, 0.78)',
    fontSize: 10,
    fontWeight: '500',
    marginTop: 2,
  },
  section: {
    marginTop: 28,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 9,
    marginBottom: 12,
  },
  sectionTitleIcon: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: COLORS.primaryFaint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitleCopy: {
    flex: 1,
    paddingTop: 1,
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  sectionCaption: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: '500',
    lineHeight: 15,
    marginTop: 3,
  },
  aboutText: {
    color: COLORS.textMuted,
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 20,
  },
  aboutFacts: {
    marginTop: 14,
    padding: 13,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  factRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  factLabel: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  factValue: {
    color: COLORS.text,
    fontSize: 11,
    fontWeight: '700',
    flexShrink: 1,
    textAlign: 'right',
  },
  factDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 9,
  },
  serviceList: {
    gap: 9,
  },
  serviceCard: {
    padding: 14,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.soft,
  },
  serviceHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  serviceIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: COLORS.primaryFaint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceCopy: {
    flex: 1,
  },
  serviceName: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '800',
  },
  serviceDuration: {
    color: COLORS.textSubtle,
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  servicePriceBlock: {
    alignItems: 'flex-end',
  },
  servicePrice: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '800',
  },
  servicePriceType: {
    color: COLORS.textSubtle,
    fontSize: 9,
    fontWeight: '600',
    marginTop: 1,
  },
  serviceDescription: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '500',
    lineHeight: 17,
    marginTop: 9,
  },
  serviceCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    marginTop: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.primaryFaint,
  },
  serviceCtaText: {
    color: COLORS.primary,
    fontSize: 10,
    fontWeight: '800',
  },
  timelineCard: {
    padding: 14,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  timelineItem: {
    flexDirection: 'row',
    gap: 11,
  },
  timelineRail: {
    alignItems: 'center',
    width: 12,
  },
  timelineDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
    borderWidth: 2,
    borderColor: COLORS.primarySoft,
    marginTop: 4,
  },
  timelineLine: {
    flex: 1,
    width: 2,
    backgroundColor: COLORS.border,
    marginTop: 3,
    marginBottom: -4,
  },
  timelineCopy: {
    flex: 1,
    paddingBottom: 14,
  },
  timelineTitle: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: '800',
  },
  timelineSubtitle: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: '500',
    marginTop: 2,
  },
  certList: {
    gap: 8,
  },
  certCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  certIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: COLORS.primaryFaint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  certCopy: {
    flex: 1,
  },
  certTitle: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: '700',
  },
  certSubtitle: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: '500',
    marginTop: 2,
  },
  certVerified: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.successSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  portfolioGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 9,
  },
  portfolioItem: {
    width: '48%',
    flexGrow: 1,
  },
  portfolioArt: {
    height: 92,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  portfolioTitle: {
    color: COLORS.text,
    fontSize: 11,
    fontWeight: '700',
    marginTop: 6,
  },
  portfolioCategory: {
    color: COLORS.textSubtle,
    fontSize: 9,
    fontWeight: '600',
    marginTop: 1,
  },
  calendarStrip: {
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'space-between',
  },
  calendarDay: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  calendarDayToday: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  calendarDayClosed: {
    backgroundColor: COLORS.surfaceMuted,
  },
  calendarWeekday: {
    color: COLORS.textSubtle,
    fontSize: 8,
    fontWeight: '800',
  },
  calendarDate: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '800',
    marginTop: 3,
  },
  calendarTextToday: {
    color: COLORS.surface,
  },
  calendarDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    marginTop: 5,
  },
  calendarDotOpen: {
    backgroundColor: COLORS.success,
  },
  calendarDotClosed: {
    backgroundColor: COLORS.borderStrong,
  },
  hoursCard: {
    marginTop: 10,
    padding: 13,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  hoursRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  hoursDay: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  hoursDayToday: {
    color: COLORS.primary,
    fontWeight: '800',
  },
  hoursValue: {
    color: COLORS.text,
    fontSize: 11,
    fontWeight: '700',
  },
  hoursClosed: {
    color: COLORS.textSubtle,
    fontWeight: '600',
  },
  ratingSummary: {
    flexDirection: 'row',
    gap: 14,
    padding: 14,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  ratingBig: {
    alignItems: 'center',
    paddingRight: 14,
    borderRightWidth: 1,
    borderRightColor: COLORS.border,
  },
  ratingBigValue: {
    color: COLORS.text,
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -0.8,
  },
  ratingBigCount: {
    color: COLORS.textSubtle,
    fontSize: 9,
    fontWeight: '600',
    marginTop: 3,
  },
  ratingSummaryCopy: {
    flex: 1,
    justifyContent: 'center',
  },
  ratingSummaryTitle: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: '800',
  },
  ratingSummaryText: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: '500',
    lineHeight: 15,
    marginTop: 4,
  },
  reviewList: {
    gap: 8,
    marginTop: 10,
  },
  reviewCard: {
    padding: 13,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  reviewAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewAvatarText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '800',
  },
  reviewAuthorCopy: {
    flex: 1,
  },
  reviewAuthor: {
    color: COLORS.text,
    fontSize: 11,
    fontWeight: '800',
  },
  reviewMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  reviewDate: {
    color: COLORS.textSubtle,
    fontSize: 9,
    fontWeight: '600',
  },
  verifiedInteraction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.successSoft,
  },
  verifiedInteractionText: {
    color: COLORS.success,
    fontSize: 8,
    fontWeight: '800',
  },
  reviewText: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '500',
    lineHeight: 17,
    marginTop: 9,
  },
  contactCard: {
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 13,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  contactIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactCopy: {
    flex: 1,
  },
  contactLabel: {
    color: COLORS.text,
    fontSize: 11,
    fontWeight: '800',
  },
  contactValue: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: '500',
    marginTop: 1,
  },
  privacyNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginTop: 10,
  },
  privacyNoteText: {
    flex: 1,
    color: COLORS.textSubtle,
    fontSize: 9,
    fontWeight: '500',
    lineHeight: 14,
  },
  trustCard: {
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 13,
  },
  trustRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  trustIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: COLORS.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trustCopy: {
    flex: 1,
  },
  trustTitle: {
    color: COLORS.text,
    fontSize: 11,
    fontWeight: '800',
  },
  trustText: {
    color: COLORS.textMuted,
    fontSize: 9,
    fontWeight: '500',
    lineHeight: 14,
    marginTop: 2,
  },
  trustStatus: {
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
  },
  trustStatusOn: {
    backgroundColor: COLORS.successSoft,
  },
  trustStatusOff: {
    backgroundColor: COLORS.warningSoft,
  },
  trustStatusText: {
    fontSize: 8,
    fontWeight: '800',
  },
  trustStatusTextOn: {
    color: COLORS.success,
  },
  trustStatusTextOff: {
    color: COLORS.warning,
  },
  trustDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 11,
  },
  disclaimerCard: {
    marginTop: 10,
    padding: 13,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.warningSoft,
    borderWidth: 1,
    borderColor: COLORS.warningBorder,
  },
  disclaimerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 5,
  },
  disclaimerTitle: {
    color: '#92400E',
    fontSize: 10,
    fontWeight: '800',
  },
  disclaimerText: {
    color: '#92400E',
    fontSize: 9,
    fontWeight: '500',
    lineHeight: 14,
  },
  moderationRow: {
    flexDirection: 'row',
    gap: 9,
    marginTop: 22,
  },
  moderationButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    minHeight: 40,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  moderationText: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: '700',
  },
  footerNote: {
    color: COLORS.textSubtle,
    fontSize: 9,
    fontWeight: '500',
    lineHeight: 14,
    textAlign: 'center',
    marginTop: 18,
  },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingHorizontal: 16,
    paddingTop: 10,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    ...SHADOWS.card,
    shadowOffset: { width: 0, height: -6 },
  },
  bottomSecondary: {
    width: 50,
    height: 50,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primaryFaint,
    borderWidth: 1,
    borderColor: COLORS.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomPrimary: {
    flex: 1,
    height: 50,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.floating,
  },
  bottomPrimaryText: {
    color: COLORS.surface,
    fontSize: 14,
    fontWeight: '800',
  },
  bottomWhatsapp: {
    width: 50,
    height: 50,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.whatsapp,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.8,
  },
});
