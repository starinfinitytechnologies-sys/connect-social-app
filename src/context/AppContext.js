import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import {
  CURRENT_USER,
  INITIAL_CREDITS,
  PROFESSIONALS,
  createInitialRelationships,
} from '../data/mockData';
import { DEFAULT_LOCATION, formatLocationLabel } from '../data/locations';
import { distanceInKm } from '../utils/geo';
import { PLAN_CATALOGUE } from '../config/plans';
import { useAuth } from './AuthContext';

const AppContext = createContext(null);
const STORAGE_KEY = 'connect-local:app-state:v1';

const EMPTY_RELATION = {
  status: 'none',
  direction: null,
  messages: [],
};

function formatPlace(place) {
  if (!place) return null;

  const area = place.district || place.subregion || place.name;
  const city = place.city || place.region;

  return {
    area,
    city,
    state: place.region,
    label:
      area && city && area.toLowerCase() !== city.toLowerCase()
        ? `${area}, ${city}`
        : city || area || 'Current location',
  };
}

function formatTime(date) {
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const hours24 = date.getHours();
  const suffix = hours24 >= 12 ? 'PM' : 'AM';
  const hours12 = hours24 % 12 || 12;
  return `${hours12}:${minutes} ${suffix}`;
}

export function AppProvider({ children }) {
  const {
    profile: authProfile,
    user: authUser,
    configured: isBackendConfigured,
  } = useAuth();
  const [plan, setPlan] = useState('free');
  const [credits, setCredits] = useState(INITIAL_CREDITS);
  const [relationships, setRelationships] = useState(createInitialRelationships);
  const [favouriteIds, setFavouriteIds] = useState([]);
  const [recentIds, setRecentIds] = useState([]);
  const [enquiries, setEnquiries] = useState([]);
  const [reports, setReports] = useState([]);
  const [blockedIds, setBlockedIds] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(DEFAULT_LOCATION);
  const [isPaywallVisible, setPaywallVisible] = useState(false);
  const [activeChatId, setActiveChatId] = useState(null);
  const [locationStatus, setLocationStatus] = useState('idle');
  const [isRefreshingLocation, setRefreshingLocation] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const locationRequest = useRef(false);

  useEffect(() => {
    let active = true;

    async function hydrate() {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw && active) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed.favouriteIds)) setFavouriteIds(parsed.favouriteIds);
          if (Array.isArray(parsed.recentIds)) setRecentIds(parsed.recentIds);
          if (Array.isArray(parsed.blockedIds)) setBlockedIds(parsed.blockedIds);
          if (Array.isArray(parsed.enquiries)) setEnquiries(parsed.enquiries);
          if (parsed.selectedLocation) {
            setSelectedLocation({ ...parsed.selectedLocation, source: 'manual' });
          }
        }
      } catch {
        // A storage failure should never block the app from loading.
      } finally {
        if (active) setHydrated(true);
      }
    }

    hydrate();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!hydrated) return;

    const payload = JSON.stringify({
      favouriteIds,
      recentIds,
      blockedIds,
      enquiries,
      selectedLocation,
    });

    AsyncStorage.setItem(STORAGE_KEY, payload).catch(() => {
      // Persistence is best-effort; the in-memory state remains usable.
    });
  }, [hydrated, favouriteIds, recentIds, blockedIds, enquiries, selectedLocation]);

  const refreshLocation = useCallback(async () => {
    if (locationRequest.current) return;

    locationRequest.current = true;
    setRefreshingLocation(true);
    setLocationStatus((previous) => (previous === 'granted' ? previous : 'locating'));

    try {
      const permission = await Location.requestForegroundPermissionsAsync();

      if (permission.status !== 'granted') {
        setLocationStatus('denied');
        return { ok: false, reason: 'permission_denied' };
      }

      let position = await Location.getLastKnownPositionAsync();

      if (!position) {
        position = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
      }

      const addresses = await Location.reverseGeocodeAsync({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });

      const place = formatPlace(addresses?.[0]);
      const nextLocation = {
        id: 'device',
        label: place?.label || 'Current location',
        area: place?.area || 'Current location',
        city: place?.city || '',
        state: place?.state || '',
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        source: 'device',
      };

      setSelectedLocation(nextLocation);
      setLocationStatus('granted');
      return { ok: true, location: nextLocation };
    } catch {
      setLocationStatus('error');
      return { ok: false, reason: 'location_error' };
    } finally {
      setRefreshingLocation(false);
      locationRequest.current = false;
    }
  }, []);

  const setManualLocation = useCallback((location) => {
    if (!location) return;
    setSelectedLocation({ ...location, source: location.source || 'manual' });
    setLocationStatus('manual');
  }, []);

  const professionals = useMemo(
    () =>
      PROFESSIONALS.map((professional) => {
        const distanceKm = distanceInKm(
          selectedLocation.latitude,
          selectedLocation.longitude,
          professional.latitude,
          professional.longitude
        );

        return {
          ...professional,
          distanceKm,
          withinServiceRadius: distanceKm <= professional.serviceRadiusKm,
          relation: relationships[professional.id] || EMPTY_RELATION,
        };
      }),
    [relationships, selectedLocation]
  );

  const professionalMap = useMemo(
    () =>
      professionals.reduce((accumulator, professional) => {
        accumulator[professional.id] = professional;
        return accumulator;
      }, {}),
    [professionals]
  );

  const incomingRequests = useMemo(
    () =>
      professionals.filter(
        (professional) =>
          !blockedIds.includes(professional.id) &&
          professional.relation.status === 'pending' &&
          professional.relation.direction === 'incoming'
      ),
    [blockedIds, professionals]
  );

  const outgoingRequests = useMemo(
    () =>
      professionals.filter(
        (professional) =>
          !blockedIds.includes(professional.id) &&
          professional.relation.status === 'pending' &&
          professional.relation.direction === 'outgoing'
      ),
    [blockedIds, professionals]
  );

  const connections = useMemo(
    () =>
      professionals.filter(
        (professional) =>
          !blockedIds.includes(professional.id) &&
          professional.relation.status === 'accepted'
      ),
    [blockedIds, professionals]
  );

  const favouriteProfessionals = useMemo(
    () =>
      favouriteIds
        .map((professionalId) => professionalMap[professionalId])
        .filter(Boolean),
    [favouriteIds, professionalMap]
  );

  const recentlyViewedProfessionals = useMemo(
    () => recentIds.map((professionalId) => professionalMap[professionalId]).filter(Boolean),
    [recentIds, professionalMap]
  );

  const activeChat = useMemo(
    () => professionals.find((professional) => professional.id === activeChatId) || null,
    [professionals, activeChatId]
  );

  const isPaid = plan !== 'free';
  const planConfig =
    PLAN_CATALOGUE.find((item) => item.id === plan) || PLAN_CATALOGUE[0];
  const isPremium = isPaid;

  const currentUser = useMemo(() => {
    if (!isBackendConfigured) return CURRENT_USER;

    const name =
      authProfile?.display_name ||
      authProfile?.full_name ||
      authUser?.user_metadata?.full_name ||
      authUser?.email?.split('@')[0] ||
      'Member';
    const nameParts = name.trim().split(/\s+/).filter(Boolean);
    const initials =
      nameParts
        .slice(0, 2)
        .map((part) => part.charAt(0).toUpperCase())
        .join('') || 'CL';

    return {
      id: authProfile?.id || authUser?.id,
      name,
      firstName: nameParts[0] || 'there',
      initials,
      profession:
        authProfile?.role === 'professional' ? 'Professional' : 'Member',
      role: authProfile?.role || 'customer',
      city: authProfile?.city || '',
      area: authProfile?.area || '',
      avatarSoft: '#EEECFF',
      avatarColor: '#5B4BFF',
    };
  }, [authProfile, authUser, isBackendConfigured]);

  const openPaywall = useCallback(() => setPaywallVisible(true), []);
  const closePaywall = useCallback(() => setPaywallVisible(false), []);

  const spendCredit = useCallback(
    (amount = 1) => {
      if (isPaid) return { ok: true, charged: 0 };

      if (credits < amount) {
        setPaywallVisible(true);
        return { ok: false, reason: 'no_credits', charged: 0 };
      }

      const nextCredits = credits - amount;
      setCredits(nextCredits);

      if (nextCredits === 0) {
        setTimeout(() => setPaywallVisible(true), 550);
      }

      return { ok: true, charged: amount, remaining: nextCredits };
    },
    [credits, isPaid]
  );

  const sendConnectionRequest = useCallback(
    (professionalId) => {
      const existing = relationships[professionalId];

      if (existing && ['pending', 'accepted', 'declined'].includes(existing.status)) {
        return { ok: false, reason: 'existing' };
      }

      if (blockedIds.includes(professionalId)) {
        return { ok: false, reason: 'blocked' };
      }

      const payment = spendCredit(1);
      if (!payment.ok) return payment;

      setRelationships((current) => ({
        ...current,
        [professionalId]: {
          status: 'pending',
          direction: 'outgoing',
          messages: [],
        },
      }));

      return { ok: true, remaining: payment.remaining };
    },
    [blockedIds, relationships, spendCredit]
  );

  const acceptRequest = useCallback((professionalId) => {
    setRelationships((current) => {
      const relation = current[professionalId];

      if (!relation || relation.status !== 'pending') return current;

      return {
        ...current,
        [professionalId]: {
          ...relation,
          status: 'accepted',
        },
      };
    });
  }, []);

  const declineRequest = useCallback((professionalId) => {
    setRelationships((current) => {
      const relation = current[professionalId];

      if (!relation || relation.status !== 'pending') return current;

      return {
        ...current,
        [professionalId]: {
          ...relation,
          status: 'declined',
        },
      };
    });
  }, []);

  const openChat = useCallback(
    (professionalId) => {
      if (blockedIds.includes(professionalId)) return;

      if (relationships[professionalId]?.status === 'accepted') {
        setActiveChatId(professionalId);
      }
    },
    [blockedIds, relationships]
  );

  const closeChat = useCallback(() => setActiveChatId(null), []);

  const sendMessage = useCallback((professionalId, text) => {
    const cleanText = text.trim();
    if (!cleanText) return;

    setRelationships((current) => {
      const relation = current[professionalId];

      if (!relation || relation.status !== 'accepted') return current;

      return {
        ...current,
        [professionalId]: {
          ...relation,
          messages: [
            ...(relation.messages || []),
            {
              id: `msg-${Date.now()}`,
              sender: 'me',
              text: cleanText,
              time: formatTime(new Date()),
            },
          ],
        },
      };
    });
  }, []);

  const sendEnquiry = useCallback(
    (professionalId, message, options = {}) => {
      const cleanMessage = String(message || '').trim();

      if (cleanMessage.length < 10) {
        return { ok: false, reason: 'too_short' };
      }

      if (blockedIds.includes(professionalId)) {
        return { ok: false, reason: 'blocked' };
      }

      const payment = spendCredit(1);
      if (!payment.ok) return payment;

      const enquiry = {
        id: `enq-${Date.now()}`,
        professionalId,
        message: cleanMessage,
        serviceId: options.serviceId || null,
        serviceName: options.serviceName || null,
        createdAt: new Date().toISOString(),
        status: 'recorded',
      };

      setEnquiries((current) => [enquiry, ...current]);

      return { ok: true, enquiry, remaining: payment.remaining };
    },
    [blockedIds, spendCredit]
  );

  const toggleFavourite = useCallback((professionalId) => {
    setFavouriteIds((current) =>
      current.includes(professionalId)
        ? current.filter((id) => id !== professionalId)
        : [professionalId, ...current]
    );
  }, []);

  const isFavourite = useCallback(
    (professionalId) => favouriteIds.includes(professionalId),
    [favouriteIds]
  );

  const recordProfileView = useCallback((professionalId) => {
    setRecentIds((current) => {
      const withoutDuplicate = current.filter((id) => id !== professionalId);
      return [professionalId, ...withoutDuplicate].slice(0, 8);
    });
  }, []);

  const reportProfile = useCallback((professionalId, reason, details = '') => {
    setReports((current) => [
      {
        id: `report-${Date.now()}`,
        professionalId,
        reason,
        details,
        createdAt: new Date().toISOString(),
        status: 'submitted',
      },
      ...current,
    ]);
  }, []);

  const blockUser = useCallback((professionalId) => {
    setBlockedIds((current) =>
      current.includes(professionalId) ? current : [...current, professionalId]
    );
    setFavouriteIds((current) => current.filter((id) => id !== professionalId));
    setActiveChatId((current) => (current === professionalId ? null : current));
  }, []);

  const unblockUser = useCallback((professionalId) => {
    setBlockedIds((current) => current.filter((id) => id !== professionalId));
  }, []);

  const setPremium = useCallback((nextValue) => {
    setPlan(nextValue ? 'pro' : 'free');
  }, []);

  const resetDemo = useCallback(async () => {
    setPlan('free');
    setCredits(INITIAL_CREDITS);
    setRelationships(createInitialRelationships());
    setFavouriteIds([]);
    setRecentIds([]);
    setEnquiries([]);
    setReports([]);
    setBlockedIds([]);
    setSelectedLocation(DEFAULT_LOCATION);
    setActiveChatId(null);
    setPaywallVisible(false);

    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore storage errors during reset.
    }
  }, []);

  const value = {
    currentUser,
    hydrated,
    plan,
    planConfig,
    planName: planConfig.name,
    isPremium,
    isPaid,
    credits,
    creditLabel: isPaid ? 'Unlimited' : `${credits} ${credits === 1 ? 'credit' : 'credits'}`,
    professionals,
    professionalMap,
    incomingRequests,
    outgoingRequests,
    connections,
    pendingCount: incomingRequests.length,
    favourites: favouriteProfessionals,
    favouriteIds,
    recentlyViewed: recentlyViewedProfessionals,
    enquiries,
    reports,
    blockedIds,
    selectedLocation,
    locationLabel: formatLocationLabel(selectedLocation),
    locationStatus,
    isRefreshingLocation,
    refreshLocation,
    setManualLocation,
    relationships,
    sendConnectionRequest,
    acceptRequest,
    declineRequest,
    openChat,
    closeChat,
    activeChatId,
    activeChat,
    sendMessage,
    sendEnquiry,
    toggleFavourite,
    isFavourite,
    recordProfileView,
    reportProfile,
    blockUser,
    unblockUser,
    isPaywallVisible,
    openPaywall,
    closePaywall,
    setPremium,
    resetDemo,
    spendCredit,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);

  if (!context) {
    throw new Error('useApp must be used inside an AppProvider');
  }

  return context;
}
