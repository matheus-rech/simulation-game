import React, { useCallback, useState, useEffect, useRef } from "react";
import { EndoscopeView, ScopeAngle } from "./components/EndoscopeView";
import { Vector3D } from "./components/3d/VFX";
import { RaycastCollision } from "./components/3d/EndoscopeRig";
import { useCollisionManager } from "./components/3d/collision/CollisionManager";
import { CollisionEvent, CrisisEvent } from "./components/3d/collision/types";
import { SafetyHUD } from "./components/ui/SafetyHUD";
import { SafetyZone } from "./components/3d/safety/SafetyCorridorManager";
import { TechniqueScoring } from "./components/ui/TechniqueScoring";
import { CurriculumMode, CertificationBadge, ModuleType, CurriculumProgress } from "./components/ui/CurriculumMode";
import { preloadAllTextures } from "./components/3d/materials/TextureLoader";
import { CaseSelector } from "./components/ui/CaseSelector";
import { SurgicalInterface } from "./components/ui/SurgicalInterface";
import { TaskManager, TaskProgress } from "./services/TaskManager";
import { PatientCase } from "./data/patientCases";
import {
  anatomyLevelForPhase,
  applyEndoscopeKey,
} from "./input/endoscopeControls";

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
function HUDButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
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
    >
      {children}
    </button>
  );
}

