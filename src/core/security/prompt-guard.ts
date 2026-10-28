import { PromptInjectionError } from '../domain/errors';
import { GuardAnalysis, IPromptGuard } from './security.interface';

interface ThreatPattern {
  readonly id: string;
  readonly pattern: RegExp;
  readonly severity: 'critical' | 'high' | 'medium';
  readonly description: string;
}

/**
 * PromptGuard: OWASP Top-10 LLM Injection Defense Engine
 * Protects against Direct Prompt Injection (LLM01), Jailbreaking, System Override,
 * and Context Escape attacks before inputs reach LLM orchestration.
 */
export class PromptGuard implements IPromptGuard {
  private static readonly THREAT_PATTERNS: readonly ThreatPattern[] = [
    // 1. Direct Instruction Overrides
    {
      id: 'INSTRUCTION_OVERRIDE',
      pattern:
        /\b(?:ignore|disregard|forget|bypass|override)\s+(?:all\s+)?(?:previous|prior|above|existing)\s+(?:instructions|rules|constraints|prompts|directives)\b/i,
      severity: 'critical',
      description: 'Attempt to override system instructions or prior context',
    },
    {
      id: 'SYSTEM_COMMAND_HIJACK',
      pattern:
        /\b(?:system\s+override|system\s+directive|new\s+system\s+prompt|admin\s+mode|root\s+access)\b/i,
      severity: 'critical',
      description: 'Attempt to inject administrative or system-level directives',
    },
    // 2. Jailbreak & Unrestricted Roleplay (DAN, Dev Mode, Uncensored)
    {
      id: 'JAILBREAK_ROLEPLAY',
      pattern:
        /\b(?:dan\s+mode|do\s+anything\s+now|developer\s+mode\s+enabled|unrestricted\s+ai|act\s+as\s+(?:an?\s+)?(?:evil|unfiltered|jailbroken|unethical)\s+ai)\b/i,
      severity: 'critical',
      description: 'Known jailbreak persona or unrestricted mode invocation',
    },
    // 3. Delimiter Injection & Structured Escape
    {
      id: 'DELIMITER_INJECTION',
      pattern:
        /(?:```(?:json|system|xml|markdown)?[\s\S]*?(?:system|assistant|user)|\[\/?(?:system|instruction|admin)\]|<\/?(?:system|prompt|instruction)>|---(?:END|START)\s+(?:SYSTEM|PROMPT)---)/i,
      severity: 'critical',
      description: 'Deliberate delimiter injection to forge model role boundaries',
    },
    // 4. Prompt Exfiltration / Leakage
    {
      id: 'PROMPT_EXFILTRATION',
      pattern:
        /\b(?:repeat|print|output|display|show|reveal|echo)\s+(?:your\s+)?(?:system\s+prompt|initial\s+instructions|pre-prompt|internal\s+guidelines|hidden\s+(?:developer\s+)?rules|all\s+secret)\b/i,
      severity: 'high',
      description: 'Attempt to leak internal system instructions or metaprompt',
    },
    // 5. Payload Encoding / Evasion Signatures
    {
      id: 'OBFUSCATED_EVASION',
      pattern:
        /(?:(?:eval|execute|run)\s*\(\s*(?:atob|base64_decode)|base64\s*:\s*[A-Za-z0-9+/=]{40,})/i,
      severity: 'high',
      description: 'Encoded evasion vector attempting code execution or decoding',
    },
    // 6. Output Format Forcing & Negative Constraint Breaches
    {
      id: 'MALICIOUS_FORMAT_FORCING',
      pattern:
        /\b(?:stop\s+generating\s+json|ignore\s+json\s+schema|output\s+plain\s+text\s+instead\s+of\s+json|write\s+a\s+hacking\s+script)\b/i,
      severity: 'medium',
      description: 'Attempt to subvert strict JSON output contract',
    },
  ];

  /**
   * Validates input. Throws PromptInjectionError if any threat vector is found.
   */
  public validate(input: string): void {
    const analysis = this.analyze(input);
    if (!analysis.isSafe || analysis.detectedThreats.length > 0) {
      const topThreat = analysis.detectedThreats[0] ?? 'PROMPT_INJECTION_DETECTED';
      throw new PromptInjectionError(
        `Prompt injection detected: Input contains prohibited security vectors (${topThreat}).`,
        topThreat
      );
    }
  }

  /**
   * Detailed threat inspection returning detected vectors and risk score.
   */
  public analyze(input: string): GuardAnalysis {
    if (!input || typeof input !== 'string') {
      return {
        isSafe: true,
        riskScore: 0.0,
        detectedThreats: [],
        sanitizedDirective: '',
      };
    }

    const detectedThreats: string[] = [];
    let severityWeight = 0;

    for (const threat of PromptGuard.THREAT_PATTERNS) {
      if (threat.pattern.test(input)) {
        detectedThreats.push(`${threat.id}: ${threat.description}`);
        if (threat.severity === 'critical') severityWeight += 0.6;
        else if (threat.severity === 'high') severityWeight += 0.4;
        else severityWeight += 0.3;
      }
    }

    const riskScore = Math.min(1.0, severityWeight);
    const isSafe = detectedThreats.length === 0;
    const sanitizedDirective = this.neutralize(input);

    return {
      isSafe,
      riskScore: Number(riskScore.toFixed(2)),
      detectedThreats,
      sanitizedDirective,
    };
  }

  /**
   * Neutralizes potential injection vectors by defanging delimiters and stripping commands.
   */
  public neutralize(input: string): string {
    if (!input || typeof input !== 'string') return '';

    let cleaned = input;

    // Defang dangerous markdown and XML delimiters
    cleaned = cleaned.replace(/```/g, "'''");
    cleaned = cleaned.replace(/<(\/?(?:system|instruction|prompt|admin)[^>]*)>/gi, '[$1]');

    // Strip known override commands
    for (const threat of PromptGuard.THREAT_PATTERNS) {
      cleaned = cleaned.replace(threat.pattern, '[SECURITY_BLOCKED_DIRECTIVE]');
    }

    return cleaned.trim();
  }
}
