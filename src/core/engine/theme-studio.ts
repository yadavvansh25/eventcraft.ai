import { ColorToken, CreativeSuite, EventType } from '../domain/event.types';

/**
 * ThemeStudio: WCAG 2.1 AA Relative Luminance & Accessible Contrast Engine
 * Computes exact sRGB relative luminance and contrast ratios against white (#FFFFFF).
 * Formulates harmonious palettes with mathematical compliance guarantees (Ratio >= 4.5:1).
 */
export class ThemeStudio {
  /**
   * Generates an accessible creative suite matching event typology and tone.
   */
  public generate(
    eventType: EventType,
    tone: string = 'Sophisticated',
    lightingContext: string = 'indoor'
  ): CreativeSuite {
    const rawPalette = this.getBaselinePalette(eventType, tone, lightingContext);

    // Validate and enforce WCAG 2.1 AA compliance (ratio >= 4.5:1 against white)
    const compliantTokens: ColorToken[] = rawPalette.colors.map((color) => {
      let currentHex = color.hex;
      let ratio = this.calculateContrastAgainstWhite(currentHex);

      // Deterministic auto-darkening adjustment to guarantee >= 4.5:1 contrast
      if (ratio < 4.5) {
        currentHex = this.darkenHexUntilCompliant(currentHex, 4.5);
        ratio = this.calculateContrastAgainstWhite(currentHex);
      }

      return {
        hex: currentHex.toUpperCase(),
        tokenName: color.tokenName,
        contrastRatioAgainstWhite: Number(ratio.toFixed(2)),
        wcagCompliant: ratio >= 4.5,
      };
    });

    return {
      themeName: rawPalette.themeName,
      colorPalette: compliantTokens,
    };
  }

  /**
   * Parses 6-character hex string to RGB channels [0..255]
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
   * Computes contrast ratio between a given color and pure white (#FFFFFF).
   * Ratio = (1.0 + 0.05) / (L + 0.05)
   */
  public calculateContrastAgainstWhite(hex: string): number {
    const luminance = this.calculateRelativeLuminance(hex);
    const whiteLuminance = 1.0;
    return (whiteLuminance + 0.05) / (luminance + 0.05);
  }

  /**
   * Darkens a color progressively along its RGB vectors until it satisfies minRatio.
   */
  public darkenHexUntilCompliant(hex: string, minRatio: number = 4.5): string {
    const rgb = this.hexToRgb(hex);
    let { r, g, b } = rgb;

    let iterations = 0;
    while (iterations < 100) {
      const currentHex = this.rgbToHex(r, g, b);
      const ratio = this.calculateContrastAgainstWhite(currentHex);
      if (ratio >= minRatio) {
        return currentHex;
      }
      // Scale down RGB channels proportionally
      r = Math.floor(r * 0.92);
      g = Math.floor(g * 0.92);
      b = Math.floor(b * 0.92);
      iterations++;
    }

    return '#1A1A1A'; // Fallback high-contrast obsidian
  }

  public rgbToHex(r: number, g: number, b: number): string {
    const clamp = (val: number): string => {
      const clamped = Math.max(0, Math.min(255, val));
      return clamped.toString(16).padStart(2, '0');
    };
    return `#${clamp(r)}${clamp(g)}${clamp(b)}`.toUpperCase();
  }

  private getBaselinePalette(
    eventType: EventType,
    tone: string,
    lightingContext: string
  ): { themeName: string; colors: Array<{ hex: string; tokenName: string }> } {
    switch (eventType) {
      case 'wedding':
        return {
          themeName: `${tone} Botanical & Tuscan Opulence (${lightingContext})`,
          colors: [
            { hex: '#1C3127', tokenName: 'Deep Eucalyptus Evergreen' },
            { hex: '#581825', tokenName: 'Opulent Cabernet Merlot' },
            { hex: '#D4AF37', tokenName: 'Tuscan Accented Gold' }, // Requires auto-darkening to satisfy 4.5:1
            { hex: '#2C2A29', tokenName: 'Charcoal Slate Foundation' },
          ],
        };
      case 'birthday':
        return {
          themeName: `${tone} Neon Twilight & Cosmic Violet (${lightingContext})`,
          colors: [
            { hex: '#3B185F', tokenName: 'Deep Ultraviolet Nebula' },
            { hex: '#1A2A6C', tokenName: 'Galactic Cobalt Navy' },
            { hex: '#7A1C3E', tokenName: 'Neon Crimson Flare' },
            { hex: '#1E1E24', tokenName: 'Obsidian Night Void' },
          ],
        };
      case 'community':
        return {
          themeName: `${tone} Civic High-Visibility & Sustainable Canopy (${lightingContext})`,
          colors: [
            { hex: '#14422B', tokenName: 'Civic Forest Canopy' },
            { hex: '#0B3C5D', tokenName: 'High-Visibility Pacific Blue' },
            { hex: '#5E2B0C', tokenName: 'Terracotta Earth Brick' },
            { hex: '#212529', tokenName: 'Industrial Asphalt Anthracite' },
          ],
        };
    }
  }
}
