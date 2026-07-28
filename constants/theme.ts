// Nizami Emerald — emerald & brass, palace-kitchen heritage palette
export const colors = {
  background: '#0d2b22',
  backgroundSecondary: '#0a2119',
  backgroundCard: '#153a2d',
  gold: '#c9a24b',
  goldLight: '#ddbd72',
  goldBright: '#e9cd8f',
  goldDark: '#9c7a34',
  white: '#f3ead9',
  whiteMuted: 'rgba(243, 234, 217, 0.45)',
  // Semantic success/vegetarian indicator — kept a lime hue, deliberately
  // distinct from the emerald background so it still reads at a glance.
  green: '#8bc34a',
  greenLight: '#a8d873',
  border: 'rgba(201, 162, 75, 0.15)',
  borderStrong: 'rgba(201, 162, 75, 0.35)',
  error: '#ef5350',
  success: '#8bc34a',
  overlay: 'rgba(13, 43, 34, 0.85)',
}

export const fonts = {
  serif: 'PlayfairDisplay_700Bold',
  serifRegular: 'PlayfairDisplay_400Regular',
  display: 'CormorantGaramond_600SemiBold',
  displayLight: 'CormorantGaramond_400Regular',
  sans: 'Jost_400Regular',
  sansMedium: 'Jost_500Medium',
  sansBold: 'Jost_700Bold',
}

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
}

export const borderRadius = {
  sm: 2,
  md: 4,
  lg: 8,
  xl: 12,
  full: 9999,
}

export const typography = {
  heroTitle: {
    fontFamily: fonts.display,
    fontSize: 48,
    lineHeight: 52,
    letterSpacing: 0.5,
    color: colors.white,
  },
  sectionTitle: {
    fontFamily: fonts.serif,
    fontSize: 22,
    lineHeight: 28,
    color: colors.white,
  },
  tagline: {
    fontFamily: fonts.sansMedium,
    fontSize: 11,
    letterSpacing: 3,
    color: colors.gold,
    textTransform: 'uppercase' as const,
  },
  body: {
    fontFamily: fonts.sans,
    fontSize: 14,
    lineHeight: 22,
    color: colors.whiteMuted,
  },
  label: {
    fontFamily: fonts.sansMedium,
    fontSize: 13,
    color: colors.white,
  },
}
