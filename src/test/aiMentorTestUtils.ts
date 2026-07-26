/**
 * AI Mentor Test Utilities
 *
 * Mock data, helpers, and fixtures for testing AI mentor functionality.
 */

import { SimulationState, MentorResponse, TechniqueMetrics } from '../services/ai/ClaudeVisionService';
import { CollisionEvent, CrisisEvent, CrisisType } from '../components/3d/collision/types';
import { TissueType } from '../components/3d/materials/TissueMaterials';
import { SafetyZone } from '../components/3d/safety/SafetyCorridorManager';

// ============================================================================
// Mock API Key
// ============================================================================

export const MOCK_API_KEY = 'sk-ant-api03-mock-key-for-testing';

// ============================================================================
// Mock Simulation States
// ============================================================================

export const mockTechniqueMetrics: TechniqueMetrics = {
  economyOfMotion: 85,
  tissueRespect: 90,
  timeEfficiency: 75,
  safetyAwareness: 95,
};

export const mockSimulationStateLevel1: SimulationState = {
  level: 1,
  currentObjective: 'Navigate through nasal cavity to sphenoid ostium',
  scopePosition: { x: 0, y: 0, z: 1.2 },
  scopeAngle: { pitch: 0.05, yaw: 0 },
  safetyZones: [],
  recentCollisions: [],
  techniqueMetrics: mockTechniqueMetrics,
  score: 100,
  activeCrisis: null,
};

export const mockSimulationStateLevel2: SimulationState = {
  level: 2,
  currentObjective: 'Open sella turcica floor and expose dura',
  scopePosition: { x: 0, y: 0.4, z: -7.2 },
  scopeAngle: { pitch: 0.1, yaw: 0 },
  safetyZones: [
    {
      structure: 'ICA (Left)',
      position: { x: -0.9, y: 0.3, z: -7.3 },
      radius: 0.2,
      status: 'safe',
    },
    {
      structure: 'ICA (Right)',
      position: { x: 0.9, y: 0.3, z: -7.3 },
      radius: 0.2,
      status: 'safe',
    },
  ],
  recentCollisions: [
    {
      position: { x: 0, y: 0.35, z: -7.1 },
      tissueType: TissueType.BONE,
      timestamp: Date.now() - 5000,
      intensity: 0.3,
    },
  ],
  techniqueMetrics: { ...mockTechniqueMetrics, tissueRespect: 80 },
  score: 92,
  activeCrisis: null,
};

export const mockSimulationStateLevel3: SimulationState = {
  level: 3,
  currentObjective: 'Resect pituitary adenoma while avoiding ICA',
  scopePosition: { x: 0, y: 0.6, z: -7.5 },
  scopeAngle: { pitch: 0.15, yaw: 0.05 },
  safetyZones: [
    {
      structure: 'ICA (Left)',
      position: { x: -0.9, y: 0.3, z: -7.3 },
      radius: 0.2,
      status: 'danger',
    },
    {
      structure: 'ICA (Right)',
      position: { x: 0.9, y: 0.3, z: -7.3 },
      radius: 0.2,
      status: 'caution',
    },
  ],
  recentCollisions: [
    {
      position: { x: 0, y: 0.5, z: -7.4 },
      tissueType: TissueType.DURA,
      timestamp: Date.now() - 2000,
      intensity: 0.5,
    },
    {
      position: { x: 0, y: 0.55, z: -7.45 },
      tissueType: TissueType.TUMOR,
      timestamp: Date.now() - 1000,
      intensity: 0.4,
    },
  ],
  techniqueMetrics: {
    economyOfMotion: 75,
    tissueRespect: 70,
    timeEfficiency: 65,
    safetyAwareness: 85,
  },
  score: 78,
  activeCrisis: null,
};

export const mockSimulationStateWithCrisis: SimulationState = {
  ...mockSimulationStateLevel3,
  activeCrisis: {
    type: CrisisType.ICA_INJURY,
    timestamp: Date.now(),
    collision: {
      position: { x: -0.9, y: 0.3, z: -7.3 },
      tissueType: TissueType.ICA,
      timestamp: Date.now(),
      intensity: 0.9,
    },
    description: 'Critical: Internal Carotid Artery injury detected! Catastrophic bleeding.',
  },
};

// ============================================================================
// Mock Mentor Responses
// ============================================================================

