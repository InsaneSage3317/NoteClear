import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import theme from '../theme';

function AgentCard({ letter, name, desc, agentTheme, isActive, isScanning }) {
  return (
    <View style={[styles.card, isActive && { borderColor: agentTheme.border }]}>
      <View style={[styles.avatar, { backgroundColor: agentTheme.bg, borderColor: agentTheme.border }]}>
        <Text style={[styles.avatarText, { color: agentTheme.color }]}>{letter}</Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.desc} numberOfLines={1}>{desc}</Text>
      </View>
      <View style={[
        styles.status,
        isActive ? styles.statusActive : styles.statusIdle,
        isScanning && { backgroundColor: theme.amberDim, borderColor: 'rgba(245, 158, 11, 0.25)' },
      ]}>
        {isScanning && <ActivityIndicator size={10} color={theme.amber} style={{ marginRight: 4 }} />}
        <Text style={[
          styles.statusText,
          isActive && styles.statusTextActive,
          isScanning && { color: theme.amber },
        ]}>
          {isScanning ? 'SCAN' : (isActive ? 'ACTIVE' : 'IDLE')}
        </Text>
      </View>
    </View>
  );
}

export default function AgentPanel({ stats, agentCRunning }) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerIcon}>🤖</Text>
        <Text style={styles.headerTitle}>SUB-AGENTS</Text>
      </View>
      <View style={styles.list}>
        <AgentCard
          letter="A"
          name="Spam Filter"
          desc="Detects spam keywords & repeated unknown senders"
          agentTheme={theme.agentA}
          isActive={stats.spamBlocked > 0}
        />
        <AgentCard
          letter="B"
          name="Categorizer"
          desc="Classifies into transaction, personal, work, social"
          agentTheme={theme.agentB}
          isActive={stats.categorized > 0}
        />
        <AgentCard
          letter="C"
          name="Auto-Cleanup"
          desc="Dismisses notifications older than 24 hours"
          agentTheme={theme.agentC}
          isActive={agentCRunning}
          isScanning={agentCRunning}
        />
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
  list: {
    padding: 12,
    gap: 8,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: theme.radiusMd,
    backgroundColor: theme.bgTertiary,
    borderWidth: 1,
    borderColor: theme.borderSubtle,
    gap: 10,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: theme.radiusSm,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  avatarText: {
    fontSize: 15,
    fontWeight: theme.fontBold,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 13,
    fontWeight: theme.fontBold,
    color: theme.textPrimary,
  },
  desc: {
    fontSize: 11,
    color: theme.textMuted,
    marginTop: 1,
  },
  status: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: theme.radiusFull,
    borderWidth: 1,
  },
  statusActive: {
    backgroundColor: theme.emeraldDim,
    borderColor: 'rgba(16, 185, 129, 0.25)',
  },
  statusIdle: {
    backgroundColor: 'rgba(90, 90, 120, 0.15)',
    borderColor: 'rgba(90, 90, 120, 0.15)',
  },
  statusText: {
    fontSize: 9,
    fontWeight: theme.fontBold,
    color: theme.textMuted,
    letterSpacing: 0.5,
  },
  statusTextActive: {
    color: theme.emerald,
  },
});
