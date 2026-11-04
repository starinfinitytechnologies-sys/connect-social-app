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
import { useApp } from '../context/AppContext';
import { COLORS, RADIUS, SHADOWS } from '../theme';

const PLANS = [
  {
    id: 'monthly',
    name: 'Monthly Pass',
    price: '$9.99',
    cadence: '/ month',
    tag: 'BEST VALUE',
    blurb: 'For professionals growing a serious local network.',
    features: [
      'Unlimited connection requests',
      'Priority placement in local search',
      'Pro badge on your profile',
    ],
  },
  {
    id: 'credits',
    name: 'Pay Per Connect',
    price: '$1.99',
    cadence: 'one-time',
    tag: 'FLEXIBLE',
    blurb: 'Top up instantly whenever you need a few more connects.',
    features: [
      '5 instant connection credits',
      'Credits never expire',
      'No monthly commitment',
    ],
  },
];

export default function SubscriptionModal() {
  const {
    isPaywallVisible,
    closePaywall,
    purchasePlan,
    credits,
    plan,
  } = useApp();
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = useState('monthly');
  const [step, setStep] = useState('plans');

  const handleShow = () => {
    setSelected('monthly');
    setStep('plans');
  };

  const handleClose = () => {
    setSelected('monthly');
    setStep('plans');
    closePaywall();
  };

  const selectedPlan = PLANS.find((item) => item.id === selected) || PLANS[0];

  const handlePurchase = () => {
    purchasePlan(selected);
    setStep('success');
  };

  return (
    <Modal
      visible={isPaywallVisible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onShow={handleShow}
      onRequestClose={handleClose}
    >
      <View style={styles.backdrop}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={handleClose}
          accessibilityRole="button"
          accessibilityLabel="Close membership modal"
        />

        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <View style={styles.handle} />

          {step === 'plans' ? (
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.sheetContent}
            >
              <View style={styles.headerRow}>
                <View style={styles.proBadge}>
                  <Text style={styles.proBadgeText}>PRO</Text>
                </View>

                <Pressable
                  onPress={handleClose}
                  style={styles.closeButton}
                  accessibilityRole="button"
                  accessibilityLabel="Close"
                >
                  <Text style={styles.closeText}>×</Text>
                </Pressable>
              </View>

              <Text style={styles.kicker}>MEMBERSHIP</Text>
              <Text style={styles.title}>Connect without limits</Text>
              <Text style={styles.subtitle}>
                Reach more local professionals and keep every conversation moving.
              </Text>

              {PLANS.map((item) => {
                const isActive = selected === item.id;

                return (
                  <Pressable
                    key={item.id}
                    onPress={() => setSelected(item.id)}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: isActive }}
                    style={[styles.planCard, isActive && styles.planCardActive]}
                  >
                    <View style={styles.planHeader}>
                      <View style={styles.planTitleRow}>
                        <Text style={styles.planName}>{item.name}</Text>
                        <View
                          style={[
                            styles.tag,
                            item.id === 'credits' && styles.tagFlexible,
                          ]}
                        >
                          <Text
                            style={[
                              styles.tagText,
                              item.id === 'credits' && styles.tagTextFlexible,
                            ]}
                          >
                            {item.tag}
                          </Text>
                        </View>
                      </View>

                      <View style={[styles.radio, isActive && styles.radioActive]}>
                        {isActive ? <View style={styles.radioDot} /> : null}
                      </View>
                    </View>

                    <View style={styles.priceRow}>
                      <Text style={styles.price}>{item.price}</Text>
                      <Text style={styles.cadence}>{item.cadence}</Text>
                    </View>

                    <Text style={styles.planBlurb}>{item.blurb}</Text>

                    <View style={styles.featureList}>
                      {item.features.map((feature) => (
                        <View key={feature} style={styles.featureRow}>
                          <View style={styles.checkCircle}>
                            <Text style={styles.checkText}>✓</Text>
                          </View>
                          <Text style={styles.featureText}>{feature}</Text>
                        </View>
                      ))}
                    </View>
                  </Pressable>
                );
              })}

              <Pressable
                onPress={handlePurchase}
                accessibilityRole="button"
                style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}
              >
                <Text style={styles.ctaText}>
                  {selected === 'monthly'
                    ? `Continue — ${selectedPlan.price} / month`
                    : `Buy 5 credits — ${selectedPlan.price}`}
                </Text>
              </Pressable>

              <Text style={styles.footnote}>
                Demo checkout — no real charge. Cancel anytime.
              </Text>

              <Pressable onPress={handleClose} style={styles.notNow}>
                <Text style={styles.notNowText}>Not now</Text>
              </Pressable>
            </ScrollView>
          ) : (
            <View style={styles.successContent}>
              <View style={styles.successIcon}>
                <Text style={styles.successCheck}>✓</Text>
              </View>

              <Text style={styles.successKicker}>
                {selected === 'monthly' ? 'PREMIUM PRO' : 'CREDITS ADDED'}
              </Text>
              <Text style={styles.successTitle}>
                {selected === 'monthly' ? 'Welcome to Pro' : 'You are ready to connect'}
              </Text>
              <Text style={styles.successText}>
                {selected === 'monthly'
                  ? 'You now have unlimited connection requests and priority local visibility.'
                  : `5 connection credits have been added. You now have ${credits} credits available.`}
              </Text>

              <View style={styles.successSummary}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Current plan</Text>
                  <Text style={styles.summaryValue}>
                    {plan === 'premium' ? 'Premium Pro Member' : 'Free Member'}
                  </Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Available connects</Text>
                  <Text style={styles.summaryValue}>
                    {plan === 'premium' ? 'Unlimited' : credits}
                  </Text>
                </View>
              </View>

              <Pressable
                onPress={handleClose}
                style={({ pressed }) => [styles.cta, styles.successCta, pressed && styles.ctaPressed]}
              >
                <Text style={styles.ctaText}>Start connecting</Text>
              </Pressable>
            </View>
          )}
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
    marginBottom: 6,
  },
  sheetContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  proBadge: {
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.premiumSoft,
    borderWidth: 1,
    borderColor: '#DDD6FE',
  },
  proBadgeText: {
    color: COLORS.premium,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.4,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  closeText: {
    color: COLORS.textMuted,
    fontSize: 20,
    lineHeight: 22,
    fontWeight: '400',
    marginTop: -1,
  },
  kicker: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.4,
    marginTop: 16,
  },
  title: {
    color: COLORS.text,
    fontSize: 27,
    fontWeight: '800',
    letterSpacing: -0.6,
    marginTop: 6,
  },
  subtitle: {
    color: COLORS.textMuted,
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 19,
    marginTop: 7,
    marginBottom: 18,
  },
  planCard: {
    padding: 16,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    marginBottom: 12,
  },
  planCardActive: {
    borderColor: COLORS.primary,
    backgroundColor: '#FAF9FF',
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  planTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 1,
  },
  planName: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  tag: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.primarySoft,
  },
  tagFlexible: {
    backgroundColor: COLORS.successSoft,
  },
  tagText: {
    color: COLORS.primary,
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  tagTextFlexible: {
    color: COLORS.success,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: COLORS.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  radioActive: {
    borderColor: COLORS.primary,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginTop: 12,
  },
  price: {
    color: COLORS.text,
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.8,
    lineHeight: 32,
  },
  cadence: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
    marginBottom: 4,
  },
  planBlurb: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 18,
    marginTop: 5,
  },
  featureList: {
    marginTop: 12,
    gap: 7,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkCircle: {
    width: 17,
    height: 17,
    borderRadius: 9,
    backgroundColor: COLORS.successSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  checkText: {
    color: COLORS.success,
    fontSize: 10,
    fontWeight: '900',
    lineHeight: 12,
  },
  featureText: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
  },
  cta: {
    minHeight: 52,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    ...SHADOWS.floating,
  },
  ctaPressed: {
    opacity: 0.86,
    transform: [{ scale: 0.995 }],
  },
  ctaText: {
    color: COLORS.surface,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.1,
  },
  footnote: {
    color: COLORS.textSubtle,
    fontSize: 10,
    fontWeight: '500',
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
  successContent: {
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 10,
    alignItems: 'center',
  },
  successIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.successSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successCheck: {
    color: COLORS.success,
    fontSize: 34,
    fontWeight: '800',
    lineHeight: 40,
  },
  successKicker: {
    color: COLORS.success,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.4,
    marginTop: 20,
  },
  successTitle: {
    color: COLORS.text,
    fontSize: 25,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginTop: 7,
    textAlign: 'center',
  },
  successText: {
    color: COLORS.textMuted,
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 20,
    textAlign: 'center',
    marginTop: 8,
  },
  successSummary: {
    alignSelf: 'stretch',
    backgroundColor: COLORS.surfaceMuted,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    marginTop: 22,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  summaryLabel: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  summaryValue: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: '800',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 12,
  },
  successCta: {
    alignSelf: 'stretch',
    marginTop: 22,
  },
});
