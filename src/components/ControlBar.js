import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import theme from '../theme';

export default function ControlBar({
  onAdd,
  onBatch,
  autoMode,
  onToggleAuto,
  onClear,
  mode,
  onToggleMode,
  isNativeAvailable,
  isPermitted,
  onRequestPermission,
}) {
  return (
    <View style={styles.container}>
      {/* Mode & Permission Row */}
      {isNativeAvailable && !isPermitted && (
        <TouchableOpacity style={styles.permissionBtn} onPress={onRequestPermission}>
          <Text style={styles.permissionText}>
            🔓 Grant Notification Access
          </Text>
          <Text style={styles.permissionSub}>
            Tap to open Android settings
          </Text>
        </TouchableOpacity>
      )}

      {/* Action buttons */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        <TouchableOpacity style={[styles.btn, styles.btnPrimary]} onPress={onAdd}>
          <Text style={styles.btnPrimaryText}>＋ Add</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.btn} onPress={onBatch}>
          <Text style={styles.btnText}>📦 Batch</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.btn, autoMode && styles.btnAutoActive]}
          onPress={onToggleAuto}
        >
          <Text style={[styles.btnText, autoMode && styles.btnAutoText]}>
            {autoMode ? '⏸ Pause' : '▶ Auto'}
          </Text>
        </TouchableOpacity>

        {isNativeAvailable && (
          <TouchableOpacity
            style={[styles.btn, mode === 'live' ? styles.btnLive : styles.btnDemo]}
            onPress={onToggleMode}
          >
            <Text style={[styles.btnText, mode === 'live' ? styles.btnLiveText : styles.btnDemoText]}>
              {mode === 'live' ? '📡 Live' : '🧪 Demo'}
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={[styles.btn, styles.btnDanger]} onPress={onClear}>
          <Text style={styles.btnDangerText}>🗑</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    gap: 10,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 2,
  },
  btn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: theme.radiusSm,
    borderWidth: 1,
    borderColor: theme.borderSubtle,
    backgroundColor: theme.bgTertiary,
  },
  btnText: {
    fontSize: 13,
    fontWeight: theme.fontSemiBold,
    color: theme.textPrimary,
  },
  btnPrimary: {
    backgroundColor: theme.purple,
    borderColor: 'transparent',
  },
  btnPrimaryText: {
    fontSize: 13,
    fontWeight: theme.fontBold,
    color: '#fff',
  },
  btnAutoActive: {
    backgroundColor: theme.emeraldDim,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  btnAutoText: {
    color: theme.emerald,
  },
  btnDanger: {
    borderColor: 'rgba(244, 63, 94, 0.2)',
  },
  btnDangerText: {
    fontSize: 13,
    color: theme.rose,
  },
  btnLive: {
    backgroundColor: theme.emeraldDim,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  btnLiveText: {
    color: theme.emerald,
  },
  btnDemo: {
    backgroundColor: theme.amberDim,
    borderColor: 'rgba(245, 158, 11, 0.25)',
  },
  btnDemoText: {
    color: theme.amber,
  },
  permissionBtn: {
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: theme.radiusMd,
    backgroundColor: theme.purpleDim,
    borderWidth: 1,
    borderColor: theme.borderGlow,
    alignItems: 'center',
  },
  permissionText: {
    fontSize: 14,
    fontWeight: theme.fontBold,
    color: theme.purple,
  },
  permissionSub: {
    fontSize: 11,
    color: theme.textSecondary,
    marginTop: 3,
  },
});
