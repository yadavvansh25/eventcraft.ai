import { ReverseTimeline } from '../../src/core/engine/reverse-timeline';
import { EventType } from '../../src/core/domain/event.types';

describe('ReverseTimeline - Chronological Milestones & Run-of-Show Engine', () => {
  let timelineEngine: ReverseTimeline;

  beforeEach(() => {
    timelineEngine = new ReverseTimeline();
  });

  const eventGenres: EventType[] = ['wedding', 'birthday', 'community'];

  it.each(eventGenres)(
    'should generate valid chronological milestones and Day-0 agenda for %s',
    (eventType) => {
      const milestones = timelineEngine.generate(eventType, '2027-06-15', 100, 8);

      expect(milestones.length).toBeGreaterThanOrEqual(5);

      // Verify each milestone satisfies structural integrity
      for (const m of milestones) {
        expect(m.stage).toBeTruthy();
        expect(typeof m.offsetDays).toBe('number');
        expect(m.title).toBeTruthy();
        expect(m.actionItems.length).toBeGreaterThan(0);
        expect(m.ariaAnnouncement).toBeTruthy();
        expect(m.ariaAnnouncement.length).toBeGreaterThan(10);
      }

      // Verify that Day-0 exists with offset 0
      const dayZero = milestones.find((m) => m.stage === 'Day-0');
      expect(dayZero).toBeDefined();
      expect(dayZero?.offsetDays).toBe(0);

      // Verify chronological sorting (negative offsetDays leading up to 0)
      for (let i = 0; i < milestones.length - 1; i++) {
        expect(milestones[i]!.offsetDays).toBeLessThanOrEqual(milestones[i + 1]!.offsetDays);
      }
    }
  );

  it('should include wedding-specific ceremony, reception, and rehearsal milestones', () => {
    const milestones = timelineEngine.generate('wedding', '2027-09-20', 150);
    const dayZero = milestones.find((m) => m.stage === 'Day-0')!;

    const hasCeremony = dayZero.actionItems.some((item) => item.toLowerCase().includes('ceremony'));
    const hasCake = dayZero.actionItems.some((item) => item.toLowerCase().includes('cake cutting'));

    expect(hasCeremony).toBe(true);
    expect(hasCake).toBe(true);
  });

  it('should include community-specific public permits, safety checks, and street closures', () => {
    const milestones = timelineEngine.generate('community', '2027-08-10', 2000);
    const t90 = milestones.find((m) => m.stage === 'T-90')!;
    const dayZero = milestones.find((m) => m.stage === 'Day-0')!;

    const hasPermit = t90.actionItems.some((item) => item.toLowerCase().includes('permit'));
    const hasStreetClosure = dayZero.actionItems.some((item) =>
      item.toLowerCase().includes('barricade') || item.toLowerCase().includes('closure')
    );

    expect(hasPermit).toBe(true);
    expect(hasStreetClosure).toBe(true);
  });
});
