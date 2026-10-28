import { EventType, VendorDeliverable } from '../domain/event.types';

/**
 * VendorProcurement: Automated Vendor Deliverables & Request For Proposals (RFP) Engine
 * Generates tailored deliverable matrices and production-ready one-click RFP briefs
 * with clear SLAs, scope, insurance requirements, and response deadlines.
 */
export class VendorProcurement {
  public generate(
    eventType: EventType,
    guestCount: number,
    targetDate: string,
    venueType: string = 'General Venue',
    stagingNeeds: string = 'Standard'
  ): VendorDeliverable[] {
    switch (eventType) {
      case 'wedding':
        return this.buildWeddingVendors(guestCount, targetDate, venueType);
      case 'birthday':
        return this.buildBirthdayVendors(guestCount, targetDate, venueType);
      case 'community':
        return this.buildCommunityVendors(guestCount, targetDate, stagingNeeds);
    }
  }

  private buildWeddingVendors(
    guests: number,
    targetDate: string,
    venue: string
  ): VendorDeliverable[] {
    return [
      {
        id: 'vnd-wed-cat-01',
        category: 'Banquet Catering & Beverage Services',
        deliverables: [
          `Full-service 3-course plated dinner or luxury buffet for ${guests} guests`,
          'Cocktail hour passed hors d’oeuvres (4 selections, hot and cold)',
          'Complete bar service with licensed mixologists, premium spirits, and glassware',
          'Dietary accommodation matrix (Vegan, Gluten-Free, Halal, Kosher-certified)',
        ],
        rfpBrief: this.formatRFP(
          'Banquet Catering & Beverage Services',
          `EventCraft Wedding Banquet at ${venue}`,
          targetDate,
          [
            `Provide premium catering services for a confirmed guest count of ${guests}.`,
            'Must provide proof of food handler licensing and $2M commercial general liability insurance.',
            'Include full table setting, linen coordination, china, flatware, and busing staff.',
            'Complimentary menu tasting session for up to 4 persons required prior to contract lock.',
          ]
        ),
      },
      {
        id: 'vnd-wed-med-02',
        category: 'Photography & Cinematography',
        deliverables: [
          'Lead photographer + second shooter for 10 hours of continuous coverage',
          'Cinematic 4K highlight reel (5-7 minutes) and full ceremony/toasts edit',
          'High-resolution online proofing gallery with full print release within 30 days',
          'Drone aerial footage of ceremony and venue grounds (subject to FAA/local regulations)',
        ],
        rfpBrief: this.formatRFP(
          'Photography & Cinematography',
          'Wedding Visual Storytelling & Cinema Package',
          targetDate,
          [
            'Provide complete dual-shooter visual documentation spanning preparation through reception.',
            'Provide sample portfolio showcasing low-light banquet and fast-action dance floor captures.',
            'Turnaround SLA: 48-hour sneak peek gallery (minimum 25 photos), 30 days for final assets.',
            'Must carry active equipment and liability insurance.',
          ]
        ),
      },
      {
        id: 'vnd-wed-dec-03',
        category: 'Floral Design & Spatial Installations',
        deliverables: [
          'Ceremony arbor/chuppah floral installation and aisle ground arrangements',
          'Bridal bouquet, 5 bridesmaids bouquets, and 8 boutonnieres/corsages',
          `Centerpiece arrangements for estimated ${Math.ceil(guests / 8)} banquet tables`,
          'Post-reception teardown, floral repurposing, and vessel return',
        ],
        rfpBrief: this.formatRFP(
          'Floral Design & Spatial Installations',
          'Floral Architecture & Botanical Scenography',
          targetDate,
          [
            'Design and erect bespoke botanical installations complementing the creative color palette.',
            'Provide moodboard and sample stem list adhering to seasonal availability.',
            'All delivery, setup, on-site maintenance, and midnight strike services included.',
          ]
        ),
      },
      {
        id: 'vnd-wed-ent-04',
        category: 'Live Music & Audio Engineering',
        deliverables: [
          'Acoustic ceremony musician (string trio or acoustic guitar/keys)',
          'Cocktail hour jazz ensemble / background ambient sound',
          'Reception MC & DJ with professional sound system, wireless lavalier mics, and dance lighting',
          'Seamless integration with venue acoustics and compliance with decibel limits',
        ],
        rfpBrief: this.formatRFP(
          'Live Music & Audio Engineering',
          'Master of Ceremonies & Audiovisual Production',
          targetDate,
          [
            'Provide master audio equipment, MC coordination, and curated reception playlists.',
            'Conduct acoustic sound check 2 hours prior to guest arrival.',
            'Provide backup mixing board, redundant laptop/player, and battery-powered microphones.',
          ]
        ),
      },
    ];
  }

