import React from 'react';
import { Modal, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppProvider, useApp } from './src/context/AppContext';
import ConnectionsScreen from './src/screens/ConnectionsScreen';
import ChatScreen from './src/screens/ChatScreen';
import DiscoveryScreen from './src/screens/DiscoveryScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import SubscriptionModal from './src/screens/SubscriptionModal';
import { COLORS, SHADOWS } from './src/theme';

const Tab = createBottomTabNavigator();

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

function DiscoverIcon({ color }) {
  return (
    <View style={styles.iconCanvas}>
      <View style={[styles.searchCircle, { borderColor: color }]} />
      <View style={[styles.searchHandle, { backgroundColor: color }]} />
    </View>
  );
}

function ConnectionsIcon({ color }) {
  return (
    <View style={styles.iconCanvas}>
      <View style={[styles.personHead, { backgroundColor: color, left: 3 }]} />
      <View style={[styles.personBody, { backgroundColor: color, left: 1 }]} />
      <View
        style={[styles.personHead, { backgroundColor: color, left: 13, opacity: 0.5 }]}
      />
      <View
        style={[styles.personBody, { backgroundColor: color, left: 11, opacity: 0.5 }]}
      />
    </View>
  );
}

function SettingsIcon({ color }) {
  const knobPositions = [1, 11, 6];

  return (
    <View style={styles.slidersIcon}>
      {knobPositions.map((left, index) => (
        <View key={index} style={styles.sliderTrack}>
          <View style={[styles.sliderLine, { backgroundColor: color }]} />
          <View style={[styles.sliderKnob, { backgroundColor: color, left }]} />
        </View>
      ))}
    </View>
  );
}

function TabIcon({ name, color, focused }) {
  return (
    <View style={[styles.tabIconBubble, focused && styles.tabIconBubbleActive]}>
      {name === 'Discover' ? <DiscoverIcon color={color} /> : null}
      {name === 'Connections' ? <ConnectionsIcon color={color} /> : null}
      {name === 'Settings' ? <SettingsIcon color={color} /> : null}
    </View>
  );
}

function Tabs() {
  const { pendingCount } = useApp();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textSubtle,
        tabBarStyle: styles.tabBar,
        tabBarItemStyle: styles.tabBarItem,
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarHideOnKeyboard: true,
        tabBarIcon: ({ color, focused }) => (
          <TabIcon name={route.name} color={color} focused={focused} />
        ),
      })}
    >
      <Tab.Screen name="Discover" component={DiscoveryScreen} />
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
        <Tabs />
      </NavigationContainer>
      <ChatOverlay />
      <SubscriptionModal />
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <StatusBar style="dark" />
        <AppShell />
      </AppProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  app: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  chatModal: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  tabBar: {
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 7,
    ...SHADOWS.soft,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 12,
  },
  tabBarItem: {
    paddingBottom: 3,
  },
  tabBarLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.1,
  },
  tabIconBubble: {
    width: 38,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIconBubbleActive: {
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
  iconCanvas: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchCircle: {
    position: 'absolute',
    top: 3,
    left: 3,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
  },
  searchHandle: {
    position: 'absolute',
    top: 15,
    left: 16,
    width: 2,
    height: 7,
    borderRadius: 1,
    transform: [{ rotate: '-45deg' }],
  },
  personHead: {
    position: 'absolute',
    top: 3,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  personBody: {
    position: 'absolute',
    bottom: 3,
    width: 13,
    height: 8,
    borderTopLeftRadius: 7,
    borderTopRightRadius: 7,
  },
  slidersIcon: {
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  sliderTrack: {
    width: 22,
    height: 5,
    justifyContent: 'center',
  },
  sliderLine: {
    width: 22,
    height: 2,
    borderRadius: 1,
    opacity: 0.75,
  },
  sliderKnob: {
    position: 'absolute',
    top: 0,
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
});
