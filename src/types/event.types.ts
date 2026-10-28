/**
 * EventCraft AI - Core Domain Types, Enums & Accessibility Metadata
 * Strictly compliant with EventCraft AI PRD & Architecture Specification
 */

export type EventType = 'wedding' | 'birthday' | 'community';

export type AllocationPriority = 'must_have' | 'flexible' | 'discretionary';

export type VendorStatus = 'pending_rfp' | 'outreach' | 'quoted' | 'contracted';

export type AriaLiveMode = 'polite' | 'assertive' | 'off';

export type WCAGLevel = 'AAA' | 'AA' | 'FAIL';

/**
 * Accessibility metadata for ARIA screen-reader orchestration
 */
export interface AccessibilityMeta {
  readonly ariaLive: AriaLiveMode;
  readonly ariaLabel: string;
  readonly ariaDescription?: string | undefined;
  readonly focusIndex: number;
}

/**
 * Budget line item with mathematical split conservation
 */
export interface BudgetSplit {
  category: string;
  amount: number;
  percentage: number;
  priority: AllocationPriority;
}

/**
 * Full budget breakdown ledger
 */
export interface BudgetLedger {
  totalAmount: number;
  currency: string;
  allocations: BudgetSplit[];
}

/**
 * Reverse-chronological timeline milestone
 */
export interface TimelineMilestone {
  stage: string;
  offsetDays: number; // e.g. -90, -60, -30, -14, -7, -1, 0 (Day-0)
  title: string;
  taskPriority: AllocationPriority;
  actionItems: string[];
  accessibility: AccessibilityMeta;
  ariaAnnouncement?: string | undefined;
}

/**
 * Vendor procurement item with auto-generated RFP
 */
export interface VendorChecklistItem {
  id: string;
  role: string;
  category: string;
  deliverables: string[];
  status: VendorStatus;
  rfpBrief: string;
}

/**
 * WCAG-verified color design token
 */
export interface ColorToken {
  hex: string;
  tokenName: string;
  contrastRatioAgainstWhite: number;
  contrastRatioAgainstBlack?: number | undefined;
  wcagCompliant: boolean;
  wcagLevel?: WCAGLevel | undefined;
  isLargeElementOnly?: boolean | undefined;
}

/**
 * Creative sensory suite & styling tokens
 */
export interface CreativeTheme {
  themeName?: string | undefined;
  vibeName: string;
  narrative: string;
  colorPalette: ColorToken[];
}

/**
 * Comprehensive physical and digital accessibility manifest
 */
export interface KeyboardNavigationStep {
  key: string;
  action: string;
  targetStage: string;
}

export interface AccessibilityManifest {
  wcagLevel: string;
  contrastSummary: string;
  keyboardNavigationMap: KeyboardNavigationStep[];
  screenReaderNotes: string[];
}

/**
 * Full EventPlan Aggregate Deliverable Contract
 */
export interface EventPlan {
  planId: string;
  eventType: EventType;
  budget: BudgetLedger;
  timeline: TimelineMilestone[];
  vendorChecklist: VendorChecklistItem[];
  creativeSuite: CreativeTheme;
  accessibility: AccessibilityManifest;
}

/**
 * User Ingestion Request Interface
 */
export interface EventPlanRequest {
  eventType: EventType;
  budget: number;
  currency?: string | undefined;
  guests: number;
  targetDate: string;
  userNotes?: string | undefined;
  categoryPriorities?: Record<string, AllocationPriority> | undefined;
  venueType?: string | undefined;
  stagingNeeds?: string | undefined;
  tone?: string | undefined;
  lightingContext?: ('indoor' | 'outdoor_day' | 'outdoor_night' | 'ballroom' | 'park') | undefined;
}

/**
 * Sanitized context payload ready for single-pass LLM pipeline
 */
export interface CleanContextPayload {
  readonly planId: string;
  readonly eventType: EventType;
  readonly budget: number;
  readonly currency: string;
  readonly guests: number;
  readonly targetDate: string;
  readonly sanitizedNotes: string;
  readonly categoryPriorities: Record<string, AllocationPriority>;
  readonly venueType: string;
  readonly stagingNeeds: string;
  readonly tone: string;
  readonly lightingContext: 'indoor' | 'outdoor_day' | 'outdoor_night' | 'ballroom' | 'park';
  readonly securityAudit: {
    readonly piiRedactedCount: number;
    readonly detectedPiiTypes: readonly string[];
    readonly injectionNeutralized: boolean;
  };
}

/**
 * Unified generation execution result
 */
export interface GenerationResult {
  readonly plan: EventPlan;
  readonly executionTimeMs: number;
  readonly cleanContext: CleanContextPayload;
  readonly fromCache?: boolean | undefined;
}
