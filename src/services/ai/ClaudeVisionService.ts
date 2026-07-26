/**
 * Claude Vision API Service for Real-Time Surgical Mentorship
 *
 * Provides AI-powered coaching using Claude 3.5 Sonnet with vision capabilities.
 * Analyzes endoscope view + telemetry data to provide contextual guidance.
 *
 * Performance targets:
 * - Latency: <500ms (streaming mode)
 * - Cost: ~$0.10-0.50 per session
 * - Cache hit rate: >70% for common scenarios
 */

import Anthropic from '@anthropic-ai/sdk';
import { Vector3D } from '../../components/3d/VFX';
import { CollisionEvent, CrisisEvent } from '../../components/3d/collision/types';
import { SafetyZone } from '../../components/3d/safety/SafetyCorridorManager';

// ============================================================================
// Types & Interfaces
// ============================================================================

export interface SimulationState {
  /** Current surgical level (1-3) */
  level: number;
  /** Current objective description */
  currentObjective: string;
  /** Endoscope tip position */
  scopePosition: Vector3D;
  /** Pitch/yaw angles */
  scopeAngle: { pitch: number; yaw: number };
  /** Active safety zones */
  safetyZones: SafetyZone[];
  /** Recent collision events */
  recentCollisions: CollisionEvent[];
  /** Current technique scores */
  techniqueMetrics: TechniqueMetrics;
  /** Overall score */
  score: number;
  /** Active crisis if any */
  activeCrisis: CrisisEvent | null;
}

export interface TechniqueMetrics {
  /** Economy of motion (0-100) */
  economyOfMotion: number;
  /** Tissue respect (0-100) */
  tissueRespect: number;
  /** Time efficiency (0-100) */
  timeEfficiency: number;
  /** Safety awareness (0-100) */
  safetyAwareness: number;
}

export interface MentorResponse {
  /** Visible anatomical structures */
  structuresVisible: string[];
  /** Safety assessment level */
  safetyAssessment: 'safe' | 'caution' | 'danger' | 'critical';
  /** What to do next */
  recommendation: string;
  /** Tone of feedback */
  tone: 'encouraging' | 'cautionary' | 'urgent';
  /** Structures to highlight in 3D */
  highlightStructures?: string[];
  /** Full text response */
  fullText: string;
  /** Confidence score (0-1) */
  confidence: number;
}

export interface AnalysisRequest {
  /** Base64 encoded screenshot */
  sceneSnapshot: string;
  /** Current simulation state */
  state: SimulationState;
  /** Include conversation history? */
  includeHistory?: boolean;
}

// ============================================================================
// Configuration
// ============================================================================

const CONFIG = {
  MODEL: 'claude-3-5-sonnet-20241022',
  MAX_TOKENS: 300,
  TEMPERATURE: 0.7,
  API_TIMEOUT: 10000, // 10s
  CACHE_TTL: 60000, // 1 min
  MAX_CONVERSATION_MESSAGES: 10,
  DEBOUNCE_MS: 2000, // Analyze every 2 seconds
} as const;

// ============================================================================
// System Prompt
// ============================================================================

