export const theme = {
  colors: {
    bg: '#09090e',
    bgCard: '#111118',
    bgInput: '#1a1a24',
    border: '#1e1e2e',
    borderLight: '#2a2a3e',

    accent: '#7c6dfa',
    accentDim: '#7c6dfa33',
    accentBright: '#a08bff',

    success: '#22d3a5',
    successDim: '#22d3a520',
    warning: '#f59e0b',
    error: '#f43f5e',
    errorDim: '#f43f5e20',

    textPrimary: '#e8e8f0',
    textSecondary: '#8888a8',
    textMuted: '#555570',

    userBubble: '#1a1a35',
    userBubbleBorder: '#3030a0',
    aiBubble: '#0f0f1a',
    aiBubbleBorder: '#1e1e3a',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  radius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    full: 9999,
  },
  font: {
    // Use system fonts since we can't load custom fonts without expo-font setup
    mono: 'monospace',
    regular: 'System',
  },
};

export type Theme = typeof theme;
