import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  AppState,
  Platform,
  TouchableOpacity,
  Clipboard,
  Alert,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';

import Header from './src/components/Header';
import StatsPanel from './src/components/StatsPanel';
import AgentPanel from './src/components/AgentPanel';
import ControlBar from './src/components/ControlBar';
import NotificationList from './src/components/NotificationList';
import AgentLog from './src/components/AgentLog';
import PermissionBanner from './src/components/PermissionBanner';

import {
  orchestrate,
  agentC_findExpired,
  resetSpamTracker,
} from './src/agentEngine';
import { generateNotification, generateBatch } from './src/notificationGenerator';
import { useNotificationListener } from './src/useNotificationListener';
import theme from './src/theme';

// ─── Expo Notifications: Foreground Handler ────────────────────
// This runs when a push notification arrives while the app is in the foreground.
// Setting all to true means the notification will show as a banner even in-app.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// ─── Constants ─────────────────────────────────────────────────
const CLEANUP_INTERVAL_MS = 5000;
const AUTO_SPEED_MS = 3000;
const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

// ─── Helper: Register for Push Notifications ──────────────────
// Handles permission checks, Android channel creation, and token retrieval.
async function registerForPushNotificationsAsync() {
  // Push notifications only work on physical devices
  if (!Device.isDevice) {
    Alert.alert(
      'Physical Device Required',
      'Push notifications require a physical device. They will not work on an emulator/simulator.'
    );
    return null;
  }

  // ── Android: Create a high-priority notification channel ──
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      description: 'Default notification channel for Antigravity Agent',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#8b5cf6', // match theme.purple
      sound: 'default',
      enableLights: true,
      enableVibrate: true,
      showBadge: true,
    });
  }

  // ── Check existing permissions ──
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  // ── Request permissions if not already granted ──
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    Alert.alert(
      'Permission Denied',
      'Notification permissions were not granted. You can enable them in your device settings.'
    );
    return null;
  }

  // ── Get the Expo Push Token ──
  // projectId comes from app.json > extra > eas > projectId
  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId;

  if (!projectId) {
    Alert.alert(
      'Configuration Error',
      'No EAS projectId found. Make sure app.json contains extra.eas.projectId.'
    );
    return null;
  }

  try {
    const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
    return tokenData.data; // e.g., "ExponentPushToken[xxxxxxx]"
  } catch (error) {
    Alert.alert('Token Error', `Failed to get push token: ${error.message}`);
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════
//  App Component
// ═══════════════════════════════════════════════════════════════
export default function App() {
  // ── Expo Push Notification State ──
  const [expoPushToken, setExpoPushToken] = useState('');
  const [lastNotification, setLastNotification] = useState(null);
  const [tokenCopied, setTokenCopied] = useState(false);

  // Refs for notification listener subscriptions
  const notificationListener = useRef(null);
  const responseListener = useRef(null);

  // ── Existing Antigravity State ──
  const [notifications, setNotifications] = useState([]);
  const [agentLogs, setAgentLogs] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    spamBlocked: 0,
    categorized: 0,
    expired: 0,
    byCategory: {},
  });
  const [autoMode, setAutoMode] = useState(false);
  const [agentCRunning, setAgentCRunning] = useState(false);
  const [mode, setMode] = useState('demo'); // 'demo' or 'live'

  const autoRef = useRef(null);
  const cleanupRef = useRef(null);

  // ─── Expo Push Notification Setup ───────────────────────────
  useEffect(() => {
    // 1. Register and get the push token
    registerForPushNotificationsAsync().then((token) => {
      if (token) {
        setExpoPushToken(token);
        console.log('📱 Expo Push Token:', token);
      }
    });

    // 2. Listener: fires when a notification is RECEIVED while app is foregrounded
    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        console.log('🔔 Notification received (foreground):', notification);
        setLastNotification(notification);
      });

    // 3. Listener: fires when the user TAPS a notification (foreground, background, or killed)
    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        const data = response.notification.request.content.data;
        console.log('👆 Notification tapped:', data);
        setLastNotification(response.notification);

        // You can add navigation or deep-link logic here based on `data`
      });

    // Cleanup subscriptions on unmount
    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(
          notificationListener.current
        );
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, []);

  // ── Copy token to clipboard ──
  const copyToken = useCallback(() => {
    if (expoPushToken) {
      Clipboard.setString(expoPushToken);
      setTokenCopied(true);
      setTimeout(() => setTokenCopied(false), 2000);
    }
  }, [expoPushToken]);

  // ── Native notification listener (existing system) ──
  const handleNativeNotification = useCallback(
    (notif) => {
      if (mode === 'live') {
        processNotification(notif);
      }
    },
    [mode]
  );

  const {
    isAvailable: isNativeAvailable,
    isPermitted,
    isConnected,
    requestPermission,
    refreshPermission,
    dismissNotification: nativeDismiss,
    dismissAll: nativeDismissAll,
  } = useNotificationListener(handleNativeNotification);

  // Refresh permission when app comes to foreground
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        refreshPermission();
      }
    });
    return () => sub.remove();
  }, [refreshPermission]);

  // ── Process a notification through the orchestrator ──
  const processNotification = useCallback(
    (notif) => {
      const { notification: processed, log } = orchestrate(notif);

      const timestampedLog = log.map((l) => ({
        ...l,
        ts: Date.now(),
        notifId: processed.id,
        notifTitle: notif.title,
        sender: notif.sender,
      }));

      setAgentLogs((prev) => [...timestampedLog, ...prev].slice(0, 200));

      setNotifications((prev) => {
        if (processed.dismissed) {
          // Spam → dismiss from native notification bar too
          if (mode === 'live' && isNativeAvailable) {
            nativeDismiss(processed.id);
          }
          // Briefly show then remove
          const updated = [processed, ...prev];
          setTimeout(() => {
            setNotifications((curr) =>
              curr.filter((n) => n.id !== processed.id)
            );
          }, 2000);
          return updated;
        }
        return [processed, ...prev];
      });

      setStats((prev) => {
        const cat = processed.category;
        return {
          total: prev.total + 1,
          spamBlocked: prev.spamBlocked + (processed.dismissed ? 1 : 0),
          categorized: prev.categorized + (!processed.dismissed ? 1 : 0),
          expired: prev.expired,
          byCategory: {
            ...prev.byCategory,
            [cat]: (prev.byCategory[cat] || 0) + 1,
          },
        };
      });
    },
    [mode, isNativeAvailable, nativeDismiss]
  );

  // ── Add single demo notification ──
  const addNotification = useCallback(() => {
    const notif = generateNotification(false);
    processNotification(notif);
  }, [processNotification]);

  // ── Add batch ──
  const addBatch = useCallback(() => {
    const batch = generateBatch(5, true);
    batch.forEach((n, i) => {
      setTimeout(() => processNotification(n), i * 400);
    });
  }, [processNotification]);

  // ── Auto mode timer ──
  useEffect(() => {
    if (autoMode && mode === 'demo') {
      autoRef.current = setInterval(() => {
        const notif = generateNotification(Math.random() < 0.15);
        processNotification(notif);
      }, AUTO_SPEED_MS);
    }
    return () => clearInterval(autoRef.current);
  }, [autoMode, mode, processNotification]);

  // ── Agent C: cleanup loop ──
  useEffect(() => {
    cleanupRef.current = setInterval(() => {
      setNotifications((prev) => {
        const expiredIds = agentC_findExpired(prev, TWENTY_FOUR_HOURS_MS);
        if (expiredIds.length > 0) {
          setAgentCRunning(true);
          setTimeout(() => setAgentCRunning(false), 2000);

          const logEntries = expiredIds.map((id) => {
            const n = prev.find((x) => x.id === id);
            return {
              agent: 'C',
              agentName: 'Auto-Cleanup',
              action: 'EXPIRED',
              detail: `"${n?.title}" — older than 24 hours`,
              durationMs: 0,
              ts: Date.now(),
              notifId: id,
              notifTitle: n?.title || 'Unknown',
              sender: n?.sender || 'Unknown',
            };
          });

          setAgentLogs((prev2) => [...logEntries, ...prev2].slice(0, 200));
          setStats((prev2) => ({
            ...prev2,
            expired: prev2.expired + expiredIds.length,
          }));

          // Dismiss from native bar too
          if (mode === 'live' && isNativeAvailable) {
            expiredIds.forEach((id) => nativeDismiss(id));
          }

          return prev.map((n) =>
            expiredIds.includes(n.id)
              ? { ...n, dismissed: true, dismissedBy: 'Agent C' }
              : n
          );
        }
        return prev;
      });
    }, CLEANUP_INTERVAL_MS);
    return () => clearInterval(cleanupRef.current);
  }, [mode, isNativeAvailable, nativeDismiss]);

  // ── Manual dismiss ──
  const handleDismiss = useCallback(
    (id) => {
      if (mode === 'live' && isNativeAvailable) {
        nativeDismiss(id);
      }
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === id ? { ...n, dismissed: true, dismissedBy: 'User' } : n
        )
      );
      setTimeout(() => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
      }, 500);
    },
    [mode, isNativeAvailable, nativeDismiss]
  );

  // ── Clear all ──
  const clearAll = useCallback(() => {
    setNotifications([]);
    setAgentLogs([]);
    setStats({
      total: 0,
      spamBlocked: 0,
      categorized: 0,
      expired: 0,
      byCategory: {},
    });
    resetSpamTracker();
  }, []);

  // ── Toggle mode ──
  const toggleMode = useCallback(() => {
    setMode((prev) => (prev === 'demo' ? 'live' : 'demo'));
    setAutoMode(false);
  }, []);

  const activeNotifs = notifications.filter((n) => !n.dismissed);
  const dismissedNotifs = notifications.filter((n) => n.dismissed);

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" backgroundColor={theme.bgPrimary} />
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Header
            isConnected={mode === 'live' && isConnected}
            mode={mode}
          />

          {/* ── Expo Push Token Display ── */}
          <View style={styles.tokenContainer}>
            <View style={styles.tokenHeader}>
              <Text style={styles.tokenLabel}>📡 Expo Push Token</Text>
              {expoPushToken ? (
                <TouchableOpacity
                  style={styles.copyButton}
                  onPress={copyToken}
                  activeOpacity={0.7}
                >
                  <Text style={styles.copyButtonText}>
                    {tokenCopied ? '✓ Copied!' : '📋 Copy'}
                  </Text>
                </TouchableOpacity>
              ) : null}
            </View>
            <Text
              style={[
                styles.tokenValue,
                !expoPushToken && styles.tokenPlaceholder,
              ]}
              selectable={true}
              numberOfLines={2}
            >
              {expoPushToken || 'Requesting token…'}
            </Text>

            {/* Show last received push notification info */}
            {lastNotification && (
              <View style={styles.lastNotifContainer}>
                <Text style={styles.lastNotifLabel}>
                  🔔 Last Push Notification:
                </Text>
                <Text style={styles.lastNotifText} numberOfLines={2}>
                  {lastNotification.request.content.title || 'No title'} —{' '}
                  {lastNotification.request.content.body || 'No body'}
                </Text>
              </View>
            )}
          </View>

          <PermissionBanner
            isNativeAvailable={isNativeAvailable}
            isPermitted={isPermitted}
            onRequestPermission={requestPermission}
          />

          <View style={styles.spacer} />

          <StatsPanel stats={stats} activeCount={activeNotifs.length} />

          <View style={styles.spacer} />

          <AgentPanel stats={stats} agentCRunning={agentCRunning} />

          <View style={styles.spacer} />

          <ControlBar
            onAdd={addNotification}
            onBatch={addBatch}
            autoMode={autoMode}
            onToggleAuto={() => setAutoMode((p) => !p)}
            onClear={clearAll}
            mode={mode}
            onToggleMode={toggleMode}
            isNativeAvailable={isNativeAvailable}
            isPermitted={isPermitted}
            onRequestPermission={requestPermission}
          />

          <View style={styles.spacer} />

          <NotificationList
            notifications={activeNotifs}
            dismissed={dismissedNotifs}
            onDismiss={handleDismiss}
          />

          <View style={styles.spacer} />

          <AgentLog logs={agentLogs} />

          <View style={styles.bottomPad} />
        </ScrollView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

