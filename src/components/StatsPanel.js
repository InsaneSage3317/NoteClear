import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import theme from '../theme';

function StatCard({ value, label, accentColor, bgColor }) {
  return (
    <View style={[styles.card, { borderLeftColor: accentColor }]}>
      <Text style={[styles.value, { color: accentColor }]}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

export default function StatsPanel({ stats, activeCount }) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerIcon}>📊</Text>
        <Text style={styles.headerTitle}>DASHBOARD</Text>
      </View>
      <View style={styles.grid}>
        <StatCard value={stats.total} label="Processed" accentColor={theme.purple} />
        <StatCard value={stats.spamBlocked} label="Spam Blocked" accentColor={theme.rose} />
        <StatCard value={activeCount} label="Active" accentColor={theme.emerald} />
        <StatCard value={stats.expired} label="Expired" accentColor={theme.amber} />
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
  headerIcon: {
    fontSize: 14,
  },
  headerTitle: {
    fontSize: 11,
    fontWeight: theme.fontBold,
    color: theme.textSecondary,
    letterSpacing: 1,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 12,
    gap: 10,
  },
  card: {
    width: '47%',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: theme.radiusMd,
    backgroundColor: theme.bgTertiary,
    borderWidth: 1,
    borderColor: theme.borderSubtle,
    borderLeftWidth: 3,
  },
  value: {
    fontSize: 26,
    fontWeight: theme.fontExtraBold,
    lineHeight: 30,
  },
  label: {
    fontSize: 10,
    fontWeight: theme.fontSemiBold,
    color: theme.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginTop: 3,
  },
});