const SURGICAL_MENTOR_SYSTEM = `You are an expert neurosurgeon specializing in endoscopic transsphenoidal pituitary surgery.

Your role: Provide real-time mentorship to a surgical resident during simulation training.

Key principles:
1. Safety first - Always warn about proximity to ICA/carotid arteries (<2mm is critical)
2. Anatomical accuracy - Identify visible structures correctly
3. Progressive teaching - Adapt to trainee level (1=beginner, 2=intermediate, 3=advanced)
4. Constructive feedback - Balance encouragement with correction
5. Brevity - Keep responses to 2-3 sentences max

Critical structures:
- ICA (Internal Carotid Artery): NEVER touch, 2mm safe margin, catastrophic if injured
- MWCS (Medial Wall Cavernous Sinus): Firm texture = stop, soft texture = tumor
- Dura: 0.5mm thick, CSF leak risk if breached, requires meticulous opening
- Optic chiasm: Superior to sella, avoid upward force, can cause vision loss
- Pituitary stalk: Midline, preserve for hormonal function
- Sphenoid sinus: Entry point, mucosa bleeds easily
- Sella turcica: Bony floor contains pituitary

Visual cues:
- Red/pink pulsation = arterial structure (likely ICA)
- White/gray = bone or dura
- Purple/brown = tumor
- Beige/tan = normal pituitary
- Dark cavity = sphenoid sinus

Respond with JSON format:
{
  "structures_visible": ["list", "of", "visible", "structures"],
  "safety_assessment": "safe|caution|danger|critical",
  "recommendation": "What to do next (2-3 sentences)",
  "tone": "encouraging|cautionary|urgent",
  "highlight_structures": ["structures", "to", "highlight"],
  "confidence": 0.0-1.0
}

Adapt teaching style:
- Level 1 (Beginner): More guidance, explain anatomy, step-by-step
- Level 2 (Intermediate): Ask guiding questions, let them reason
- Level 3 (Advanced): Challenge with edge cases, expect precision

If you see collision/trauma:
- Assess severity
- Explain what went wrong
- Suggest corrective action
- Provide encouragement if appropriate`;

// ============================================================================
// Claude Vision Service Class
// ============================================================================

export class ClaudeVisionService {
  private client: Anthropic;
  private conversationHistory: Anthropic.MessageParam[] = [];
  private cache: Map<string, { response: MentorResponse; timestamp: number }> = new Map();
  private lastAnalysisTime: number = 0;
  private isProcessing: boolean = false;