export const mockMentorResponseEncouraging: MentorResponse = {
  structuresVisible: ['Sphenoid Sinus', 'Sphenoid Ostium'],
  safetyAssessment: 'safe',
  recommendation: 'Excellent approach! You are correctly navigating through the nasal cavity. Continue advancing toward the sphenoid ostium visible ahead.',
  tone: 'encouraging',
  highlightStructures: ['Sphenoid Ostium'],
  fullText: 'Excellent approach! You are correctly navigating through the nasal cavity. Continue advancing toward the sphenoid ostium visible ahead.',
  confidence: 0.92,
};

export const mockMentorResponseCautionary: MentorResponse = {
  structuresVisible: ['Sella Turcica', 'Dura', 'ICA (Left)', 'ICA (Right)'],
  safetyAssessment: 'caution',
  recommendation: 'You are approaching the sella floor. Notice the bony texture. Identify the carotid arteries laterally before proceeding. Use gentle pressure to avoid dural injury.',
  tone: 'cautionary',
  highlightStructures: ['ICA (Left)', 'ICA (Right)'],
  fullText: 'You are approaching the sella floor. Notice the bony texture. Identify the carotid arteries laterally before proceeding. Use gentle pressure to avoid dural injury.',
  confidence: 0.88,
};

export const mockMentorResponseUrgent: MentorResponse = {
  structuresVisible: ['ICA (Left)', 'Pituitary Adenoma', 'MWCS'],
  safetyAssessment: 'critical',
  recommendation: 'STOP! You are within 2mm of the left internal carotid artery. Any contact will cause catastrophic bleeding. Reposition immediately to midline.',
  tone: 'urgent',
  highlightStructures: ['ICA (Left)'],
  fullText: 'STOP! You are within 2mm of the left internal carotid artery. Any contact will cause catastrophic bleeding. Reposition immediately to midline.',
  confidence: 0.96,
};

export const mockMentorResponseCrisis: MentorResponse = {
  structuresVisible: ['ICA (Left)', 'Arterial Blood'],
  safetyAssessment: 'critical',
  recommendation: 'EMERGENCY: ICA injury occurred. Immediate management required: 1) Apply direct pressure with cotton patty, 2) Call for vascular surgery, 3) Prepare for urgent angiography. Do NOT attempt to continue resection.',
  tone: 'urgent',
  highlightStructures: ['ICA (Left)'],
  fullText: 'EMERGENCY: ICA injury occurred. Immediate management required: 1) Apply direct pressure with cotton patty, 2) Call for vascular surgery, 3) Prepare for urgent angiography. Do NOT attempt to continue resection.',
  confidence: 0.99,
};

// ============================================================================
// Mock Scene Snapshots
// ============================================================================

/**
 * Generate mock base64 image (1x1 red pixel)
 */
export function generateMockSnapshot(): string {
  // Base64 encoded 1x1 red pixel JPEG
  return '/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwAA//2Q==';
}

/**
 * Generate realistic mock snapshot (512x512 canvas with gradient)
 */
export function generateRealisticMockSnapshot(): string {
  if (typeof document === 'undefined') {
    return generateMockSnapshot();
  }

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    return generateMockSnapshot();
  }

  // Create gradient (simulating endoscope view)
  const gradient = ctx.createRadialGradient(256, 256, 50, 256, 256, 300);
  gradient.addColorStop(0, '#8b7355');
  gradient.addColorStop(0.5, '#5c4033');
  gradient.addColorStop(1, '#2c1810');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 512, 512);

  // Add vignette
  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
  ctx.beginPath();
  ctx.arc(256, 256, 256, 0, Math.PI * 2);
  ctx.rect(512, 0, -512, 512);
  ctx.fill();

  return canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
}

// ============================================================================
// Mock Claude API Responses
// ============================================================================

export const mockClaudeAPIResponse = {
  id: 'msg_01ABC123',
  type: 'message',
  role: 'assistant',
  content: [
    {
      type: 'text',
      text: JSON.stringify({
        structures_visible: ['Sphenoid Sinus', 'Sphenoid Ostium'],
        safety_assessment: 'safe',
        recommendation: 'Excellent approach! Continue advancing toward the sphenoid ostium.',
        tone: 'encouraging',
        highlight_structures: ['Sphenoid Ostium'],
        confidence: 0.92,
      }),
    },
  ],
  model: 'claude-3-5-sonnet-20241022',
  stop_reason: 'end_turn',
  usage: {
    input_tokens: 2268,
    output_tokens: 125,
  },
};

// ============================================================================
// Test Helpers
// ============================================================================

/**
 * Create mock simulation state with custom overrides
 */
export function createMockSimulationState(
  overrides: Partial<SimulationState> = {}
): SimulationState {
  return {
    ...mockSimulationStateLevel1,
    ...overrides,
  };
}

