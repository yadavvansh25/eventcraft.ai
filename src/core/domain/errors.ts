/**
 * Domain errors for EventCraft AI Engine
 */

export class EventCraftError extends Error {
  public readonly code: string;

  constructor(message: string, code: string = 'EVENTCRAFT_ERROR') {
    super(message);
    this.name = 'EventCraftError';
    this.code = code;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class SecurityValidationError extends EventCraftError {
  constructor(message: string, code: string = 'SECURITY_VALIDATION_ERROR') {
    super(message, code);
    this.name = 'SecurityValidationError';
  }
}

export class PromptInjectionError extends SecurityValidationError {
  public readonly detectedVector: string;

  constructor(message: string, detectedVector: string) {
    super(message, 'PROMPT_INJECTION_DETECTED');
    this.name = 'PromptInjectionError';
    this.detectedVector = detectedVector;
  }
}

export class SchemaValidationError extends EventCraftError {
  public readonly validationIssues: unknown[];

  constructor(message: string, issues: unknown[] = []) {
    super(message, 'SCHEMA_VALIDATION_ERROR');
    this.name = 'SchemaValidationError';
    this.validationIssues = issues;
  }
}

export class BudgetConservationError extends EventCraftError {
  public readonly variance: number;

  constructor(message: string, variance: number) {
    super(message, 'BUDGET_CONSERVATION_ERROR');
    this.name = 'BudgetConservationError';
    this.variance = variance;
  }
}
