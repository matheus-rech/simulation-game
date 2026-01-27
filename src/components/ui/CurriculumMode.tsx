import { useState, useCallback, useMemo } from 'react'
import { SafetyZone } from '../3d/safety/SafetyCorridorManager'

/**
 * Curriculum Mode Component (Phase 1C)
 *
 * Structured learning progression for MWCS resection training:
 * - Module 1: Anatomical Recognition
 * - Module 2: Tumor Debulking (Non-invasive)
 * - Module 3: MWCS Decision Making (Invasive)
 *
 * Each module has specific learning objectives, pass criteria, and certification thresholds.
 */

export enum ModuleType {
  ANATOMICAL_RECOGNITION = 'anatomical-recognition',
  TUMOR_DEBULKING = 'tumor-debulking',
  MWCS_DECISION = 'mwcs-decision',
}

export interface LearningObjective {
  id: string
  description: string
  achieved: boolean
  required: boolean // Must complete to pass module
}

export interface ModuleConfig {
  type: ModuleType
  title: string
  description: string
  level: number // Surgical depth (1-3)
  objectives: LearningObjective[]
  passCriteria: {
    minScore: number
    maxCollisions: number
    maxCrises: number
    timeLimit?: number // seconds (optional)
  }
}

export interface CurriculumProgress {
  currentModule: ModuleType
  modulesCompleted: ModuleType[]
  certified: boolean
  overallScore: number
}

export interface CurriculumModeProps {
  visible: boolean
  currentModule: ModuleType
  progress: CurriculumProgress
  techniqueScore: number
  collisionCount: number
  crisisCount: number
  elapsedTime: number
  safetyZones: SafetyZone[]
  onModuleComplete: (module: ModuleType, passed: boolean) => void
  onCertificationAchieved: () => void
}

/**
 * Module Configurations
 */
const MODULE_CONFIGS: Record<ModuleType, ModuleConfig> = {
  [ModuleType.ANATOMICAL_RECOGNITION]: {
    type: ModuleType.ANATOMICAL_RECOGNITION,
    title: 'Module 1: Anatomical Recognition',
    description: 'Navigate the sphenoid sinus and identify key anatomical landmarks',
    level: 1,
    objectives: [
      {
        id: 'identify-sphenoid-ostium',
        description: 'Locate the sphenoid sinus ostium',
        achieved: false,
        required: true,
      },
      {
        id: 'identify-septations',
        description: 'Identify intrasphenoidal septations',
        achieved: false,
        required: true,
      },
      {
        id: 'identify-sella-floor',
        description: 'Recognize the sella floor (sellar prominence)',
        achieved: false,
        required: true,
      },
      {
        id: 'minimal-trauma',
        description: 'Navigate with minimal mucosal trauma (<5 collisions)',
        achieved: false,
        required: true,
      },
    ],
    passCriteria: {
      minScore: 75,
      maxCollisions: 5,
      maxCrises: 0,
      timeLimit: 120, // 2 minutes
    },
  },

  [ModuleType.TUMOR_DEBULKING]: {
    type: ModuleType.TUMOR_DEBULKING,
    title: 'Module 2: Tumor Debulking',
    description: 'Resect non-invasive pituitary adenoma respecting natural boundaries',
    level: 2,
    objectives: [
      {
        id: 'identify-pseudocapsule',
        description: 'Identify and preserve the tumor pseudocapsule plane',
        achieved: false,
        required: true,
      },
      {
        id: 'avoid-normal-gland',
        description: 'Avoid damage to normal pituitary tissue',
        achieved: false,
        required: true,
      },
      {
        id: 'recognize-dura',
        description: 'Recognize diaphragma sellae (dura)',
        achieved: false,
        required: true,
      },
      {
        id: 'safety-awareness',
        description: 'Maintain safe distance from ICA (>2mm at all times)',
        achieved: false,
        required: true,
      },
      {
        id: 'no-csf-leak',
        description: 'Complete resection without CSF leak',
        achieved: false,
        required: true,
      },
    ],
    passCriteria: {
      minScore: 80,
      maxCollisions: 10,
      maxCrises: 0,
      timeLimit: 180, // 3 minutes
    },
  },

  [ModuleType.MWCS_DECISION]: {
    type: ModuleType.MWCS_DECISION,
    title: 'Module 3: MWCS Decision Making',
    description: 'Evaluate invasive tumor and make safe MWCS resection decisions',
    level: 3,
    objectives: [
      {
        id: 'identify-mwcs',
        description: 'Correctly identify medial wall of cavernous sinus',
        achieved: false,
        required: true,
      },
      {
        id: 'firm-vs-soft',
        description: 'Distinguish firm tissue (MWCS - STOP) from soft tissue (tumor - continue)',
        achieved: false,
        required: true,
      },
      {
        id: 'bilateral-ica',
        description: 'Identify bilateral ICA positions at all times',
        achieved: false,
        required: true,
      },
      {
        id: 'safe-approach',
        description: 'Approach MWCS from medial direction (never lateral)',
        achieved: false,
        required: true,
      },
      {
        id: 'no-ica-injury',
        description: 'Complete case with zero ICA injury events',
        achieved: false,
        required: true,
      },
      {
        id: 'expert-technique',
        description: 'Achieve technique score ≥85 (expert level)',
        achieved: false,
        required: true,
      },
    ],
    passCriteria: {
      minScore: 85,
      maxCollisions: 15,
      maxCrises: 0,
      timeLimit: 300, // 5 minutes
    },
  },
}

