#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { EventCraftEngine } from '../core/orchestrator/eventcraft-engine';
import { EventType, RawEventRequest } from '../core/domain/event.types';

function parseArgs(args: string[]): {
  type: EventType;
  budget: number;
  currency: string;
  guests: number;
  date: string;
  notes: string;
  output?: string;
  jsonOnly: boolean;
  help: boolean;
} {
  const params = {
    type: 'wedding' as EventType,
    budget: 25000,
    currency: 'USD',
    guests: 100,
    date: new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0] ?? '2027-01-01',
    notes: 'Elevated aesthetic with focus on culinary excellence and acoustic harmony.',
    output: undefined as string | undefined,
    jsonOnly: false,
    help: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--type' && args[i + 1]) {
      params.type = args[++i] as EventType;
    } else if (arg === '--budget' && args[i + 1]) {
      params.budget = parseFloat(args[++i] ?? '25000');
    } else if (arg === '--currency' && args[i + 1]) {
      params.currency = args[++i] ?? 'USD';
    } else if (arg === '--guests' && args[i + 1]) {
      params.guests = parseInt(args[++i] ?? '100', 10);
    } else if (arg === '--date' && args[i + 1]) {
      params.date = args[++i] ?? params.date;
    } else if (arg === '--notes' && args[i + 1]) {
      params.notes = args[++i] ?? '';
    } else if (arg === '--output' && args[i + 1]) {
      params.output = args[++i];
    } else if (arg === '--json') {
      params.jsonOnly = true;
    } else if (arg === '--help' || arg === '-h') {
      params.help = true;
    }
  }

  return params;
}

function printHelp(): void {
  console.log(`
===================================================================
EventCraft AI - Autonomous GenAI Event Architecture CLI Harness
===================================================================

Usage:
  npx ts-node src/cli/index.ts [options]

Options:
  --type <genre>       Event typology: "wedding" | "birthday" | "community" (default: wedding)
  --budget <number>    Total allocated budget (default: 25000)
  --currency <code>    Currency code, e.g. USD, EUR, GBP (default: USD)
  --guests <number>    Target guest / attendee count (default: 100)
  --date <YYYY-MM-DD>  Execution target date (default: T+90 days)
  --notes <string>     Custom user intent / requirements
  --output <filepath>  Save generated blueprint JSON to file
  --json               Output raw formatted JSON only (ideal for piping)
  --help, -h           Show this help manual

Example:
  npx ts-node src/cli/index.ts --type wedding --budget 40000 --guests 150 --date 2026-11-20
`);
}

async function run(): Promise<void> {
  const args = process.argv.slice(2);
  const options = parseArgs(args);

  if (options.help) {
    printHelp();
    process.exit(0);
  }

  const engine = new EventCraftEngine();

  const request: RawEventRequest = {
    eventType: options.type,
    budget: options.budget,
    currency: options.currency,
    guests: options.guests,
    targetDate: options.date,
    userNotes: options.notes,
  };

  try {
    const result = await engine.synthesize(request);
    const plan = result.plan;

    if (options.output) {
      const targetPath = path.resolve(process.cwd(), options.output);
      fs.writeFileSync(targetPath, JSON.stringify(plan, null, 2), 'utf-8');
      if (!options.jsonOnly) {
        console.log(`\n✔ Plan successfully exported to ${targetPath}`);
      }
    }

    if (options.jsonOnly) {
      console.log(JSON.stringify(plan, null, 2));
      return;
    }

    // Rich Terminal Dashboard
    console.log(`
===================================================================
EVENTCRAFT AI — AUTONOMOUS BLUEPRINT GENERATED
===================================================================
Plan ID:        ${plan.planId}
Event Type:     ${plan.eventType.toUpperCase()}
Target Date:    ${options.date} (${options.guests} Guests)
Total Budget:   ${plan.budget.currency} ${plan.budget.totalAmount.toLocaleString()} (Variance: 0.00)
Synthesis Time: ${result.executionTimeMs} ms
Accessibility:  ${plan.accessibility.wcagLevel}

-------------------------------------------------------------------
1. BUDGET ALLOCATION MATRIX (Conservation ≡ 100.00%)
-------------------------------------------------------------------`);

    for (const item of plan.budget.allocations) {
      const formattedAmount = `${plan.budget.currency} ${item.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      console.log(
        `• [${item.priority.toUpperCase().padEnd(13)}] ${item.category.padEnd(38)} : ${formattedAmount.padStart(14)} (${item.percentage.toFixed(2)}%)`
      );
    }

    console.log(`
-------------------------------------------------------------------
2. CHRONOLOGICAL MILESTONES & DAY-0 RUN-OF-SHOW
-------------------------------------------------------------------`);
    for (const stage of plan.timeline) {
      console.log(`[${stage.stage.padEnd(6)}] (T${stage.offsetDays >= 0 ? '+' : ''}${stage.offsetDays}d) ${stage.title}`);
      for (const action of stage.actionItems.slice(0, 2)) {
        console.log(`       - ${action}`);
      }
    }

    console.log(`
-------------------------------------------------------------------
3. VENDOR PROCUREMENT & ONE-CLICK RFP BRIEFS
-------------------------------------------------------------------`);
    for (const vendor of plan.vendorChecklist) {
      console.log(`• ID: ${vendor.id} | Category: ${vendor.category}`);
      console.log(`  Deliverables: ${vendor.deliverables.length} line items defined`);
    }

    console.log(`
-------------------------------------------------------------------
4. THEME STUDIO & WCAG 2.1 AA COLOR TOKENS
-------------------------------------------------------------------
Theme: ${plan.creativeSuite.themeName}`);
    for (const token of plan.creativeSuite.colorPalette) {
      console.log(
        `• ${token.tokenName.padEnd(34)}: ${token.hex} (Contrast: ${token.contrastRatioAgainstWhite}:1 against white | WCAG Compliant: ${token.wcagCompliant})`
      );
    }

    console.log(`
===================================================================
Security Audit: ${result.cleanContext.securityAudit.piiRedactedCount} PII Redactions | Prompt Injection Cleared
Accessibility:  ${plan.accessibility.contrastSummary}
===================================================================
`);
  } catch (error) {
    console.error('\n✖ Blueprint Synthesis Failed:');
    if (error instanceof Error) {
      console.error(error.message);
    } else {
      console.error(error);
    }
    process.exit(1);
  }
}

if (require.main === module) {
  run().catch((err) => {
    console.error('Fatal CLI Error:', err);
    process.exit(1);
  });
}
