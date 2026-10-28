import { VendorProcurement } from '../../src/core/engine/vendor-procurement';
import { EventType } from '../../src/core/domain/event.types';

describe('VendorProcurement - Deliverable Matrices & One-Click RFP Engine', () => {
  let procurement: VendorProcurement;

  beforeEach(() => {
    procurement = new VendorProcurement();
  });

  const eventGenres: EventType[] = ['wedding', 'birthday', 'community'];

  it.each(eventGenres)(
    'should generate comprehensive vendor matrices and one-click RFPs for %s',
    (eventType) => {
      const vendors = procurement.generate(eventType, 150, '2027-05-18');

      expect(vendors.length).toBeGreaterThanOrEqual(3);

      for (const vendor of vendors) {
        expect(vendor.id).toMatch(/^vnd-/);
        expect(vendor.category).toBeTruthy();
        expect(vendor.deliverables.length).toBeGreaterThan(0);
        expect(vendor.rfpBrief).toContain('REQUEST FOR PROPOSAL');
        expect(vendor.rfpBrief).toContain('Scope of Work');
        expect(vendor.rfpBrief).toContain('Compliance & Submission Standards');
      }
    }
  );

  it('should include catering with dietary matrix and insurance for weddings', () => {
    const vendors = procurement.generate('wedding', 200, '2027-06-20', 'Grand Estate');
    const catering = vendors.find((v) => v.category.toLowerCase().includes('catering'))!;

    expect(catering).toBeDefined();
    expect(catering.deliverables.some((d) => d.toLowerCase().includes('dietary'))).toBe(true);
    expect(catering.rfpBrief).toContain('Grand Estate');
  });

  it('should include stage and safety vendor specifications for community events', () => {
    const vendors = procurement.generate('community', 1200, '2027-07-04', 'Covered Stage with Rigging');
    const avVendor = vendors.find((v) => v.category.toLowerCase().includes('stage'))!;
    const safetyVendor = vendors.find((v) => v.category.toLowerCase().includes('safety'))!;

    expect(avVendor).toBeDefined();
    expect(safetyVendor).toBeDefined();
    expect(safetyVendor.rfpBrief).toContain('Incident Action Plan');
  });
});
