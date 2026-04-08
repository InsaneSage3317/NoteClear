import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import NotificationCard from './NotificationCard';
import { getCategoryMeta } from '../agentEngine';
import theme from '../theme';

function CategoryChips({ notifications }) {
  const counts = {};
  notifications.forEach((n) => {
    const cat = n.category || 'general';
    counts[cat] = (counts[cat] || 0) + 1;
  });

  const chips = Object.entries(counts);
  if (chips.length === 0) return null;

  return (
    <View style={styles.chipsRow}>
      {chips.map(([cat, count]) => {
        const meta = getCategoryMeta(cat);
        return (
          <View key={cat} style={[styles.chip, { borderColor: meta.color + '30' }]}>
            <Text style={[styles.chipText, { color: meta.color }]}>
              {meta.emoji} {meta.label}
            </Text>
            <View style={[styles.chipCount, { backgroundColor: meta.color + '18' }]}>
              <Text style={[styles.chipCountText, { color: meta.color }]}>{count}</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

export default function NotificationList({ notifications, dismissed, onDismiss }) {
  const renderItem = ({ item, index }) => (
    <NotificationCard
      notification={item}
      onDismiss={onDismiss}
      index={index}
    />
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerIcon}>🔔</Text>
        <Text style={styles.headerTitle}>NOTIFICATION BAR</Text>
      </View>

      <View style={styles.body}>
        {notifications.length > 0 && (
          <CategoryChips notifications={notifications} />
        )}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>ACTIVE</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{notifications.length}</Text>
          </View>
        </View>

        {notifications.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🔕</Text>
            <Text style={styles.emptyText}>No active notifications</Text>
            <Text style={styles.emptyHint}>
              Tap Add or enable Auto to begin
            </Text>
          </View>
        ) : (
          <FlatList
            data={notifications}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
          />
        )}

        {dismissed.length > 0 && (
          <>
            <View style={[styles.sectionHeader, { marginTop: 20 }]}>
              <Text style={styles.sectionTitle}>DISMISSED</Text>
              <View style={[styles.countBadge, { backgroundColor: theme.roseDim }]}>
                <Text style={[styles.countText, { color: theme.rose }]}>{dismissed.length}</Text>
              </View>
            </View>
            {dismissed.slice(0, 3).map((n, i) => (
              <NotificationCard
                key={n.id}
                notification={n}
                onDismiss={onDismiss}
                index={i}
              />
            ))}
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    borderRadius: theme.radiusLg,
    backgroundColor: theme.bgCard,
    borderWidth: 1,
    borderColor: theme.borderSubtle,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.borderSubtle,
  },
  headerIcon: { fontSize: 14 },
  headerTitle: {
    fontSize: 11,
    fontWeight: theme.fontBold,
    color: theme.textSecondary,
    letterSpacing: 1,
  },
  body: {
    padding: 14,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 14,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: theme.radiusFull,
    borderWidth: 1,
    borderColor: theme.borderSubtle,
    backgroundColor: theme.bgTertiary,
    gap: 4,
  },
  chipText: {
    fontSize: 9,
    fontWeight: theme.fontBold,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  chipCount: {
    paddingHorizontal: 4,
    paddingVertical: 0,
    borderRadius: 4,
  },
  chipCountText: {
    fontSize: 9,
    fontWeight: theme.fontBold,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: theme.fontBold,
    color: theme.textMuted,
    letterSpacing: 1,
  },
  countBadge: {
    paddingHorizontal: 7,
    paddingVertical: 1,
    borderRadius: theme.radiusFull,
    backgroundColor: theme.purpleDim,
  },
  countText: {
    fontSize: 10,
    fontWeight: theme.fontBold,
    color: theme.purple,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyIcon: {
    fontSize: 36,
    marginBottom: 10,
    opacity: 0.5,
  },
  emptyText: {
    fontSize: 14,
    color: theme.textMuted,
    fontWeight: theme.fontSemiBold,
  },
  emptyHint: {
    fontSize: 12,
    color: theme.textMuted,
    marginTop: 4,
  },
});
