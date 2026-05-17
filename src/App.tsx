import React, { useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { PerspectiveCamera, SpotLight } from '@react-three/drei';
import * as THREE from 'three';
import { AudioEngine } from './engines/audio';
import { PhysicsEngine } from './engines/physics';
import { CavernousSinus } from './components/CavernousSinus';
import { HandTracker } from './components/HandInput';
import { AVAILABLE_TOOLS, inputRefs, useGameStore } from './store';

// Simulation configuration
const DOPPLER_SIGNAL_THRESHOLD = 0.8;
const SUCTION_RATE = 0.5;

const SimulationLoop: React.FC = () => {
  const { activeTool, step, reduceBlood, setFeedback } = useGameStore();

  const physics = useMemo(() => new PhysicsEngine(), []);
  const audio = useMemo(() => new AudioEngine(), []);

  const scopeRef = useRef<THREE.PerspectiveCamera>(null);
  const toolRef = useRef<THREE.Mesh>(null);
  const lightRef = useRef<THREE.SpotLight>(null);

  // Cleanup audio engine on unmount
  useEffect(() => {
    return () => {
      audio.dispose();
    };
  }, [audio]);

  useFrame(() => {
    const sim = physics.update();

    if (scopeRef.current) {
      scopeRef.current.position.lerp(sim.scope.pos, 0.2);
      scopeRef.current.quaternion.slerp(sim.scope.rot, 0.2);

      if (lightRef.current) {
        lightRef.current.position.copy(scopeRef.current.position);
        lightRef.current.rotation.copy(scopeRef.current.rotation);
      }
    }

    if (toolRef.current) {
      toolRef.current.position.lerp(sim.tool.pos, 0.2);
      toolRef.current.quaternion.slerp(sim.tool.rot, 0.2);
    }

    const isDoppler = activeTool === 'doppler' && inputRefs.rightHand.pinch;
    const signal = audio.updateDoppler(sim.tool.pos, isDoppler);

    if (signal > DOPPLER_SIGNAL_THRESHOLD && step === 'MAPPING') {
      setFeedback('Anterior Genu Located. Mark for Incision.', 'success');
    }

    if (activeTool === 'suction' && inputRefs.rightHand.pinch) {
      reduceBlood(SUCTION_RATE);
    }
  });

  return (
    <>
      <PerspectiveCamera ref={scopeRef} makeDefault fov={70} near={0.1} far={100} />
      <SpotLight ref={lightRef} intensity={2.5} angle={0.5} penumbra={0.5} castShadow />
      <ambientLight intensity={0.3} />
      <fog attach="fog" args={["#000000", 0, 25]} />

      {/* Pass toolRef directly to avoid unnecessary object allocations */}
      <CavernousSinus toolRef={toolRef} audio={audio} />

      <mesh ref={toolRef} visible={activeTool !== 'scope'}>
        <cylinderGeometry args={[0.03, 0.03, 15]} />
        <meshStandardMaterial color={activeTool === 'doppler' ? '#00ff00' : '#cccccc'} />
      </mesh>
    </>
  );
};

export default function App() {
  const { bloodLevel, step, activeTool, feedback, feedbackType, setTool, setStep } = useGameStore();

  return (
    <div className="w-full h-screen bg-black overflow-hidden font-mono text-white select-none cursor-none relative">
      <HandTracker />

      <Canvas shadows>
        <SimulationLoop />
      </Canvas>

      <div
        className="absolute inset-0 pointer-events-none mix-blend-multiply bg-red-900 transition-opacity duration-150"
        style={{ opacity: bloodLevel / 100 }}
      />

      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle,transparent_60%,black_95%)]" />

      <div className="absolute top-0 left-0 w-full p-8 flex justify-between pointer-events-none">
        <div>
          <h1 className="text-3xl font-bold text-blue-500">NEURO-ENDO SIM</h1>
          <div
            className={`mt-2 px-4 py-2 rounded border ${
              feedbackType === 'critical'
                ? 'bg-red-900/80 border-red-500 animate-pulse'
                : feedbackType === 'success'
                ? 'bg-green-900/80 border-green-500'
                : 'bg-blue-900/50 border-blue-500'
            }`}
          >
            {feedback}
          </div>
        </div>
        <div className="text-right">
          <p className="text-xl text-yellow-400">{step.replace('_', ' ')}</p>
          <div className="w-48 h-4 bg-gray-800 mt-2 border border-gray-600">
            <div
              className={`h-full ${bloodLevel > 50 ? 'bg-red-600' : 'bg-green-500'}`}
              style={{ width: `${bloodLevel}%` }}
            />
          </div>
          <p className="text-xs text-gray-400 mt-1">HEMOSTASIS LOSS</p>
        </div>
      </div>

      <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 flex gap-6 pointer-events-auto cursor-auto">
        {/* Use AVAILABLE_TOOLS from store for single source of truth */}
        {AVAILABLE_TOOLS.map((t) => (
          <button
            key={t}
            onClick={() => setTool(t)}
            className={`w-20 h-20 rounded-full border-2 flex items-center justify-center transition-all ${
              activeTool === t
                ? 'bg-blue-600 scale-110 border-white shadow-lg'
                : 'bg-gray-800 border-gray-600 text-gray-500'
            }`}
          >
            {t[0].toUpperCase()}
          </button>
        ))}
        <button onClick={() => setStep('RESECTION')} className="absolute -right-32 top-6 text-xs bg-gray-800 p-2 rounded">
          DEBUG: SKIP
        </button>
      </div>
    </div>
  );
}
