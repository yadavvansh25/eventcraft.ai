import { ThemeStudio } from '../../src/core/engine/theme-studio';
import { EventType } from '../../src/core/domain/event.types';

describe('ThemeStudio - WCAG 2.1 AA Luminance & Accessible Contrast Engine', () => {
  let themeStudio: ThemeStudio;

  beforeEach(() => {
    themeStudio = new ThemeStudio();
  });

  const eventGenres: EventType[] = ['wedding', 'birthday', 'community'];

  it.each(eventGenres)(
    'should generate a palette where all tokens exceed 4.5:1 contrast against white for %s',
    (eventType) => {
      const suite = themeStudio.generate(eventType, 'Vibrant', 'indoor');

      expect(suite.themeName).toBeTruthy();
      expect(suite.colorPalette.length).toBeGreaterThanOrEqual(4);

      for (const token of suite.colorPalette) {
        expect(token.hex).toMatch(/^#[0-9A-F]{6}$/);
        expect(token.tokenName).toBeTruthy();
        expect(token.contrastRatioAgainstWhite).toBeGreaterThanOrEqual(4.5);
        expect(token.wcagCompliant).toBe(true);
      }
    }
  );

  it('should use default tone and lightingContext when not provided', () => {
    const suite = themeStudio.generate('wedding');
    expect(suite.themeName).toContain('Sophisticated');
    expect(suite.themeName).toContain('indoor');
  });

  it('should use default minRatio in darkenHexUntilCompliant when not provided', () => {
    const darkened = themeStudio.darkenHexUntilCompliant('#E0F2FE');
    expect(themeStudio.calculateContrastAgainstWhite(darkened)).toBeGreaterThanOrEqual(4.5);
  });

  describe('Mathematical Relative Luminance Calculations', () => {
    it('should compute exact relative luminance for pure black and pure white', () => {
      const blackLuminance = themeStudio.calculateRelativeLuminance('#000000');
      const whiteLuminance = themeStudio.calculateRelativeLuminance('#FFFFFF');

      expect(blackLuminance).toBeCloseTo(0.0, 4);
      expect(whiteLuminance).toBeCloseTo(1.0, 4);
    });

    it('should calculate accurate contrast ratio for black against white (21:1)', () => {
      const contrast = themeStudio.calculateContrastAgainstWhite('#000000');
      expect(contrast).toBeCloseTo(21.0, 1);
    });

    it('should calculate accurate contrast ratio for white against white (1:1)', () => {
      const contrast = themeStudio.calculateContrastAgainstWhite('#FFFFFF');
      expect(contrast).toBeCloseTo(1.0, 1);
    });
  });

  describe('Auto-Darkening Compliance Algorithm', () => {
    it('should automatically darken a pastel color until contrast ratio >= 4.5:1', () => {
      const lightPastel = '#E0F2FE'; // Very light cyan (~1.1:1 ratio against white)
      const initialRatio = themeStudio.calculateContrastAgainstWhite(lightPastel);
      expect(initialRatio).toBeLessThan(4.5);

      const compliantHex = themeStudio.darkenHexUntilCompliant(lightPastel, 4.5);
      const adjustedRatio = themeStudio.calculateContrastAgainstWhite(compliantHex);

      expect(adjustedRatio).toBeGreaterThanOrEqual(4.5);
    });

    it('should return obsidian fallback when target ratio is impossible', () => {
      const fallback = themeStudio.darkenHexUntilCompliant('#FFFFFF', 999);
      expect(fallback).toBe('#1A1A1A');
    });
  });

  describe('Hex & RGB Conversions', () => {
    it('should convert valid hex codes to RGB channels accurately', () => {
      const rgb = themeStudio.hexToRgb('#1A2B3C');
      expect(rgb).toEqual({ r: 26, g: 43, b: 60 });
    });

    it('should throw error on invalid hex strings', () => {
      expect(() => themeStudio.hexToRgb('#XYZ')).toThrow();
    });

    it('should clamp RGB values when converting back to hex', () => {
      const hex = themeStudio.rgbToHex(300, -10, 255);
      expect(hex).toBe('#FF00FF');
    });
  });
});
