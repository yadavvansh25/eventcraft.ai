import { z } from 'zod';

/**
 * Zod Schema for input raw event request
 */
export const EventPlanRequestSchema = z.object({
  eventType: z.enum(['wedding', 'birthday', 'community']),
  budget: z.number().positive('Budget must be greater than 0'),
  currency: z.string().min(1).default('USD'),
  guests: z.number().int().positive('Guest count must be at least 1'),
  targetDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'targetDate must be in YYYY-MM-DD format'),
  userNotes: z.string().max(2000, 'User notes must not exceed 2000 characters').optional().default(''),
  categoryPriorities: z
    .record(z.enum(['must_have', 'flexible', 'discretionary']))
    .optional()
    .default({}),
  venueType: z.string().optional().default('General Venue'),
  stagingNeeds: z.string().optional().default('Standard'),
  tone: z.string().optional().default('Elegant and Memorable'),
  lightingContext: z
    .enum(['indoor', 'outdoor_day', 'outdoor_night', 'ballroom', 'park'])
    .optional()
    .default('indoor'),
});

export type ValidatedPlanRequest = z.infer<typeof EventPlanRequestSchema>;

/**
 * Unified Data Contract Schema matching EventCraft PRD Section 5
 */
export const BudgetItemSchema = z.object({
  category: z.string().min(1),
  amount: z.number().nonnegative(),
  percentage: z.number().min(0).max(100),
  priority: z.enum(['must_have', 'flexible', 'discretionary']),
});

export const BudgetSchema = z.object({
  totalAmount: z.number().positive(),
  currency: z.string().min(1),
  allocations: z.array(BudgetItemSchema).min(1),
});

export const TimelineMilestoneSchema = z.object({
  stage: z.string().min(1),
  offsetDays: z.number(),
  title: z.string().min(1),
  actionItems: z.array(z.string().min(1)).min(1),
  ariaAnnouncement: z.string().min(1),
});

export const VendorChecklistItemSchema = z.object({
  id: z.string().min(1),
  category: z.string().min(1),
  deliverables: z.array(z.string().min(1)).min(1),
  rfpBrief: z.string().min(1),
});

export const ColorTokenSchema = z.object({
  hex: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Must be a 6-character hex code'),
  tokenName: z.string().min(1),
  contrastRatioAgainstWhite: z.number().positive(),
  wcagCompliant: z.boolean(),
});

export const CreativeSuiteSchema = z.object({
  themeName: z.string().min(1),
  colorPalette: z.array(ColorTokenSchema).min(1),
});

export const KeyboardNavigationMapItemSchema = z.object({
  key: z.string().min(1),
  action: z.string().min(1),
  targetStage: z.string().min(1),
});

export const AccessibilitySchema = z.object({
  wcagLevel: z.string().min(1),
  contrastSummary: z.string().min(1),
  keyboardNavigationMap: z.array(KeyboardNavigationMapItemSchema).min(1),
  screenReaderNotes: z.array(z.string().min(1)).min(1),
});

export const EventCraftPlanSchema = z.object({
  planId: z.string().min(1),
  eventType: z.enum(['wedding', 'birthday', 'community']),
  budget: BudgetSchema,
  timeline: z.array(TimelineMilestoneSchema).min(1),
  vendorChecklist: z.array(VendorChecklistItemSchema).min(1),
  creativeSuite: CreativeSuiteSchema,
  accessibility: AccessibilitySchema,
});

export type EventCraftPlan = z.infer<typeof EventCraftPlanSchema>;
