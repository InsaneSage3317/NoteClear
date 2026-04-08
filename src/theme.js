// ─── Design Theme ─────────────────────────────────────────────
// Centralized theme tokens for the React Native app.

const theme = {
  // Backgrounds
  bgPrimary: '#0a0a12',
  bgSecondary: '#10101c',
  bgTertiary: '#161628',
  bgCard: 'rgba(22, 22, 40, 0.85)',
  bgGlass: 'rgba(22, 22, 40, 0.6)',

  // Accents
  purple: '#8b5cf6',
  purpleDim: 'rgba(139, 92, 246, 0.15)',
  blue: '#3b82f6',
  blueDim: 'rgba(59, 130, 246, 0.15)',
  cyan: '#06b6d4',
  cyanDim: 'rgba(6, 182, 212, 0.15)',
  emerald: '#10b981',
  emeraldDim: 'rgba(16, 185, 129, 0.15)',
  amber: '#f59e0b',
  amberDim: 'rgba(245, 158, 11, 0.15)',
  rose: '#f43f5e',
  roseDim: 'rgba(244, 63, 94, 0.15)',
  orange: '#f97316',

  // Text
  textPrimary: '#f0f0f8',
  textSecondary: '#9d9db8',
  textMuted: '#5a5a78',

  // Borders
  borderSubtle: 'rgba(255, 255, 255, 0.06)',
  borderGlow: 'rgba(139, 92, 246, 0.3)',

  // Radii
  radiusSm: 10,
  radiusMd: 14,
  radiusLg: 18,
  radiusXl: 22,
  radiusFull: 999,

  // Typography
  fontRegular: '400',
  fontMedium: '500',
  fontSemiBold: '600',
  fontBold: '700',
  fontExtraBold: '800',

  // Agent colors
  agentA: { bg: 'rgba(244, 63, 94, 0.15)', color: '#f43f5e', border: 'rgba(244, 63, 94, 0.25)' },
  agentB: { bg: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6', border: 'rgba(59, 130, 246, 0.25)' },
  agentC: { bg: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', border: 'rgba(245, 158, 11, 0.25)' },
};

export default theme;
