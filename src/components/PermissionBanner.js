import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking  } from 'react-native';
import theme from '../theme';

export default function PermissionBanner({ isNativeAvailable, isPermitted, onRequestPermission }) {
  if (!isNativeAvailable) {
    return (
      <View style={styles.container}>
        <View style={[styles.banner, styles.bannerDemo]}>
          <Text style={styles.bannerIcon}>🧪</Text>
          <View style={styles.bannerText}>
            <Text style={styles.bannerTitle}>Demo Mode Active</Text>
            <Text style={styles.bannerDesc}>
              Running in Expo Go — native notification access unavailable.
              Use the demo controls to simulate notifications.
            </Text>
          </View>
        </View>
        <View style={[styles.banner, styles.bannerInfo]}>
          <Text style={styles.bannerIcon}>📱</Text>
          <View style={styles.bannerText}>
            <Text style={styles.bannerTitle}>For Real Notifications</Text>
            <Text style={styles.bannerDesc}>
              Build a development build with:{'\n'}
              npx expo prebuild{'\n'}
              npx expo run:android
            </Text>
          </View>
        </View>
      </View>
    );
  }

  if (!isPermitted) {
    return (
      <View style={styles.container}>
        <TouchableOpacity style={[styles.banner, styles.bannerWarning]} onPress={onRequestPermission}>
          <Text style={styles.bannerIcon}>🔓</Text>
          <View style={styles.bannerText}>
            <Text style={[styles.bannerTitle, { color: theme.amber }]}>Permission Required</Text>
            <Text style={styles.bannerDesc}>
              Tap to open Android Settings and grant Notification Access
              to enable real notification management.
            </Text>
          </View>
          <Text style={styles.arrow}>→</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    gap: 8,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: theme.radiusMd,
    borderWidth: 1,
    gap: 12,
  },
  bannerDemo: {
    backgroundColor: theme.amberDim,
    borderColor: 'rgba(245, 158, 11, 0.2)',
  },
  bannerInfo: {
    backgroundColor: theme.purpleDim,
    borderColor: 'rgba(139, 92, 246, 0.2)',
  },
  bannerWarning: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  bannerIcon: {
    fontSize: 22,
  },
  bannerText: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 13,
    fontWeight: theme.fontBold,
    color: theme.textPrimary,
    marginBottom: 3,
  },
  bannerDesc: {
    fontSize: 11,
    color: theme.textSecondary,
    lineHeight: 16,
  },
  arrow: {
    fontSize: 18,
    color: theme.amber,
    fontWeight: theme.fontBold,
  },
});
