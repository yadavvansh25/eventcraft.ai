import { BudgetAllocator } from '../../src/core/engine/budget-allocator';
import { BudgetConservationError } from '../../src/core/domain/errors';
import { EventType } from '../../src/core/domain/event.types';

describe('BudgetAllocator - Zero-Sum Mathematical Consistency Engine', () => {
  let allocator: BudgetAllocator;

  beforeEach(() => {
    allocator = new BudgetAllocator();
  });

  const eventGenres: EventType[] = ['wedding', 'birthday', 'community'];

  it.each(eventGenres)(
    'should enforce exact zero-sum budget conservation for %s (Variance ≡ 0.00)',
    (eventType) => {
      const totalAmount = 45678.93; // Prime/fractional number testing precision
      const ledger = allocator.allocate(totalAmount, 'USD', eventType);

      expect(ledger.totalAmount).toBe(totalAmount);
      expect(ledger.currency).toBe('USD');
      expect(ledger.allocations.length).toBeGreaterThan(0);

      const sumAllocated = ledger.allocations.reduce((acc, curr) => acc + curr.amount, 0);
      const variance = Math.abs(Math.round((totalAmount - sumAllocated) * 100) / 100);

      expect(variance).toBe(0.0);
    }
  );

  it('should reconcile percentages to sum to exactly 100.00%', () => {
    const totalAmount = 19999.99;
    const ledger = allocator.allocate(totalAmount, 'USD', 'wedding');

    const totalPercentage = ledger.allocations.reduce((acc, curr) => acc + curr.percentage, 0);
    expect(Math.round(totalPercentage * 100) / 100).toBe(100.0);
  });

  it('should dynamically shift allocations based on custom priority overrides', () => {
    const totalAmount = 50000;
    const defaultLedger = allocator.allocate(totalAmount, 'USD', 'wedding');
    const defaultDecor = defaultLedger.allocations.find((a) =>
      a.category.includes('Floral & Spatial Decor')
    )!;

    // Boost Floral to must_have
    const prioritizedLedger = allocator.allocate(totalAmount, 'USD', 'wedding', {
      'Floral & Spatial Decor': 'must_have',
    });
    const boostedDecor = prioritizedLedger.allocations.find((a) =>
      a.category.includes('Floral & Spatial Decor')
    )!;

    expect(boostedDecor.amount).toBeGreaterThan(defaultDecor.amount);
    expect(boostedDecor.priority).toBe('must_have');

    // Conservation still holds
    const sum = prioritizedLedger.allocations.reduce((acc, curr) => acc + curr.amount, 0);
    expect(Math.abs(Math.round((totalAmount - sum) * 100) / 100)).toBe(0.0);
  });

  it('should auto-absorb rounding discrepancies into Contingency Buffer', () => {
    // 33333.33 will produce recurring cents in floating point math
    const totalAmount = 33333.33;
    const ledger = allocator.allocate(totalAmount, 'EUR', 'community');

    const contingency = ledger.allocations.find((a) =>
      a.category.toLowerCase().includes('contingency')
    );
    expect(contingency).toBeDefined();

    const sum = ledger.allocations.reduce((acc, curr) => acc + curr.amount, 0);
    expect(Math.round(sum * 100) / 100).toBe(totalAmount);
  });

  it('should throw BudgetConservationError on negative or zero budget amounts', () => {
    expect(() => allocator.allocate(0, 'USD', 'wedding')).toThrow(BudgetConservationError);
    expect(() => allocator.allocate(-500, 'USD', 'birthday')).toThrow(BudgetConservationError);
  });
});
