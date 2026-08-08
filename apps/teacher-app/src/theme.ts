/**
 * Design tokens for the SFGC Teacher app. Mirrors the website's palette so the
 * three products read as one institution: deep navy ground, maroon heritage
 * accent, gold for emphasis.
 */

export const colors = {
  // Teacher app leads with navy.
  brand: '#0f2b56',
  brandDark: '#0b2039',
  brandLight: '#1c4b93',
  brandTint: '#eef4fc',

  maroon: '#6b1230',
  gold: '#c9a227',
  goldTint: '#fdf9ec',

  background: '#f6f8fb',
  surface: '#ffffff',
  surfaceAlt: '#f1f5fa',

  text: '#0d1b2e',
  textMuted: '#5b6b80',
  textFaint: '#8a99ad',
  textOnBrand: '#ffffff',

  border: '#e2e8f0',
  borderStrong: '#cbd5e1',

  success: '#16a34a',
  successTint: '#eaf7ef',
  warning: '#d97706',
  warningTint: '#fdf4e7',
  danger: '#dc2626',
  dangerTint: '#fdecec',
  info: '#2563eb',
  infoTint: '#eaf0fd',

  overlay: 'rgba(11, 32, 57, 0.55)',
} as const

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 22,
  pill: 999,
} as const

export const typography = {
  display: { fontSize: 30, fontWeight: '700' as const, letterSpacing: -0.5 },
  title: { fontSize: 22, fontWeight: '700' as const, letterSpacing: -0.3 },
  heading: { fontSize: 18, fontWeight: '700' as const },
  subheading: { fontSize: 16, fontWeight: '600' as const },
  body: { fontSize: 15, fontWeight: '400' as const },
  bodyStrong: { fontSize: 15, fontWeight: '600' as const },
  caption: { fontSize: 13, fontWeight: '500' as const },
  tiny: { fontSize: 11, fontWeight: '600' as const, letterSpacing: 0.4 },
} as const

/** Cross-platform elevation — iOS wants a shadow, Android wants elevation. */
export const shadow = {
  card: {
    shadowColor: '#0b2039',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  raised: {
    shadowColor: '#0b2039',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 20,
    elevation: 8,
  },
} as const

export const theme = { colors, spacing, radius, typography, shadow }
export type Theme = typeof theme
