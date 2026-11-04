import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import { COLORS, RADIUS, SHADOWS } from '../theme';

function Field({
  label,
  icon,
  value,
  onChangeText,
  placeholder,
  secure = false,
  visible = false,
  onToggleVisibility,
  keyboardType = 'default',
  autoCapitalize = 'none',
  autoComplete,
  textContentType,
  returnKeyType,
  onSubmitEditing,
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.inputWrap}>
        <Ionicons name={icon} size={17} color={COLORS.textSubtle} />
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={COLORS.textSubtle}
          secureTextEntry={secure && !visible}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={false}
          autoComplete={autoComplete}
          textContentType={textContentType}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
          style={styles.input}
        />
        {secure ? (
          <Pressable
            onPress={onToggleVisibility}
            accessibilityRole="button"
            accessibilityLabel={visible ? 'Hide password' : 'Show password'}
            hitSlop={10}
          >
            <Ionicons
              name={visible ? 'eye-off-outline' : 'eye-outline'}
              size={18}
              color={COLORS.textSubtle}
            />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

function ModeTab({ label, active, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      style={[styles.modeTab, active && styles.modeTabActive]}
    >
      <Text style={[styles.modeTabText, active && styles.modeTabTextActive]}>
        {label}
      </Text>
    </Pressable>
  );
}

export default function AuthScreen() {
  const {
    signIn,
    signUp,
    resendConfirmation,
    requestPasswordReset,
    updatePassword,
    recoveryMode,
    authError,
    clearAuthError,
  } = useAuth();

  const [mode, setMode] = useState('signin');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [confirmationEmail, setConfirmationEmail] = useState('');

  const activeMode = recoveryMode ? 'recovery' : mode;

  const switchMode = (nextMode) => {
    setMode(nextMode);
    setError('');
    setNotice('');
    setPassword('');
    setConfirmPassword('');
    clearAuthError();
  };

  const handleSubmit = async () => {
    setError('');
    setNotice('');

    if (recoveryMode) {
      if (password !== confirmPassword) {
        setError('The passwords do not match.');
        return;
      }

      setBusy(true);
      const result = await updatePassword(password);
      setBusy(false);

      if (!result.ok) {
        setError(result.error);
        return;
      }

      setNotice('Your password has been updated. You can continue into the app.');
      return;
    }

    if (mode === 'reset') {
      setBusy(true);
      const result = await requestPasswordReset(email);
      setBusy(false);

      if (!result.ok) {
        setError(result.error);
        return;
      }

      setNotice(
        'If an account exists for that email, a secure reset link has been sent.'
      );
      return;
    }

    if (mode === 'signup' && password !== confirmPassword) {
      setError('The passwords do not match.');
      return;
    }

    setBusy(true);
    const result =
      mode === 'signup'
        ? await signUp({ fullName, email, password })
        : await signIn(email, password);
    setBusy(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    if (mode === 'signup' && result.needsConfirmation) {
      setConfirmationEmail(result.email);
      setMode('signin');
      setNotice(
        'Account created. Check your email to confirm your address before signing in.'
      );
    }
  };

  const handleResend = async () => {
    if (!confirmationEmail) return;

    setBusy(true);
    const result = await resendConfirmation(confirmationEmail);
    setBusy(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    setNotice('A new confirmation email has been sent.');
  };

  const headline =
    activeMode === 'recovery'
      ? 'Choose a new password'
      : activeMode === 'signup'
        ? 'Join your local network'
        : activeMode === 'reset'
          ? 'Reset your password'
          : 'Welcome back';

  const subtitle =
    activeMode === 'recovery'
      ? 'Use at least 8 characters. Your current session will stay signed in.'
      : activeMode === 'signup'
        ? 'Find trusted professionals nearby and keep every enquiry in one place.'
        : activeMode === 'reset'
          ? 'Enter the email on your account and we will send a secure link.'
          : 'Sign in to continue discovering trusted local professionals.';

  const primaryLabel = busy
    ? null
    : activeMode === 'recovery'
      ? 'Update password'
      : activeMode === 'signup'
        ? 'Create account'
        : activeMode === 'reset'
          ? 'Send reset link'
          : 'Sign in';

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <LinearGradient
            colors={['#4F3BF0', '#2A2391']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.hero}
          >
            <View style={styles.heroGlow} />
            <View style={[styles.heroRing, { top: -36, right: 24 }]} />
            <View style={[styles.heroRing, { bottom: -76, left: -48 }]} />

            <View style={styles.brandRow}>
              <View style={styles.brandMark}>
                <Ionicons name="location" size={21} color={COLORS.primary} />
              </View>
              <View>
                <Text style={styles.brandName}>CONNECT LOCAL</Text>
                <Text style={styles.brandTagline}>Trusted help, nearby</Text>
              </View>
            </View>

            <Text style={styles.heroTitle}>Your neighbourhood, connected.</Text>
            <Text style={styles.heroSubtitle}>
              Discover verified professionals, compare real services and start a
              conversation without sharing your exact address.
            </Text>

            <View style={styles.trustRow}>
              <View style={styles.trustPill}>
                <Ionicons name="shield-checkmark" size={12} color="#E0E7FF" />
                <Text style={styles.trustPillText}>Privacy first</Text>
              </View>
              <View style={styles.trustPill}>
                <Ionicons name="location-outline" size={12} color="#E0E7FF" />
                <Text style={styles.trustPillText}>Local discovery</Text>
              </View>
            </View>
          </LinearGradient>

          <View style={styles.card}>
            {recoveryMode ? (
              <View style={styles.recoveryBadge}>
                <Ionicons name="lock-open-outline" size={14} color={COLORS.primary} />
                <Text style={styles.recoveryBadgeText}>SECURE RECOVERY</Text>
              </View>
            ) : (
              <View style={styles.modeTabs}>
                <ModeTab
                  label="Sign in"
                  active={activeMode === 'signin'}
                  onPress={() => switchMode('signin')}
                />
                <ModeTab
                  label="Create account"
                  active={activeMode === 'signup'}
                  onPress={() => switchMode('signup')}
                />
              </View>
            )}

            <Text style={styles.title}>{headline}</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>

            {notice ? (
              <View style={styles.noticeBox}>
                <Ionicons name="checkmark-circle" size={17} color={COLORS.success} />
                <Text style={styles.noticeText}>{notice}</Text>
              </View>
            ) : null}

            {error || authError ? (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={17} color={COLORS.danger} />
                <Text style={styles.errorText}>{error || authError}</Text>
              </View>
            ) : null}

            {activeMode === 'signup' ? (
              <Field
                label="Full name"
                icon="person-outline"
                value={fullName}
                onChangeText={setFullName}
                placeholder="Your full name"
                autoCapitalize="words"
                autoComplete="name"
                textContentType="name"
                returnKeyType="next"
              />
            ) : null}

            {activeMode !== 'recovery' ? (
              <Field
                label="Email address"
                icon="mail-outline"
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                keyboardType="email-address"
                autoComplete="email"
                textContentType="emailAddress"
                returnKeyType="next"
              />
            ) : null}

            {activeMode !== 'reset' ? (
              <Field
                label={activeMode === 'recovery' ? 'New password' : 'Password'}
                icon="lock-closed-outline"
                value={password}
                onChangeText={setPassword}
                placeholder="At least 8 characters"
                secure
                visible={showPassword}
                onToggleVisibility={() => setShowPassword((current) => !current)}
                autoComplete={activeMode === 'signup' ? 'new-password' : 'current-password'}
                textContentType={
                  activeMode === 'signup' ? 'newPassword' : 'password'
                }
                returnKeyType={activeMode === 'signin' ? 'go' : 'next'}
                onSubmitEditing={activeMode === 'signin' ? handleSubmit : undefined}
              />
            ) : null}

            {activeMode === 'signup' || activeMode === 'recovery' ? (
              <Field
                label="Confirm password"
                icon="shield-checkmark-outline"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Repeat your password"
                secure
                visible={showPassword}
                onToggleVisibility={() => setShowPassword((current) => !current)}
                autoComplete="new-password"
                textContentType="newPassword"
                returnKeyType="go"
                onSubmitEditing={handleSubmit}
              />
            ) : null}

            {activeMode === 'signin' ? (
              <Pressable
                onPress={() => switchMode('reset')}
                accessibilityRole="button"
                style={styles.forgotButton}
              >
                <Text style={styles.forgotText}>Forgot password?</Text>
              </Pressable>
            ) : null}

            <Pressable
              onPress={handleSubmit}
              disabled={busy}
              accessibilityRole="button"
              accessibilityState={{ disabled: busy, busy }}
              style={({ pressed }) => [
                styles.primaryButton,
                busy && styles.primaryButtonBusy,
                pressed && !busy && styles.pressed,
              ]}
            >
              {busy ? (
                <ActivityIndicator size="small" color={COLORS.surface} />
              ) : (
                <>
                  <Text style={styles.primaryButtonText}>{primaryLabel}</Text>
                  <Ionicons name="arrow-forward" size={16} color={COLORS.surface} />
                </>
              )}
            </Pressable>

            {activeMode === 'reset' ? (
              <Pressable
                onPress={() => switchMode('signin')}
                accessibilityRole="button"
                style={styles.backButton}
              >
                <Ionicons name="arrow-back" size={13} color={COLORS.primary} />
                <Text style={styles.backText}>Back to sign in</Text>
              </Pressable>
            ) : null}

            {notice && confirmationEmail ? (
              <Pressable
                onPress={handleResend}
                disabled={busy}
                accessibilityRole="button"
                style={styles.resendButton}
              >
                <Text style={styles.resendText}>Resend confirmation email</Text>
              </Pressable>
            ) : null}

            {activeMode === 'signup' ? (
              <Text style={styles.legalText}>
                By creating an account you agree to use the platform honestly and to
                keep your contact details accurate. You can review privacy settings at
                any time.
              </Text>
            ) : null}

            <View style={styles.securityNote}>
              <Ionicons name="lock-closed" size={12} color={COLORS.textSubtle} />
              <Text style={styles.securityText}>
                Sessions are stored on this device. We never ask for card details until
                a server-verified payment flow is enabled.
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  hero: {
    minHeight: 282,
    paddingHorizontal: 22,
    paddingTop: 18,
    paddingBottom: 58,
    overflow: 'hidden',
  },
  heroGlow: {
    position: 'absolute',
    top: -70,
    right: -60,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(255, 255, 255, 0.09)',
  },
  heroRing: {
    position: 'absolute',
    width: 170,
    height: 170,
    borderRadius: 85,
    borderWidth: 26,
    borderColor: 'rgba(255, 255, 255, 0.07)',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  brandMark: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandName: {
    color: COLORS.surface,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.6,
  },
  brandTagline: {
    color: '#C7D2FE',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  heroTitle: {
    color: COLORS.surface,
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: -1.1,
    lineHeight: 39,
    marginTop: 28,
    maxWidth: 320,
  },
  heroSubtitle: {
    color: '#C7D2FE',
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 20,
    marginTop: 10,
    maxWidth: 330,
  },
  trustRow: {
    flexDirection: 'row',
    gap: 7,
    marginTop: 16,
    flexWrap: 'wrap',
  },
  trustPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.13)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.16)',
  },
  trustPillText: {
    color: '#E0E7FF',
    fontSize: 9,
    fontWeight: '700',
  },
  card: {
    marginHorizontal: 16,
    marginTop: -34,
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 20,
    borderRadius: RADIUS.xl,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.card,
  },
  modeTabs: {
    flexDirection: 'row',
    gap: 4,
    padding: 4,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.surfaceMuted,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  modeTab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: RADIUS.pill,
  },
  modeTabActive: {
    backgroundColor: COLORS.surface,
    ...SHADOWS.soft,
  },
  modeTabText: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '700',
  },
  modeTabTextActive: {
    color: COLORS.text,
  },
  recoveryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.primaryFaint,
  },
  recoveryBadgeText: {
    color: COLORS.primary,
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  title: {
    color: COLORS.text,
    fontSize: 23,
    fontWeight: '800',
    letterSpacing: -0.6,
    marginTop: 16,
  },
  subtitle: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '500',
    lineHeight: 17,
    marginTop: 4,
    marginBottom: 4,
  },
  noticeBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 7,
    marginTop: 12,
    padding: 10,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.successSoft,
    borderWidth: 1,
    borderColor: COLORS.successBorder,
  },
  noticeText: {
    flex: 1,
    color: COLORS.success,
    fontSize: 10,
    fontWeight: '600',
    lineHeight: 15,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 7,
    marginTop: 12,
    padding: 10,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.dangerSoft,
    borderWidth: 1,
    borderColor: COLORS.dangerBorder,
  },
  errorText: {
    flex: 1,
    color: COLORS.danger,
    fontSize: 10,
    fontWeight: '600',
    lineHeight: 15,
  },
  field: {
    marginTop: 13,
  },
  fieldLabel: {
    color: COLORS.text,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.2,
    marginBottom: 6,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 48,
    paddingHorizontal: 12,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surfaceMuted,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  input: {
    flex: 1,
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '500',
    paddingVertical: 10,
  },
  forgotButton: {
    alignSelf: 'flex-end',
    paddingVertical: 9,
    paddingLeft: 8,
  },
  forgotText: {
    color: COLORS.primary,
    fontSize: 10,
    fontWeight: '800',
  },
  primaryButton: {
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primary,
    marginTop: 13,
    ...SHADOWS.floating,
  },
  primaryButtonBusy: {
    opacity: 0.75,
  },
  primaryButtonText: {
    color: COLORS.surface,
    fontSize: 13,
    fontWeight: '800',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 11,
  },
  backText: {
    color: COLORS.primary,
    fontSize: 10,
    fontWeight: '800',
  },
  resendButton: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  resendText: {
    color: COLORS.primary,
    fontSize: 10,
    fontWeight: '800',
  },
  legalText: {
    color: COLORS.textSubtle,
    fontSize: 9,
    fontWeight: '500',
    lineHeight: 14,
    textAlign: 'center',
    marginTop: 10,
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  securityText: {
    flex: 1,
    color: COLORS.textSubtle,
    fontSize: 9,
    fontWeight: '500',
    lineHeight: 14,
  },
  pressed: {
    opacity: 0.82,
  },
});
