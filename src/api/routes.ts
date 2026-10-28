import { Request, Response, Router } from 'express';
import { EventCraftEngine } from '../core/orchestrator/eventcraft-engine';
import { PIISanitizer } from '../core/security/pii-sanitizer';
import { PromptGuard } from '../core/security/prompt-guard';
import { EventCraftPlanSchema } from '../core/domain/plan.schema';
import { EventCraftError } from '../core/domain/errors';

export function createEventCraftRouter(engine: EventCraftEngine = new EventCraftEngine()): Router {
  const router = Router();
  const sanitizer = new PIISanitizer();
  const promptGuard = new PromptGuard();

  /**
   * Health Check
   */
  router.get('/health', (_req: Request, res: Response): void => {
    res.status(200).json({
      status: 'UP',
      service: 'EventCraft AI Microservice',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      capabilities: [
        'Single-pass deterministic synthesis',
        'OWASP Top-10 prompt injection defense',
        'Dual-pass PII scrubbing',
        'Zero-sum budget conservation',
        'WCAG 2.1 AA luminance contrast calculations',
      ],
    });
  });

  /**
   * Primary Plan Generation Endpoint
   */
  router.post('/plan', async (req: Request, res: Response): Promise<void> => {
    try {
      const result = await engine.synthesize(req.body);
      res.status(200).json({
        success: true,
        data: result.plan,
        meta: {
          executionTimeMs: result.executionTimeMs,
          securityAudit: result.cleanContext.securityAudit,
        },
      });
    } catch (error) {
      if (error instanceof EventCraftError) {
        res.status(400).json({
          success: false,
          error: {
            code: error.code,
            message: error.message,
          },
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Unknown internal error occurred',
        },
      });
    }
  });

  /**
   * Security Pre-flight Sanitization & Injection Inspection
   */
  router.post('/sanitize', (req: Request, res: Response): void => {
    const rawText = String(req.body?.text ?? '');
    const piiResult = sanitizer.sanitize(rawText);
    const guardResult = promptGuard.analyze(piiResult.sanitizedText);

    res.status(200).json({
      sanitizedText: guardResult.sanitizedDirective,
      isSafe: guardResult.isSafe,
      riskScore: guardResult.riskScore,
      detectedThreats: guardResult.detectedThreats,
      piiRedactedCount: piiResult.redactedCount,
      detectedPiiTypes: piiResult.detectedTypes,
    });
  });

  /**
   * Plan Schema Contract Verification
   */
  router.post('/validate', (req: Request, res: Response): void => {
    const parseResult = EventCraftPlanSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(422).json({
        valid: false,
        issues: parseResult.error.issues,
      });
      return;
    }

    res.status(200).json({
      valid: true,
      planId: parseResult.data.planId,
    });
  });

  return router;
}
