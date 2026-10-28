import { EventType, TimelineMilestone } from '../domain/event.types';

/**
 * ReverseTimeline: Chronological Milestones & Day-0 Run-of-Show Matrix Engine
 * Computes countdown stages (T-90 to T-1) and minute-by-minute execution agendas
 * with explicit ARIA accessibility announcements.
 */
export class ReverseTimeline {
  public generate(
    eventType: EventType,
    targetDate: string,
    guestCount: number,
    venueHours: number = 8
  ): TimelineMilestone[] {
    switch (eventType) {
      case 'wedding':
        return this.buildWeddingTimeline(targetDate, guestCount, venueHours);
      case 'birthday':
        return this.buildBirthdayTimeline(targetDate, guestCount, venueHours);
      case 'community':
        return this.buildCommunityTimeline(targetDate, guestCount, venueHours);
    }
  }

  private buildWeddingTimeline(
    targetDate: string,
    guests: number,
    venueHours: number
  ): TimelineMilestone[] {
    return [
      {
        stage: 'T-90',
        offsetDays: -90,
        title: 'Foundational Scaffolding & Save-the-Dates',
        actionItems: [
          `Confirm primary venue contract with ${venueHours}-hour access window for ${guests} guests on ${targetDate}`,
          'Lock lead photographer & videographer procurement contracts',
          'Dispatch digital & physical Save-the-Date notices with dietary query links',
          'Establish emergency contingency escrow fund',
        ],
        ariaAnnouncement:
          `Milestone T-90 active: Foundational venue lock for ${targetDate} and Save-the-Dates dispatched.`,
      },
      {
        stage: 'T-60',
        offsetDays: -60,
        title: 'Vendor Finalization & Menu Tastings',
        actionItems: [
          'Conduct comprehensive culinary and cake tasting with catering leads',
          'Execute floral mockups and structural lighting placement plan',
          'Finalize formal invitation suites with strict RSVP deadlines',
          'Review acoustic specifications and noise curfew permits',
        ],
        ariaAnnouncement:
          'Milestone T-60 active: Catering tastings and vendor production designs locked.',
      },
      {
        stage: 'T-30',
        offsetDays: -30,
        title: 'RSVP Lockdown & Seating Architecture',
        actionItems: [
          `Finalize confirmed guest registry (targeting ${guests} attendees)`,
          'Map accessible seating chart with designated companion spaces',
          'Issue music playlist must-play and do-not-play rosters to DJ/Ensemble',
          'Submit marriage license documentation to local jurisdiction',
        ],
        ariaAnnouncement:
          'Milestone T-30 active: RSVP roster closed, seating chart architecture finalized.',
      },
      {
        stage: 'T-14',
        offsetDays: -14,
        title: 'Logistics Harmonization & Floorplan Sign-off',
        actionItems: [
          'Submit final guaranteed banquet count to caterer and bar vendor',
          'Finalize hair and makeup schedule matrix for wedding party',
          'Conduct venue walk-through with day-of coordinator and AV lead',
          'Assemble bridal party emergency utility kit',
        ],
        ariaAnnouncement:
          'Milestone T-14 active: Final headcount submitted to caterers, rehearsal itinerary verified.',
      },
      {
        stage: 'T-7',
        offsetDays: -7,
        title: 'Vendor Master Dispatch & Final Settlement',
        actionItems: [
          'Distribute minute-by-minute vendor run-of-show packet with load-in dock times',
          'Confirm guest transportation shuttles and accessible ramp routes',
          'Prepare gratuity envelopes for venue and vendor crews',
          'Pack ceremony items (vow books, rings, unity elements)',
        ],
        ariaAnnouncement:
          'Milestone T-7 active: Master vendor schedule dispatched, logistical transit locked.',
      },
      {
        stage: 'T-1',
        offsetDays: -1,
        title: 'Rehearsal Protocol & Spatial Pre-check',
        actionItems: [
          'Execute ceremony processional rehearsal with officiant and wedding party',
          'Host intimate rehearsal dinner and welcome cocktails',
          'Verify arrival of all bridal attire, steam garments, and test audio mics',
          'Enforce strict resting protocol before Day-0 execution',
        ],
        ariaAnnouncement:
          'Milestone T-1 active: Rehearsal protocol concluded, pre-event checks cleared.',
      },
      {
        stage: 'Day-0',
        offsetDays: 0,
        title: `Day-0 Wedding Run-of-Show Protocol (${venueHours}h venue window)`,
        actionItems: [
          '08:00 - Vendor load-in and floral installation under coordinator oversight',
          '11:00 - Bridal party hair, makeup, and media preparation begins',
          '14:00 - First look portraits and immediate family photography',
          '16:30 - Ceremony processional, musical accompaniment, and exchange of vows',
          '17:30 - Cocktail hour transition and acoustic ambient entertainment',
          '18:45 - Grand entrance into main reception dining space',
          '19:30 - Toasts, plated dinner service, and dietary catering validation',
          '21:00 - Cake cutting ceremony and first dance suite',
          '23:30 - Formal couple send-off, vendor strike, and load-out reconciliation',
        ],
        ariaAnnouncement:
          `Day-0 Execution Agenda on ${targetDate}: Active chronological run-of-show from 08:00 load-in to midnight teardown.`,
      },
    ];
  }

