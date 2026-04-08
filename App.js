import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  StatusBar,
  AppState,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

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

const CLEANUP_INTERVAL_MS = 5000;
const AUTO_SPEED_MS = 3000;
const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

export default function App() {
  // ── State ──
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

  // ── Native notification listener ──
  const handleNativeNotification = useCallback((notif) => {
    if (mode === 'live') {
      processNotification(notif);
    }
  }, [mode]);

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
  const processNotification = useCallback((notif) => {
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
          setNotifications((curr) => curr.filter((n) => n.id !== processed.id));
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
  }, [mode, isNativeAvailable, nativeDismiss]);

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
  const handleDismiss = useCallback((id) => {
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
  }, [mode, isNativeAvailable, nativeDismiss]);

  // ── Clear all ──
  const clearAll = useCallback(() => {
    setNotifications([]);
    setAgentLogs([]);
    setStats({ total: 0, spamBlocked: 0, categorized: 0, expired: 0, byCategory: {} });
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
});
