import { BudgetConservationError } from '../domain/errors';
import { AllocationPriority, BudgetItem, BudgetLedger, EventType } from '../domain/event.types';

interface BaselineCategory {
  readonly category: string;
  readonly baseRatio: number; // Decimal (e.g., 0.45 = 45%)
  readonly defaultPriority: AllocationPriority;
}

/**
 * BudgetAllocator: Deterministic Zero-Sum Financial Allocation Engine
 * Enforces strict mathematical conservation of funds:
 * Total = ∑(Allocated_i) + Buffer_Emergency | Variance ≡ 0.00
 * Automatic discrepancy reconciliation into Contingency / Emergency Buffer.
 */
export class BudgetAllocator {
  // Baseline industry allocation distributions per event typology
  private static readonly BASELINE_RATIOS: Record<EventType, readonly BaselineCategory[]> = {
    wedding: [
      { category: 'Venue & Reception Dining', baseRatio: 0.44, defaultPriority: 'must_have' },
      { category: 'Photography & Cinematography', baseRatio: 0.15, defaultPriority: 'must_have' },
      { category: 'Floral & Spatial Decor', baseRatio: 0.12, defaultPriority: 'flexible' },
      { category: 'Live Music & Entertainment', baseRatio: 0.11, defaultPriority: 'flexible' },
      { category: 'Attire, Beauty & Stationery', baseRatio: 0.08, defaultPriority: 'discretionary' },
      { category: 'Contingency & Emergency Buffer', baseRatio: 0.1, defaultPriority: 'must_have' },
    ],
    birthday: [
      { category: 'Venue Hire & Food Catering', baseRatio: 0.48, defaultPriority: 'must_have' },
      { category: 'Entertainment & Interactive Hosts', baseRatio: 0.2, defaultPriority: 'must_have' },
      { category: 'Cake, Confections & Dessert Bar', baseRatio: 0.1, defaultPriority: 'must_have' },
      { category: 'Thematic Decor & Party Favors', baseRatio: 0.12, defaultPriority: 'flexible' },
      { category: 'Photography & Memory Keepsakes', baseRatio: 0.04, defaultPriority: 'discretionary' },
      { category: 'Contingency & Emergency Buffer', baseRatio: 0.06, defaultPriority: 'must_have' },
    ],
    community: [
      { category: 'Staging, Rigging & AV Production', baseRatio: 0.28, defaultPriority: 'must_have' },
      { category: 'Safety, Crowd Control & EMS/Sanitation', baseRatio: 0.24, defaultPriority: 'must_have' },
      { category: 'Municipal Permits, City Fees & Licenses', baseRatio: 0.12, defaultPriority: 'must_have' },
      { category: 'Volunteer Hospitality & Logistics Hub', baseRatio: 0.14, defaultPriority: 'flexible' },
      { category: 'Public Signage & Community Outreach', baseRatio: 0.1, defaultPriority: 'discretionary' },
      { category: 'Contingency & Emergency Buffer', baseRatio: 0.12, defaultPriority: 'must_have' },
    ],
  };

  /**
   * Allocates total funds across categories with zero-sum mathematical consistency.
   */
  public allocate(
    totalAmount: number,
    currency: string = 'USD',
    eventType: EventType,
    customPriorities: Record<string, AllocationPriority> = {}
  ): BudgetLedger {
    if (totalAmount <= 0) {
      throw new BudgetConservationError('Total budget must be strictly greater than 0', totalAmount);
    }

    const baseline = BudgetAllocator.BASELINE_RATIOS[eventType];
    const normalizedCurrency = currency.toUpperCase();

    // 1. Compute dynamic weights based on priority overrides
    const weightedCategories = baseline.map((item) => {
      const priority = customPriorities[item.category] ?? item.defaultPriority;
      let multiplier = 1.0;
      if (priority === 'must_have') multiplier = 1.15;
      else if (priority === 'discretionary') multiplier = 0.85;

      return {
        category: item.category,
        weight: item.baseRatio * multiplier,
        priority,
      };
    });

    // 2. Normalize weights so sum of weights equals 1.0
    const totalWeight = weightedCategories.reduce((acc, curr) => acc + curr.weight, 0);
    const normalizedSplits = weightedCategories.map((item) => ({
      category: item.category,
      ratio: item.weight / totalWeight,
      priority: item.priority,
    }));

    // 3. Compute raw amounts rounded to 2 decimal places
    let allocatedSum = 0;
    const allocations: BudgetItem[] = normalizedSplits.map((item) => {
      const rawAmount = Math.round(totalAmount * item.ratio * 100) / 100;
      allocatedSum += rawAmount;
      return {
        category: item.category,
        amount: rawAmount,
        percentage: 0, // Assigned below
        priority: item.priority,
      };
    });

    // 4. Exact Zero-Sum Reconciliation
    // Allocate any rounding difference (even $0.01) into Contingency / Emergency Buffer
    const variance = Math.round((totalAmount - allocatedSum) * 100) / 100;
    if (Math.abs(variance) > 0.0001) {
      const bufferItem = allocations.find((a) =>
        a.category.toLowerCase().includes('contingency')
      );
      if (bufferItem) {
        bufferItem.amount = Math.round((bufferItem.amount + variance) * 100) / 100;
      }
    }

    // 5. Compute exact percentage representation summing to 100.00%
    let percentageSum = 0;
    allocations.forEach((item) => {
      item.percentage = Math.round((item.amount / totalAmount) * 10000) / 100;
      percentageSum += item.percentage;
    });

    const percentVariance = Math.round((100.0 - percentageSum) * 100) / 100;
    if (Math.abs(percentVariance) > 0.0001) {
      const bufferItem = allocations.find((a) =>
        a.category.toLowerCase().includes('contingency')
      );
      if (bufferItem) {
        bufferItem.percentage = Math.round((bufferItem.percentage + percentVariance) * 100) / 100;
      }
    }

    // 6. Strict Verification Pass
    const finalAllocatedTotal = allocations.reduce((sum, item) => sum + item.amount, 0);
    const finalVariance = Math.abs(Math.round((totalAmount - finalAllocatedTotal) * 100) / 100);

    if (finalVariance > 0.0001) {
      throw new BudgetConservationError(
        `Mathematical conservation breach: Total (${totalAmount}) != Sum of allocations (${finalAllocatedTotal}). Variance: ${finalVariance}`,
        finalVariance
      );
    }

    return {
      totalAmount,
      currency: normalizedCurrency,
      allocations,
    };
  }
}
