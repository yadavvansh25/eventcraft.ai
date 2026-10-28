import { Request, Response, Router } from 'express';
import { PlannerEngine } from '../engine/plannerEngine';
import { SecurityGuard, SecurityError } from '../security/sanitizer';
import { EventValidator, ValidationError } from '../security/validator';

export function createEventCraftRouter(engine: PlannerEngine = new PlannerEngine()): Router {
  const router = Router();
  const guard = new SecurityGuard();

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
        'Dual-pass PII scrubbing (phone, email, SSN, Aadhaar, CC)',
        'Zero-sum budget conservation (Variance ≡ 0.00)',
        'WCAG 2.1 AA luminance contrast calculations',
      ],
    });
  });

  /**
   * Primary Plan Generation Endpoint
   */
  router.post('/plan', async (req: Request, res: Response): Promise<void> => {
    try {
      const result = await engine.generatePlan(req.body);
      res.status(200).json({
        success: true,
        data: result.plan,
        meta: {
          executionTimeMs: result.executionTimeMs,
          securityAudit: result.cleanContext.securityAudit,
        },
      });
    } catch (error) {
      if (error instanceof SecurityError) {
        res.status(400).json({
          success: false,
          error: {
            code: error.code,
            message: error.message,
          },
        });
        return;
      }

      if (error instanceof ValidationError) {
        res.status(400).json({
          success: false,
          error: {
            code: error.name,
            message: error.message,
            issues: error.issues,
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
   * Security Pre-flight Sanitization & Threat Inspection
   */
  router.post('/sanitize', (req: Request, res: Response): void => {
    const rawText = String(req.body?.text ?? '');
    const piiResult = guard.scrubPII(rawText);
    const threatAnalysis = guard.analyze(piiResult.sanitizedText);

    res.status(200).json({
      sanitizedText: threatAnalysis.neutralizedText,
      isSafe: threatAnalysis.isSafe,
      riskScore: threatAnalysis.riskScore,
      detectedThreats: threatAnalysis.detectedThreats,
      piiRedactedCount: piiResult.redactedCount,
      detectedPiiTypes: piiResult.detectedTypes,
    });
  });

  /**
   * Plan Contract Validation
   */
  router.post('/validate', (req: Request, res: Response): void => {
    try {
      const plan = EventValidator.validatePlan(req.body);
      res.status(200).json({
        valid: true,
        planId: plan.planId,
      });
    } catch (error) {
      res.status(422).json({
        valid: false,
        issues: error instanceof ValidationError ? error.issues : [],
        message: error instanceof Error ? error.message : 'Plan failed contract validation',
      });
    }
  });

  return router;
}
