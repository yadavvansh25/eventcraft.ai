import { AccessibilityValidator } from '../src/engine/a11yValidator';
import { EventValidator, BudgetConservationError } from '../src/security/validator';
import { DeterministicLLMProvider } from '../src/engine/plannerEngine';
import { CleanContextPayload } from '../src/types/event.types';

describe('Deterministic Math & WCAG 2.1 AA Accessibility Test Suite', () => {
  const a11yValidator = new AccessibilityValidator();
  const deterministicProvider = new DeterministicLLMProvider();

  describe('Mathematical Budget Conservation (Sum = 100% & Total Budget)', () => {
    const testBudgets = [15000, 33333.33, 50000, 99999.99];

    it.each(testBudgets)(
      'should enforce that all budget line items sum to exactly the total budget (%d) with 0 variance',
      async (budget) => {
        const dummyContext: CleanContextPayload = {
          planId: 'ecp-test-01',
          eventType: 'wedding',
          budget,
          currency: 'USD',
          guests: 100,
          targetDate: '2027-06-15',
          sanitizedNotes: '',
          categoryPriorities: {},
          venueType: 'Ballroom',
          stagingNeeds: 'Standard',
          tone: 'Elegant',
          lightingContext: 'indoor',
          securityAudit: { piiRedactedCount: 0, detectedPiiTypes: [], injectionNeutralized: false },
        };

        const plan = await deterministicProvider.generatePlan(dummyContext);
        const sumAllocations = plan.budget.allocations.reduce((sum, item) => sum + item.amount, 0);

        // Exact match with zero variance
        const variance = Math.abs(Math.round((budget - sumAllocations) * 100) / 100);
        expect(variance).toBe(0.0);

        // Verification utility succeeds
        const check = EventValidator.verifyBudgetConservation(plan.budget.totalAmount, plan.budget.allocations);
        expect(check.conserved).toBe(true);
      }
    );

    it('should verify that all budget percentages add up to exactly 100.00%', async () => {
      const dummyContext: CleanContextPayload = {
        planId: 'ecp-test-02',
        eventType: 'birthday',
        budget: 4500,
        currency: 'USD',
        guests: 35,
        targetDate: '2026-12-20',
        sanitizedNotes: '',
        categoryPriorities: {},
        venueType: 'Arcade',
        stagingNeeds: 'Basic',
        tone: 'Vibrant',
        lightingContext: 'indoor',
        securityAudit: { piiRedactedCount: 0, detectedPiiTypes: [], injectionNeutralized: false },
      };

      const plan = await deterministicProvider.generatePlan(dummyContext);
      const sumPercentage = plan.budget.allocations.reduce((sum, item) => sum + item.percentage, 0);

      expect(Math.round(sumPercentage * 100) / 100).toBe(100.0);
    });

    it('should throw BudgetConservationError when line items do not sum to total budget', () => {
      const brokenAllocations = [
        { category: 'Venue', amount: 4000, percentage: 50, priority: 'must_have' as const },
        { category: 'Decor', amount: 3000, percentage: 37.5, priority: 'flexible' as const },
      ]; // Sum = 7000, but total is 8000

      expect(() => EventValidator.verifyBudgetConservation(8000, brokenAllocations)).toThrow(
        BudgetConservationError
      );
    });
  });

  describe('WCAG 2.1 AA Relative Luminance & Contrast Ratios', () => {
    it('should compute exact relative luminance for pure black (0.0) and pure white (1.0)', () => {
      expect(a11yValidator.calculateRelativeLuminance('#000000')).toBeCloseTo(0.0, 4);
      expect(a11yValidator.calculateRelativeLuminance('#FFFFFF')).toBeCloseTo(1.0, 4);
    });

    it('should calculate contrast ratio: black against white is 21:1, white against white is 1:1', () => {
      const blackOnWhite = a11yValidator.calculateContrastRatio('#000000', '#FFFFFF');
      expect(blackOnWhite).toBeCloseTo(21.0, 1);

      const whiteOnWhite = a11yValidator.calculateContrastRatio('#FFFFFF', '#FFFFFF');
      expect(whiteOnWhite).toBeCloseTo(1.0, 1);
    });

    it('should verify compliance thresholds (4.5:1 for normal text, 3.0:1 for large elements)', () => {
      // Default isLargeElement = false
      expect(a11yValidator.isWCAGCompliant(4.5)).toBe(true);
      expect(a11yValidator.isWCAGCompliant(4.49)).toBe(false);

      expect(a11yValidator.isWCAGCompliant(4.5, false)).toBe(true);
      expect(a11yValidator.isWCAGCompliant(4.49, false)).toBe(false);

      expect(a11yValidator.isWCAGCompliant(3.0, true)).toBe(true);
      expect(a11yValidator.isWCAGCompliant(2.99, true)).toBe(false);
    });

    it('should progressively darken light colors until they meet 4.5:1 contrast against white', () => {
      const lightPastel = '#E0F2FE'; // Light pastel cyan (~1.1:1 ratio)
      expect(a11yValidator.calculateContrastAgainstWhite(lightPastel)).toBeLessThan(4.5);

      // Test with default minRatio parameter
      const darkenedDefault = a11yValidator.darkenUntilCompliant(lightPastel);
      expect(a11yValidator.calculateContrastAgainstWhite(darkenedDefault)).toBeGreaterThanOrEqual(4.5);

      // Test with explicit minRatio parameter
      const darkenedCustom = a11yValidator.darkenUntilCompliant(lightPastel, 3.0);
      expect(a11yValidator.calculateContrastAgainstWhite(darkenedCustom)).toBeGreaterThanOrEqual(3.0);
    });

    it('should validate an entire palette and flag non-compliant tokens', () => {
      const compliantPalette = [
        { hex: '#1C3127', tokenName: 'Evergreen', contrastRatioAgainstWhite: 13.8, wcagCompliant: true },
        { hex: '#581825', tokenName: 'Merlot', contrastRatioAgainstWhite: 13.3, wcagCompliant: true },
      ];
      const validCheck = a11yValidator.validatePalette(compliantPalette);
      expect(validCheck.valid).toBe(true);

      const failingPalette = [
        { hex: '#FFFF00', tokenName: 'Pure Yellow', contrastRatioAgainstWhite: 1.07, wcagCompliant: false },
      ];
      const failCheck = a11yValidator.validatePalette(failingPalette);
      expect(failCheck.valid).toBe(false);
      expect(failCheck.summary).toContain('WCAG compliance failure');

      // Test empty palette branch
      const emptyCheck = a11yValidator.validatePalette([]);
      expect(emptyCheck.valid).toBe(false);
      expect(emptyCheck.summary).toContain('Color palette is empty');
    });

    it('should throw error for invalid hex length in hexToRgb', () => {
      expect(() => a11yValidator.hexToRgb('#XYZ')).toThrow(/Invalid hex color string/);
    });

    it('should return fallback obsidian color when contrast ratio is impossible', () => {
      const fallback = a11yValidator.darkenUntilCompliant('#FFFFFF', 999);
      expect(fallback).toBe('#1A1A1A');
    });

    it('should throw ValidationError when validating a malformed plan object', () => {
      expect(() => EventValidator.validatePlan({ planId: '' })).toThrow(/Output plan violates unified/);
    });

    it('should calculate contrast ratio against pure black', () => {
      const whiteAgainstBlack = a11yValidator.calculateContrastAgainstBlack('#FFFFFF');
      expect(whiteAgainstBlack).toBeCloseTo(21.0, 1);
      const blackAgainstBlack = a11yValidator.calculateContrastAgainstBlack('#000000');
      expect(blackAgainstBlack).toBeCloseTo(1.0, 1);
    });

    it('should verify WCAG AAA compliance thresholds and level categorization', () => {
      // Normal text threshold: 7.0:1
      expect(a11yValidator.isWCAGAAACompliant(7.0, false)).toBe(true);
      expect(a11yValidator.isWCAGAAACompliant(6.99, false)).toBe(false);

      // Large elements threshold: 4.5:1
      expect(a11yValidator.isWCAGAAACompliant(4.5, true)).toBe(true);
      expect(a11yValidator.isWCAGAAACompliant(4.49, true)).toBe(false);

      // getWCAGLevel evaluation
      expect(a11yValidator.getWCAGLevel(8.0)).toBe('AAA');
      expect(a11yValidator.getWCAGLevel(5.0)).toBe('AA');
      expect(a11yValidator.getWCAGLevel(2.0)).toBe('FAIL');
    });
  });

  describe('Accessibility Meta Verification in Milestones', () => {
    it('should properly assign aria-live, aria-label, and focusIndex to all milestones', async () => {
      const dummyContext: CleanContextPayload = {
        planId: 'ecp-test-03',
        eventType: 'wedding',
        budget: 30000,
        currency: 'USD',
        guests: 120,
        targetDate: '2027-08-20',
        sanitizedNotes: '',
        categoryPriorities: {},
        venueType: 'Estate',
        stagingNeeds: 'Standard',
        tone: 'Opulent',
        lightingContext: 'indoor',
        securityAudit: { piiRedactedCount: 0, detectedPiiTypes: [], injectionNeutralized: false },
      };

      const plan = await deterministicProvider.generatePlan(dummyContext);

      for (const milestone of plan.timeline) {
        expect(['polite', 'assertive', 'off']).toContain(milestone.accessibility.ariaLive);
        expect(milestone.accessibility.ariaLabel).toBeTruthy();
        expect(milestone.accessibility.focusIndex).toBeGreaterThanOrEqual(1);
      }
    });
  });
});
