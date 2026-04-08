// ─── Native Bridge Hook ──────────────────────────────────────
// JS wrapper around the native NotificationBridge module.
// Provides a clean React hook API + graceful fallback when
// running in Expo Go (where native modules aren't available).

import { useEffect, useRef, useState, useCallback } from 'react';
import { NativeModules, NativeEventEmitter, Platform } from 'react-native';

const { NotificationBridge } = NativeModules || {};

/**
 * Hook that connects to the native NotificationListenerService.
 *
 * Returns:
 *   - isAvailable:    boolean — true if native module exists (dev build)
 *   - isPermitted:    boolean — true if notification access granted
 *   - isConnected:    boolean — true if service is running
 *   - requestPermission: () => void — opens Android notification settings
 *   - dismissNotification: (key) => void — dismiss one notification
 *   - dismissAll: () => void — dismiss all
 *   - onNotification: callback ref — fired for each new notification
 */
export function useNotificationListener(onNotification) {
  const [isAvailable, setIsAvailable] = useState(false);
  const [isPermitted, setIsPermitted] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const callbackRef = useRef(onNotification);

  // Keep callback ref fresh
  useEffect(() => {
    callbackRef.current = onNotification;
  }, [onNotification]);

  // Check availability
  useEffect(() => {
    if (Platform.OS !== 'android' || !NotificationBridge) {
      setIsAvailable(false);
      return;
    }
    setIsAvailable(true);

    // Check permission
    NotificationBridge.isPermissionGranted()
      .then((granted) => setIsPermitted(granted))
      .catch(() => setIsPermitted(false));

    // Check service
    NotificationBridge.isServiceRunning()
      .then((running) => setIsConnected(running))
      .catch(() => setIsConnected(false));
  }, []);

  // Subscribe to native events
  useEffect(() => {
    if (!isAvailable || !isPermitted) return;

    const emitter = new NativeEventEmitter(NotificationBridge);

    const postSub = emitter.addListener('onNotificationPosted', (data) => {
      if (callbackRef.current) {
        callbackRef.current({
          id: data.id,
          packageName: data.packageName,
          title: data.title || '',
          body: data.body || '',
          sender: data.sender || 'Unknown',
          timestamp: data.timestamp || Date.now(),
          isOngoing: data.isOngoing || false,
          dismissed: false,
          category: null,
          processedAt: null,
        });
      }
    });

    // Periodic service check
    const interval = setInterval(() => {
      NotificationBridge.isServiceRunning()
        .then((running) => setIsConnected(running))
        .catch(() => setIsConnected(false));
    }, 10000);

    return () => {
      postSub.remove();
      clearInterval(interval);
    };
  }, [isAvailable, isPermitted]);

  const requestPermission = useCallback(() => {
    if (NotificationBridge) {
      NotificationBridge.requestPermission().catch(() => {});
    }
  }, []);

  const dismissNotification = useCallback((key) => {
    if (NotificationBridge) {
      NotificationBridge.dismissNotification(key).catch(() => {});
    }
  }, []);

  const dismissAll = useCallback(() => {
    if (NotificationBridge) {
      NotificationBridge.dismissAll().catch(() => {});
    }
  }, []);

  // Refresh permission status (call after returning from settings)
  const refreshPermission = useCallback(() => {
    if (NotificationBridge) {
      NotificationBridge.isPermissionGranted()
        .then((granted) => setIsPermitted(granted))
        .catch(() => {});
    }
  }, []);

  return {
    isAvailable,
    isPermitted,
    isConnected,
    requestPermission,
    refreshPermission,
    dismissNotification,
    dismissAll,
  };
}
