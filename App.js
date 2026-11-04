import React from 'react';
import { ActivityIndicator, Modal, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppProvider, useApp } from './src/context/AppContext';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import AuthScreen from './src/screens/AuthScreen';
import ChatScreen from './src/screens/ChatScreen';
import ConnectionsScreen from './src/screens/ConnectionsScreen';
import DiscoveryScreen from './src/screens/DiscoveryScreen';
import ProfessionalProfileScreen from './src/screens/ProfessionalProfileScreen';
import SavedScreen from './src/screens/SavedScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import SubscriptionModal from './src/screens/SubscriptionModal';
import { COLORS, SHADOWS } from './src/theme';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const navigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: COLORS.primary,
    background: COLORS.background,
    card: COLORS.surface,
    text: COLORS.text,
    border: COLORS.border,
    notification: COLORS.danger,
  },
};

const TAB_ICONS = {
  Discover: ['compass', 'compass-outline'],
  Saved: ['bookmark', 'bookmark-outline'],
  Connections: ['chatbubbles', 'chatbubbles-outline'],
  Settings: ['settings', 'settings-outline'],
};

function Tabs() {
  const { pendingCount } = useApp();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => {
        const [activeIcon, inactiveIcon] = TAB_ICONS[route.name];

        return {
          headerShown: false,
          tabBarActiveTintColor: COLORS.primary,
          tabBarInactiveTintColor: COLORS.textSubtle,
          tabBarStyle: styles.tabBar,
          tabBarItemStyle: styles.tabBarItem,
          tabBarLabelStyle: styles.tabBarLabel,
          tabBarHideOnKeyboard: true,
          tabBarIcon: ({ color, focused, size }) => (
            <View style={[styles.tabIcon, focused && styles.tabIconActive]}>
              <Ionicons
                name={focused ? activeIcon : inactiveIcon}
                size={size - 2}
                color={color}
              />
            </View>
          ),
        };
      }}
    >
      <Tab.Screen name="Discover" component={DiscoveryScreen} />
      <Tab.Screen name="Saved" component={SavedScreen} />
      <Tab.Screen
        name="Connections"
        component={ConnectionsScreen}
        options={{
          tabBarBadge: pendingCount > 0 ? pendingCount : undefined,
          tabBarBadgeStyle: styles.badge,
        }}
      />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

function RootNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Main" component={Tabs} />
      <Stack.Screen
        name="ProfessionalProfile"
        component={ProfessionalProfileScreen}
        options={{ animation: 'slide_from_right' }}
      />
    </Stack.Navigator>
  );
}

function ChatOverlay() {
  const { activeChatId, closeChat } = useApp();

  return (
    <Modal
      visible={Boolean(activeChatId)}
      animationType="slide"
      statusBarTranslucent
      onRequestClose={closeChat}
    >
      <View style={styles.chatModal}>
        <ChatScreen key={activeChatId} />
      </View>
    </Modal>
  );
}

function AppShell() {
  return (
    <View style={styles.app}>
      <NavigationContainer theme={navigationTheme}>
        <RootNavigator />
      </NavigationContainer>
      <ChatOverlay />
      <SubscriptionModal />
    </View>
  );
}

function SessionSplash({ label }) {
  return (
    <View style={styles.splash}>
      <View style={styles.splashMark}>
        <Ionicons name="location" size={26} color={COLORS.surface} />
      </View>
      <Text style={styles.splashTitle}>Connect Local</Text>
      <Text style={styles.splashLabel}>{label}</Text>
      <ActivityIndicator color={COLORS.primary} style={styles.splashSpinner} />
    </View>
  );
}

function AppGate() {
  const { configured, loading, session, recoveryMode, profileLoading, profile } =
    useAuth();

  if (!configured) return <AppShell />;
  if (loading) return <SessionSplash label="Checking your session" />;
  if (!session || recoveryMode) return <AuthScreen />;
  if (profileLoading && !profile) {
    return <SessionSplash label="Loading your account" />;
  }

  return <AppShell />;
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <AppProvider>
          <StatusBar style="dark" />
          <AppGate />
        </AppProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  app: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  splash: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
    paddingHorizontal: 24,
  },
  splashMark: {
    width: 58,
    height: 58,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.floating,
  },
  splashTitle: {
    color: COLORS.text,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginTop: 16,
  },
  splashLabel: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '500',
    marginTop: 5,
  },
  splashSpinner: {
    marginTop: 18,
  },
  chatModal: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  tabBar: {
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 6,
    ...SHADOWS.soft,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 12,
  },
  tabBarItem: {
    paddingBottom: 4,
  },
  tabBarLabel: {
    fontSize: 9.5,
    fontWeight: '700',
    letterSpacing: 0.1,
  },
  tabIcon: {
    width: 38,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIconActive: {
    backgroundColor: COLORS.primarySoft,
  },
  badge: {
    backgroundColor: COLORS.danger,
    color: COLORS.surface,
    fontSize: 9,
    fontWeight: '800',
    minWidth: 17,
    height: 17,
    lineHeight: 16,
  },
});
