import { BudgetConservationError, SchemaValidationError } from '../domain/errors';
import { CleanContextPayload, RawEventRequest } from '../domain/event.types';
import { EventCraftPlan, EventCraftPlanSchema, EventPlanRequestSchema } from '../domain/plan.schema';
import { DeterministicLLMProvider } from '../llm/deterministic-llm-provider';
import { ILLMProvider } from '../llm/llm-provider.interface';
import { PIISanitizer } from '../security/pii-sanitizer';
import { PromptGuard } from '../security/prompt-guard';
import { IPIISanitizer, IPromptGuard } from '../security/security.interface';

export interface PlanSynthesisResult {
  readonly plan: EventCraftPlan;
  readonly executionTimeMs: number;
  readonly cleanContext: CleanContextPayload;
}

/**
 * EventCraftEngine: Autonomous Planning Engine Orchestrator
 * Coordinates Ingestion & Guard, Budget Allocator, Reverse Timeline,
 * Vendor Procurement, Theme Studio, and Deterministic Verification Layer.
 */
export class EventCraftEngine {
  constructor(
    private readonly piiSanitizer: IPIISanitizer = new PIISanitizer(),
    private readonly promptGuard: IPromptGuard = new PromptGuard(),
    private readonly llmProvider: ILLMProvider = new DeterministicLLMProvider()
  ) {}

  /**
   * Primary entry point: Synthesizes production-ready event architecture from raw user intent.
   */
  public async synthesize(request: RawEventRequest): Promise<PlanSynthesisResult> {
    const startTime = performance.now();

    // 1. Ingestion & Schema Validation
    const parseResult = EventPlanRequestSchema.safeParse(request);
    if (!parseResult.success) {
      throw new SchemaValidationError(
        'Input request failed schema validation constraints.',
        parseResult.error.issues
      );
    }
    const validated = parseResult.data;

    // 2. Security Layer - Pass A: PII Sanitization
    const piiResult = this.piiSanitizer.sanitize(validated.userNotes);

    // 3. Security Layer - Pass B: OWASP Prompt Injection Defense
    this.promptGuard.validate(piiResult.sanitizedText);
    const sanitizedNotes = this.promptGuard.neutralize(piiResult.sanitizedText);

    // 4. Clean Context Payload Formation
    const planId = `ecp-${validated.eventType.substring(0, 3)}-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    const cleanContext: CleanContextPayload = {
      planId,
      eventType: validated.eventType,
      budget: validated.budget,
      currency: validated.currency,
      guests: validated.guests,
      targetDate: validated.targetDate,
      sanitizedNotes,
      categoryPriorities: validated.categoryPriorities,
      venueType: validated.venueType,
      stagingNeeds: validated.stagingNeeds,
      tone: validated.tone,
      lightingContext: validated.lightingContext,
      securityAudit: {
        piiRedactedCount: piiResult.redactedCount,
        detectedPiiTypes: piiResult.detectedTypes,
        injectionNeutralized: sanitizedNotes !== piiResult.sanitizedText,
      },
    };

    // 5. GenAI Orchestration Pass
    const rawPlan = await this.llmProvider.generatePlan(cleanContext);

    // 6. Deterministic Verification Layer (Mathematical & Accessibility Audits)
    this.verifyBudgetConservation(rawPlan);
    this.verifyAccessibilityCompliance(rawPlan);

    // 7. Strict Contract Validation
    const schemaValidation = EventCraftPlanSchema.safeParse(rawPlan);
    if (!schemaValidation.success) {
      throw new SchemaValidationError(
        'Engine produced an output payload violating the unified JSON schema contract.',
        schemaValidation.error.issues
      );
    }

    const executionTimeMs = Number((performance.now() - startTime).toFixed(2));

    return {
      plan: schemaValidation.data,
      executionTimeMs,
      cleanContext,
    };
  }

  /**
   * Enforces Total = ∑(Allocated_i) with zero variance (0.00).
   */
  private verifyBudgetConservation(plan: EventCraftPlan): void {
    const total = plan.budget.totalAmount;
    const sumAllocations = plan.budget.allocations.reduce((sum, item) => sum + item.amount, 0);
    const variance = Math.abs(Math.round((total - sumAllocations) * 100) / 100);

    if (variance > 0.0001) {
      throw new BudgetConservationError(
        `Budget conservation failure: Total (${total}) does not match sum of line items (${sumAllocations}). Discrepancy: ${variance}`,
        variance
      );
    }
  }

  /**
   * Verifies that all generated UI color tokens have contrast ratio >= 4.5:1.
   */
  private verifyAccessibilityCompliance(plan: EventCraftPlan): void {
    for (const token of plan.creativeSuite.colorPalette) {
      if (token.contrastRatioAgainstWhite < 4.5 || !token.wcagCompliant) {
        throw new SchemaValidationError(
          `WCAG Compliance Failure: Token ${token.tokenName} (${token.hex}) has contrast ratio ${token.contrastRatioAgainstWhite}:1, below 4.5:1.`
        );
      }
    }
  }
}
