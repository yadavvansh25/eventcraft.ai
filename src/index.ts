/**
 * EventCraft AI - Autonomous Event Architecture Engine
 * Public API & Factory Functions
 */

import { LLMProvider, PlannerEngine } from './engine/plannerEngine';
import { SecurityGuard } from './security/sanitizer';
import { AccessibilityValidator } from './engine/a11yValidator';
import { createApp } from './api/server';

// Types & Metadata
export * from './types/event.types';

// Security & Validation
export * from './security/sanitizer';
export * from './security/validator';

// Engine & Prompts
export * from './engine/systemPrompts';
export * from './engine/a11yValidator';
export * from './engine/plannerEngine';

// Server & Microservice App
export { createApp } from './api/server';

/**
 * Factory function to create an EventCraft AI Planner Engine instance
 * with optional custom LLM Provider.
 */
export function createEventPlannerEngine(llmProvider?: LLMProvider): PlannerEngine {
  const securityGuard = new SecurityGuard();
  const a11yValidator = new AccessibilityValidator();
  return new PlannerEngine(securityGuard, a11yValidator, llmProvider);
}

/**
 * Default Express Application Export for Vercel Serverless Function Runtime
 */
const app = createApp();
export default app;
