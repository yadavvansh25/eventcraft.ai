import { AccessibilityMapper } from '../engine/accessibility-mapper';
import { BudgetAllocator } from '../engine/budget-allocator';
import { ReverseTimeline } from '../engine/reverse-timeline';
import { ThemeStudio } from '../engine/theme-studio';
import { VendorProcurement } from '../engine/vendor-procurement';
import { CleanContextPayload } from '../domain/event.types';
import { EventCraftPlan } from '../domain/plan.schema';
import { ILLMProvider } from './llm-provider.interface';

/**
 * DeterministicLLMProvider: Ultra-fast, single-pass synthesis engine
 * Produces strictly validated, mathematically conserved EventCraftPlan payloads
 * without network latency, nondeterministic drift, or JSON parsing retries.
 */
export class DeterministicLLMProvider implements ILLMProvider {
  constructor(
    private readonly budgetAllocator: BudgetAllocator = new BudgetAllocator(),
    private readonly reverseTimeline: ReverseTimeline = new ReverseTimeline(),
    private readonly vendorProcurement: VendorProcurement = new VendorProcurement(),
    private readonly themeStudio: ThemeStudio = new ThemeStudio(),
    private readonly accessibilityMapper: AccessibilityMapper = new AccessibilityMapper()
  ) {}

  public async generatePlan(context: CleanContextPayload): Promise<EventCraftPlan> {
    // 1. Budget Allocation (Strict zero-sum variance)
    const budget = this.budgetAllocator.allocate(
      context.budget,
      context.currency,
      context.eventType,
      context.categoryPriorities
    );

    // 2. Chronological Milestones & Day-0 Run-of-Show
    const timeline = this.reverseTimeline.generate(
      context.eventType,
      context.targetDate,
      context.guests,
      8
    );

    // 3. Vendor Procurement & One-Click RFP Briefs
    const vendorChecklist = this.vendorProcurement.generate(
      context.eventType,
      context.guests,
      context.targetDate,
      context.venueType,
      context.stagingNeeds
    );

    // 4. Accessible Theme Studio (WCAG 2.1 AA luminance verified)
    const creativeSuite = this.themeStudio.generate(
      context.eventType,
      context.tone,
      context.lightingContext
    );

    // 5. Accessibility Manifest (ARIA & Navigation Map)
    const accessibility = this.accessibilityMapper.generate(
      context.eventType,
      creativeSuite.colorPalette,
      context.guests
    );

    return {
      planId: context.planId,
      eventType: context.eventType,
      budget,
      timeline,
      vendorChecklist,
      creativeSuite,
      accessibility,
    };
  }
}