  private buildBirthdayTimeline(
    targetDate: string,
    guests: number,
    venueHours: number
  ): TimelineMilestone[] {
    return [
      {
        stage: 'T-21',
        offsetDays: -21,
        title: 'Theme Definition & Guest Ingestion',
        actionItems: [
          `Lock birthday theme concept for ${targetDate} celebration`,
          `Send digital invitations with interactive RSVP link for ${guests} guests`,
          `Reserve party venue with confirmed ${venueHours}-hour access window`,
          'Commission customized artisanal birthday cake and dessert treats',
        ],
        ariaAnnouncement:
          `Milestone T-21 active: Birthday theme locked for ${targetDate} and invitations sent.`,
      },
      {
        stage: 'T-14',
        offsetDays: -14,
        title: 'Entertainment Booking & Supply Acquisition',
        actionItems: [
          'Contract interactive entertainment hosts, performers, or DJ service',
          'Order curated party favors, customized balloons, and sensory decor',
          'Verify dietary restrictions and allergen-free dessert alternatives',
          'Plan playlist containing guest-of-honor favorite anthems',
        ],
        ariaAnnouncement:
          'Milestone T-14 active: Interactive entertainers contracted, party supplies procured.',
      },
      {
        stage: 'T-7',
        offsetDays: -7,
        title: 'RSVP Tally & Activity Scaffolding',
        actionItems: [
          'Confirm final guest headcount and age distribution breakdown',
          'Construct detailed party activity and games rotation schedule',
          'Reconfirm bakery delivery time window and refrigeration arrangements',
          'Designate dedicated photographer/videographer for milestone moments',
        ],
        ariaAnnouncement:
          'Milestone T-7 active: RSVP headcount tallied, party activity rotation scheduled.',
      },
      {
        stage: 'T-1',
        offsetDays: -1,
        title: 'Spatial Prep & Pre-assembly',
        actionItems: [
          'Inflate balloon arches and assemble decorative backdrops',
          'Prepare guest gift station and memory photo wall',
          'Charge camera batteries, wireless microphones, and portable speakers',
          'Package goodie bags and interactive game prizes',
        ],
        ariaAnnouncement:
          'Milestone T-1 active: Spatial pre-assembly completed, audiovisual gear primed.',
      },
      {
        stage: 'Day-0',
        offsetDays: 0,
        title: `Day-0 Birthday Run-of-Show Protocol (${venueHours}h venue window)`,
        actionItems: [
          '13:00 - Venue load-in, decorative backdrop erection, and sound check',
          '14:00 - Guest arrival, welcome punch station, and ambient background music',
          '14:45 - High-energy group activities and interactive entertainment segment',
          '16:00 - Gourmet food bar and celebratory appetizer service',
          '16:45 - Dimming lights, candle lighting, birthday song, and cake cutting',
          '17:15 - Toast to guest of honor, gift unwrapping, and candid photo sessions',
          '18:00 - Party favor distribution, warm send-off, and venue strike',
        ],
        ariaAnnouncement:
          `Day-0 Execution Agenda on ${targetDate}: Active chronological birthday schedule from 13:00 arrival to evening wrap.`,
      },
    ];
  }

