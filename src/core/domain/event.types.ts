/**
 * Domain types and interfaces for EventCraft AI
 */

export type EventType = 'wedding' | 'birthday' | 'community';

export type AllocationPriority = 'must_have' | 'flexible' | 'discretionary';

export interface RawEventRequest {
  eventType: EventType;
  budget: number;
  currency?: string;
  guests: number;
  targetDate: string;
  userNotes?: string;
  categoryPriorities?: Record<string, AllocationPriority>;
  venueType?: string;
  stagingNeeds?: string;
  tone?: string;
  lightingContext?: 'indoor' | 'outdoor_day' | 'outdoor_night' | 'ballroom' | 'park';
}

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
    piiRedactedCount: number;
    detectedPiiTypes: readonly string[];
    injectionNeutralized: boolean;
  };
}

export interface BudgetItem {
  category: string;
  amount: number;
  percentage: number;
  priority: AllocationPriority;
}

export interface BudgetLedger {
  totalAmount: number;
  currency: string;
  allocations: BudgetItem[];
}

export interface TimelineMilestone {
  stage: string;
  offsetDays: number;
  title: string;
  actionItems: string[];
  ariaAnnouncement: string;
}

export interface VendorDeliverable {
  id: string;
  category: string;
  deliverables: string[];
  rfpBrief: string;
}

export interface ColorToken {
  hex: string;
  tokenName: string;
  contrastRatioAgainstWhite: number;
  wcagCompliant: boolean;
}

export interface CreativeSuite {
  themeName: string;
  colorPalette: ColorToken[];
}

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