export default function App() {
  const [level, setLevel] = useState(1);
  const [scopeAngle, setScopeAngle] = useState<ScopeAngle>({ pitch: 0.05, yaw: 0 });
  const [tipPosition, setTipPosition] = useState<Vector3D>(initialTipPosition);
  const [rotationZ, setRotationZ] = useState(0);
  const [lastCollision, setLastCollision] = useState<Vector3D | null>(null);
  const [collisionCount, setCollisionCount] = useState(0);
  const [score, setScore] = useState(100);
  const [activeCrisis, setActiveCrisis] = useState<CrisisEvent | null>(null);
  const [safetyZones, setSafetyZones] = useState<SafetyZone[]>([]);

  // Phase 1B: Technique Scoring - Timer state
  const [elapsedTime, setElapsedTime] = useState(0);
  const [startTime] = useState(Date.now());
  const [crisisCount, setCrisisCount] = useState(0);

  // Phase 1C: Curriculum Mode
  const [curriculumMode, setCurriculumMode] = useState(false); // Disabled by default (using serious game mode)
  const [currentModule, setCurrentModule] = useState<ModuleType>(ModuleType.ANATOMICAL_RECOGNITION);
  const [curriculumProgress, setCurriculumProgress] = useState<CurriculumProgress>({
    currentModule: ModuleType.ANATOMICAL_RECOGNITION,
    modulesCompleted: [],
    certified: false,
    overallScore: 0
  });
  const [showCertification, setShowCertification] = useState(false);

  // Serious Game Mode - Patient Case System
  const [selectedCase, setSelectedCase] = useState<PatientCase | null>(null);
  const [completedCaseIds, setCompletedCaseIds] = useState<string[]>([]);
  const [taskProgress, setTaskProgress] = useState<TaskProgress | null>(null);
  const taskManagerRef = useRef<TaskManager | null>(null);

  const handleCollisionScoreChange = useCallback((delta: number) => {
    if (taskManagerRef.current) {
      taskManagerRef.current.applyPenalty(delta, 'Tissue contact detected');
      return;
    }
    setScore((previousScore) => Math.max(previousScore + delta, 0));
  }, []);

  const handleCollisionEvent = useCallback((collision: CollisionEvent) => {
    setLastCollision(collision.position);
    setCollisionCount((count) => count + 1);
  }, []);

  const handleCollisionCrisis = useCallback((crisis: CrisisEvent) => {
    setActiveCrisis(crisis);
    setCrisisCount((prev) => prev + 1);
  }, []);

  const { handleCollision: routeCollision } = useCollisionManager({
    onScoreChange: handleCollisionScoreChange,
    onCollision: handleCollisionEvent,
    onCrisis: handleCollisionCrisis,
  });

  const handleRaycastCollision = useCallback(
    (collision: RaycastCollision) => {
      routeCollision(
        collision.position,
        collision.tissueType,
        collision.intensity
      );
    },
    [routeCollision]
  );

  useEffect(() => {
    if (!selectedCase) return;

    const handleEndoscopeKeyDown = (event: KeyboardEvent) => {
      const target = event.target;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement ||
        (target instanceof HTMLElement && target.isContentEditable)
      ) {
        return;
      }

      const nextState = applyEndoscopeKey(
        { tipPosition, scopeAngle, rotationZ, level },
        event.key
      );

      if (!nextState) return;

      event.preventDefault();
      setTipPosition(nextState.tipPosition);
      setScopeAngle(nextState.scopeAngle);
      setRotationZ(nextState.rotationZ);
      setLevel(nextState.level);
    };

    window.addEventListener("keydown", handleEndoscopeKeyDown);
    return () => window.removeEventListener("keydown", handleEndoscopeKeyDown);
  }, [level, rotationZ, scopeAngle, selectedCase, tipPosition]);

  // Update elapsed time every second
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  // Preload AI-generated anatomical textures (Nano Banana Pro - 84/100 quality)
  useEffect(() => {
    console.log('🎨 Preloading AI-generated anatomical textures from Nano Banana Pro...');
    preloadAllTextures()
      .then((textures) => {
        console.log(`✅ Successfully preloaded ${textures.size}/12 anatomical textures`);
        console.log('   Textures validated at 84/100 quality with 98 medical references');
        console.log('   Generation model: gemini-3-pro-image-preview');
      })
      .catch((error) => {
        console.error('❌ Failed to preload textures:', error);
      });
  }, []); // Run once on mount

  // Handle module completion
  const handleModuleComplete = useCallback((module: ModuleType, passed: boolean) => {
    if (!passed) {
      alert(`Module failed! Review objectives and try again.`);
      return;
    }

    // Add to completed modules
    setCurriculumProgress(prev => ({
      ...prev,
      modulesCompleted: [...prev.modulesCompleted, module],
      overallScore: Math.round((prev.overallScore + score) / 2)
    }));

    // Advance to next module
    if (module === ModuleType.ANATOMICAL_RECOGNITION) {
      setCurrentModule(ModuleType.TUMOR_DEBULKING);
      setLevel(2);
      alert('✅ Module 1 Complete! Advancing to Module 2: Tumor Debulking');
    } else if (module === ModuleType.TUMOR_DEBULKING) {
      setCurrentModule(ModuleType.MWCS_DECISION);
      setLevel(3);
      alert('✅ Module 2 Complete! Advancing to Module 3: MWCS Decision Making');
    } else if (module === ModuleType.MWCS_DECISION) {
      alert('✅ Module 3 Complete! Certification awarded!');
    }

    // Reset stats for next module
    setCollisionCount(0);
    setCrisisCount(0);
    setScore(100);
    setLastCollision(null);
  }, [score]);

  const handleCertificationAchieved = useCallback(() => {
    setCurriculumProgress(prev => ({
      ...prev,
      certified: true
    }));
    setShowCertification(true);
  }, []);

  // Serious Game Mode Handlers
  const handleCaseSelected = useCallback((patientCase: PatientCase) => {
    setSelectedCase(patientCase);

    // Initialize TaskManager
    const taskManager = new TaskManager(
      patientCase,
      (progress) => {
        setTaskProgress(progress);
        setScore(progress.score);
        setLevel(anatomyLevelForPhase(progress.currentPhase));
      },
      (feedback) => {
        console.log(`📋 ${feedback.type.toUpperCase()}: ${feedback.message}`);
        // TODO: Display feedback in UI (toast notification)
      }
    );

    taskManagerRef.current = taskManager;
    setTaskProgress(taskManager.getProgress());

    // Set level based on first phase
    setLevel(1);

    // Reset simulation state
    setScore(100);
    setCollisionCount(0);
    setCrisisCount(0);
    setLastCollision(null);
    setScopeAngle({ pitch: 0.05, yaw: 0 });
    setTipPosition(initialTipPosition);
    setRotationZ(0);

    console.log(`🏥 Starting case: ${patientCase.name} (${patientCase.diagnosis})`);
  }, []);

  const handleExitCase = useCallback(() => {
    if (taskManagerRef.current) {
      // Save completion if all objectives completed
      if (taskManagerRef.current.isCompleted()) {
        setCompletedCaseIds(prev => [...prev, selectedCase!.id]);
        console.log(`✅ Case completed: ${selectedCase!.name}`);
      }
    }

    setSelectedCase(null);
    setTaskProgress(null);
    taskManagerRef.current = null;
    setLevel(1);
    setScore(100);
  }, [selectedCase]);

  // Show case selector if no case is selected and not in curriculum mode
  if (!selectedCase && !curriculumMode) {
    return (
      <CaseSelector
        onCaseSelected={handleCaseSelected}
        completedCaseIds={completedCaseIds}
      />
    );
  }

  return (
    <div style={{ height: "100vh", width: "100vw", background: "#0f0a0a" }}>
      {/* Crisis Alert Banner */}
      {activeCrisis && (
        <div style={styles.crisisAlert} role="alert" aria-live="assertive">
          <h2 style={styles.crisisTitle}>🚨 CRITICAL EVENT</h2>
          <p style={styles.crisisDescription}>{activeCrisis.description}</p>
        </div>
      )}

      {/* Serious Game Mode - OR-Style Interface */}
      {selectedCase && taskProgress && (
        <SurgicalInterface
          patientCase={selectedCase}
          taskProgress={taskProgress}
          currentObjective={taskManagerRef.current?.getCurrentObjective() || null}
          elapsedTime={taskManagerRef.current?.getElapsedTime() || 0}
          timeRemaining={taskManagerRef.current?.getTotalTimeRemaining() || 0}
          phaseProgress={taskManagerRef.current?.getPhaseProgress() || 0}
          onExitCase={handleExitCase}
        />
      )}

      {/* Legacy UI - Only show when in curriculum mode or no case selected */}
      {!selectedCase && curriculumMode && (
        <>
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
              <HUDButton onClick={() => setCurriculumMode(!curriculumMode)}>
                {curriculumMode ? '📚 Curriculum' : '🎮 Serious Game'}
              </HUDButton>
              {!curriculumMode && (
                <HUDButton onClick={() => setLevel((prev) => (prev >= 3 ? 1 : prev + 1))}>
                  Advance Level
                </HUDButton>
              )}
              <HUDButton
                onClick={() => {
                  setScopeAngle({ pitch: 0.05, yaw: 0 });
                  setTipPosition(initialTipPosition);
                  setRotationZ(0);
                  setLastCollision(null);
                }}
              >
                Reset Scope
              </HUDButton>
            </nav>
          </section>

          {/* Safety Corridor HUD */}
          <SafetyHUD
            safetyZones={safetyZones}
            visible={level >= 2}
            compact={false}
          />

          {/* Phase 1B: Technique Scoring System */}
          <TechniqueScoring
            safetyZones={safetyZones}
            collisionCount={collisionCount}
            crisisCount={crisisCount}
            elapsedTime={elapsedTime}
            level={level}
            compact={false}
          />

          {/* Phase 1C: Curriculum Mode */}
          <CurriculumMode
            visible={true}
            currentModule={currentModule}
            progress={curriculumProgress}
            techniqueScore={score}
            collisionCount={collisionCount}
            crisisCount={crisisCount}
            elapsedTime={elapsedTime}
            safetyZones={safetyZones}
            onModuleComplete={handleModuleComplete}
            onCertificationAchieved={handleCertificationAchieved}
          />

          {/* Certification Badge */}
          <CertificationBadge
            visible={showCertification}
            onClose={() => setShowCertification(false)}
          />
        </>
      )}

      <EndoscopeView
        level={level}
        scopeAngle={scopeAngle}
        tipPosition={tipPosition}
        rotationZ={rotationZ}
        collision={lastCollision}
        onRaycastCollision={handleRaycastCollision}
        onSafetyChange={setSafetyZones}
        showSafetySpheres={false}
      />
    </div>
  );
}