  private buildCommunityTimeline(
    targetDate: string,
    guests: number,
    venueHours: number
  ): TimelineMilestone[] {
    return [
      {
        stage: 'T-90',
        offsetDays: -90,
        title: 'Civic Permits & Municipal Agency Coordination',
        actionItems: [
          `Submit municipal park/street closure and sound amplification permits for ${targetDate}`,
          `Submit crowd safety and emergency management plan for estimated ${guests} attendees`,
          'Engage local emergency medical services (EMS) and police liaison',
          'Launch community outreach and corporate sponsor partnership drive',
        ],
        ariaAnnouncement:
          `Milestone T-90 active: Municipal permit filings initiated for ${targetDate}, emergency services notified.`,
      },
      {
        stage: 'T-60',
        offsetDays: -60,
        title: 'Infrastructure & Volunteer Procurement',
        actionItems: [
          `Finalize staging, high-output PA system, and ${venueHours}-hour generator power rentals`,
          'Contract portable sanitation and accessibility-compliant restroom units',
          'Open public volunteer registration portal with task-role preferences',
          'Secure licensed local food truck concessionaires and health inspections',
        ],
        ariaAnnouncement:
          'Milestone T-60 active: Staging and power infrastructure secured, volunteer portal live.',
      },
      {
        stage: 'T-30',
        offsetDays: -30,
        title: 'Logistics Matrix & Safety Briefing',
        actionItems: [
          'Review approved city permits and fire marshal site clearance',
          'Draft volunteer operational shift matrix (Greeters, Wayfinders, Safety Leads)',
          'Establish accessible transit, ADA parking, and shuttle bus routes',
          'Deploy high-visibility digital community marketing campaign',
        ],
        ariaAnnouncement:
          'Milestone T-30 active: Permits cleared, volunteer shift routing matrix mapped.',
      },
      {
        stage: 'T-14',
        offsetDays: -14,
        title: 'Volunteer Orientation & Communications Dispatch',
        actionItems: [
          'Conduct mandatory all-hands virtual volunteer safety and logistics briefing',
          'Test two-way radio channels and emergency broadcast protocols',
          'Distribute vendor vehicle access passes and staging load-in maps',
          'Inspect first-aid station supplies and automated external defibrillators (AED)',
        ],
        ariaAnnouncement:
          'Milestone T-14 active: Volunteer safety briefing held, communications dispatch issued.',
      },
      {
        stage: 'T-7',
        offsetDays: -7,
        title: 'Final Public Safety Walkthrough & Load-in Sign-off',
        actionItems: [
          'Conduct on-site safety walkthrough with city traffic engineer and fire inspector',
          'Confirm trash collection, recycling skips, and clean-up crew contracts',
          'Print high-contrast physical directional signage with tactile Braille cues',
          'Publish live event schedule, performance line-up, and accessibility maps',
        ],
        ariaAnnouncement:
          'Milestone T-7 active: Municipal walkthrough completed, public accessibility maps published.',
      },
      {
        stage: 'T-1',
        offsetDays: -1,
        title: 'Site Staging & Command Post Erection',
        actionItems: [
          'Erect main stage, sound towers, lighting truss, and safety perimeter barricades',
          'Set up incident command tent, lost-child center, and medical aid hub',
          'Conduct acoustic sound check within municipal decibel thresholds',
          'Stage hydration stations and volunteer check-in hospitality desks',
        ],
        ariaAnnouncement:
          'Milestone T-1 active: Staging infrastructure erected, incident command post operational.',
      },
      {
        stage: 'Day-0',
        offsetDays: 0,
        title: `Day-0 Community Gathering Execution Protocol (${venueHours}h venue window)`,
        actionItems: [
          '06:00 - Street barricades secured, traffic officers deployed to perimeter',
          '07:30 - Volunteer check-in, radio handoff, and high-visibility vest distribution',
          '08:30 - Food truck load-in, generator safety check, and fire marshal clearance',
          '10:00 - Public gates open, welcome address, and community booths activated',
          '12:00 - Main stage cultural performances and civic leadership addresses',
          '15:00 - Youth showcase, interactive workshops, and community recognition awards',
          '18:00 - Main programming concludes, public egress guidance underway',
          '19:30 - Waste audit, site sanitization, stage teardown, and street reopening',
        ],
        ariaAnnouncement:
          `Day-0 Execution Agenda on ${targetDate}: Active chronological community schedule from 06:00 street closure to evening reopening.`,
      },
    ];
  }
}
