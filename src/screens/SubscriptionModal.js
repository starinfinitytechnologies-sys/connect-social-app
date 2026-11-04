import React, { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useApp } from '../context/AppContext';
import {
  CREDIT_PACKS,
  PAYMENTS_ENABLED,
  PLAN_CATALOGUE,
  formatInr,
} from '../config/plans';
import { COLORS, RADIUS, SHADOWS } from '../theme';

function PlanCard({ plan, billing, selected, current, onSelect }) {
  const price =
    billing === 'annual' ? plan.annualPrice : plan.monthlyPrice;
  const isCurrent = current === plan.id;

  return (
    <Pressable
      onPress={() => onSelect(plan.id)}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      style={[
        styles.planCard,
        plan.highlight && styles.planCardHighlight,
        selected && styles.planCardSelected,
      ]}
    >
      {plan.highlight ? (
        <View style={styles.recommendedBadge}>
          <Text style={styles.recommendedText}>MOST POPULAR</Text>
        </View>
      ) : null}

      <View style={styles.planTopRow}>
        <View style={styles.planTitleCopy}>
          <Text style={styles.planName}>{plan.name}</Text>
          {isCurrent ? (
            <View style={styles.currentPill}>
              <Text style={styles.currentPillText}>CURRENT</Text>
            </View>
          ) : null}
        </View>
        <View style={[styles.radio, selected && styles.radioActive]}>
          {selected ? <View style={styles.radioDot} /> : null}
        </View>
      </View>

      <Text style={styles.planTagline}>{plan.tagline}</Text>

      <View style={styles.priceRow}>
        <Text style={styles.price}>{price === 0 ? 'Free' : formatInr(price)}</Text>
        {price > 0 ? (
          <Text style={styles.cadence}>
            / {billing === 'annual' ? 'year' : 'month'}
          </Text>
        ) : null}
      </View>

      {billing === 'annual' && plan.annualPrice > 0 ? (
        <Text style={styles.savings}>
          Save {formatInr(plan.monthlyPrice * 12 - plan.annualPrice)} vs monthly
        </Text>
      ) : null}

      <View style={styles.featureList}>
        {plan.features.map((feature) => (
          <View key={feature} style={styles.featureRow}>
            <View style={styles.checkCircle}>
              <Ionicons name="checkmark" size={10} color={COLORS.success} />
            </View>
            <Text style={styles.featureText}>{feature}</Text>
          </View>
        ))}
      </View>
    </Pressable>
  );
}