  private buildBirthdayVendors(
    guests: number,
    targetDate: string,
    venue: string
  ): VendorDeliverable[] {
    return [
      {
        id: 'vnd-bday-cat-01',
        category: 'Artisanal Bakery & Confectionery',
        deliverables: [
          `Custom multi-tiered thematic centerpiece cake scaled for ${guests} servings`,
          'Assorted dessert shooter bar (macarons, cake pops, mini fruit tarts)',
          'Specialty allergen-free confection (Gluten-free / nut-free tier)',
          'Safe delivery, cake stand staging, and chilled transport protocol',
        ],
        rfpBrief: this.formatRFP(
          'Artisanal Bakery & Confectionery',
          `Custom Thematic Cake & Dessert Suite at ${venue}`,
          targetDate,
          [
            'Create artisanal birthday cake aligned with the color palette and theme aesthetic.',
            'Include tasting sampler and guaranteed refrigerated delivery 90 minutes before party kickoff.',
            'Include food allergy disclosure placards for all ingredients.',
          ]
        ),
      },
      {
        id: 'vnd-bday-ent-02',
        category: 'Interactive Entertainment & Performance',
        deliverables: [
          'Lead event entertainer/host for 2.5 hours of organized group gaming',
          'Thematic character / specialty performer tailored to age demographic',
          'Face-painting station / interactive activity workshop with hypoallergenic materials',
          'Sound system with wireless microphone for announcements and musical games',
        ],
        rfpBrief: this.formatRFP(
          'Interactive Entertainment & Performance',
          'Birthday Performance & Activity Coordination',
          targetDate,
          [
            `Provide energetic age-tailored entertainment suitable for ${guests} guests.`,
            'Performers must possess background checks and child-safety certifications where applicable.',
            'Furnish all props, game equipment, and safe sound reinforcement.',
          ]
        ),
      },
      {
        id: 'vnd-bday-dec-03',
        category: 'Balloon Artistry & Visual Decor',
        deliverables: [
          'Organic balloon garland photo backdrop (8ft x 8ft) with custom marquee lettering',
          'Thematic table runners, cutlery, and eco-friendly compostable tableware',
          'Custom welcome easel sign and celebration banners',
          'Prompt teardown and non-toxic materials removal',
        ],
        rfpBrief: this.formatRFP(
          'Balloon Artistry & Visual Decor',
          'Immersive Thematic Spatial Decoration',
          targetDate,
          [
            'Install vibrant, biodegradable latex balloon installations and custom signage.',
            'Deliver setup completed 1 hour prior to party start time.',
          ]
        ),
      },
    ];
  }

  private buildCommunityVendors(
    guests: number,
    targetDate: string,
    stagingNeeds: string
  ): VendorDeliverable[] {
    return [
      {
        id: 'vnd-comm-av-01',
        category: 'Stage, Rigging & Audiovisual Production',
        deliverables: [
          `Modular outdoor/indoor stage (${stagingNeeds}) with safety guard rails and access ramps`,
          'Line-array PA system with digital mixer, stage monitors, and wireless frequency coordination',
          'High-lumen outdoor LED video wall for announcements and live camera feed',
          'Quiet diesel power generator with secondary failover backup unit',
        ],
        rfpBrief: this.formatRFP(
          'Stage, Rigging & Audiovisual Production',
          'Civic Event Audio/Visual Infrastructure RFP',
          targetDate,
          [
            `Provide professional staging and acoustic reinforcement for a crowd capacity of ${guests}.`,
            'Comply with municipal sound ordinances (maximum 85 dBA at perimeter boundary).',
            'Full structural engineering certification for stage rigging and wind ballast required.',
            'Include dedicated on-site AV engineer throughout load-in, run-of-show, and load-out.',
          ]
        ),
      },
      {
        id: 'vnd-comm-sec-02',
        category: 'Crowd Safety, Medical & Security',
        deliverables: [
          'Licensed security guards for perimeter control, entry bag checks, and queue routing',
          'Dedicated First-Aid medical station staffed by licensed EMT / Paramedics',
          'Perimeter crowd control bike-rack barricades and queue stanchions',
          'Direct radio link with municipal police dispatch and fire department liaison',
        ],
        rfpBrief: this.formatRFP(
          'Crowd Safety, Medical & Security',
          'Community Gathering Safety & Emergency Medical Services RFP',
          targetDate,
          [
            `Supply licensed security officers and emergency first-aid station for ${guests} expected attendees.`,
            'Submit comprehensive Incident Action Plan (IAP) including evacuation contingencies.',
            'Provide proof of state security guard licensing and professional liability insurance.',
          ]
        ),
      },
      {
        id: 'vnd-comm-san-03',
        category: 'Sanitation, Restrooms & Waste Diversion',
        deliverables: [
          `Portable restroom trailer units including ADA wheelchair-accessible facilities`,
          'Handwashing stations with soap, water, and touchless paper towel dispensers',
          'Color-coded three-stream waste sorting receptacles (Compost, Recycling, Landfill)',
          'Post-event sweep and grounds decontamination returning venue to pristine status',
        ],
        rfpBrief: this.formatRFP(
          'Sanitation, Restrooms & Waste Diversion',
          'Civic Grounds Sanitation & Environmental Stewardship RFP',
          targetDate,
          [
            `Deploy clean sanitation facilities and continuous trash maintenance for ${guests} participants.`,
            'Deliver zero-waste diversion plan targeting at least 50% recyclable/compostable diversion.',
            'Complete post-event grounds sweep within 2 hours of public egress.',
          ]
        ),
      },
    ];
  }

  private formatRFP(
    category: string,
    projectTitle: string,
    targetDate: string,
    requirements: string[]
  ): string {
    const bulletList = requirements.map((r) => `  * ${r}`).join('\n');
    return `### REQUEST FOR PROPOSAL (RFP): ${category.toUpperCase()}
**Project Title:** ${projectTitle}
**Execution Target Date:** ${targetDate}
**Issuing Authority:** EventCraft Autonomous Engine

#### 1. Scope of Work & Deliverables
${bulletList}

#### 2. Compliance & Submission Standards
  * Proof of valid business registration and general liability coverage (minimum $1,000,000 occurrence).
  * Firm, all-inclusive price quotation with zero hidden fuel or overtime surcharges.
  * Vendor response deadline: 14 business days prior to scheduled milestone cutoff.
  * Direct submissions and inquiries to the authorized EventCraft procurement portal.`;
  }
}
