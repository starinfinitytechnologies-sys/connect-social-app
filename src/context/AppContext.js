import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import * as Location from 'expo-location';
import {
  CURRENT_USER,
  INITIAL_CREDITS,
  PROFESSIONALS,
  createInitialRelationships,
} from '../data/mockData';

const AppContext = createContext(null);

const EMPTY_RELATION = {
  status: 'none',
  direction: null,
  messages: [],
};

function formatPlace(place) {
  if (!place) return '';

  const area = place.district || place.subregion || place.name;
  const city = place.city || place.region;

  if (area && city && area.toLowerCase() !== city.toLowerCase()) {
    return `${area}, ${city}`;
  }

  return city || area || place.region || '';
}

function formatTime(date) {
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const hours24 = date.getHours();
  const suffix = hours24 >= 12 ? 'PM' : 'AM';
  const hours12 = hours24 % 12 || 12;
  return `${hours12}:${minutes} ${suffix}`;
}

export function AppProvider({ children }) {
  const [plan, setPlan] = useState('free');
  const [credits, setCredits] = useState(INITIAL_CREDITS);
  const [relationships, setRelationships] = useState(createInitialRelationships);
  const [isPaywallVisible, setPaywallVisible] = useState(false);
  const [activeChatId, setActiveChatId] = useState(null);
  const [locationLabel, setLocationLabel] = useState('Locating you...');
  const [locationStatus, setLocationStatus] = useState('loading');
  const [isRefreshingLocation, setRefreshingLocation] = useState(false);
  const locationRequest = useRef(false);

  const refreshLocation = useCallback(async () => {
    if (locationRequest.current) return;

    locationRequest.current = true;
    setRefreshingLocation(true);
    setLocationStatus((previous) => (previous === 'granted' ? previous : 'loading'));

    try {
      const permission = await Location.requestForegroundPermissionsAsync();

      if (permission.status !== 'granted') {
        setLocationStatus('denied');
        setLocationLabel('Location off');
        return;
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

      setLocationLabel(formatPlace(addresses?.[0]) || 'Your area');
      setLocationStatus('granted');
    } catch {
      setLocationStatus('error');
      setLocationLabel('Your area');
    } finally {
      setRefreshingLocation(false);
      locationRequest.current = false;
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      refreshLocation();
    }, 0);

    return () => clearTimeout(timer);
  }, [refreshLocation]);

  const professionals = useMemo(
    () =>
      PROFESSIONALS.map((professional) => ({
        ...professional,
        relation: relationships[professional.id] || EMPTY_RELATION,
      })),
    [relationships]
  );

  const incomingRequests = useMemo(
    () =>
      professionals.filter(
        (professional) =>
          professional.relation.status === 'pending' &&
          professional.relation.direction === 'incoming'
      ),
    [professionals]
  );

  const outgoingRequests = useMemo(
    () =>
      professionals.filter(
        (professional) =>
          professional.relation.status === 'pending' &&
          professional.relation.direction === 'outgoing'
      ),
    [professionals]
  );

  const connections = useMemo(
    () => professionals.filter((professional) => professional.relation.status === 'accepted'),
    [professionals]
  );

  const activeChat = useMemo(
    () => professionals.find((professional) => professional.id === activeChatId) || null,
    [professionals, activeChatId]
  );

  const isPremium = plan === 'premium';

  const openPaywall = useCallback(() => setPaywallVisible(true), []);
  const closePaywall = useCallback(() => setPaywallVisible(false), []);

  const sendConnectionRequest = useCallback(
    (professionalId) => {
      const existing = relationships[professionalId];

      if (existing && ['pending', 'accepted', 'declined'].includes(existing.status)) {
        return { ok: false, reason: 'existing' };
      }

      if (!isPremium && credits <= 0) {
        setPaywallVisible(true);
        return { ok: false, reason: 'no_credits' };
      }

      if (!isPremium) {
        const nextCredits = Math.max(0, credits - 1);
        setCredits(nextCredits);

        if (nextCredits === 0) {
          setTimeout(() => setPaywallVisible(true), 550);
        }
      }

      setRelationships((current) => ({
        ...current,
        [professionalId]: {
          status: 'pending',
          direction: 'outgoing',
          messages: [],
        },
      }));

      return { ok: true };
    },
    [credits, isPremium, relationships]
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
      if (relationships[professionalId]?.status === 'accepted') {
        setActiveChatId(professionalId);
      }
    },
    [relationships]
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

  const purchasePlan = useCallback((planId) => {
    if (planId === 'monthly') {
      setPlan('premium');
      return;
    }

    if (planId === 'credits') {
      setCredits((current) => current + 5);
    }
  }, []);

  const setPremium = useCallback((nextValue) => {
    setPlan(nextValue ? 'premium' : 'free');
  }, []);

  const resetDemo = useCallback(() => {
    setPlan('free');
    setCredits(INITIAL_CREDITS);
    setRelationships(createInitialRelationships());
    setActiveChatId(null);
    setPaywallVisible(false);
  }, []);

  const value = {
    currentUser: CURRENT_USER,
    plan,
    isPremium,
    credits,
    creditLabel: isPremium ? 'Unlimited' : `${credits} ${credits === 1 ? 'credit' : 'credits'}`,
    professionals,
    incomingRequests,
    outgoingRequests,
    connections,
    pendingCount: incomingRequests.length,
    locationLabel,
    locationStatus,
    isRefreshingLocation,
    refreshLocation,
    relationships,
    sendConnectionRequest,
    acceptRequest,
    declineRequest,
    openChat,
    closeChat,
    activeChatId,
    activeChat,
    sendMessage,
    isPaywallVisible,
    openPaywall,
    closePaywall,
    purchasePlan,
    setPremium,
    resetDemo,
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
