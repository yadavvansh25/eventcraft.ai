import { CleanContextPayload } from '../domain/event.types';
import { EventCraftPlan } from '../domain/plan.schema';

/**
 * Pluggable LLM Provider interface allowing decoupled Dependency Injection
 * for deterministic synthesis, OpenAI, Gemini, or Claude orchestrators.
 */
export interface ILLMProvider {
  generatePlan(context: CleanContextPayload): Promise<EventCraftPlan>;
}
