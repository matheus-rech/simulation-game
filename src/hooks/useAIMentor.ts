/**
 * useAIMentor Hook
 *
 * React hook for managing AI surgical mentor interactions.
 * Handles periodic scene analysis, streaming responses, and state management.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  ClaudeVisionService,
  SimulationState,
  MentorResponse,
  TechniqueMetrics,
  createClaudeVisionService,
  captureSceneSnapshot,
} from '../services/ai/ClaudeVisionService';

// ============================================================================
// Types
// ============================================================================

export interface AIMentorConfig {
  /** Enable AI mentor */
  enabled: boolean;
  /** Analysis interval (ms) */
  analysisInterval: number;
  /** Use streaming responses */
  useStreaming: boolean;
  /** Include conversation history */
  includeHistory: boolean;
  /** Show confidence scores */
  showConfidence: boolean;
}

export interface AIMentorState {
  /** Current mentor response */
  response: MentorResponse | null;
  /** Is analyzing? */
  isAnalyzing: boolean;
  /** Error message */
  error: string | null;
  /** Service ready? */
  isReady: boolean;
  /** Streaming text (partial response) */
  streamingText: string;
}

const DEFAULT_CONFIG: AIMentorConfig = {
  enabled: true,
  analysisInterval: 3000, // 3 seconds
  useStreaming: true,
  includeHistory: true,
  showConfidence: true,
};

const DEFAULT_STATE: AIMentorState = {
  response: null,
  isAnalyzing: false,
  error: null,
  isReady: false,
  streamingText: '',
};

// ============================================================================
// Hook
// ============================================================================

export function useAIMentor(
  simulationState: SimulationState,
  config: Partial<AIMentorConfig> = {}
) {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };
  const [state, setState] = useState<AIMentorState>(DEFAULT_STATE);
  const serviceRef = useRef<ClaudeVisionService | null>(null);
  const intervalRef = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // ==========================================================================
  // Initialization
  // ==========================================================================

  useEffect(() => {
    if (!mergedConfig.enabled) return;

    try {
      serviceRef.current = createClaudeVisionService();
      if (serviceRef.current) {
        setState(prev => ({ ...prev, isReady: true, error: null }));
      } else {
        setState(prev => ({
          ...prev,
          isReady: false,
          error: 'No API key. Set VITE_ANTHROPIC_API_KEY in .env',
        }));
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        isReady: false,
        error: `Failed to initialize: ${error}`,
      }));
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [mergedConfig.enabled]);

  // ==========================================================================
  // Periodic Analysis
  // ==========================================================================

  useEffect(() => {
    if (!mergedConfig.enabled || !state.isReady || !serviceRef.current) {
      return;
    }

    // Start periodic analysis
    intervalRef.current = setInterval(() => {
      analyzeScene();
    }, mergedConfig.analysisInterval) as unknown as number;

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [mergedConfig.enabled, state.isReady, mergedConfig.analysisInterval, simulationState]);

  // ==========================================================================
  // Analysis Function
  // ==========================================================================

  const analyzeScene = useCallback(async () => {
    if (!serviceRef.current || state.isAnalyzing || !canvasRef.current) {
      return;
    }

    setState(prev => ({ ...prev, isAnalyzing: true, error: null, streamingText: '' }));

    try {
      // Capture scene
      const sceneSnapshot = captureSceneSnapshot(canvasRef.current);

      // Perform analysis
      if (mergedConfig.useStreaming) {
        await serviceRef.current.analyzeStreaming(
          {
            sceneSnapshot,
            state: simulationState,
            includeHistory: mergedConfig.includeHistory,
          },
          (chunk: string) => {
            // Update streaming text
            setState(prev => ({
              ...prev,
              streamingText: prev.streamingText + chunk,
            }));
          }
        );
      } else {
        const response = await serviceRef.current.analyze({
          sceneSnapshot,
          state: simulationState,
          includeHistory: mergedConfig.includeHistory,
        });

        setState(prev => ({
          ...prev,
          response,
          isAnalyzing: false,
          streamingText: '',
        }));
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setState(prev => ({
        ...prev,
        isAnalyzing: false,
        error: errorMessage,
        streamingText: '',
      }));
    }
  }, [state.isAnalyzing, simulationState, mergedConfig]);

  // ==========================================================================
  // Manual Trigger
  // ==========================================================================

  const triggerAnalysis = useCallback(() => {
    analyzeScene();
  }, [analyzeScene]);

  // ==========================================================================
  // Canvas Registration
  // ==========================================================================

  const registerCanvas = useCallback((canvas: HTMLCanvasElement | null) => {
    canvasRef.current = canvas;
  }, []);

  // ==========================================================================
  // Clear History
  // ==========================================================================

  const clearHistory = useCallback(() => {
    if (serviceRef.current) {
      serviceRef.current.clearHistory();
    }
  }, []);

  // ==========================================================================
  // Clear Cache
  // ==========================================================================

  const clearCache = useCallback(() => {
    if (serviceRef.current) {
      serviceRef.current.clearCache();
    }
  }, []);

  // ==========================================================================
  // Return
  // ==========================================================================

  return {
    // State
    ...state,

    // Config
    config: mergedConfig,

    // Actions
    triggerAnalysis,
    registerCanvas,
    clearHistory,
    clearCache,
  };
}

// ============================================================================
// Utility: Create Default Simulation State
// ============================================================================

export function createDefaultSimulationState(
  level: number,
  score: number,
  scopePosition: { x: number; y: number; z: number },
  scopeAngle: { pitch: number; yaw: number }
): SimulationState {
  const objectives = [
    'Navigate through nasal cavity to sphenoid ostium',
    'Open sella turcica floor and expose dura',
    'Resect pituitary adenoma while avoiding ICA',
  ];

  const defaultMetrics: TechniqueMetrics = {
    economyOfMotion: 85,
    tissueRespect: 90,
    timeEfficiency: 75,
    safetyAwareness: 95,
  };

  return {
    level,
    currentObjective: objectives[level - 1] || 'Unknown objective',
    scopePosition,
    scopeAngle,
    safetyZones: [],
    recentCollisions: [],
    techniqueMetrics: defaultMetrics,
    score,
    activeCrisis: null,
  };
}