/**
 * Check if module objectives are achieved
 */
function updateObjectives(
  config: ModuleConfig,
  techniqueScore: number,
  collisionCount: number,
  crisisCount: number,
  safetyZones: SafetyZone[]
): LearningObjective[] {
  const objectives = [...config.objectives]

  // Module-specific objective checking
  switch (config.type) {
    case ModuleType.ANATOMICAL_RECOGNITION:
      // Check collision count objective
      const minimalTrauma = objectives.find(o => o.id === 'minimal-trauma')
      if (minimalTrauma) {
        minimalTrauma.achieved = collisionCount < 5
      }
      break

    case ModuleType.TUMOR_DEBULKING:
      // Check safety awareness
      const safetyAwareness = objectives.find(o => o.id === 'safety-awareness')
      if (safetyAwareness) {
        const icaZones = safetyZones.filter(z => z.structureName.includes('ICA'))
        const allSafe = icaZones.every(z => z.distance >= 2.0)
        safetyAwareness.achieved = allSafe
      }

      // Check no CSF leak
      const noCsfLeak = objectives.find(o => o.id === 'no-csf-leak')
      if (noCsfLeak) {
        noCsfLeak.achieved = crisisCount === 0
      }
      break

    case ModuleType.MWCS_DECISION:
      // Check no ICA injury
      const noIcaInjury = objectives.find(o => o.id === 'no-ica-injury')
      if (noIcaInjury) {
        noIcaInjury.achieved = crisisCount === 0
      }

      // Check expert technique
      const expertTechnique = objectives.find(o => o.id === 'expert-technique')
      if (expertTechnique) {
        expertTechnique.achieved = techniqueScore >= 85
      }
      break
  }

  return objectives
}

/**
 * Check if module pass criteria are met
 */
function checkPassCriteria(
  config: ModuleConfig,
  techniqueScore: number,
  collisionCount: number,
  crisisCount: number,
  elapsedTime: number,
  objectives: LearningObjective[]
): boolean {
  const { passCriteria } = config

  // All required objectives must be achieved
  const requiredObjectives = objectives.filter(o => o.required)
  const allRequiredAchieved = requiredObjectives.every(o => o.achieved)

  // Check numeric criteria
  const scorePass = techniqueScore >= passCriteria.minScore
  const collisionPass = collisionCount <= passCriteria.maxCollisions
  const crisisPass = crisisCount <= passCriteria.maxCrises
  const timePass = !passCriteria.timeLimit || elapsedTime <= passCriteria.timeLimit

  return allRequiredAchieved && scorePass && collisionPass && crisisPass && timePass
}

/**
 * Curriculum Mode HUD
 */
