import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import theme from '../theme';

const ACTION_COLORS = {
  DISMISSED: { bg: 'rgba(244, 63, 94, 0.1)', color: theme.rose },
  PASSED: { bg: 'rgba(16, 185, 129, 0.1)', color: theme.emerald },
  CATEGORIZED: { bg: 'rgba(59, 130, 246, 0.1)', color: theme.blue },
  EXPIRED: { bg: 'rgba(245, 158, 11, 0.1)', color: theme.amber },
};

const AGENT_COLORS = {
  A: { bg: theme.agentA.bg, color: theme.agentA.color },
  B: { bg: theme.agentB.bg, color: theme.agentB.color },
  C: { bg: theme.agentC.bg, color: theme.agentC.color },
};

function formatTime(ts) {
  return new Date(ts).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

function LogEntry({ log }) {
  const actionStyle = ACTION_COLORS[log.action] || ACTION_COLORS.PASSED;
  const agentStyle = AGENT_COLORS[log.agent] || AGENT_COLORS.A;

  return (
    <View style={styles.entry}>
      <View style={[styles.agentBadge, { backgroundColor: agentStyle.bg }]}>
        <Text style={[styles.agentBadgeText, { color: agentStyle.color }]}>{log.agent}</Text>
      </View>
      <View style={[styles.actionBadge, { backgroundColor: actionStyle.bg }]}>
        <Text style={[styles.actionText, { color: actionStyle.color }]}>{log.action}</Text>
      </View>
      <View style={styles.detailBlock}>
        <Text style={styles.logSender}>{log.sender}</Text>
        <Text style={styles.logDetail} numberOfLines={2}>{log.detail}</Text>
      </View>
      <Text style={styles.logTime}>{formatTime(log.ts)}</Text>
    </View>
  );
}

export default function AgentLog({ logs }) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerIcon}>📜</Text>
        <Text style={styles.headerTitle}>AGENT LOG</Text>
        <View style={styles.logCount}>
          <Text style={styles.logCountText}>{logs.length}</Text>
        </View>
      </View>

      <View style={styles.body}>
        {logs.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No activity yet</Text>
          </View>
        ) : (
          <FlatList
            data={logs.slice(0, 50)}
            renderItem={({ item }) => <LogEntry log={item} />}
            keyExtractor={(item, i) => `${item.ts}-${item.agent}-${i}`}
            scrollEnabled={false}
          />
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
    flex: 1,
  },
  logCount: {
    paddingHorizontal: 7,
    paddingVertical: 1,
    borderRadius: theme.radiusFull,
    backgroundColor: theme.purpleDim,
  },
  logCountText: {
    fontSize: 10,
    fontWeight: theme.fontBold,
    color: theme.purple,
  },
  body: {
    padding: 10,
    maxHeight: 320,
  },
  entry: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: 8,
    borderRadius: theme.radiusSm,
    backgroundColor: 'rgba(10, 10, 18, 0.4)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.02)',
    marginBottom: 5,
  },
  agentBadge: {
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  agentBadgeText: {
    fontSize: 10,
    fontWeight: theme.fontBold,
  },
  actionBadge: {
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  actionText: {
    fontSize: 8,
    fontWeight: theme.fontBold,
    letterSpacing: 0.3,
  },
  detailBlock: {
    flex: 1,
  },
  logSender: {
    fontSize: 11,
    fontWeight: theme.fontSemiBold,
    color: theme.textPrimary,
  },
  logDetail: {
    fontSize: 10,
    color: theme.textSecondary,
    lineHeight: 14,
    marginTop: 1,
  },
  logTime: {
    fontSize: 9,
    color: theme.textMuted,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 28,
  },
  emptyText: {
    fontSize: 12,
    color: theme.textMuted,
  },
});
