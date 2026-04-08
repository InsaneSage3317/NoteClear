import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import theme from '../theme';

export default function Header({ isConnected, mode }) {
  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <View style={styles.logo}>
          <Text style={styles.logoEmoji}>🛸</Text>
        </View>
        <View style={styles.textBlock}>
          <Text style={styles.title}>Antigravity Agent</Text>
          <Text style={styles.subtitle}>
            Notification Intelligence System
          </Text>
        </View>
        <View style={[styles.badge, isConnected ? styles.badgeActive : styles.badgeDemo]}>
          <View style={[styles.dot, isConnected ? styles.dotActive : styles.dotDemo]} />
          <Text style={[styles.badgeText, isConnected ? styles.badgeTextActive : styles.badgeTextDemo]}>
            {mode === 'live' ? 'LIVE' : 'DEMO'}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    width: 46,
    height: 46,
    borderRadius: theme.radiusMd,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    overflow: 'hidden',
    backgroundColor: theme.purple,
  },
  logoEmoji: {
    fontSize: 24,
  },
  textBlock: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: theme.fontExtraBold,
    color: theme.textPrimary,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 12,
    color: theme.textSecondary,
    marginTop: 1,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: theme.radiusFull,
    gap: 6,
  },
  badgeActive: {
    backgroundColor: theme.emeraldDim,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
  },
  badgeDemo: {
    backgroundColor: theme.amberDim,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.25)',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dotActive: {
    backgroundColor: theme.emerald,
  },
  dotDemo: {
    backgroundColor: theme.amber,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: theme.fontBold,
    letterSpacing: 0.8,
  },
  badgeTextActive: {
    color: theme.emerald,
  },
  badgeTextDemo: {
    color: theme.amber,
  },
});