export default function SubscriptionModal() {
  const { isPaywallVisible, closePaywall, plan, credits, isPaid } = useApp();
  const insets = useSafeAreaInsets();
  const [billing, setBilling] = useState('monthly');
  const [selected, setSelected] = useState('pro');

  const selectedPlan =
    PLAN_CATALOGUE.find((item) => item.id === selected) || PLAN_CATALOGUE[1];

  const handleClose = () => {
    setBilling('monthly');
    setSelected(plan === 'free' ? 'pro' : plan);
    closePaywall();
  };

  return (
    <Modal
      visible={isPaywallVisible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <View style={styles.backdrop}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={handleClose}
          accessibilityRole="button"
          accessibilityLabel="Close membership plans"
        />

        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <View style={styles.handle} />

          <View style={styles.header}>
            <View style={styles.headerCopy}>
              <Text style={styles.overline}>MEMBERSHIP</Text>
              <Text style={styles.title}>Grow with a plan that fits</Text>
              <Text style={styles.subtitle}>
                Better visibility, more enquiries and tools to manage your pipeline.
              </Text>
            </View>

            <Pressable
              onPress={handleClose}
              style={styles.closeButton}
              accessibilityRole="button"
              accessibilityLabel="Close"
            >
              <Ionicons name="close" size={19} color={COLORS.textMuted} />
            </Pressable>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.content}
          >
            <View style={styles.creditBanner}>
              <View style={styles.creditIcon}>
                <Ionicons name="flash" size={17} color={COLORS.gold} />
              </View>
              <View style={styles.creditCopy}>
                <Text style={styles.creditTitle}>
                  {isPaid ? `${selectedPlan.name} plan preview` : `${credits} credits available`}
                </Text>
                <Text style={styles.creditText}>
                  {isPaid
                    ? 'Paid plans include unlimited enquiries in this development build.'
                    : 'Credits can be used for additional enquiries and profile boosts.'}
                </Text>
              </View>
            </View>

            <View style={styles.billingToggle}>
              <Pressable
                onPress={() => setBilling('monthly')}
                accessibilityRole="radio"
                accessibilityState={{ selected: billing === 'monthly' }}
                style={[
                  styles.billingOption,
                  billing === 'monthly' && styles.billingOptionActive,
                ]}
              >
                <Text
                  style={[
                    styles.billingText,
                    billing === 'monthly' && styles.billingTextActive,
                  ]}
                >
                  Monthly
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setBilling('annual')}
                accessibilityRole="radio"
                accessibilityState={{ selected: billing === 'annual' }}
                style={[
                  styles.billingOption,
                  billing === 'annual' && styles.billingOptionActive,
                ]}
              >
                <Text
                  style={[
                    styles.billingText,
                    billing === 'annual' && styles.billingTextActive,
                  ]}
                >
                  Annual
                </Text>
                <View style={styles.savePill}>
                  <Text style={styles.savePillText}>SAVE 2 MONTHS</Text>
                </View>
              </Pressable>
            </View>

            {PLAN_CATALOGUE.map((item) => (
              <PlanCard
                key={item.id}
                plan={item}
                billing={billing}
                selected={selected === item.id}
                current={plan}
                onSelect={setSelected}
              />
            ))}

            <Text style={styles.sectionLabel}>CREDIT PACKS</Text>
            <View style={styles.creditPacks}>
              {CREDIT_PACKS.map((pack) => (
                <View key={pack.id} style={styles.creditPack}>
                  <View style={styles.creditPackIcon}>
                    <Ionicons name="flash-outline" size={16} color={COLORS.gold} />
                  </View>
                  <Text style={styles.creditPackCredits}>{pack.credits} credits</Text>
                  <Text style={styles.creditPackPrice}>{formatInr(pack.price)}</Text>
                  <Text style={styles.creditPackDescription}>{pack.description}</Text>
                </View>
              ))}
            </View>

            <LinearGradient
              colors={['#F4F1FF', '#F8F6FF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.paymentNotice}
            >
              <Ionicons name="shield-checkmark-outline" size={18} color={COLORS.primary} />
              <View style={styles.paymentNoticeCopy}>
                <Text style={styles.paymentNoticeTitle}>Payments are not live yet</Text>
                <Text style={styles.paymentNoticeText}>
                  {PAYMENTS_ENABLED
                    ? 'You will be redirected to a secure payment page.'
                    : 'This build does not charge cards, activate subscriptions or simulate payment success. Razorpay UPI integration is scheduled for a later phase.'}
                </Text>
              </View>
            </LinearGradient>

            <Pressable
              disabled={!PAYMENTS_ENABLED}
              accessibilityRole="button"
              accessibilityState={{ disabled: !PAYMENTS_ENABLED }}
              style={({ pressed }) => [
                styles.cta,
                !PAYMENTS_ENABLED && styles.ctaDisabled,
                pressed && PAYMENTS_ENABLED && styles.pressed,
              ]}
            >
              <Text style={[styles.ctaText, !PAYMENTS_ENABLED && styles.ctaTextDisabled]}>
                {selectedPlan.id === plan
                  ? 'Your current plan'
                  : PAYMENTS_ENABLED
                    ? `Continue with ${selectedPlan.name}`
                    : 'Payments coming soon'}
              </Text>
            </Pressable>

            <Text style={styles.footnote}>
              Plan limits and prices are loaded from a central catalogue. In production the
              administrator controls these values and the payment service verifies every
              transaction on the server.
            </Text>

            <Pressable onPress={handleClose} style={styles.notNow}>
              <Text style={styles.notNowText}>Not now</Text>
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'flex-end',
  },
  sheet: {
    maxHeight: '92%',
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    paddingTop: 10,
    ...SHADOWS.card,
  },
  handle: {
    alignSelf: 'center',
    width: 42,
    height: 5,
    borderRadius: 3,
    backgroundColor: COLORS.borderStrong,
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingHorizontal: 20,
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
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.55,
    marginTop: 5,
  },
  subtitle: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 18,
    marginTop: 5,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.surfaceMuted,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 14,
  },
  creditBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.goldSoft,
    borderWidth: 1,
    borderColor: COLORS.goldBorder,
  },
  creditIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  creditCopy: {
    flex: 1,
  },
  creditTitle: {
    color: '#92400E',
    fontSize: 12,
    fontWeight: '800',
  },
  creditText: {
    color: '#92400E',
    fontSize: 10,
    fontWeight: '500',
    lineHeight: 15,
    marginTop: 2,
  },
  billingToggle: {
    flexDirection: 'row',
    gap: 5,
    marginTop: 14,
    padding: 4,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.surfaceMuted,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  billingOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 8,
    borderRadius: RADIUS.pill,
  },
  billingOptionActive: {
    backgroundColor: COLORS.surface,
    ...SHADOWS.soft,
  },
  billingText: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '700',
  },
  billingTextActive: {
    color: COLORS.text,
  },
  savePill: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.successSoft,
  },
  savePillText: {
    color: COLORS.success,
    fontSize: 7,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  planCard: {
    marginTop: 12,
    padding: 15,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  planCardHighlight: {
    borderColor: '#D6D0FF',
  },
  planCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.surfaceTint,
  },
  recommendedBadge: {
    alignSelf: 'flex-start',
    marginBottom: 9,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.primarySoft,
  },
  recommendedText: {
    color: COLORS.primary,
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.7,
  },
  planTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  planTitleCopy: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  planName: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  currentPill: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.surfaceMuted,
  },
  currentPillText: {
    color: COLORS.textSubtle,
    fontSize: 7,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  radio: {
    width: 21,
    height: 21,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: COLORS.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioActive: {
    borderColor: COLORS.primary,
  },
  radioDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
  },
  planTagline: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '500',
    lineHeight: 16,
    marginTop: 5,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginTop: 10,
  },
  price: {
    color: COLORS.text,
    fontSize: 25,
    fontWeight: '800',
    letterSpacing: -0.6,
    lineHeight: 29,
  },
  cadence: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 5,
    marginBottom: 4,
  },
  savings: {
    color: COLORS.success,
    fontSize: 9,
    fontWeight: '700',
    marginTop: 2,
  },
  featureList: {
    marginTop: 10,
    gap: 6,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: COLORS.successSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 7,
  },
  featureText: {
    color: COLORS.text,
    fontSize: 11,
    fontWeight: '500',
    flex: 1,
    lineHeight: 16,
  },
  sectionLabel: {
    color: COLORS.textSubtle,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.1,
    marginTop: 20,
    marginBottom: 8,
  },
  creditPacks: {
    gap: 8,
  },
  creditPack: {
    padding: 12,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  creditPackIcon: {
    width: 28,
    height: 28,
    borderRadius: 9,
    backgroundColor: COLORS.goldSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 7,
  },
  creditPackCredits: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '800',
  },
  creditPackPrice: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '800',
    marginTop: 1,
  },
  creditPackDescription: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: '500',
    marginTop: 3,
  },
  paymentNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 9,
    marginTop: 16,
    padding: 12,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.primarySoft,
  },
  paymentNoticeCopy: {
    flex: 1,
  },
  paymentNoticeTitle: {
    color: COLORS.text,
    fontSize: 11,
    fontWeight: '800',
  },
  paymentNoticeText: {
    color: COLORS.textMuted,
    fontSize: 9,
    fontWeight: '500',
    lineHeight: 14,
    marginTop: 2,
  },
  cta: {
    minHeight: 50,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
    ...SHADOWS.floating,
  },
  ctaDisabled: {
    backgroundColor: COLORS.surfaceMuted,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowOpacity: 0,
    elevation: 0,
  },
  ctaText: {
    color: COLORS.surface,
    fontSize: 13,
    fontWeight: '800',
  },
  ctaTextDisabled: {
    color: COLORS.textSubtle,
  },
  footnote: {
    color: COLORS.textSubtle,
    fontSize: 9,
    fontWeight: '500',
    lineHeight: 14,
    textAlign: 'center',
    marginTop: 10,
  },
  notNow: {
    alignSelf: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  notNowText: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.85,
  },
});
