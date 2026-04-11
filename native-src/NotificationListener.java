package com.antigravity.agent;

import android.service.notification.NotificationListenerService;
import android.service.notification.StatusBarNotification;
import android.app.Notification;
import android.os.Bundle;
import android.util.Log;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import com.facebook.react.ReactApplication;
import com.facebook.react.ReactInstanceManager;
import com.facebook.react.bridge.ReactContext;

/**
 * Android NotificationListenerService that intercepts ALL notifications
 * posted to the system notification bar and forwards them to React Native
 * via the DeviceEventEmitter.
 *
 * The user must grant "Notification Access" in Settings for this to work.
 */
public class NotificationListener extends NotificationListenerService {

    private static final String TAG = "AntigravityNLS";
    private static NotificationListener instance;

    @Override
    public void onCreate() {
        super.onCreate();
        instance = this;
        Log.d(TAG, "NotificationListenerService created");
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        instance = null;
        Log.d(TAG, "NotificationListenerService destroyed");
    }

    /**
     * Called when a new notification is posted to the notification bar.
     */
    @Override
    public void onNotificationPosted(StatusBarNotification sbn) {
        if (sbn == null) return;

        try {
            Notification notification = sbn.getNotification();
            Bundle extras = notification.extras;

            String packageName = sbn.getPackageName();
            String key = sbn.getKey();
            String title = "";
            String body = "";
            String sender = "";
            long postTime = sbn.getPostTime();

            if (extras != null) {
                CharSequence titleCs = extras.getCharSequence(Notification.EXTRA_TITLE);
                CharSequence textCs = extras.getCharSequence(Notification.EXTRA_TEXT);
                CharSequence subTextCs = extras.getCharSequence(Notification.EXTRA_SUB_TEXT);

                title = titleCs != null ? titleCs.toString() : "";
                body = textCs != null ? textCs.toString() : "";
                sender = subTextCs != null ? subTextCs.toString() : getAppName(packageName);
            }

            // Build the event payload
            WritableMap params = Arguments.createMap();
            params.putString("id", key);
            params.putString("packageName", packageName);
            params.putString("title", title);
            params.putString("body", body);
            params.putString("sender", sender.isEmpty() ? getAppName(packageName) : sender);
            params.putDouble("timestamp", (double) postTime);
            params.putBoolean("isOngoing", sbn.isOngoing());

            // Send to React Native
            sendEvent("onNotificationPosted", params);

            Log.d(TAG, "Notification posted: " + packageName + " - " + title);
        } catch (Exception e) {
            Log.e(TAG, "Error processing notification", e);
        }
    }

    /**
     * Called when a notification is removed from the notification bar.
     */
    @Override
    public void onNotificationRemoved(StatusBarNotification sbn) {
        if (sbn == null) return;

        try {
            WritableMap params = Arguments.createMap();
            params.putString("id", sbn.getKey());
            params.putString("packageName", sbn.getPackageName());

            sendEvent("onNotificationRemoved", params);

            Log.d(TAG, "Notification removed: " + sbn.getPackageName());
        } catch (Exception e) {
            Log.e(TAG, "Error processing notification removal", e);
        }
    }

    /**
     * Dismiss a notification by its key from the notification bar.
     */
    public static void dismissNotification(String key) {
        if (instance != null) {
            try {
                instance.cancelNotification(key);
                Log.d(TAG, "Dismissed notification: " + key);
            } catch (Exception e) {
                Log.e(TAG, "Error dismissing notification: " + key, e);
            }
        }
    }

    /**
     * Dismiss all notifications from the notification bar.
     */
    public static void dismissAllNotifications() {
        if (instance != null) {
            try {
                instance.cancelAllNotifications();
                Log.d(TAG, "Dismissed all notifications");
            } catch (Exception e) {
                Log.e(TAG, "Error dismissing all notifications", e);
            }
        }
    }

    /**
     * Check if the service is currently connected / running.
     */
    public static boolean isServiceRunning() {
        return instance != null;
    }

    private void sendEvent(String eventName, WritableMap params) {
        try {
            android.content.Intent intent = new android.content.Intent("com.antigravity.agent.NOTIFICATION_EVENT");
            intent.putExtra("eventName", eventName);
            Bundle bundle = Arguments.toBundle(params);
            intent.putExtras(bundle);
            sendBroadcast(intent);
        } catch (Exception e) {
            Log.e(TAG, "Error broadcasting intent: " + eventName, e);
        }
    }

    /**
     * Convert a package name to a human-readable app name.
     */
    private String getAppName(String packageName) {
        try {
            return getPackageManager()
                .getApplicationLabel(
                    getPackageManager().getApplicationInfo(packageName, 0)
                ).toString();
        } catch (Exception e) {
            // Fallback: use last part of package name
            String[] parts = packageName.split("\\.");
            return parts[parts.length - 1];
        }
    }
}
