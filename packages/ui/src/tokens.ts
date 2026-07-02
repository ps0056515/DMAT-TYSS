/** Design tokens — Screen Design Specification v1.0 */
export const tokens = {
  accent: '#2E4374',
  accentLight: '#EAF0F8',
  success: { text: '#1A5C35', bg: '#E6F5EC' },
  warning: { text: '#7A4F00', bg: '#FFF4E0' },
  danger: { text: '#7A1F1F', bg: '#FDECEC' },
  surface1: '#F5F5F3',
  surface2: '#FFFFFF',
  border: 'rgba(0, 0, 0, 0.12)',
  text: {
    primary: '#1A1A1A',
    secondary: '#5C5C5C',
    muted: '#8A8A8A',
  },
  radius: { sm: 8, card: 12 },
  pad: { sm: 8, md: 16, lg: 24, xl: 32 },
  font: {
    h1: { size: 18, weight: 500 },
    h2: { size: 16, weight: 500 },
    cardTitle: { size: 15, weight: 500 },
    body: { size: 14, weight: 400 },
    small: { size: 13, weight: 400 },
    meta: { size: 12, weight: 400 },
    badge: { size: 11, weight: 500 },
  },
} as const;

export type SemanticTone = 'success' | 'warning' | 'danger' | 'neutral' | 'accent';
