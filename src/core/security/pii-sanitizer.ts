import { IPIISanitizer, SanitizationResult } from './security.interface';

/**
 * Dual-pass PII Sanitizer
 * Masks sensitive personal data (phone numbers, emails, SSNs, credit cards)
 * with `[REDACTED]` tokens to prevent data leakage in LLM contexts.
 */
export class PIISanitizer implements IPIISanitizer {
  // Regex definitions for high-confidence PII entities
  private static readonly EMAIL_REGEX =
    /[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+/g;

  // Handles standard US and international telephone numbers (+1-555-555-5555, (555) 555-5555, +44 7911 123456, 555.234.5678, etc.)
  private static readonly PHONE_REGEX =
    /(?:\+?\d{1,3}[-.\s]?)?(?:\(?\d{2,4}\)?[-.\s]?)\d{3,4}[-.\s]?\d{3,5}(?!\d)/g;

  private static readonly SSN_REGEX = /\b(?!000|666|9\d{2})\d{3}-(?!00)\d{2}-(?!0000)\d{4}\b/g;

  // Standard credit card patterns (Visa, Mastercard, Amex, Discover)
  private static readonly CREDIT_CARD_REGEX =
    /\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|6(?:011|5[0-9]{2})[0-9]{12}|(?:[0-9]{4}[-\s]){3}[0-9]{4})\b/g;

  // Pass-2 Contextual Name and Personal Handle Redaction
  private static readonly CONTEXTUAL_PII_REGEX =
    /(?:call\s+|contact\s+|planner:\s*|organizer:\s*|reach\s+out\s+to\s+)([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?|\[REDACTED\])\b/g;

  public sanitize(input: string): SanitizationResult {
    if (!input || typeof input !== 'string') {
      return {
        sanitizedText: '',
        redactedCount: 0,
        detectedTypes: [],
      };
    }

    const detectedTypesSet = new Set<string>();
    let redactedCount = 0;

    // --- Pass 1: High-Confidence Regex Scrubbing ---
    let currentText = input;

    // Redact Credit Cards
    currentText = currentText.replace(PIISanitizer.CREDIT_CARD_REGEX, () => {
      redactedCount++;
      detectedTypesSet.add('credit_card');
      return '[REDACTED]';
    });

    // Redact SSNs
    currentText = currentText.replace(PIISanitizer.SSN_REGEX, () => {
      redactedCount++;
      detectedTypesSet.add('ssn');
      return '[REDACTED]';
    });

    // Redact Emails
    currentText = currentText.replace(PIISanitizer.EMAIL_REGEX, () => {
      redactedCount++;
      detectedTypesSet.add('email');
      return '[REDACTED]';
    });

    // Redact Phone Numbers
    currentText = currentText.replace(PIISanitizer.PHONE_REGEX, () => {
      redactedCount++;
      detectedTypesSet.add('phone');
      return '[REDACTED]';
    });

    // --- Pass 2: Contextual PII Scrubbing ---
    currentText = currentText.replace(
      PIISanitizer.CONTEXTUAL_PII_REGEX,
      (match, capturedName: string) => {
        // Only redact if the captured name isn't already [REDACTED]
        if (capturedName.includes('[REDACTED]')) {
          return match;
        }
        redactedCount++;
        detectedTypesSet.add('contact_name');
        return match.replace(capturedName, '[REDACTED]');
      }
    );

    return {
      sanitizedText: currentText,
      redactedCount,
      detectedTypes: Array.from(detectedTypesSet),
    };
  }
}
