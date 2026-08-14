/**
 * Design Tokens for Loja Luz do Interior
 * Centralizes all design system constants: colors, gradients, spacing, typography
 */

export type GradientPreset = 'blue' | 'green' | 'red' | 'amber' | 'teal' | 'indigo' | 'purple' | 'pink';

export type StatusType = 'pending' | 'approved' | 'rejected' | 'active' | 'inactive' | 'success' | 'warning' | 'error';

/**
 * Gradient presets for KPI cards with light and dark mode support
 */
export const GRADIENT_PRESETS: Record<GradientPreset, { light: string; dark: string; border: string; text: string; icon: string }> = {
  blue: {
    light: 'from-blue-50 to-sky-100',
    dark: 'dark:from-blue-950 dark:to-sky-900',
    border: 'border-blue-200 dark:border-blue-800',
    text: 'text-blue-700 dark:text-blue-300',
    icon: 'text-blue-500/50'
  },
  green: {
    light: 'from-green-50 to-emerald-100',
    dark: 'dark:from-green-950 dark:to-emerald-900',
    border: 'border-green-200 dark:border-green-800',
    text: 'text-green-700 dark:text-green-300',
    icon: 'text-green-500/50'
  },
  red: {
    light: 'from-red-50 to-rose-100',
    dark: 'dark:from-red-950 dark:to-rose-900',
    border: 'border-red-200 dark:border-red-800',
    text: 'text-red-700 dark:text-red-300',
    icon: 'text-red-500/50'
  },
  amber: {
    light: 'from-amber-50 to-yellow-100',
    dark: 'dark:from-amber-950 dark:to-yellow-900',
    border: 'border-amber-200 dark:border-amber-800',
    text: 'text-amber-700 dark:text-amber-300',
    icon: 'text-amber-500/50'
  },
  teal: {
    light: 'from-teal-50 to-cyan-100',
    dark: 'dark:from-teal-950 dark:to-cyan-900',
    border: 'border-teal-200 dark:border-teal-800',
    text: 'text-teal-700 dark:text-teal-300',
    icon: 'text-teal-500/50'
  },
  indigo: {
    light: 'from-indigo-50 to-blue-100',
    dark: 'dark:from-indigo-950 dark:to-blue-900',
    border: 'border-indigo-200 dark:border-indigo-800',
    text: 'text-indigo-700 dark:text-indigo-300',
    icon: 'text-indigo-500/50'
  },
  purple: {
    light: 'from-purple-50 to-pink-100',
    dark: 'dark:from-purple-950 dark:to-pink-900',
    border: 'border-purple-200 dark:border-purple-800',
    text: 'text-purple-700 dark:text-purple-300',
    icon: 'text-purple-500/50'
  },
  pink: {
    light: 'from-pink-50 to-rose-100',
    dark: 'dark:from-pink-950 dark:to-rose-900',
    border: 'border-pink-200 dark:border-pink-800',
    text: 'text-pink-700 dark:text-pink-300',
    icon: 'text-pink-500/50'
  }
};

/**
 * Status color mappings for badges and visual indicators
 */
export const STATUS_COLORS: Record<StatusType, { bg: string; text: string; badge: string }> = {
  pending: {
    bg: 'bg-yellow-50 dark:bg-yellow-950',
    text: 'text-yellow-700 dark:text-yellow-300',
    badge: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
  },
  approved: {
    bg: 'bg-green-50 dark:bg-green-950',
    text: 'text-green-700 dark:text-green-300',
    badge: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
  },
  rejected: {
    bg: 'bg-red-50 dark:bg-red-950',
    text: 'text-red-700 dark:text-red-300',
    badge: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
  },
  active: {
    bg: 'bg-green-50 dark:bg-green-950',
    text: 'text-green-700 dark:text-green-300',
    badge: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
  },
  inactive: {
    bg: 'bg-gray-50 dark:bg-gray-950',
    text: 'text-gray-700 dark:text-gray-300',
    badge: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
  },
  success: {
    bg: 'bg-green-50 dark:bg-green-950',
    text: 'text-green-700 dark:text-green-300',
    badge: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
  },
  warning: {
    bg: 'bg-amber-50 dark:bg-amber-950',
    text: 'text-amber-700 dark:text-amber-300',
    badge: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300'
  },
  error: {
    bg: 'bg-red-50 dark:bg-red-950',
    text: 'text-red-700 dark:text-red-300',
    badge: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
  }
};

/**
 * Spacing scale - consistent values for padding, margin, gap
 */
export const SPACING = {
  xs: 'space-y-2',
  sm: 'space-y-3',
  md: 'space-y-4',
  lg: 'space-y-6',

  gapXs: 'gap-2',
  gapSm: 'gap-3',
  gapMd: 'gap-4',
  gapLg: 'gap-6',

  paddingCard: 'p-6 pt-0',
  paddingContent: 'p-4',
  paddingCompact: 'p-3',
};

/**
 * Typography scale
 */
export const TYPOGRAPHY = {
  h1: 'text-4xl font-bold tracking-tight',
  h2: 'text-3xl font-bold tracking-tight',
  h3: 'text-2xl font-bold tracking-tight',
  h4: 'text-xl font-semibold tracking-tight',

  body: 'text-base',
  bodySm: 'text-sm',
  bodyXs: 'text-xs',

  label: 'text-sm font-medium',
  muted: 'text-sm text-muted-foreground',
};

/**
 * Responsive grid columns configuration
 */
export const GRID_COLS = {
  auto: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  twoCol: 'grid-cols-1 md:grid-cols-2',
  threeCol: 'grid-cols-1 md:grid-cols-3',
  fourCol: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
};

/**
 * Helper function to get gradient classes for a preset
 */
export function getGradientClasses(preset: GradientPreset): string {
  const colors = GRADIENT_PRESETS[preset];
  return `bg-gradient-to-br ${colors.light} ${colors.dark} border ${colors.border}`;
}

/**
 * Helper function to get all color-related classes for a gradient preset
 */
export function getGradientColors(preset: GradientPreset) {
  return GRADIENT_PRESETS[preset];
}

/**
 * Helper function to get status color classes
 */
export function getStatusColorClasses(status: StatusType) {
  return STATUS_COLORS[status];
}
