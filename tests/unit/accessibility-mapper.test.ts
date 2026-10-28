import { AccessibilityMapper } from '../../src/core/engine/accessibility-mapper';
import { ColorToken, EventType } from '../../src/core/domain/event.types';

describe('AccessibilityMapper - WCAG 2.1 AA Compliance Architect', () => {
  let mapper: AccessibilityMapper;

  beforeEach(() => {
    mapper = new AccessibilityMapper();
  });

  const dummyTokens: ColorToken[] = [
    { hex: '#1C3127', tokenName: 'Deep Evergreen', contrastRatioAgainstWhite: 10.42, wcagCompliant: true },
    { hex: '#581825', tokenName: 'Opulent Merlot', contrastRatioAgainstWhite: 9.15, wcagCompliant: true },
  ];

  it('should formulate WCAG 2.1 AA level metadata and contrast summary', () => {
    const manifest = mapper.generate('wedding', dummyTokens, 120);

    expect(manifest.wcagLevel).toBe('WCAG 2.1 AA Compliant');
    expect(manifest.contrastSummary).toContain('strictly exceed the WCAG 2.1 AA normal text contrast threshold');
    expect(manifest.contrastSummary).toContain('9.15:1');
  });

  it('should fallback to 4.5 ratio when empty token array is provided', () => {
    const manifest = mapper.generate('wedding', [], 100);
    expect(manifest.contrastSummary).toContain('4.5:1');
  });

  it('should construct sequential keyboard navigation mappings for arrow keys and tab', () => {
    const manifest = mapper.generate('wedding', dummyTokens, 120);

    const keys = manifest.keyboardNavigationMap.map((k) => k.key);
    expect(keys.some((k) => k.includes('Tab'))).toBe(true);
    expect(keys.some((k) => k.includes('ArrowDown'))).toBe(true);
    expect(keys.some((k) => k.includes('Escape'))).toBe(true);
  });

  const genres: EventType[] = ['wedding', 'birthday', 'community'];

  it.each(genres)('should supply genre-specific screen reader and physical access notes for %s', (genre) => {
    const manifest = mapper.generate(genre, dummyTokens, 250);

    expect(manifest.screenReaderNotes.length).toBeGreaterThanOrEqual(4);
    expect(manifest.screenReaderNotes.some((n) => n.includes('aria-'))).toBe(true);
  });
});
