/**
 * SecurityGuard: OWASP Top-10 LLM Defense, Comprehensive PII Scrubbing & Injection Neutralization
 *
 * Implements:
 * 1. Deep PII & Secret masking: Emails, Phones, IPv4/IPv6, Credit Cards, SSN, PAN, Aadhaar, Contextual Names, API Keys, JWTs, Private Keys.
 * 2. OWASP LLM01 Prompt Injection & Jailbreak Armor: Prefix overrides, DAN persona, delimiter escapes, hidden comments, role spoofing.
 * 3. Script & XSS defanging: script, iframe, embed, object, eval, inline event handlers.
 * 4. Denial of Wallet / Token Exhaustion defense: Input payload boundary enforcement (2,000 char max).
 */

export class SecurityError extends Error {
  public readonly code: string;

  constructor(message: string, code: string = 'SECURITY_ERROR') {
    super(message);
    this.name = 'SecurityError';
    this.code = code;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class PromptInjectionError extends SecurityError {
  public readonly detectedVector: string;

  constructor(message: string, detectedVector: string) {
    super(message, 'PROMPT_INJECTION_DETECTED');
    this.name = 'PromptInjectionError';
    this.detectedVector = detectedVector;
  }
}

export class PayloadLimitError extends SecurityError {
  public readonly maxLength: number;
  public readonly actualLength: number;

  constructor(message: string, maxLength: number, actualLength: number) {
    super(message, 'PAYLOAD_LIMIT_EXCEEDED');
    this.name = 'PayloadLimitError';
    this.maxLength = maxLength;
    this.actualLength = actualLength;
  }
}

export interface SanitizationResult {
  readonly sanitizedText: string;
  readonly redactedCount: number;
  readonly detectedTypes: readonly string[];
}

export interface ThreatAnalysis {
  readonly isSafe: boolean;
  readonly riskScore: number;
  readonly detectedThreats: readonly string[];
  readonly neutralizedText: string;
}

interface ThreatPattern {
  readonly id: string;
  readonly pattern: RegExp;
  readonly severity: 'critical' | 'high' | 'medium';
  readonly description: string;
}

export class SecurityGuard {
  /** Maximum allowable character count for untrusted user inputs (Denial of Wallet mitigation) */
  public static readonly MAX_INPUT_LENGTH = 2000;

  // --- High-Confidence PII & Secret Regular Expressions ---
  private static readonly EMAIL_REGEX =
    /[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+/g;

  // Handles international (+1, +44, +91, +33, etc.) and national telephone formats
  private static readonly PHONE_REGEX =
    /(?:\+?\d{1,4}[-.\s]?)?(?:\(?\d{2,5}\)?[-.\s]?)\d{3,4}[-.\s]?\d{3,5}(?!\d)/g;

  // US Social Security Numbers
  private static readonly SSN_REGEX = /\b(?!000|666|9\d{2})\d{3}-(?!00)\d{2}-(?!0000)\d{4}\b/g;

  // Indian PAN (Permanent Account Number: 5 letters, 4 digits, 1 letter)
  private static readonly PAN_REGEX = /\b[A-Z]{5}[0-9]{4}[A-Z]\b/g;

  // Indian Aadhaar format (12 digits grouped into 4s)
  private static readonly AADHAAR_REGEX = /\b[2-9]\d{3}[-\s]\d{4}[-\s]\d{4}\b/g;

  // IPv4 Addresses
  private static readonly IPV4_REGEX =
    /\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/g;

  // IPv6 Addresses
  private static readonly IPV6_REGEX =
    /\b(?:[A-Fa-f0-9]{1,4}:){7}[A-Fa-f0-9]{1,4}\b/g;

  // Standard Credit Cards (13-19 digits, spaced or dashed)
  private static readonly CREDIT_CARD_REGEX =
    /\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|6(?:011|5[0-9]{2})[0-9]{12}|(?:[0-9]{4}[-\s]){3}[0-9]{4})\b/g;

  // JSON Web Tokens (JWT)
  private static readonly JWT_REGEX =
    /\beyJ[a-zA-Z0-9_-]{10,}\.eyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}\b/g;

  // Cloud API Keys & Bearer Tokens (AWS AKIA, OpenAI sk-, GitHub ghp_, Bearer)
  private static readonly API_KEY_REGEX =
    /\b(?:sk-[a-zA-Z0-9]{20,}|AKIA[0-9A-Z]{16}|gh[pousr]_[A-Za-z0-9_]{36,}|Bearer\s+[a-zA-Z0-9_\-\.]{16,})\b/gi;

  // Private Key Blocks
  private static readonly PRIVATE_KEY_REGEX =
    /-----BEGIN (?:RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----[\s\S]*?-----END (?:RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----/g;

  // Pass 2: Contextual Personal Name Redaction
  private static readonly CONTEXTUAL_NAME_REGEX =
    /(?:call\s+|contact\s+|planner:\s*|organizer:\s*|reach\s+out\s+to\s+)([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?|\[REDACTED\])(?=\s|$|[.,!?;:])/g;

  // --- Threat Signatures for OWASP LLM01 Prompt Injection ---
  private static readonly THREAT_PATTERNS: readonly ThreatPattern[] = [
    // 1. Direct Jailbreaks & Instruction Overrides
    {
      id: 'INSTRUCTION_OVERRIDE',
      pattern:
        /\b(?:ignore|disregard|forget|bypass|override)\s+(?:all\s+)?(?:previous|prior|above|existing)\s+(?:instructions|rules|constraints|prompts|directives)\b/i,
      severity: 'critical',
      description: 'Direct attempt to override system instructions or initial constraints',
    },
    {
      id: 'SYSTEM_COMMAND_HIJACK',
      pattern:
        /\b(?:system\s+override|system\s+directive|new\s+system\s+prompt|system\s+role\s+override|admin\s+mode|root\s+access|developer\s+mode\s+enabled)\b/i,
      severity: 'critical',
      description: 'Privilege escalation or administrative system override attempt',
    },
    {
      id: 'JAILBREAK_ROLEPLAY',
      pattern:
        /\b(?:dan\s+mode|do\s+anything\s+now|unrestricted\s+ai|act\s+as\s+(?:an?\s+)?(?:evil|unfiltered|jailbroken|unethical)\s+ai)\b/i,
      severity: 'critical',
      description: 'Known DAN persona or unrestricted mode invocation',
    },
    {
      id: 'SIMULATION_JAILBREAK',
      pattern:
        /\b(?:simulate|pretend|act\s+as\s+if|in\s+developer\s+mode|as\s+an\s+unfiltered|unhinged\s+ai|jailbreak\s+mode|sudo\s+mode)\b/i,
      severity: 'high',
      description: 'Simulation or sudo persona evasion attempt',
    },
    // 2. Delimiter Injection & Sandboxing Escape
    {
      id: 'DELIMITER_INJECTION',
      pattern:
        /(?:```(?:json|system|xml|markdown)?[\s\S]*?(?:system|assistant|user)|\[\/?(?:system|instruction|admin)\]|<\/?(?:system|prompt|instruction|user_untrusted_input)>|---(?:END|START)\s+(?:SYSTEM|PROMPT)---)/i,
      severity: 'critical',
      description: 'Deliberate delimiter injection to forge model role boundaries',
    },
    {
      id: 'ROLE_DELIMITER_SPOOFING',
      pattern:
        /(?:<\|im_start\|>|<\|im_end\|>|<\|endoftext\|>|\[INST\]|\[\/INST\]|<<SYS>>|<\/<<SYS>>)/i,
      severity: 'critical',
      description: 'Model token boundary spoofing attack',
    },
    {
      id: 'INDIRECT_COMMENT_INJECTION',
      pattern:
        /(?:<!--[\s\S]*?(?:ignore|system|instruction|bypass)[\s\S]*?-->)/i,
      severity: 'high',
      description: 'Indirect prompt injection hidden inside markup comments',
    },
    // 3. Payload Scripts & XSS Injections
    {
      id: 'SCRIPT_PAYLOAD',
      pattern:
        /(?:<script[\s\S]*?>[\s\S]*?<\/script>|<script\b|<iframe\b|<object\b|<embed\b|<applet\b|javascript:|onerror\s*=|onload\s*=|onclick\s*=|onmouseover\s*=|onfocus\s*=|eval\s*\(|document\.cookie)/i,
      severity: 'critical',
      description: 'Embedded executable script, iframe, or cross-site scripting payload',
    },
    // 4. Prompt Exfiltration / Leakage
    {
      id: 'PROMPT_EXFILTRATION',
      pattern:
        /\b(?:repeat|print|output|display|show|reveal|echo)\s+(?:your\s+)?(?:system\s+prompt|initial\s+instructions|pre-prompt|internal\s+guidelines|hidden\s+(?:developer\s+)?rules|all\s+secret)\b/i,
      severity: 'high',
      description: 'Attempt to exfiltrate metaprompt or internal system directives',
    },
    // 5. Negative Output Format Subversion
    {
      id: 'SCHEMA_SUBVERSION',
      pattern:
        /\b(?:stop\s+generating\s+json|ignore\s+json\s+schema|output\s+plain\s+text\s+instead\s+of\s+json|write\s+a\s+hacking\s+script)\b/i,
      severity: 'medium',
      description: 'Attempt to subvert strict JSON output schema constraint',
    },
  ];

  /**
   * Enforces payload character boundaries to mitigate Denial of Wallet attacks.
   */
  public enforcePayloadLimit(input: string, maxLength: number = SecurityGuard.MAX_INPUT_LENGTH): string {
    if (!input || typeof input !== 'string') return '';
    if (input.length > maxLength) {
      throw new PayloadLimitError(
        `Input payload of ${input.length} characters exceeds maximum allowable limit of ${maxLength} characters.`,
        maxLength,
        input.length
      );
    }
    return input;
  }

  /**
   * Deep PII scrubber: replaces sensitive identifiers and secret tokens with [REDACTED] tokens.
   */
  public scrubPII(input: string): SanitizationResult {
    if (!input || typeof input !== 'string') {
      return { sanitizedText: '', redactedCount: 0, detectedTypes: [] };
    }

    const detectedTypesSet = new Set<string>();
    let redactedCount = 0;
    let currentText = input;

    // Pass 1: High-Confidence Regex Scrubbing for Secrets & PII
    currentText = currentText.replace(SecurityGuard.PRIVATE_KEY_REGEX, () => {
      redactedCount++;
      detectedTypesSet.add('private_key');
      return '[REDACTED]';
    });

    currentText = currentText.replace(SecurityGuard.JWT_REGEX, () => {
      redactedCount++;
      detectedTypesSet.add('jwt');
      return '[REDACTED]';
    });

    currentText = currentText.replace(SecurityGuard.API_KEY_REGEX, () => {
      redactedCount++;
      detectedTypesSet.add('api_key');
      return '[REDACTED]';
    });

    currentText = currentText.replace(SecurityGuard.CREDIT_CARD_REGEX, () => {
      redactedCount++;
      detectedTypesSet.add('credit_card');
      return '[REDACTED]';
    });

    currentText = currentText.replace(SecurityGuard.SSN_REGEX, () => {
      redactedCount++;
      detectedTypesSet.add('ssn');
      return '[REDACTED]';
    });

    currentText = currentText.replace(SecurityGuard.PAN_REGEX, () => {
      redactedCount++;
      detectedTypesSet.add('pan');
      return '[REDACTED]';
    });

    currentText = currentText.replace(SecurityGuard.AADHAAR_REGEX, () => {
      redactedCount++;
      detectedTypesSet.add('aadhaar');
      return '[REDACTED]';
    });

    currentText = currentText.replace(SecurityGuard.IPV4_REGEX, () => {
      redactedCount++;
      detectedTypesSet.add('ipv4');
      return '[REDACTED]';
    });

    currentText = currentText.replace(SecurityGuard.IPV6_REGEX, () => {
      redactedCount++;
      detectedTypesSet.add('ipv6');
      return '[REDACTED]';
    });

    currentText = currentText.replace(SecurityGuard.EMAIL_REGEX, () => {
      redactedCount++;
      detectedTypesSet.add('email');
      return '[REDACTED]';
    });

    currentText = currentText.replace(SecurityGuard.PHONE_REGEX, () => {
      redactedCount++;
      detectedTypesSet.add('phone');
      return '[REDACTED]';
    });

    // Pass 2: Contextual Personal Name Scrubbing
    currentText = currentText.replace(
      SecurityGuard.CONTEXTUAL_NAME_REGEX,
      (match, capturedName: string) => {
        if (capturedName.includes('[REDACTED]')) {
          return match;
        }
        redactedCount++;
        detectedTypesSet.add('contact_name');
        return match.replace(capturedName, '[REDACTED]');
      }
    );

    return {
      sanitizedText: currentText,
      redactedCount,
      detectedTypes: Array.from(detectedTypesSet),
    };
  }

  /**
   * Validates input against prompt injection signatures. Throws PromptInjectionError if detected.
   */
  public validate(input: string): void {
    const analysis = this.analyze(input);
    if (!analysis.isSafe) {
      const topThreat = analysis.detectedThreats[0]!;
      throw new PromptInjectionError(
        `Security verification failed: prohibited injection vector detected (${topThreat}).`,
        topThreat
      );
    }
  }

  /**
   * Inspects input for threat patterns and computes risk score.
   */
  public analyze(input: string): ThreatAnalysis {
    if (!input || typeof input !== 'string') {
      return { isSafe: true, riskScore: 0.0, detectedThreats: [], neutralizedText: '' };
    }

    const detectedThreats: string[] = [];
    let severityWeight = 0;

    for (const threat of SecurityGuard.THREAT_PATTERNS) {
      if (threat.pattern.test(input)) {
        detectedThreats.push(`${threat.id}: ${threat.description}`);
        if (threat.severity === 'critical') severityWeight += 0.6;
        else if (threat.severity === 'high') severityWeight += 0.4;
        else severityWeight += 0.3;
      }
    }

    const riskScore = Math.min(1.0, severityWeight);
    const isSafe = detectedThreats.length === 0;
    const neutralizedText = this.neutralize(input);

    return {
      isSafe,
      riskScore: Number(riskScore.toFixed(2)),
      detectedThreats,
      neutralizedText,
    };
  }

  /**
   * Neutralizes prompt delimiters, script payloads, hidden comments, and override directives safely.
   */
  public neutralize(input: string): string {
    if (!input || typeof input !== 'string') return '';

    let cleaned = input;

    // Strip invisible zero-width unicode characters
    cleaned = cleaned.replace(/[\u200B-\u200D\uFEFF\u00A0\u202A-\u202E]/g, '');

    // Defang script and iframe tags
    cleaned = cleaned.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '[DEFANGED_SCRIPT]');
    cleaned = cleaned.replace(/<script\b/gi, '[script');
    cleaned = cleaned.replace(/<iframe[\s\S]*?>[\s\S]*?<\/iframe>/gi, '[DEFANGED_IFRAME]');
    cleaned = cleaned.replace(/<iframe\b/gi, '[iframe');
    cleaned = cleaned.replace(/<(object|embed|applet)\b/gi, '[$1');
    cleaned = cleaned.replace(/javascript:/gi, 'blocked-script:');
    cleaned = cleaned.replace(/eval\s*\(/gi, 'blocked-eval(');

    // Defang HTML comments used for indirect injection
    cleaned = cleaned.replace(/<!--[\s\S]*?-->/g, '[DEFANGED_COMMENT]');

    // Defang model token role delimiters
    cleaned = cleaned.replace(/<\|im_start\|>|<\|im_end\|>|<\|endoftext\|>|\[INST\]|\[\/INST\]|<<SYS>>|<\/<<SYS>>/gi, '[DEFANGED_DELIMITER]');

    // Defang markdown and XML delimiters
    cleaned = cleaned.replace(/```/g, "'''");
    cleaned = cleaned.replace(/<(\/?(?:system|instruction|prompt|admin|user_untrusted_input)[^>]*)>/gi, '[$1]');

    // Strip known override directives
    for (const threat of SecurityGuard.THREAT_PATTERNS) {
      cleaned = cleaned.replace(threat.pattern, '[SECURITY_BLOCKED_DIRECTIVE]');
    }

    return cleaned.trim();
  }
}
