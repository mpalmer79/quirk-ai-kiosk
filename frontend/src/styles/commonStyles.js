/**
 * Quirk AI Kiosk - Common Reusable Styles
 * Pre-built style objects for frequently used UI patterns
 */

import { colors, typography, spacing, borderRadius, transitions } from './theme';

// ============================================
// BUTTONS
// ============================================
export const buttons = {
  // Primary action button (green gradient)
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
  
  // Primary large (for CTAs)
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
  
  // Secondary button (outline style)
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
  
  // Ghost button (transparent)
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
  
  // Term/option button (selectable)
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
  
  // Term button selected state
  termSelected: {
    background: colors.primary,
    borderColor: colors.primary,
  },
};

// ============================================
// CARDS
// ============================================
export const cards = {
  // Standard card container
  base: {
    padding: spacing[6],
    background: colors.bgCard,
    borderRadius: borderRadius['3xl'],
    border: `1px solid ${colors.border}`,
  },
  
  // Card with hover effect
  interactive: {
    padding: spacing[6],
    background: colors.bgCard,
    borderRadius: borderRadius['3xl'],
    border: `1px solid ${colors.border}`,
    cursor: 'pointer',
    transition: transitions.normal,
  },
  
  // Pricing/highlight card
  highlight: {
    padding: spacing[6],
    background: colors.primaryBg,
    borderRadius: borderRadius['3xl'],
    border: `1px solid ${colors.primaryBorder}`,
  },
  
  // Results section card
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
  // Slider container
  sliderContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: spacing[4],
  },
  
  // Slider track
  slider: {
    flex: 1,
  },
  
  // Slider value display
  sliderValue: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.primaryLight,
    minWidth: '80px',
    textAlign: 'right',
  },
  
  // Select dropdown
  select: {
    padding: `${spacing[3]} ${spacing[4]}`,
    background: colors.bgCard,
    border: `1px solid ${colors.border}`,
    borderRadius: borderRadius.lg,
    color: colors.textPrimary,
    fontSize: typography.fontSize.md,
    cursor: 'pointer',
  },
  
  // Input label
  label: {
    display: 'block',
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textMuted,
    marginBottom: spacing[2],
  },
  
  // Input group wrapper
  group: {
    marginBottom: spacing[5],
  },
  
  // Button group (horizontal)
  buttonGroup: {
    display: 'flex',
    gap: spacing[2],
  },
};

// ============================================
// TEXT STYLES
// ============================================
export const text = {
  // Page title
  pageTitle: {
    fontSize: typography.fontSize['6xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    margin: 0,
  },
  
  // Section title
  sectionTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    margin: 0,
  },
  
  // Card title
  cardTitle: {
    fontSize: typography.fontSize['4xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    margin: 0,
  },
  
  // Subtitle/description
  subtitle: {
    fontSize: typography.fontSize.xl,
    color: colors.textMuted,
    margin: 0,
  },
  
  // Small label (uppercase)
  label: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textDisabled,
    textTransform: 'uppercase',
  },
  
  // Body text
  body: {
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
    lineHeight: typography.lineHeight.normal,
  },
  
  // Muted/helper text
  muted: {
    fontSize: typography.fontSize.base,
    color: colors.textSubtle,
  },
  
  // Large display number
  displayLarge: {
    fontSize: typography.fontSize['7xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  
  // Price display
  price: {
    fontSize: typography.fontSize['6xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.primaryLight,
  },
  
  // Monospace (for VINs, codes)
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
  // Page container
  pageContainer: {
    flex: 1,
    padding: `${spacing[6]} ${spacing[10]}`,
    overflow: 'auto',
  },
  
  // Centered content container
  centeredContainer: {
    maxWidth: '1200px',
    margin: '0 auto',
  },
  
  // Two column grid
  twoColumnGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: spacing[6],
  },
  
  // Auto-fit grid
  autoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: spacing[6],
  },
  
  // Flex row
  flexRow: {
    display: 'flex',
    alignItems: 'center',
    gap: spacing[3],
  },
  
  // Flex row with space between
  flexBetween: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  
  // Flex column
  flexColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing[5],
  },
  
  // Header section
  header: {
    marginBottom: spacing[6],
  },
  
  // Divider
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
  // Success badge
  success: {
    padding: `${spacing[2]} ${spacing[3]}`,
    background: colors.successBg,
    borderRadius: borderRadius.lg,
    color: colors.success,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
  },
  
  // Feature tag
  feature: {
    padding: `${spacing[1]} ${spacing[3]}`,
    background: colors.primaryBgStrong,
    borderRadius: borderRadius['2xl'],
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primaryLight,
  },
  
  // Status badge (with dot)
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
  
  // Status dot
  statusDot: {
    width: '8px',
    height: '8px',
    borderRadius: borderRadius.full,
  },
  
  // Match score badge
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
  // Info/tip banner
  info: {
    display: 'flex',
    alignItems: 'center',
    gap: spacing[4],
    padding: spacing[5],
    background: colors.primaryBgMedium,
    borderRadius: borderRadius['2xl'],
  },
  
  // Success banner
  success: {
    display: 'flex',
    alignItems: 'center',
    gap: spacing[3],
    padding: `${spacing[4]} ${spacing[5]}`,
    background: colors.successBg,
    borderRadius: borderRadius['2xl'],
  },
  
  // CTA banner (dashed border)
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
  // Center content
  center: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // Full width
  fullWidth: {
    width: '100%',
  },
  
  // Text center
  textCenter: {
    textAlign: 'center',
  },
  
  // Hide visually
  srOnly: {
    position: 'absolute',
    width: '1px',
    height: '1px',
    padding: 0,
    margin: '-1px',
    overflow: 'hidden',
    clip: 'rect(0, 0, 0, 0)',
    border: 0,
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
