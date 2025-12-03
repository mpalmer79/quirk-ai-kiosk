/**
 * Quirk AI Kiosk - Common Reusable Styles
 * Pre-built style objects for frequently used UI patterns
 */

import { colors, typography, spacing, borderRadius, transitions } from './theme';

// ============================================
// BUTTONS
// ============================================
export const buttons = {
  primary: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    padding: `${spacing[4]} ${spacing[6]}`,
    background: colors.primaryGradient,
    border: 'none',
    borderRadius: borderRadius.xl,
    color: colors.textPrimary,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    cursor: 'pointer',
    transition: transitions.normal,
  },
  
  primaryLarge: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[3],
    padding: `${spacing[5]} ${spacing[6]}`,
    background: colors.primaryGradient,
    border: 'none',
    borderRadius: borderRadius['2xl'],
    color: colors.textPrimary,
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    cursor: 'pointer',
    transition: transitions.normal,
  },
  
  secondary: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[3],
    padding: `${spacing[4]} ${spacing[6]}`,
    background: colors.bgCard,
    border: `1px solid ${colors.borderLight}`,
    borderRadius: borderRadius['2xl'],
    color: colors.textPrimary,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    cursor: 'pointer',
    transition: transitions.normal,
  },
  
  ghost: {
    display: 'flex',
    alignItems: 'center',
    gap: spacing[2],
    background: 'none',
    border: 'none',
    color: colors.textMuted,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    cursor: 'pointer',
    padding: 0,
  },
  
  term: {
    flex: 1,
    padding: spacing[3],
    borderRadius: borderRadius.lg,
    border: `1px solid ${colors.borderLight}`,
    color: colors.textPrimary,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    cursor: 'pointer',
    transition: transitions.normal,
    background: 'transparent',
  },
  
  termSelected: {
    background: colors.primary,
    borderColor: colors.primary,
  },
};

// ============================================
// CARDS
// ============================================
export const cards = {
  base: {
    padding: spacing[6],
    background: colors.bgCard,
    borderRadius: borderRadius['3xl'],
    border: `1px solid ${colors.border}`,
  },
  
  interactive: {
    padding: spacing[6],
    background: colors.bgCard,
    borderRadius: borderRadius['3xl'],
    border: `1px solid ${colors.border}`,
    cursor: 'pointer',
    transition: transitions.normal,
  },
  
  highlight: {
    padding: spacing[6],
    background: colors.primaryBg,
    borderRadius: borderRadius['3xl'],
    border: `1px solid ${colors.primaryBorder}`,
  },
  
  results: {
    padding: spacing[5],
    background: colors.bgOverlay,
    borderRadius: borderRadius['2xl'],
  },
};

// ============================================
// FORM INPUTS
// ============================================
export const inputs = {
  sliderContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: spacing[4],
  },
  
  slider: {
    flex: 1,
  },
  
  sliderValue: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.primaryLight,
    minWidth: '80px',
    textAlign: 'right',
  },
  
  select: {
    padding: `${spacing[3]} ${spacing[4]}`,
    background: colors.bgCard,
    border: `1px solid ${colors.border}`,
    borderRadius: borderRadius.lg,
    color: colors.textPrimary,
    fontSize: typography.fontSize.md,
    cursor: 'pointer',
  },
  
  label: {
    display: 'block',
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textMuted,
    marginBottom: spacing[2],
  },
  
  group: {
    marginBottom: spacing[5],
  },
  
  buttonGroup: {
    display: 'flex',
    gap: spacing[2],
  },
};

// ============================================
// TEXT STYLES
// ============================================
export const text = {
  pageTitle: {
    fontSize: typography.fontSize['6xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    margin: 0,
  },
  
  sectionTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    margin: 0,
  },
  
  cardTitle: {
    fontSize: typography.fontSize['4xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    margin: 0,
  },
  
  subtitle: {
    fontSize: typography.fontSize.xl,
    color: colors.textMuted,
    margin: 0,
  },
  
  label: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textDisabled,
    textTransform: 'uppercase',
  },
  
  body: {
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
    lineHeight: typography.lineHeight.normal,
  },
  
  muted: {
    fontSize: typography.fontSize.base,
    color: colors.textSubtle,
  },
  
  displayLarge: {
    fontSize: typography.fontSize['7xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  
  price: {
    fontSize: typography.fontSize['6xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.primaryLight,
  },
  
  mono: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontMono,
    color: colors.textMuted,
  },
};

// ============================================
// LAYOUT
// ============================================
export const layout = {
  pageContainer: {
    flex: 1,
    padding: `${spacing[6]} ${spacing[10]}`,
    overflow: 'auto',
  },
  
  centeredContainer: {
    maxWidth: '1200px',
    margin: '0 auto',
  },
  
  twoColumnGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: spacing[6],
  },
  
  autoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: spacing[6],
  },
  
  flexRow: {
    display: 'flex',
    alignItems: 'center',
    gap: spacing[3],
  },
  
  flexBetween: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  
  flexColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing[5],
  },
  
  header: {
    marginBottom: spacing[6],
  },
  
  divider: {
    height: '1px',
    background: colors.border,
    margin: `${spacing[3]} 0`,
  },
};

// ============================================
// BADGES & TAGS
// ============================================
export const badges = {
  success: {
    padding: `${spacing[2]} ${spacing[3]}`,
    background: colors.successBg,
    borderRadius: borderRadius.lg,
    color: colors.success,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
  },
  
  feature: {
    padding: `${spacing[1]} ${spacing[3]}`,
    background: colors.primaryBgStrong,
    borderRadius: borderRadius['2xl'],
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primaryLight,
  },
  
  status: {
    display: 'flex',
    alignItems: 'center',
    gap: spacing[2],
    padding: `${spacing[2]} ${spacing[3]}`,
    background: colors.bgOverlayLight,
    borderRadius: borderRadius.pill,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  
  statusDot: {
    width: '8px',
    height: '8px',
    borderRadius: borderRadius.full,
  },
  
  matchScore: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: `${spacing[2]} ${spacing[3]}`,
    background: colors.bgOverlayLight,
    borderRadius: borderRadius.xl,
    backdropFilter: 'blur(8px)',
  },
};

// ============================================
// BANNERS
// ============================================
export const banners = {
  info: {
    display: 'flex',
    alignItems: 'center',
    gap: spacing[4],
    padding: spacing[5],
    background: colors.primaryBgMedium,
    borderRadius: borderRadius['2xl'],
  },
  
  success: {
    display: 'flex',
    alignItems: 'center',
    gap: spacing[3],
    padding: `${spacing[4]} ${spacing[5]}`,
    background: colors.successBg,
    borderRadius: borderRadius['2xl'],
  },
  
  cta: {
    display: 'flex',
    alignItems: 'center',
    gap: spacing[4],
    width: '100%',
    padding: spacing[5],
    background: colors.bgCard,
    border: `2px dashed ${colors.borderLight}`,
    borderRadius: borderRadius['2xl'],
    color: colors.textPrimary,
    cursor: 'pointer',
    textAlign: 'left',
  },
};

// ============================================
// UTILITY HELPERS
// ============================================
export const utils = {
  center: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  fullWidth: {
    width: '100%',
  },
  
  textCenter: {
    textAlign: 'center',
  },
};

// Default export
const commonStyles = {
  buttons,
  cards,
  inputs,
  text,
  layout,
  badges,
  banners,
  utils,
};

export default commonStyles;