export function CurriculumMode({
  visible,
  currentModule,
  progress,
  techniqueScore,
  collisionCount,
  crisisCount,
  elapsedTime,
  safetyZones,
  onModuleComplete,
  onCertificationAchieved,
}: CurriculumModeProps) {
  const [showObjectives, setShowObjectives] = useState(true)

  const config = MODULE_CONFIGS[currentModule]

  // Update objectives based on current performance
  const objectives = useMemo(
    () => updateObjectives(config, techniqueScore, collisionCount, crisisCount, safetyZones),
    [config, techniqueScore, collisionCount, crisisCount, safetyZones]
  )

  // Check if module is passed
  const modulePassed = useMemo(
    () =>
      checkPassCriteria(
        config,
        techniqueScore,
        collisionCount,
        crisisCount,
        elapsedTime,
        objectives
      ),
    [config, techniqueScore, collisionCount, crisisCount, elapsedTime, objectives]
  )

  // Calculate objective completion percentage
  const objectiveProgress = useMemo(() => {
    const achieved = objectives.filter(o => o.achieved).length
    return Math.round((achieved / objectives.length) * 100)
  }, [objectives])

  const handleCompleteModule = useCallback(() => {
    onModuleComplete(currentModule, modulePassed)

    // Check for certification (all modules completed with passing scores)
    if (progress.modulesCompleted.length === 2 && modulePassed) {
      onCertificationAchieved()
    }
  }, [
    currentModule,
    modulePassed,
    progress.modulesCompleted.length,
    onModuleComplete,
    onCertificationAchieved,
  ])

  if (!visible) return null

  return (
    <div
      style={{
        position: 'fixed',
        top: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        padding: '16px',
        background: 'rgba(15, 10, 10, 0.90)',
        borderRadius: '12px',
        color: '#f7e5da',
        fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
        border: '2px solid rgba(100, 200, 255, 0.4)',
        backdropFilter: 'blur(10px)',
        minWidth: '400px',
        maxWidth: '600px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        zIndex: 15,
      }}
    >
      {/* Header */}
      <div
        style={{
          marginBottom: '12px',
          borderBottom: '1px solid rgba(247, 229, 218, 0.2)',
          paddingBottom: '8px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#64c8ff' }}>
              {config.title}
            </div>
            <div style={{ fontSize: '0.75rem', opacity: 0.7, marginTop: '2px' }}>
              {config.description}
            </div>
          </div>
          <button
            onClick={() => setShowObjectives(!showObjectives)}
            style={{
              padding: '4px 8px',
              background: 'rgba(100, 200, 255, 0.1)',
              border: '1px solid rgba(100, 200, 255, 0.3)',
              borderRadius: '4px',
              color: '#64c8ff',
              cursor: 'pointer',
              fontSize: '0.7rem',
              fontFamily: 'inherit',
            }}
          >
            {showObjectives ? 'Hide' : 'Show'} Objectives
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div style={{ marginBottom: '12px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '0.75rem',
            marginBottom: '4px',
          }}
        >
          <span>Objectives Progress</span>
          <span
            style={{ fontWeight: 600, color: objectiveProgress === 100 ? '#00ff88' : '#ffaa00' }}
          >
            {objectiveProgress}%
          </span>
        </div>
        <div
          style={{
            height: '8px',
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '4px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${objectiveProgress}%`,
              height: '100%',
              background: objectiveProgress === 100 ? '#00ff88' : '#ffaa00',
              transition: 'width 0.3s ease',
            }}
          />
        </div>
      </div>

      {/* Learning Objectives */}
      {showObjectives && (
        <div style={{ marginBottom: '12px' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: '8px', opacity: 0.9 }}>
            Learning Objectives:
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {objectives.map(obj => (
              <div
                key={obj.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '0.75rem',
                  padding: '6px 8px',
                  background: obj.achieved ? 'rgba(0, 255, 136, 0.1)' : 'rgba(255, 170, 0, 0.05)',
                  borderRadius: '4px',
                  border: `1px solid ${obj.achieved ? 'rgba(0, 255, 136, 0.3)' : 'rgba(255, 170, 0, 0.2)'}`,
                }}
              >
                <span style={{ fontSize: '1rem' }}>
                  {obj.achieved ? '✅' : obj.required ? '⭕' : '○'}
                </span>
                <span style={{ flex: 1, opacity: obj.achieved ? 1 : 0.7 }}>{obj.description}</span>
                {obj.required && (
                  <span style={{ fontSize: '0.65rem', opacity: 0.5 }}>REQUIRED</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pass Criteria */}
      <div
        style={{
          padding: '8px',
          background: 'rgba(100, 200, 255, 0.05)',
          borderRadius: '6px',
          border: '1px solid rgba(100, 200, 255, 0.2)',
          marginBottom: '12px',
        }}
      >
        <div
          style={{ fontSize: '0.75rem', fontWeight: 600, marginBottom: '6px', color: '#64c8ff' }}
        >
          Pass Criteria:
        </div>
        <div style={{ display: 'flex', gap: '12px', fontSize: '0.7rem', flexWrap: 'wrap' }}>
          <div>
            <span style={{ opacity: 0.7 }}>Score:</span>{' '}
            <span
              style={{
                fontWeight: 600,
                color: techniqueScore >= config.passCriteria.minScore ? '#00ff88' : '#ff6600',
              }}
            >
              {techniqueScore}/{config.passCriteria.minScore}
            </span>
          </div>
          <div>
            <span style={{ opacity: 0.7 }}>Collisions:</span>{' '}
            <span
              style={{
                fontWeight: 600,
                color: collisionCount <= config.passCriteria.maxCollisions ? '#00ff88' : '#ff6600',
              }}
            >
              {collisionCount}/{config.passCriteria.maxCollisions}
            </span>
          </div>
          <div>
            <span style={{ opacity: 0.7 }}>Crises:</span>{' '}
            <span style={{ fontWeight: 600, color: crisisCount === 0 ? '#00ff88' : '#ff3333' }}>
              {crisisCount}/{config.passCriteria.maxCrises}
            </span>
          </div>
          {config.passCriteria.timeLimit && (
            <div>
              <span style={{ opacity: 0.7 }}>Time:</span>{' '}
              <span
                style={{
                  fontWeight: 600,
                  color: elapsedTime <= config.passCriteria.timeLimit ? '#00ff88' : '#ff6600',
                }}
              >
                {elapsedTime}s/{config.passCriteria.timeLimit}s
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Complete Button */}
      <button
        onClick={handleCompleteModule}
        disabled={!modulePassed}
        style={{
          width: '100%',
          padding: '10px',
          background: modulePassed ? 'rgba(0, 255, 136, 0.2)' : 'rgba(100, 100, 100, 0.2)',
          border: modulePassed ? '2px solid #00ff88' : '2px solid rgba(100, 100, 100, 0.5)',
          borderRadius: '6px',
          color: modulePassed ? '#00ff88' : 'rgba(247, 229, 218, 0.5)',
          cursor: modulePassed ? 'pointer' : 'not-allowed',
          fontSize: '0.85rem',
          fontWeight: 600,
          fontFamily: 'inherit',
          transition: 'all 0.2s ease',
        }}
      >
        {modulePassed ? '✅ Complete Module' : '⏳ Complete Objectives to Pass'}
      </button>

      {/* Footer */}
      <div
        style={{
          marginTop: '8px',
          paddingTop: '8px',
          borderTop: '1px solid rgba(247, 229, 218, 0.2)',
          fontSize: '0.65rem',
          opacity: 0.6,
          textAlign: 'center',
        }}
      >
        Phase 1C: Curriculum Mode • Module {progress.modulesCompleted.length + 1}/3
      </div>
    </div>
  )
}

/**
 * Certification Badge Component
 */
export function CertificationBadge({
  visible,
  onClose,
}: {
  visible: boolean
  onClose: () => void
}) {
  if (!visible) return null

  return (
    <div
      style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        padding: '32px',
        background: 'rgba(15, 10, 10, 0.95)',
        borderRadius: '16px',
        color: '#f7e5da',
        fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
        border: '3px solid #ffd700',
        backdropFilter: 'blur(12px)',
        boxShadow: '0 8px 32px rgba(255, 215, 0, 0.4)',
        zIndex: 1000,
        minWidth: '400px',
        textAlign: 'center',
        animation: 'pulse 2s ease-in-out infinite',
      }}
    >
      <div style={{ fontSize: '4rem', marginBottom: '16px' }}>🏆</div>
      <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#ffd700', marginBottom: '8px' }}>
        CERTIFICATION ACHIEVED
      </div>
      <div style={{ fontSize: '1rem', marginBottom: '16px', opacity: 0.9 }}>
        Endoscopic Transsphenoidal Surgery
      </div>
      <div style={{ fontSize: '0.85rem', marginBottom: '24px', opacity: 0.7 }}>
        You have successfully completed all 3 training modules with expert-level performance
      </div>
      <div
        style={{
          padding: '12px 16px',
          background: 'rgba(255, 215, 0, 0.1)',
          borderRadius: '8px',
          border: '1px solid rgba(255, 215, 0, 0.3)',
          marginBottom: '24px',
          fontSize: '0.8rem',
        }}
      >
        <div style={{ fontWeight: 600, marginBottom: '4px' }}>Certification Requirements Met:</div>
        <div>✅ Module 1: Anatomical Recognition</div>
        <div>✅ Module 2: Tumor Debulking</div>
        <div>✅ Module 3: MWCS Decision Making</div>
      </div>
      <button
        onClick={onClose}
        style={{
          padding: '12px 24px',
          background: 'rgba(255, 215, 0, 0.2)',
          border: '2px solid #ffd700',
          borderRadius: '8px',
          color: '#ffd700',
          cursor: 'pointer',
          fontSize: '0.9rem',
          fontWeight: 600,
          fontFamily: 'inherit',
        }}
      >
        Continue Training
      </button>
    </div>
  )
}
