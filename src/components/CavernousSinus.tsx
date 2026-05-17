import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { CN_VI_PATH, ICA_PATH } from '../anatomy';
import { AudioEngine } from '../engines/audio';
import { inputRefs, useGameStore } from '../store';

// Interaction configuration constants
const WALL_Z_POSITION = -10.5;
const WALL_Z_TOLERANCE = 0.5;
const WALL_SIZE = 3.0;
const GRID_SIZE = 10;
const ICA_INJURY_THRESHOLD = 0.3;
const RESECTION_DECREMENT = 0.1;
const RESECTION_EPSILON = 0.001; // Epsilon for floating-point comparison
const VIBRATION_DURATION_MS = 15;
const INJURY_DEBOUNCE_MS = 500;

interface Props {
  toolRef: React.RefObject<THREE.Mesh>;
  audio: AudioEngine;
}

/**
 * Safely trigger haptic feedback if available in the browser environment.
 */
function safeVibrate(pattern: number | number[]): void {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    navigator.vibrate?.(pattern);
  }
}

export const CavernousSinus: React.FC<Props> = ({ toolRef, audio }) => {
  const icaRef = useRef<THREE.Mesh>(null);
  const { activeTool, step, addTrauma, incrementResection, setFeedback } = useGameStore();

  // Debounce ref for ICA injury - prevents frame-rate-dependent event stacking
  const lastInjuryTimeRef = useRef<number>(0);

  const gridIndices = useMemo(() => Array.from({ length: 100 }, (_, i) => i), []);

  useFrame(({ clock }) => {
    if (icaRef.current) {
      const pulse = 1 + Math.sin(clock.elapsedTime * 8) * 0.02;
      icaRef.current.scale.set(pulse, pulse, 1);
    }

    // Get tool position from ref, skip if not available
    const toolPos = toolRef.current?.position;
    if (!toolPos) return;

    if (inputRefs.rightHand.pinch && activeTool !== 'scope') {
      if (activeTool === 'dissector' || activeTool === 'drill') {
        if (Math.abs(toolPos.z - WALL_Z_POSITION) < WALL_Z_TOLERANCE) {
          const normalizedX = (toolPos.x + WALL_SIZE / 2) / WALL_SIZE;
          const normalizedY = (toolPos.y + WALL_SIZE / 2) / WALL_SIZE;
          const x = Math.floor(normalizedX * GRID_SIZE);
          const y = Math.floor(normalizedY * GRID_SIZE);

          if (x >= 0 && x < GRID_SIZE && y >= 0 && y < GRID_SIZE) {
            const idx = y * GRID_SIZE + x;
            if (inputRefs.wallGrid[idx] > RESECTION_EPSILON) {
              if (step === 'RESECTION') {
                inputRefs.wallGrid[idx] = Math.max(0, inputRefs.wallGrid[idx] - RESECTION_DECREMENT);
                // Use epsilon comparison instead of strict equality
                if (inputRefs.wallGrid[idx] < RESECTION_EPSILON) {
                  incrementResection();
                }
                safeVibrate(VIBRATION_DURATION_MS);
              } else {
                setFeedback('Protocol Violation: Map Anatomy First!', 'critical');
              }
            }
          }
        }
      }

      // Check ICA proximity with debouncing
      const distICA = toolPos.distanceTo(ICA_PATH.getPointAt(0.5));
      if (distICA < ICA_INJURY_THRESHOLD && activeTool !== 'doppler') {
        const now = Date.now();
        // Debounce: only trigger if enough time has passed since last injury
        if (now - lastInjuryTimeRef.current > INJURY_DEBOUNCE_MS) {
          lastInjuryTimeRef.current = now;
          addTrauma(2);
          audio.triggerAlarm();
          setFeedback('CRITICAL: CAROTID INJURY', 'critical');
        }
      }
    }
  });

  return (
    <group>
      <mesh ref={icaRef}>
        <tubeGeometry args={[ICA_PATH, 64, 0.35, 16, false]} />
        <meshStandardMaterial color="#b30000" roughness={0.2} />
      </mesh>

      <mesh position={[0.2, -0.5, 0]}>
        <tubeGeometry args={[CN_VI_PATH, 32, 0.08, 8, false]} />
        <meshStandardMaterial color="#ffd700" />
      </mesh>

      <group position={[-1.5, -1.5, WALL_Z_POSITION]}>
        {gridIndices.map((i) => {
          const integrity = inputRefs.wallGrid[i];
          if (integrity <= 0.01) return null;

          const x = (i % GRID_SIZE) * 0.3;
          const y = Math.floor(i / GRID_SIZE) * 0.3;

          return (
            <mesh key={i} position={[x, y, 0]} rotation={[0, 0.2, 0]}>
              <planeGeometry args={[0.28, 0.28]} />
              <meshStandardMaterial
                color="#dcbdbd"
                transparent
                opacity={integrity}
                side={THREE.DoubleSide}
              />
            </mesh>
          );
        })}
      </group>

      <mesh position={[-0.2, 0, -11.5]}>
        <sphereGeometry args={[1.2, 32, 32]} />
        <meshStandardMaterial color="#a86e88" roughness={0.7} />
      </mesh>
    </group>
  );
};
