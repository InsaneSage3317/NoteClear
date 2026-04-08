package com.antigravity.agent;

import android.content.ComponentName;
import android.content.Intent;
import android.provider.Settings;
import android.text.TextUtils;
import android.util.Log;

import androidx.annotation.NonNull;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

/**
 * React Native bridge module that exposes NotificationListenerService
 * functionality to JavaScript.
 *
 * JS can call:
 *   - isPermissionGranted()   – check if notification access is granted
 *   - requestPermission()     – open Android notification access settings
 *   - dismissNotification(id) – dismiss a specific notification by key
 *   - dismissAll()            – dismiss all notifications
 *   - isServiceRunning()      – check if the service is active
 */
public class NotificationBridgeModule extends ReactContextBaseJavaModule {

    private static final String TAG = "AntigravityBridge";

    public NotificationBridgeModule(ReactApplicationContext context) {
        super(context);
    }

    @NonNull
    @Override
    public String getName() {
        return "NotificationBridge";
    }

    /**
     * Check if Notification Listener permission is granted.
     */
    @ReactMethod
    public void isPermissionGranted(Promise promise) {
        try {
            String enabledListeners = Settings.Secure.getString(
                getReactApplicationContext().getContentResolver(),
                "enabled_notification_listeners"
            );

            String packageName = getReactApplicationContext().getPackageName();
            boolean granted = !TextUtils.isEmpty(enabledListeners)
                && enabledListeners.contains(packageName);

            promise.resolve(granted);
        } catch (Exception e) {
            Log.e(TAG, "Error checking permission", e);
            promise.reject("PERMISSION_CHECK_ERROR", e.getMessage());
        }
    }

    /**
     * Open Android's Notification Listener Settings so the user can
     * grant our app notification access.
     */
    @ReactMethod
    public void requestPermission(Promise promise) {
        try {
            Intent intent = new Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getReactApplicationContext().startActivity(intent);
            promise.resolve(true);
        } catch (Exception e) {
            Log.e(TAG, "Error opening settings", e);
            promise.reject("OPEN_SETTINGS_ERROR", e.getMessage());
        }
    }

    /**
     * Dismiss a specific notification by its key.
     */
    @ReactMethod
    public void dismissNotification(String key, Promise promise) {
        try {
            NotificationListener.dismissNotification(key);
            promise.resolve(true);
        } catch (Exception e) {
            Log.e(TAG, "Error dismissing notification", e);
            promise.reject("DISMISS_ERROR", e.getMessage());
        }
    }

    /**
     * Dismiss all notifications.
     */
    @ReactMethod
    public void dismissAll(Promise promise) {
        try {
            NotificationListener.dismissAllNotifications();
            promise.resolve(true);
        } catch (Exception e) {
            Log.e(TAG, "Error dismissing all", e);
            promise.reject("DISMISS_ALL_ERROR", e.getMessage());
        }
    }

    /**
     * Check if the NotificationListenerService is running.
     */
    @ReactMethod
    public void isServiceRunning(Promise promise) {
        try {
            promise.resolve(NotificationListener.isServiceRunning());
        } catch (Exception e) {
            promise.reject("SERVICE_CHECK_ERROR", e.getMessage());
        }
    }
}