/**
 * Create mock mentor response with custom overrides
 */
export function createMockMentorResponse(
  overrides: Partial<MentorResponse> = {}
): MentorResponse {
  return {
    ...mockMentorResponseEncouraging,
    ...overrides,
  };
}

/**
 * Create mock collision event
 */
export function createMockCollisionEvent(
  tissueType: TissueType = TissueType.MUCOSA,
  intensity: number = 0.3
): CollisionEvent {
  return {
    position: { x: 0, y: 0, z: 0 },
    tissueType,
    timestamp: Date.now(),
    intensity,
  };
}

/**
 * Create mock crisis event
 */
export function createMockCrisisEvent(
  type: CrisisType = CrisisType.ICA_INJURY
): CrisisEvent {
  return {
    type,
    timestamp: Date.now(),
    collision: createMockCollisionEvent(TissueType.ICA, 0.9),
    description: 'Critical event occurred',
  };
}

/**
 * Create mock safety zone
 */
export function createMockSafetyZone(
  structure: string = 'ICA (Left)',
  status: 'safe' | 'caution' | 'danger' | 'critical' = 'safe'
): SafetyZone {
  return {
    structure,
    position: { x: -0.9, y: 0.3, z: -7.3 },
    radius: 0.2,
    status,
  };
}

// ============================================================================
// Mock Anthropic Client
// ============================================================================

/**
 * Create mock Anthropic client for testing
 */
export function createMockAnthropicClient() {
  return {
    messages: {
      create: jest.fn().mockResolvedValue(mockClaudeAPIResponse),
      stream: jest.fn().mockImplementation(async function* () {
        // Simulate streaming chunks
        const chunks = [
          { type: 'content_block_start', index: 0, content_block: { type: 'text', text: '' } },
          { type: 'content_block_delta', index: 0, delta: { type: 'text_delta', text: 'Excellent ' } },
          { type: 'content_block_delta', index: 0, delta: { type: 'text_delta', text: 'approach! ' } },
          { type: 'content_block_delta', index: 0, delta: { type: 'text_delta', text: 'Continue advancing.' } },
          { type: 'content_block_stop', index: 0 },
          { type: 'message_stop' },
        ];

        for (const chunk of chunks) {
          yield chunk;
        }
      }),
    },
  };
}

// ============================================================================
// Validation Helpers
// ============================================================================

/**
 * Validate mentor response structure
 */
export function validateMentorResponse(response: MentorResponse): boolean {
  return (
    Array.isArray(response.structuresVisible) &&
    ['safe', 'caution', 'danger', 'critical'].includes(response.safetyAssessment) &&
    typeof response.recommendation === 'string' &&
    response.recommendation.length > 0 &&
    ['encouraging', 'cautionary', 'urgent'].includes(response.tone) &&
    typeof response.fullText === 'string' &&
    typeof response.confidence === 'number' &&
    response.confidence >= 0 &&
    response.confidence <= 1
  );
}

/**
 * Validate simulation state structure
 */
export function validateSimulationState(state: SimulationState): boolean {
  return (
    typeof state.level === 'number' &&
    state.level >= 1 &&
    state.level <= 3 &&
    typeof state.currentObjective === 'string' &&
    typeof state.scopePosition === 'object' &&
    typeof state.scopeAngle === 'object' &&
    Array.isArray(state.safetyZones) &&
    Array.isArray(state.recentCollisions) &&
    typeof state.techniqueMetrics === 'object' &&
    typeof state.score === 'number'
  );
}

// ============================================================================
// Performance Testing Helpers
// ============================================================================

/**
 * Measure latency of async function
 */
export async function measureLatency<T>(fn: () => Promise<T>): Promise<{ result: T; latency: number }> {
  const start = performance.now();
  const result = await fn();
  const latency = performance.now() - start;
  return { result, latency };
}

/**
 * Calculate cache hit rate from requests
 */
export function calculateCacheHitRate(requests: { cached: boolean }[]): number {
  if (requests.length === 0) return 0;
  const hits = requests.filter(r => r.cached).length;
  return hits / requests.length;
}

/**
 * Estimate cost per request
 */
export function estimateCost(inputTokens: number, outputTokens: number): number {
  const INPUT_PRICE = 3.0 / 1_000_000; // $3 per 1M tokens
  const OUTPUT_PRICE = 15.0 / 1_000_000; // $15 per 1M tokens

  return inputTokens * INPUT_PRICE + outputTokens * OUTPUT_PRICE;
}