  constructor(apiKey: string) {
    this.client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true });
  }

  // ==========================================================================
  // Public API
  // ==========================================================================

  /**
   * Analyze current surgical scene and provide mentorship
   *
   * @param request - Analysis request with scene snapshot and state
   * @returns Mentor response with recommendations
   */
  async analyze(request: AnalysisRequest): Promise<MentorResponse> {
    // Debouncing: Prevent analysis spam
    const now = Date.now();
    if (now - this.lastAnalysisTime < CONFIG.DEBOUNCE_MS) {
      throw new Error('Analysis rate limited. Please wait.');
    }

    // Check cache
    const cacheKey = this.computeCacheKey(request);
    const cached = this.cache.get(cacheKey);
    if (cached && now - cached.timestamp < CONFIG.CACHE_TTL) {
      console.log('[ClaudeVision] Cache hit:', cacheKey);
      return cached.response;
    }

    // Prevent concurrent requests
    if (this.isProcessing) {
      throw new Error('Analysis already in progress');
    }

    this.isProcessing = true;
    this.lastAnalysisTime = now;

    try {
      const response = await this.performAnalysis(request);

      // Cache result
      this.cache.set(cacheKey, { response, timestamp: now });

      return response;
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Analyze with streaming for lower perceived latency
   *
   * @param request - Analysis request
   * @param onChunk - Callback for each text chunk
   */
  async analyzeStreaming(
    request: AnalysisRequest,
    onChunk: (text: string) => void
  ): Promise<MentorResponse> {
    const context = this.buildContextPrompt(request.state);
    const messages = this.buildMessages(request, context);

    let fullText = '';

    const stream = await this.client.messages.stream({
      model: CONFIG.MODEL,
      max_tokens: CONFIG.MAX_TOKENS,
      temperature: CONFIG.TEMPERATURE,
      system: SURGICAL_MENTOR_SYSTEM,
      messages,
    });

    for await (const chunk of stream) {
      if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
        const text = chunk.delta.text;
        fullText += text;
        onChunk(text);
      }
    }

    // Parse final response
    return this.parseResponse(fullText, request.state);
  }

  /**
   * Clear conversation history
   */
  clearHistory(): void {
    this.conversationHistory = [];
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; hitRate: number } {
    // TODO: Track hits/misses for accurate hit rate
    return {
      size: this.cache.size,
      hitRate: 0, // Placeholder
    };
  }

  // ==========================================================================
  // Private Methods
  // ==========================================================================

  private async performAnalysis(request: AnalysisRequest): Promise<MentorResponse> {
    const context = this.buildContextPrompt(request.state);
    const messages = this.buildMessages(request, context);

    const response = await this.client.messages.create({
      model: CONFIG.MODEL,
      max_tokens: CONFIG.MAX_TOKENS,
      temperature: CONFIG.TEMPERATURE,
      system: SURGICAL_MENTOR_SYSTEM,
      messages,
    });

    // Extract text from response
    const textContent = response.content.find(block => block.type === 'text');
    const fullText = textContent && textContent.type === 'text' ? textContent.text : '';

    // Update conversation history
    this.updateConversationHistory(messages, fullText);

    return this.parseResponse(fullText, request.state);
  }

  private buildContextPrompt(state: SimulationState): string {
    const levelDesc = this.getLevelDescription(state.level);
    const closestDanger = this.getClosestDanger(state.safetyZones, state.scopePosition);
    const recentEvents = this.formatRecentEvents(state.recentCollisions);
    const scores = this.formatScores(state.techniqueMetrics);

    return `Current situation:
- Level: ${state.level} (${levelDesc})
- Objective: ${state.currentObjective}
- Position: ${this.formatPosition(state.scopePosition)}
- Scope Angle: Pitch ${state.scopeAngle.pitch.toFixed(2)}, Yaw ${state.scopeAngle.yaw.toFixed(2)}
- Safety: ${closestDanger}
- Recent events: ${recentEvents}
- Technique scores: ${scores}
- Overall score: ${state.score}
${state.activeCrisis ? `- ACTIVE CRISIS: ${state.activeCrisis.description}` : ''}

Analyze the attached endoscope view and provide guidance.`;
  }

  private buildMessages(
    request: AnalysisRequest,
    context: string
  ): Anthropic.MessageParam[] {
    const newMessage: Anthropic.MessageParam = {
      role: 'user',
      content: [
        {
          type: 'image',
          source: {
            type: 'base64',
            media_type: 'image/jpeg',
            data: request.sceneSnapshot,
          },
        },
        {
          type: 'text',
          text: context,
        },
      ],
    };

    // Include conversation history if requested
    if (request.includeHistory && this.conversationHistory.length > 0) {
      return [...this.conversationHistory, newMessage];
    }

    return [newMessage];
  }

  private updateConversationHistory(
    userMessages: Anthropic.MessageParam[],
    assistantResponse: string
  ): void {
    // Add user message (only the latest)
    const latestUserMessage = userMessages[userMessages.length - 1];
    this.conversationHistory.push(latestUserMessage);

    // Add assistant response
    this.conversationHistory.push({
      role: 'assistant',
      content: assistantResponse,
    });

    // Trim to max length
    if (this.conversationHistory.length > CONFIG.MAX_CONVERSATION_MESSAGES * 2) {
      this.conversationHistory = this.conversationHistory.slice(-CONFIG.MAX_CONVERSATION_MESSAGES * 2);
    }
  }

  private parseResponse(text: string, _state: SimulationState): MentorResponse {
    try {
      // Try to extract JSON from response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          structuresVisible: parsed.structures_visible || [],
          safetyAssessment: parsed.safety_assessment || 'safe',
          recommendation: parsed.recommendation || text,
          tone: parsed.tone || 'encouraging',
          highlightStructures: parsed.highlight_structures || [],
          fullText: text,
          confidence: parsed.confidence || 0.8,
        };
      }
    } catch (error) {
      console.warn('[ClaudeVision] Failed to parse JSON response:', error);
    }

    // Fallback: Generate response from unstructured text
    return {
      structuresVisible: [],
      safetyAssessment: this.inferSafetyFromText(text),
      recommendation: text,
      tone: this.inferToneFromText(text),
      fullText: text,
      confidence: 0.6,
    };
  }

  private inferSafetyFromText(text: string): 'safe' | 'caution' | 'danger' | 'critical' {
    const lower = text.toLowerCase();
    if (lower.includes('critical') || lower.includes('emergency') || lower.includes('ica')) {
      return 'critical';
    }
    if (lower.includes('danger') || lower.includes('stop') || lower.includes('careful')) {
      return 'danger';
    }
    if (lower.includes('caution') || lower.includes('watch') || lower.includes('proximity')) {
      return 'caution';
    }
    return 'safe';
  }

  private inferToneFromText(text: string): 'encouraging' | 'cautionary' | 'urgent' {
    const lower = text.toLowerCase();
    if (lower.includes('great') || lower.includes('excellent') || lower.includes('good')) {
      return 'encouraging';
    }
    if (lower.includes('stop') || lower.includes('critical') || lower.includes('emergency')) {
      return 'urgent';
    }
    return 'cautionary';
  }

  private computeCacheKey(request: AnalysisRequest): string {
    const { level, scopePosition, safetyZones } = request.state;
    const pos = `${Math.round(scopePosition.x * 10)},${Math.round(scopePosition.y * 10)},${Math.round(scopePosition.z * 10)}`;
    const safety = safetyZones.map(z => z.riskLevel).join(',');
    return `L${level}_${pos}_${safety}`;
  }

  // ==========================================================================
  // Formatting Helpers
  // ==========================================================================

  private getLevelDescription(level: number): string {
    switch (level) {
      case 1:
        return 'Beginner - Navigating to sphenoid sinus';
      case 2:
        return 'Intermediate - Opening sella turcica';
      case 3:
        return 'Advanced - Tumor resection near ICA';
      default:
        return 'Unknown level';
    }
  }

  private formatPosition(pos: Vector3D): string {
    return `(${pos.x.toFixed(2)}, ${pos.y.toFixed(2)}, ${pos.z.toFixed(2)})`;
  }

  private getClosestDanger(zones: SafetyZone[], position: Vector3D): string {
    if (zones.length === 0) return 'No active safety zones';

    const closest = zones.reduce((prev, curr) => {
      const prevDist = this.distance(prev.position, position);
      const currDist = this.distance(curr.position, position);
      return currDist < prevDist ? curr : prev;
    });

    const dist = this.distance(closest.position, position);
    return `${closest.structureName} at ${dist.toFixed(1)}mm (${closest.riskLevel})`;
  }

  private distance(a: Vector3D, b: Vector3D): number {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    const dz = a.z - b.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz) * 10; // Convert to mm
  }

  private formatRecentEvents(collisions: CollisionEvent[]): string {
    if (collisions.length === 0) return 'None';

    const recent = collisions.slice(-3);
    return recent
      .map(c => `${c.tissueType} (intensity ${c.intensity.toFixed(2)})`)
      .join(', ');
  }

  private formatScores(metrics: TechniqueMetrics): string {
    return `Motion=${metrics.economyOfMotion}, Tissue=${metrics.tissueRespect}, Time=${metrics.timeEfficiency}, Safety=${metrics.safetyAwareness}`;
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Capture current scene as base64 JPEG
 */
export function captureSceneSnapshot(canvas: HTMLCanvasElement): string {
  const dataURL = canvas.toDataURL('image/jpeg', 0.8);
  return dataURL.split(',')[1]; // Remove data:image/jpeg;base64, prefix
}

/**
 * Create singleton instance (use ANTHROPIC_API_KEY from env)
 */
export function createClaudeVisionService(): ClaudeVisionService | null {
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;

  if (!apiKey) {
    console.warn('[ClaudeVision] No API key found. Set VITE_ANTHROPIC_API_KEY.');
    return null;
  }

  return new ClaudeVisionService(apiKey);
}
