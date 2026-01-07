import React, { useCallback, useMemo, useState } from "react";
import { EndoscopeView, ScopeAngle } from "./components/EndoscopeView";
import { Vector3D } from "./components/3d/VFX";

const initialTipPosition: Vector3D = { x: 0, y: 0, z: 1.2 };

export default function App() {
  const [level, setLevel] = useState(1);
  const [scopeAngle, setScopeAngle] = useState<ScopeAngle>({ pitch: 0.05, yaw: 0 });
  const [tipPosition, setTipPosition] = useState<Vector3D>(initialTipPosition);
  const [lastCollision, setLastCollision] = useState<Vector3D | null>(null);
  const [collisionCount, setCollisionCount] = useState(0);
  const [score, setScore] = useState(100);

  const rotationZ = useMemo(() => scopeAngle.yaw * 0.2, [scopeAngle.yaw]);

  const handleRaycastCollision = useCallback((point: Vector3D) => {
    setLastCollision(point);
    setCollisionCount((count) => count + 1);
    setScore((prev) => Math.max(prev - 2, 0));
  }, []);

  return (
    <div style={{ height: "100vh", width: "100vw", background: "#0f0a0a" }}>
      <div
        style={{
          position: "absolute",
          top: 16,
          left: 16,
          color: "#f7e5da",
          fontFamily: "sans-serif",
          zIndex: 1,
        }}
      >
        <div>Level: {level}</div>
        <div>Score: {score}</div>
        <div>Collisions: {collisionCount}</div>
        <button
          onClick={() => setLevel((prev) => (prev >= 3 ? 1 : prev + 1))}
          style={{ marginTop: 8 }}
        >
          Advance Level
        </button>
        <button
          onClick={() => {
            setScopeAngle({ pitch: 0.05, yaw: 0 });
            setTipPosition(initialTipPosition);
            setLastCollision(null);
          }}
          style={{ marginTop: 8, marginLeft: 8 }}
        >
          Reset Scope
        </button>
      </div>

      <EndoscopeView
        level={level}
        scopeAngle={scopeAngle}
        tipPosition={tipPosition}
        rotationZ={rotationZ}
        collision={lastCollision}
        onRaycastCollision={handleRaycastCollision}
      />
    </div>
  );
}
