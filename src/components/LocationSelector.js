import React, { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useApp } from '../context/AppContext';
import { LOCATIONS, formatLocationLabel } from '../data/locations';
import { COLORS, RADIUS, SHADOWS } from '../theme';

export default function LocationSelector({ visible, onClose }) {
  const {
    selectedLocation,
    setManualLocation,
    refreshLocation,
    isRefreshingLocation,
    locationStatus,
  } = useApp();
  const insets = useSafeAreaInsets();
  const [message, setMessage] = useState('');

  const handleSelect = (location) => {
    setManualLocation(location);
    setMessage('');
    Haptics.selectionAsync().catch(() => {});
    onClose();
  };

  const handleDeviceLocation = async () => {
    setMessage('');
    const result = await refreshLocation();

    if (result.ok) {
      setMessage('Location updated from your device.');
      setTimeout(onClose, 350);
      return;
    }

    if (result.reason === 'permission_denied') {
      setMessage('Location permission was not granted. Choose an area below instead.');
      return;
    }

    setMessage('We could not read your location. Choose an area below instead.');
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close location selector"
        />

        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 18) }]}>
          <View style={styles.handle} />

          <View style={styles.header}>
            <View style={styles.headerCopy}>
              <Text style={styles.overline}>SERVICE AREA</Text>
              <Text style={styles.title}>Choose your location</Text>
              <Text style={styles.subtitle}>
                Distances and nearby recommendations update to this area.
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

          <Pressable
            onPress={handleDeviceLocation}
            disabled={isRefreshingLocation}
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.deviceButton,
              pressed && styles.pressed,
              isRefreshingLocation && styles.deviceButtonBusy,
            ]}
          >
            <View style={styles.deviceIcon}>
              {isRefreshingLocation ? (
                <ActivityIndicator size="small" color={COLORS.primary} />
              ) : (
                <Ionicons name="navigate" size={19} color={COLORS.primary} />
              )}
            </View>

            <View style={styles.deviceCopy}>
              <Text style={styles.deviceTitle}>Use my current location</Text>
              <Text style={styles.deviceSubtitle}>
                We only use your area to rank nearby professionals.
              </Text>
            </View>

            <Ionicons name="chevron-forward" size={17} color={COLORS.textSubtle} />
          </Pressable>

          {message ? (
            <View style={styles.messageRow}>
              <Ionicons name="information-circle" size={15} color={COLORS.info} />
              <Text style={styles.messageText}>{message}</Text>
            </View>
          ) : null}

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR PICK A NEIGHBOURHOOD</Text>
            <View style={styles.dividerLine} />
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.list}
          >
            {LOCATIONS.map((location) => {
              const isSelected =
                location.id === selectedLocation.id ||
                formatLocationLabel(location) === formatLocationLabel(selectedLocation);

              return (
                <Pressable
                  key={location.id}
                  onPress={() => handleSelect(location)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: isSelected }}
                  style={({ pressed }) => [
                    styles.locationRow,
                    isSelected && styles.locationRowSelected,
                    pressed && styles.pressed,
                  ]}
                >
                  <View style={[styles.locationPin, isSelected && styles.locationPinSelected]}>
                    <Ionicons
                      name="location"
                      size={16}
                      color={isSelected ? COLORS.surface : COLORS.primary}
                    />
                  </View>

                  <View style={styles.locationCopy}>
                    <Text style={styles.locationTitle}>{location.label}</Text>
                    <Text style={styles.locationSubtitle}>
                      {[location.city, location.state].filter(Boolean).join(', ')}
                    </Text>
                  </View>

                  {isSelected ? (
                    <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />
                  ) : null}
                </Pressable>
              );
            })}
          </ScrollView>

          <View style={styles.privacyRow}>
            <Ionicons name="shield-checkmark-outline" size={15} color={COLORS.textSubtle} />
            <Text style={styles.privacyText}>
              Your exact address is never shown on your profile or in search results.
            </Text>
          </View>

          {locationStatus === 'denied' ? (
            <Text style={styles.permissionNote}>
              You can keep using a manually selected area without enabling GPS.
            </Text>
          ) : null}
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
    maxHeight: '88%',
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
    paddingHorizontal: 20,
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
  deviceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    marginHorizontal: 20,
    marginTop: 18,
    padding: 14,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primaryFaint,
    borderWidth: 1,
    borderColor: COLORS.primarySoft,
  },
  deviceButtonBusy: {
    opacity: 0.75,
  },
  deviceIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deviceCopy: {
    flex: 1,
  },
  deviceTitle: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '800',
  },
  deviceSubtitle: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
    lineHeight: 15,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginHorizontal: 20,
    marginTop: 10,
  },
  messageText: {
    flex: 1,
    color: COLORS.info,
    fontSize: 11,
    fontWeight: '600',
    lineHeight: 16,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 8,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  dividerText: {
    color: COLORS.textSubtle,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: 'transparent',
    marginBottom: 4,
  },
  locationRowSelected: {
    backgroundColor: COLORS.primaryFaint,
    borderColor: COLORS.primarySoft,
  },
  locationPin: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: COLORS.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationPinSelected: {
    backgroundColor: COLORS.primary,
  },
  locationCopy: {
    flex: 1,
  },
  locationTitle: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '700',
  },
  locationSubtitle: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  privacyRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 7,
    marginHorizontal: 20,
    marginTop: 10,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  privacyText: {
    flex: 1,
    color: COLORS.textSubtle,
    fontSize: 10,
    fontWeight: '500',
    lineHeight: 15,
  },
  permissionNote: {
    color: COLORS.warning,
    fontSize: 10,
    fontWeight: '600',
    marginHorizontal: 20,
    marginTop: 8,
    lineHeight: 15,
  },
  pressed: {
    opacity: 0.75,
  },
});
