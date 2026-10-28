/**
 * Security interfaces for PII Sanitization and Prompt Injection Defense
 */

export interface SanitizationResult {
  readonly sanitizedText: string;
  readonly redactedCount: number;
  readonly detectedTypes: readonly string[];
}

export interface IPIISanitizer {
  sanitize(input: string): SanitizationResult;
}

export interface GuardAnalysis {
  readonly isSafe: boolean;
  readonly riskScore: number; // 0 to 1
  readonly detectedThreats: readonly string[];
  readonly sanitizedDirective: string;
}

export interface IPromptGuard {
  validate(input: string): void;
  analyze(input: string): GuardAnalysis;
  neutralize(input: string): string;
}