// ═══════════════════════════════════════════════════════════════
//  Styles
// ═══════════════════════════════════════════════════════════════
const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: theme.bgPrimary,
  },
  scroll: {
    flex: 1,
    backgroundColor: theme.bgPrimary,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  spacer: {
    height: 16,
  },
  bottomPad: {
    height: 30,
  },

  // ── Token Card ──
  tokenContainer: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 12,
    padding: 16,
    borderRadius: theme.radiusMd,
    backgroundColor: theme.bgCard,
    borderWidth: 1,
    borderColor: theme.borderGlow,
  },
  tokenHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  tokenLabel: {
    fontSize: 13,
    fontWeight: theme.fontBold,
    color: theme.purple,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  copyButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.radiusSm,
    backgroundColor: theme.purpleDim,
    borderWidth: 1,
    borderColor: theme.borderGlow,
  },
  copyButtonText: {
    fontSize: 12,
    fontWeight: theme.fontSemiBold,
    color: theme.purple,
  },
  tokenValue: {
    fontSize: 12,
    fontWeight: theme.fontMedium,
    color: theme.textPrimary,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    lineHeight: 20,
    backgroundColor: theme.bgTertiary,
    padding: 10,
    borderRadius: theme.radiusSm,
    overflow: 'hidden',
  },
  tokenPlaceholder: {
    color: theme.textMuted,
    fontStyle: 'italic',
  },

  // ── Last Notification Display ──
  lastNotifContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: theme.borderSubtle,
  },
  lastNotifLabel: {
    fontSize: 11,
    fontWeight: theme.fontSemiBold,
    color: theme.cyan,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  lastNotifText: {
    fontSize: 12,
    color: theme.textSecondary,
    lineHeight: 18,
  },
});
