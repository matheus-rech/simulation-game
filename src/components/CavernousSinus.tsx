import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { CN_VI_PATH, ICA_PATH } from '../anatomy';
import { AudioEngine } from '../engines/audio';
import { inputRefs, useGameStore } from '../store';

interface Props {
  toolPos: THREE.Vector3;
  audio: AudioEngine;
}

export const CavernousSinus: React.FC<Props> = ({ toolPos, audio }) => {
  const icaRef = useRef<THREE.Mesh>(null);
  const { activeTool, step, addTrauma, incrementResection, setFeedback } = useGameStore();

  const gridIndices = useMemo(() => Array.from({ length: 100 }, (_, i) => i), []);

  useFrame(({ clock }) => {
    if (icaRef.current) {
      const pulse = 1 + Math.sin(clock.elapsedTime * 8) * 0.02;
      icaRef.current.scale.set(pulse, pulse, 1);
    }

    if (inputRefs.rightHand.pinch && activeTool !== 'scope') {
      if (activeTool === 'dissector' || activeTool === 'drill') {
        if (Math.abs(toolPos.z - -10.5) < 0.5) {
          const x = Math.floor(((toolPos.x + 1.5) / 3) * 10);
          const y = Math.floor(((toolPos.y + 1.5) / 3) * 10);

          if (x >= 0 && x < 10 && y >= 0 && y < 10) {
            const idx = y * 10 + x;
            if (inputRefs.wallGrid[idx] > 0) {
              if (step === 'RESECTION') {
                inputRefs.wallGrid[idx] = Math.max(0, inputRefs.wallGrid[idx] - 0.1);
                if (inputRefs.wallGrid[idx] === 0) incrementResection();
                navigator.vibrate?.(15);
              } else {
                setFeedback('Protocol Violation: Map Anatomy First!', 'critical');
              }
            }
          }
        }
      }

      const distICA = toolPos.distanceTo(ICA_PATH.getPointAt(0.5));
      if (distICA < 0.3 && activeTool !== 'doppler') {
        addTrauma(2);
        audio.triggerAlarm();
        setFeedback('CRITICAL: CAROTID INJURY', 'critical');
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

      <group position={[-1.5, -1.5, -10.5]}>
        {gridIndices.map((i) => {
          const integrity = inputRefs.wallGrid[i];
          if (integrity <= 0.01) return null;

          const x = (i % 10) * 0.3;
          const y = Math.floor(i / 10) * 0.3;

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
