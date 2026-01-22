import React, { useCallback, useEffect, useMemo, useState } from "react";
import { EndoscopeView, ScopeAngle } from "./components/EndoscopeView";
import { Vector3D } from "./components/3d/VFX";
import { CrisisEvent } from "./components/3d/collision/types";

const initialTipPosition: Vector3D = { x: 0, y: 0, z: 1.2 };

const styles = {
  overlay: {
    position: 'absolute' as const,
    top: 16,
    left: 16,
    padding: 20,
    background: 'rgba(15, 10, 10, 0.85)',
    borderRadius: 12,
    color: '#f7e5da',
    fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    zIndex: 10,
    border: '1px solid rgba(247, 229, 218, 0.15)',
    backdropFilter: 'blur(8px)',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
    minWidth: 220,
  },
  statsList: {
    margin: 0,
    padding: 0,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 8,
    marginBottom: 20,
  },
  statItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '0.95rem',
    borderBottom: '1px solid rgba(247, 229, 218, 0.1)',
    paddingBottom: 4,
  },
  statLabel: {
    opacity: 0.8,
    fontWeight: 400,
  },
  statValue: {
    margin: 0,
    fontWeight: 600,
    fontVariantNumeric: 'tabular-nums',
  },
  controls: {
    display: 'flex',
    gap: 8,
    flexWrap: 'wrap' as const,
  },
  button: {
    flex: 1,
    padding: '10px 14px',
    background: 'rgba(247, 229, 218, 0.08)',
    border: '1px solid rgba(247, 229, 218, 0.3)',
    borderRadius: 6,
    color: '#f7e5da',
    cursor: 'pointer',
    fontFamily: 'inherit',
    fontSize: '0.85rem',
    fontWeight: 500,
    transition: 'all 0.2s ease',
    whiteSpace: 'nowrap' as const,
    outline: 'none', // Focus handled by visible focus ring if possible, but for inline styles we rely on browser default or explicit focus style
  },
  crisisAlert: {
    position: 'absolute' as const,
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    padding: 24,
    background: 'rgba(183, 28, 43, 0.95)',
    borderRadius: 12,
    color: '#ffffff',
    fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    zIndex: 1000,
    border: '2px solid #ff4444',
    backdropFilter: 'blur(8px)',
    boxShadow: '0 8px 24px rgba(183, 28, 43, 0.6)',
    minWidth: 320,
    animation: 'pulse 1s ease-in-out infinite',
  },
  crisisTitle: {
    margin: '0 0 12px 0',
    fontSize: '1.5rem',
    fontWeight: 700,
    textAlign: 'center' as const,
  },
  crisisDescription: {
    margin: 0,
    fontSize: '1rem',
    textAlign: 'center' as const,
    opacity: 0.95,
  }
};

// Reusable button component to handle hover state cleanly
function HUDButton({ onClick, children, shortcut }: { onClick: () => void; children: React.ReactNode; shortcut?: string }) {
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const currentStyle = {
    ...styles.button,
    background: isHovered || isFocused ? 'rgba(247, 229, 218, 0.15)' : 'rgba(247, 229, 218, 0.08)',
    boxShadow: isFocused ? '0 0 0 2px rgba(247, 229, 218, 0.5)' : 'none',
  };

  return (
    <button
      onClick={onClick}
      style={currentStyle}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      type="button"
      aria-keyshortcuts={shortcut}
    >
      {children}
      {shortcut && (
        <kbd
          style={{
            marginLeft: 8,
            fontSize: '0.75em',
            background: 'rgba(255, 255, 255, 0.1)',
            padding: '2px 6px',
            borderRadius: 4,
            border: '1px solid rgba(255, 255, 255, 0.2)',
            fontFamily: 'inherit',
          }}
        >
          {shortcut}
        </kbd>
      )}
    </button>
  );
}

export default function App() {
  const [level, setLevel] = useState(1);
  const [scopeAngle, setScopeAngle] = useState<ScopeAngle>({ pitch: 0.05, yaw: 0 });
  const [tipPosition, setTipPosition] = useState<Vector3D>(initialTipPosition);
  const [lastCollision, setLastCollision] = useState<Vector3D | null>(null);
  const [collisionCount, setCollisionCount] = useState(0);
  const [score, setScore] = useState(100);
  const [activeCrisis, setActiveCrisis] = useState<CrisisEvent | null>(null);

  const rotationZ = useMemo(() => scopeAngle.yaw * 0.2, [scopeAngle.yaw]);

  const handleRaycastCollision = useCallback((point: Vector3D) => {
    setLastCollision(point);
    setCollisionCount((count) => count + 1);
    setScore((prev) => Math.max(prev - 2, 0));
  }, []);

  const handleCrisis = useCallback((crisis: CrisisEvent) => {
    setActiveCrisis(crisis);
    // Massive score penalty for crisis
    setScore((prev) => Math.max(prev - 50, 0));
  }, []);

  const handleAdvanceLevel = useCallback(() => {
    setLevel((prev) => (prev >= 3 ? 1 : prev + 1));
  }, []);

  const handleResetScope = useCallback(() => {
    setScopeAngle({ pitch: 0.05, yaw: 0 });
    setTipPosition(initialTipPosition);
    setLastCollision(null);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement ||
        (e.target as HTMLElement).isContentEditable
      ) {
        return;
      }

      if (e.key.toLowerCase() === 'l') {
        handleAdvanceLevel();
      } else if (e.key.toLowerCase() === 'r') {
        handleResetScope();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleAdvanceLevel, handleResetScope]);

  return (
    <div style={{ height: "100vh", width: "100vw", background: "#0f0a0a" }}>
      {/* Crisis Alert Banner */}
      {activeCrisis && (
        <div style={styles.crisisAlert} role="alert" aria-live="assertive">
          <h2 style={styles.crisisTitle}>🚨 CRITICAL EVENT</h2>
          <p style={styles.crisisDescription}>{activeCrisis.description}</p>
        </div>
      )}

      <section aria-label="Simulation Status" style={styles.overlay}>
        <dl style={styles.statsList}>
          <div style={styles.statItem}>
            <dt style={styles.statLabel}>Level</dt>
            <dd style={styles.statValue} aria-live="polite">{level}</dd>
          </div>
          <div style={styles.statItem}>
            <dt style={styles.statLabel}>Score</dt>
            <dd style={styles.statValue} aria-live="polite">{score}</dd>
          </div>
          <div style={styles.statItem}>
            <dt style={styles.statLabel}>Collisions</dt>
            <dd style={styles.statValue} aria-live="polite">{collisionCount}</dd>
          </div>
        </dl>

        <nav aria-label="Controls" style={styles.controls}>
          <HUDButton onClick={handleAdvanceLevel} shortcut="L">
            Advance Level
          </HUDButton>
          <HUDButton onClick={handleResetScope} shortcut="R">
            Reset Scope
          </HUDButton>
        </nav>
      </section>

      <EndoscopeView
        level={level}
        scopeAngle={scopeAngle}
        tipPosition={tipPosition}
        rotationZ={rotationZ}
        collision={lastCollision}
        onRaycastCollision={handleRaycastCollision}
        onCrisis={handleCrisis}
      />
    </div>
  );
}
