import { z } from 'zod';
import { EventPlan, BudgetSplit } from '../types/event.types';

export class ValidationError extends Error {
  public readonly issues: unknown[];

  constructor(message: string, issues: unknown[] = []) {
    super(message);
    this.name = 'ValidationError';
    this.issues = issues;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class BudgetConservationError extends ValidationError {
  public readonly variance: number;

  constructor(message: string, variance: number) {
    super(message);
    this.name = 'BudgetConservationError';
    this.variance = variance;
  }
}

/**
 * Zod Schema for User Ingestion Request
 */
export const EventPlanRequestSchema = z.object({
  eventType: z.enum(['wedding', 'birthday', 'community']),
  budget: z.number().positive('Budget must be strictly positive'),
  currency: z.string().min(1).default('USD'),
  guests: z.number().int().min(1, 'Guest count must be at least 1'),
  targetDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'targetDate must be in YYYY-MM-DD format'),
  userNotes: z.string().max(2000).optional().default(''),
  categoryPriorities: z
    .record(z.enum(['must_have', 'flexible', 'discretionary']))
    .optional()
    .default({}),
  venueType: z.string().optional().default('General Venue'),
  stagingNeeds: z.string().optional().default('Standard'),
  tone: z.string().optional().default('Sophisticated and Memorable'),
  lightingContext: z
    .enum(['indoor', 'outdoor_day', 'outdoor_night', 'ballroom', 'park'])
    .optional()
    .default('indoor'),
});

/**
 * Zod Schema for Budget Line Item
 */
export const BudgetSplitSchema = z.object({
  category: z.string().min(1),
  amount: z.number().nonnegative('Line item amount cannot be negative'),
  percentage: z.number().min(0).max(100),
  priority: z.enum(['must_have', 'flexible', 'discretionary']),
});

/**
 * Zod Schema for Budget Ledger with Mathematical Conservation Verification
 */
export const BudgetLedgerSchema = z
  .object({
    totalAmount: z.number().positive('Total budget must be strictly positive'),
    currency: z.string().min(1),
    allocations: z.array(BudgetSplitSchema).min(1, 'Must contain at least 1 allocation item'),
  })
  .refine(
    (ledger) => {
      const sumAllocated = ledger.allocations.reduce((sum, item) => sum + item.amount, 0);
      const variance = Math.abs(Math.round((ledger.totalAmount - sumAllocated) * 100) / 100);
      return variance <= 0.01;
    },
    {
      message: 'Mathematical conservation check failed: Sum of all allocations must equal total budget exactly (Variance ≡ 0.00)',
    }
  );

/**
 * Zod Schema for Accessibility Metadata
 */
export const AccessibilityMetaSchema = z.object({
  ariaLive: z.enum(['polite', 'assertive', 'off']),
  ariaLabel: z.string().min(1),
  focusIndex: z.number().int().nonnegative(),
});

/**
 * Zod Schema for Timeline Milestones
 */
export const TimelineMilestoneSchema = z.object({
  stage: z.string().min(1),
  offsetDays: z.number(),
  title: z.string().min(1),
  taskPriority: z.enum(['must_have', 'flexible', 'discretionary']),
  actionItems: z.array(z.string().min(1)).min(1),
  accessibility: AccessibilityMetaSchema,
  ariaAnnouncement: z.string().optional(),
});

/**
 * Zod Schema for Vendor Checklist Item
 */
export const VendorChecklistItemSchema = z.object({
  id: z.string().min(1),
  role: z.string().min(1),
  category: z.string().min(1),
  deliverables: z.array(z.string().min(1)).min(1),
  status: z.enum(['pending_rfp', 'outreach', 'quoted', 'contracted']),
  rfpBrief: z.string().min(1),
});

/**
 * Zod Schema for Color Token
 */
export const ColorTokenSchema = z.object({
  hex: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Must be a 6-character hex code'),
  tokenName: z.string().min(1),
  contrastRatioAgainstWhite: z.number().positive(),
  wcagCompliant: z.boolean(),
  isLargeElementOnly: z.boolean().optional(),
});

/**
 * Zod Schema for Creative Theme
 */
export const CreativeThemeSchema = z.object({
  themeName: z.string().optional(),
  vibeName: z.string().min(1),
  narrative: z.string().min(1),
  colorPalette: z.array(ColorTokenSchema).min(1),
});

/**
 * Zod Schema for Accessibility Manifest
 */
export const AccessibilityManifestSchema = z.object({
  wcagLevel: z.string().min(1),
  contrastSummary: z.string().min(1),
  keyboardNavigationMap: z.array(
    z.object({
      key: z.string().min(1),
      action: z.string().min(1),
      targetStage: z.string().min(1),
    })
  ).min(1),
  screenReaderNotes: z.array(z.string().min(1)).min(1),
});

/**
 * Complete Aggregate EventPlan Schema
 */
export const EventPlanSchema = z.object({
  planId: z.string().min(1),
  eventType: z.enum(['wedding', 'birthday', 'community']),
  budget: BudgetLedgerSchema,
  timeline: z.array(TimelineMilestoneSchema).min(1),
  vendorChecklist: z.array(VendorChecklistItemSchema).min(1),
  creativeSuite: CreativeThemeSchema,
  accessibility: AccessibilityManifestSchema,
});

export type ValidatedRequestPayload = z.infer<typeof EventPlanRequestSchema>;

/**
 * EventValidator Utility
 */
export class EventValidator {
  public static validateRequest(input: unknown): ValidatedRequestPayload {
    const result = EventPlanRequestSchema.safeParse(input);
    if (!result.success) {
      throw new ValidationError(
        'Invalid event request payload: validation constraints breached.',
        result.error.issues
      );
    }
    return result.data;
  }

  public static validatePlan(plan: unknown): EventPlan {
    const result = EventPlanSchema.safeParse(plan);
    if (!result.success) {
      throw new ValidationError(
        'Output plan violates unified EventPlan schema contract.',
        result.error.issues
      );
    }
    return result.data;
  }

  public static verifyBudgetConservation(
    totalBudget: number,
    allocations: BudgetSplit[]
  ): { conserved: boolean; variance: number } {
    const sum = allocations.reduce((acc, curr) => acc + curr.amount, 0);
    const variance = Math.abs(Math.round((totalBudget - sum) * 100) / 100);

    if (variance > 0.01) {
      throw new BudgetConservationError(
        `Budget conservation breach: Total (${totalBudget}) != sum of allocations (${sum}). Discrepancy: ${variance}`,
        variance
      );
    }

    return { conserved: true, variance: 0.0 };
  }
}
