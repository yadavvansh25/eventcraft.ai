import { ColorToken } from '../types/event.types';

/**
 * AccessibilityValidator: WCAG 2.1 AA Relative Luminance & Accessible Contrast Engine
 * Validates and mathematically enforces contrast ratios for normal (>= 4.5:1)
 * and large elements (>= 3.0:1) according to W3C specifications.
 */
export class AccessibilityValidator {
  /**
   * Parses 6-character hex string into RGB channels [0..255]
   */
  public hexToRgb(hex: string): { r: number; g: number; b: number } {
    const cleaned = hex.replace('#', '').trim();
    if (cleaned.length !== 6) {
      throw new Error(`Invalid hex color string: "${hex}". Expected 6 characters.`);
    }

    const r = parseInt(cleaned.substring(0, 2), 16);
    const g = parseInt(cleaned.substring(2, 4), 16);
    const b = parseInt(cleaned.substring(4, 6), 16);

    return { r, g, b };
  }

  /**
   * Converts RGB channels [0..255] into clamped 6-character uppercase hex code
   */
  public rgbToHex(r: number, g: number, b: number): string {
    const clamp = (val: number): string => {
      const clamped = Math.max(0, Math.min(255, val));
      return clamped.toString(16).padStart(2, '0');
    };
    return `#${clamp(r)}${clamp(g)}${clamp(b)}`.toUpperCase();
  }

  /**
   * Computes WCAG 2.1 relative luminance for an sRGB color.
   * L = 0.2126 * R + 0.7152 * G + 0.0722 * B
   */
  public calculateRelativeLuminance(hex: string): number {
    const { r, g, b } = this.hexToRgb(hex);

    const sR = r / 255;
    const sG = g / 255;
    const sB = b / 255;

    const transform = (c: number): number => {
      return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    };

    const linearR = transform(sR);
    const linearG = transform(sG);
    const linearB = transform(sB);

    return 0.2126 * linearR + 0.7152 * linearG + 0.0722 * linearB;
  }

  /**
   * Computes contrast ratio between two sRGB colors.
   * Ratio = (L1 + 0.05) / (L2 + 0.05) where L1 is the lighter luminance.
   */
  public calculateContrastRatio(hex1: string, hex2: string): number {
    const lum1 = this.calculateRelativeLuminance(hex1);
    const lum2 = this.calculateRelativeLuminance(hex2);

    const lighter = Math.max(lum1, lum2);
    const darker = Math.min(lum1, lum2);

    return (lighter + 0.05) / (darker + 0.05);
  }

  /**
   * Computes contrast ratio against pure white (#FFFFFF, L = 1.0).
   */
  public calculateContrastAgainstWhite(hex: string): number {
    return this.calculateContrastRatio(hex, '#FFFFFF');
  }

  /**
   * Asserts whether contrast ratio meets WCAG 2.1 AA standard:
   * >= 4.5:1 for normal text, >= 3.0:1 for large text/elements.
   */
  public isWCAGCompliant(contrastRatio: number, isLargeElement: boolean = false): boolean {
    const threshold = isLargeElement ? 3.0 : 4.5;
    return contrastRatio >= threshold;
  }

  /**
   * Darkens an sRGB color along its RGB vector until it reaches the required contrast ratio against white.
   */
  public darkenUntilCompliant(hex: string, minRatio: number = 4.5): string {
    const rgb = this.hexToRgb(hex);
    let { r, g, b } = rgb;

    let iterations = 0;
    while (iterations < 100) {
      const currentHex = this.rgbToHex(r, g, b);
      const ratio = this.calculateContrastAgainstWhite(currentHex);
      if (ratio >= minRatio) {
        return currentHex;
      }
      r = Math.floor(r * 0.92);
      g = Math.floor(g * 0.92);
      b = Math.floor(b * 0.92);
      iterations++;
    }

    return '#1A1A1A'; // High-contrast obsidian fallback
  }

  /**
   * Validates a complete array of ColorTokens for WCAG 2.1 AA compliance.
   */
  public validatePalette(tokens: ColorToken[]): { valid: boolean; minRatio: number; summary: string } {
    if (tokens.length === 0) {
      return {
        valid: false,
        minRatio: 0,
        summary: 'Color palette is empty. No design tokens found to validate.',
      };
    }

    let allCompliant = true;
    let minRatio = Infinity;

    for (const token of tokens) {
      const calculatedRatio = Number(this.calculateContrastAgainstWhite(token.hex).toFixed(2));
      minRatio = Math.min(minRatio, calculatedRatio);

      const compliant = this.isWCAGCompliant(calculatedRatio, token.isLargeElementOnly);
      if (!compliant || !token.wcagCompliant) {
        allCompliant = false;
      }
    }

    const summary = allCompliant
      ? `All ${tokens.length} color tokens satisfy WCAG 2.1 AA compliance against #FFFFFF (Lowest calculated contrast: ${minRatio}:1).`
      : `WCAG compliance failure: One or more color tokens do not satisfy the minimum 4.5:1 contrast ratio against #FFFFFF (Lowest ratio: ${minRatio}:1).`;

    return {
      valid: allCompliant,
      minRatio,
      summary,
    };
  }
}
