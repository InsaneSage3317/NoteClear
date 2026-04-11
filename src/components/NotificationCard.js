import React, { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { getCategoryMeta, CATEGORIES } from '../agentEngine';
import theme from '../theme';

function timeAgo(timestamp) {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function getCategoryBorderColor(cat) {
  const meta = getCategoryMeta(cat);
  return meta.color;
}

export default function NotificationCard({ notification, onDismiss, onUnspam, index = 0 }) {
  const cat = notification.category || CATEGORIES.GENERAL;
  const meta = getCategoryMeta(cat);
  const isDismissed = notification.dismissed;

  const slideAnim = useRef(new Animated.Value(50)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 350,
        delay: index * 60,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: isDismissed ? 0.4 : 1,
        duration: 350,
        delay: index * 60,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Animate out when dismissed
  useEffect(() => {
    if (isDismissed) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -30,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0.3,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isDismissed]);

  return (
    <Animated.View
      style={[
        styles.card,
        {
          transform: [{ translateX: slideAnim }],
          opacity: opacityAnim,
          borderLeftColor: getCategoryBorderColor(cat),
        },
      ]}
    >
      <View style={[styles.icon, { backgroundColor: meta.color + '20' }]}>
        <Text style={styles.iconEmoji}>{meta.emoji}</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.topRow}>
          <Text style={styles.sender} numberOfLines={1}>{notification.sender}</Text>
          <View style={[styles.catBadge, { backgroundColor: meta.color + '18', borderColor: meta.color + '30' }]}>
            <Text style={[styles.catBadgeText, { color: meta.color }]}>{meta.label}</Text>
          </View>
        </View>

        <Text style={styles.title} numberOfLines={1}>{notification.title}</Text>
        <Text style={styles.body} numberOfLines={2}>{notification.body}</Text>

        <View style={styles.metaRow}>
          <Text style={styles.time}>{timeAgo(notification.timestamp)}</Text>

          {isDismissed && notification.dismissedBy && (
            <>
              <View style={[styles.dismissBadge]}>
                <Text style={styles.dismissBadgeText}>
                  {notification.dismissedBy === 'Agent A' ? '🚫 Spam' :
                   notification.dismissedBy === 'Agent C' ? '⏰ Expired' : '✕ Dismissed'}
                </Text>
              </View>
              {notification.dismissedBy === 'Agent A' && onUnspam && (
                <TouchableOpacity style={styles.unspamBtn} onPress={() => onUnspam(notification)}>
                  <Text style={styles.unspamBtnText}>📥 Unspam</Text>
                </TouchableOpacity>
              )}
            </>
          )}

          {notification.confidence && !isDismissed && (
            <Text style={[styles.confidence, { color: meta.color }]}>
              {(notification.confidence * 100).toFixed(0)}%
            </Text>
          )}
        </View>
      </View>

      {!isDismissed && (
        <TouchableOpacity style={styles.dismissBtn} onPress={() => onDismiss(notification.id)}>
          <Text style={styles.dismissBtnText}>✕</Text>
        </TouchableOpacity>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    borderRadius: theme.radiusMd,
    backgroundColor: theme.bgTertiary,
    borderWidth: 1,
    borderColor: theme.borderSubtle,
    borderLeftWidth: 3,
    gap: 10,
    marginBottom: 8,
  },
  icon: {
    width: 36,
    height: 36,
    borderRadius: theme.radiusSm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconEmoji: {
    fontSize: 16,
  },
  content: {
    flex: 1,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  sender: {
    fontSize: 12,
    fontWeight: theme.fontBold,
    color: theme.textPrimary,
    maxWidth: '60%',
  },
  catBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: theme.radiusFull,
    borderWidth: 1,
  },
  catBadgeText: {
    fontSize: 8,
    fontWeight: theme.fontBold,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  title: {
    fontSize: 13,
    fontWeight: theme.fontSemiBold,
    color: theme.textPrimary,
    marginBottom: 2,
  },
  body: {
    fontSize: 11.5,
    color: theme.textSecondary,
    lineHeight: 16,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  time: {
    fontSize: 10,
    color: theme.textMuted,
  },
  confidence: {
    fontSize: 10,
    fontWeight: theme.fontSemiBold,
  },
  dismissBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: theme.radiusFull,
    backgroundColor: theme.roseDim,
  },
  dismissBadgeText: {
    fontSize: 9,
    fontWeight: theme.fontBold,
    color: theme.rose,
  },
  unspamBtn: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: theme.radiusFull,
    backgroundColor: theme.emeraldDim,
  },
  unspamBtnText: {
    fontSize: 9,
    fontWeight: theme.fontBold,
    color: theme.emerald,
  },
  dismissBtn: {
    width: 28,
    height: 28,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: theme.borderSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dismissBtnText: {
    fontSize: 13,
    color: theme.textMuted,
  },
});
