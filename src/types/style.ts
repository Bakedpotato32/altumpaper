export interface PaperCustomization {
  // Typography — real values, not presets, so density is fully adjustable
  fontFamily: 'serif' | 'sans' | 'mono';
  fontSizePx: number;      // base body/question text size
  lineHeight: number;      // unitless line-height multiplier
  wordSpacingPx: number;
  questionGapPx: number;   // vertical gap between questions/sections
  pageMarginPx: number;    // page padding

  // Layout & Density
  columns: 1 | 2;
  showPageNumbers: boolean;
  questionNumberFormat: 'Q1.' | '1.' | 'Q.1)';

  // Header & Branding
  headerStyle: 'classic' | 'modern' | 'minimal';
  headerDivider: 'solid' | 'double' | 'dashed' | 'none';
  affiliationText: string;
  logoUrl?: string;

  // Watermark
  showWatermark: boolean;
  watermarkText: string;
  watermarkOpacity: number;

  // Page Styling & Borders
  borderStyle: 'none' | 'single' | 'double';
  showStudentBox: boolean;
  showSignatures: boolean;
}

export const DEFAULT_STYLE: PaperCustomization = {
  fontFamily: 'serif',
  fontSizePx: 12,
  lineHeight: 1.45,
  wordSpacingPx: 0,
  questionGapPx: 16,
  pageMarginPx: 40,
  columns: 1,
  showPageNumbers: true,
  questionNumberFormat: 'Q1.',
  headerStyle: 'classic',
  headerDivider: 'solid',
  affiliationText: 'Affiliated to State / Central Board of Secondary Education',
  showWatermark: false,
  watermarkText: "WINNER'S ACADEMY",
  watermarkOpacity: 0.08,
  borderStyle: 'single',
  showStudentBox: true,
  showSignatures: true
};

// Slider bounds so the UI knows a sensible min/max/step per control
export const STYLE_RANGES = {
  fontSizePx: { min: 8, max: 20, step: 0.5 },
  lineHeight: { min: 1.0, max: 2.2, step: 0.05 },
  wordSpacingPx: { min: -1, max: 4, step: 0.5 },
  questionGapPx: { min: 4, max: 40, step: 2 },
  pageMarginPx: { min: 16, max: 72, step: 2 }
} as const;

// One-tap density shortcuts — set several sliders at once
export const DENSITY_PRESETS: Record<'compact' | 'normal' | 'spacious', Pick<PaperCustomization, 'fontSizePx' | 'lineHeight' | 'questionGapPx' | 'pageMarginPx'>> = {
  compact: { fontSizePx: 10, lineHeight: 1.25, questionGapPx: 8, pageMarginPx: 28 },
  normal: { fontSizePx: 12, lineHeight: 1.45, questionGapPx: 16, pageMarginPx: 40 },
  spacious: { fontSizePx: 14, lineHeight: 1.7, questionGapPx: 24, pageMarginPx: 56 }
};
