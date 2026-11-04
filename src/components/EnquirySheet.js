import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useApp } from '../context/AppContext';
import { formatPrice } from '../utils/geo';
import { buildEnquiryMessage } from '../utils/whatsapp';
import { COLORS, RADIUS, SHADOWS } from '../theme';

export default function EnquirySheet({
  visible,
  onClose,
  professional,
  initialServiceId,
}) {
  const insets = useSafeAreaInsets();
  const { sendEnquiry, isPaid, credits, openPaywall } = useApp();
  const [selectedServiceId, setSelectedServiceId] = useState(
    initialServiceId || professional?.services?.[0]?.id || null
  );
  const [message, setMessage] = useState(
    professional ? buildEnquiryMessage(professional) : ''
  );
  const [error, setError] = useState('');
  const [step, setStep] = useState('form');
  const [submitting, setSubmitting] = useState(false);

  const selectedService = useMemo(
    () =>
      (professional?.services || []).find(
        (service) => service.id === selectedServiceId
      ) || null,
    [professional, selectedServiceId]
  );

  if (!professional) return null;

  const resetForm = () => {
    setSelectedServiceId(
      initialServiceId || professional.services?.[0]?.id || null
    );
    setMessage(buildEnquiryMessage(professional));
    setError('');
    setStep('form');
    setSubmitting(false);
  };

  const handleSubmit = () => {
    if (message.trim().length < 10) {
      setError('Please add a little more detail so the professional can respond.');
      return;
    }

    setSubmitting(true);
    const result = sendEnquiry(professional.id, message, {
      serviceId: selectedService?.id || null,
      serviceName: selectedService?.name || null,
    });
    setSubmitting(false);

    if (!result.ok) {
      if (result.reason === 'no_credits') {
        setError('You have used all free enquiry credits. Add credits or upgrade to continue.');
      } else if (result.reason === 'blocked') {
        setError('You have blocked this professional. Unblock them from Settings first.');
      } else {
        setError('This enquiry could not be created. Please try again.');
      }
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    setStep('success');
  };

  const handleSelectService = (serviceId) => {
    setSelectedServiceId(serviceId);
    setError('');
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onShow={resetForm}
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close enquiry form"
        />

        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <View style={styles.handle} />

          {step === 'success' ? (
            <View style={styles.successContent}>
              <View style={styles.successIcon}>
                <Ionicons name="checkmark" size={34} color={COLORS.success} />
              </View>
              <Text style={styles.successOverline}>ENQUIRY RECORDED</Text>
              <Text style={styles.successTitle}>Your request is in your dashboard</Text>
              <Text style={styles.successText}>
                {professional.name.split(' ')[0]} can review your enquiry when the
                messaging service is connected. You can also contact them directly on
                WhatsApp if their profile allows it.
              </Text>

              <View style={styles.successCard}>
                <View style={styles.successRow}>
                  <Text style={styles.successLabel}>Professional</Text>
                  <Text style={styles.successValue}>{professional.name}</Text>
                </View>
                <View style={styles.successDivider} />
                <View style={styles.successRow}>
                  <Text style={styles.successLabel}>Service</Text>
                  <Text style={styles.successValue}>
                    {selectedService?.name || 'General enquiry'}
                  </Text>
                </View>
                <View style={styles.successDivider} />
                <View style={styles.successRow}>
                  <Text style={styles.successLabel}>Credits left</Text>
                  <Text style={styles.successValue}>
                    {isPaid ? 'Unlimited' : credits}
                  </Text>
                </View>
              </View>

              <Pressable
                onPress={onClose}
                accessibilityRole="button"
                style={({ pressed }) => [styles.submit, pressed && styles.pressed]}
              >
                <Text style={styles.submitText}>Done</Text>
              </Pressable>

              <Pressable onPress={onClose} style={styles.secondaryClose}>
                <Text style={styles.secondaryCloseText}>Back to profile</Text>
              </Pressable>
            </View>
          ) : (
            <>
              <View style={styles.header}>
                <View style={styles.headerCopy}>
                  <Text style={styles.overline}>SEND AN ENQUIRY</Text>
                  <Text style={styles.title}>Tell them what you need</Text>
                  <Text style={styles.subtitle}>
                    A clear first message gets a faster, more useful reply.
                  </Text>
                </View>

                <Pressable
                  onPress={onClose}
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
                keyboardShouldPersistTaps="handled"
              >
                {professional.services?.length ? (
                  <>
                    <Text style={styles.fieldLabel}>CHOOSE A SERVICE</Text>
                    <View style={styles.serviceList}>
                      {professional.services.map((service) => {
                        const active = selectedServiceId === service.id;

                        return (
                          <Pressable
                            key={service.id}
                            onPress={() => handleSelectService(service.id)}
                            accessibilityRole="radio"
                            accessibilityState={{ selected: active }}
                            style={({ pressed }) => [
                              styles.serviceOption,
                              active && styles.serviceOptionActive,
                              pressed && styles.pressed,
                            ]}
                          >
                            <View style={styles.serviceRadio}>
                              {active ? <View style={styles.serviceRadioDot} /> : null}
                            </View>
                            <View style={styles.serviceCopy}>
                              <Text style={styles.serviceName}>{service.name}</Text>
                              <Text style={styles.serviceMeta}>
                                {formatPrice(service.price)}
                                {service.priceType === 'from' ? '+' : ''} · {service.duration}
                              </Text>
                            </View>
                          </Pressable>
                        );
                      })}
                    </View>
                  </>
                ) : null}

                <Text style={styles.fieldLabel}>YOUR MESSAGE</Text>
                <TextInput
                  value={message}
                  onChangeText={(text) => {
                    setMessage(text);
                    setError('');
                  }}
                  multiline
                  maxLength={600}
                  placeholder="Describe what you need, your preferred time, and any useful context."
                  placeholderTextColor={COLORS.textSubtle}
                  style={styles.input}
                  textAlignVertical="top"
                  accessibilityLabel="Enquiry message"
                />
                <View style={styles.inputMeta}>
                  <Text style={styles.inputHint}>Do not share sensitive documents here.</Text>
                  <Text style={styles.inputCount}>{message.length}/600</Text>
                </View>

                {error ? (
                  <View style={styles.errorRow}>
                    <Ionicons name="alert-circle" size={15} color={COLORS.danger} />
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                ) : null}

                <View style={styles.creditNote}>
                  <Ionicons
                    name={isPaid ? 'diamond' : 'flash'}
                    size={15}
                    color={isPaid ? COLORS.premium : COLORS.gold}
                  />
                  <Text style={styles.creditNoteText}>
                    {isPaid
                      ? 'Your plan includes unlimited enquiries.'
                      : `This uses 1 credit. You have ${credits} left.`}
                  </Text>
                  {!isPaid ? (
                    <Pressable
                      onPress={openPaywall}
                      accessibilityRole="button"
                      style={styles.getMore}
                    >
                      <Text style={styles.getMoreText}>Get more</Text>
                    </Pressable>
                  ) : null}
                </View>

                <Pressable
                  onPress={handleSubmit}
                  disabled={submitting}
                  accessibilityRole="button"
                  style={({ pressed }) => [
                    styles.submit,
                    pressed && styles.pressed,
                    submitting && styles.submitBusy,
                  ]}
                >
                  {submitting ? (
                    <ActivityIndicator size="small" color={COLORS.surface} />
                  ) : (
                    <>
                      <Ionicons name="send" size={15} color={COLORS.surface} />
                      <Text style={styles.submitText}>Send enquiry</Text>
                    </>
                  )}
                </Pressable>

                <Text style={styles.privacyNote}>
                  Your phone number is not shared unless you choose to include it.
                </Text>
              </ScrollView>
            </>
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
    marginBottom: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingHorizontal: 20,
    paddingBottom: 8,
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
    fontSize: 23,
    fontWeight: '800',
    letterSpacing: -0.5,
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
    paddingTop: 10,
  },
  fieldLabel: {
    color: COLORS.textSubtle,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.1,
    marginTop: 12,
    marginBottom: 8,
  },
  serviceList: {
    gap: 7,
  },
  serviceOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  serviceOptionActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryFaint,
  },
  serviceRadio: {
    width: 19,
    height: 19,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: COLORS.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceRadioDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
  },
  serviceCopy: {
    flex: 1,
  },
  serviceName: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '700',
  },
  serviceMeta: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  input: {
    minHeight: 120,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surfaceMuted,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 13,
    paddingVertical: 12,
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 19,
  },
  inputMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 6,
  },
  inputHint: {
    flex: 1,
    color: COLORS.textSubtle,
    fontSize: 9,
    fontWeight: '500',
  },
  inputCount: {
    color: COLORS.textSubtle,
    fontSize: 9,
    fontWeight: '700',
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginTop: 10,
    padding: 10,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.dangerSoft,
  },
  errorText: {
    flex: 1,
    color: COLORS.danger,
    fontSize: 11,
    fontWeight: '600',
    lineHeight: 16,
  },
  creditNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginTop: 14,
    padding: 11,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.goldSoft,
    borderWidth: 1,
    borderColor: COLORS.goldBorder,
  },
  creditNoteText: {
    flex: 1,
    color: '#92400E',
    fontSize: 10,
    fontWeight: '600',
    lineHeight: 15,
  },
  getMore: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.surface,
  },
  getMoreText: {
    color: COLORS.warning,
    fontSize: 9,
    fontWeight: '800',
  },
  submit: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primary,
    marginTop: 16,
    ...SHADOWS.floating,
  },
  submitBusy: {
    opacity: 0.8,
  },
  submitText: {
    color: COLORS.surface,
    fontSize: 14,
    fontWeight: '800',
  },
  privacyNote: {
    color: COLORS.textSubtle,
    fontSize: 9,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 6,
  },
  pressed: {
    opacity: 0.8,
  },
  successContent: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 8,
  },
  successIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.successSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successOverline: {
    color: COLORS.success,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.3,
    marginTop: 16,
  },
  successTitle: {
    color: COLORS.text,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.4,
    textAlign: 'center',
    marginTop: 7,
  },
  successText: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 19,
    textAlign: 'center',
    marginTop: 8,
  },
  successCard: {
    alignSelf: 'stretch',
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.surfaceMuted,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
    marginTop: 18,
  },
  successRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  successLabel: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  successValue: {
    color: COLORS.text,
    fontSize: 11,
    fontWeight: '800',
    flexShrink: 1,
    textAlign: 'right',
  },
  successDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 10,
  },
  secondaryClose: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  secondaryCloseText: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
});
