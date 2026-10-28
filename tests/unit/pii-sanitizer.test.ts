import { PIISanitizer } from '../../src/core/security/pii-sanitizer';

describe('PIISanitizer - Dual-Pass Privacy Defense', () => {
  let sanitizer: PIISanitizer;

  beforeEach(() => {
    sanitizer = new PIISanitizer();
  });

  it('should redact standard US phone numbers in various formats', () => {
    const text = 'Call me at 555-839-2910 or (800) 555-0199 or 555.234.5678 today.';
    const result = sanitizer.sanitize(text);

    expect(result.sanitizedText).toBe('Call me at [REDACTED] or [REDACTED] or [REDACTED] today.');
    expect(result.redactedCount).toBe(3);
    expect(result.detectedTypes).toContain('phone');
  });

  it('should redact international phone numbers', () => {
    const text = 'Reach out at +1-555-234-5678 or +44 7911 123456 for coordinator details.';
    const result = sanitizer.sanitize(text);

    expect(result.sanitizedText).not.toContain('+1-555-234-5678');
    expect(result.sanitizedText).not.toContain('+44 7911 123456');
    expect(result.detectedTypes).toContain('phone');
  });

  it('should redact standard and complex email addresses', () => {
    const text = 'Send invoices to planner.lead+event@luxury-weddings.co.uk or admin@eventcraft.io.';
    const result = sanitizer.sanitize(text);

    expect(result.sanitizedText).toBe('Send invoices to [REDACTED] or [REDACTED].');
    expect(result.redactedCount).toBe(2);
    expect(result.detectedTypes).toContain('email');
  });

  it('should redact Social Security Numbers', () => {
    const text = 'Client tax SSN is 123-45-6789 for municipal permit.';
    const result = sanitizer.sanitize(text);

    expect(result.sanitizedText).toBe('Client tax SSN is [REDACTED] for municipal permit.');
    expect(result.detectedTypes).toContain('ssn');
  });

  it('should redact 16-digit credit card numbers', () => {
    const text = 'Card on file: 4111 2222 3333 4444 or 5500-1234-5678-9012.';
    const result = sanitizer.sanitize(text);

    expect(result.sanitizedText).toBe('Card on file: [REDACTED] or [REDACTED].');
    expect(result.detectedTypes).toContain('credit_card');
  });

  it('should redact contextual contact names in Pass 2', () => {
    const text = 'Please contact Jane Doe for staging and call Robert Smith for permits.';
    const result = sanitizer.sanitize(text);

    expect(result.sanitizedText).toContain('contact [REDACTED]');
    expect(result.sanitizedText).toContain('call [REDACTED]');
    expect(result.detectedTypes).toContain('contact_name');
  });

  it('should not re-redact contact names that are already redacted', () => {
    const text = 'Please contact [REDACTED] for staging updates.';
    const result = sanitizer.sanitize(text);

    expect(result.sanitizedText).toBe('Please contact [REDACTED] for staging updates.');
    expect(result.detectedTypes).not.toContain('contact_name');
  });

  it('should handle clean text without false positives', () => {
    const text = 'We desire an outdoor evening gala with acoustic cello accompaniment.';
    const result = sanitizer.sanitize(text);

    expect(result.sanitizedText).toBe(text);
    expect(result.redactedCount).toBe(0);
    expect(result.detectedTypes).toHaveLength(0);
  });

  it('should gracefully handle empty or undefined input', () => {
    // @ts-expect-error testing invalid input types
    const resNull = sanitizer.sanitize(null);
    expect(resNull.sanitizedText).toBe('');
    expect(resNull.redactedCount).toBe(0);

    const resEmpty = sanitizer.sanitize('');
    expect(resEmpty.sanitizedText).toBe('');
  });
});
