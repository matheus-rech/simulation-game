/**
 * Surgical Interface - Immersive OR-style UI overlay
 * Using inline styles (no Tailwind dependency)
 */

import { PatientCase, SurgicalObjective } from '../../data/patientCases';
import { TaskProgress } from '../../services/TaskManager';

interface SurgicalInterfaceProps {
  patientCase: PatientCase;
  taskProgress: TaskProgress;
  currentObjective: SurgicalObjective | null;
  elapsedTime: number;
  timeRemaining: number;
  phaseProgress: number;
  onExitCase: () => void;
}

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export function SurgicalInterface({
  patientCase,
  taskProgress,
  currentObjective,
  elapsedTime,
  timeRemaining,
  phaseProgress,
  onExitCase,
}: SurgicalInterfaceProps) {
  const getTimeColor = (): string => {
    if (timeRemaining < 300) return '#f87171'; // <5 min - red
    if (timeRemaining < 900) return '#fbbf24'; // <15 min - yellow
    return '#34d399'; // green
  };

  const timeColor = getTimeColor();

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 20, pointerEvents: 'none', fontFamily: "'Segoe UI', sans-serif" }}>
      {/* Top Bar */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        background: 'linear-gradient(to bottom, rgba(0,0,0,0.8), transparent)',
        padding: '16px',
        pointerEvents: 'auto',
      }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <div style={{ background: 'rgba(37, 99, 235, 0.2)', border: '1px solid #3b82f6', borderRadius: '8px', padding: '8px 16px' }}>
              <div style={{ fontSize: '0.75rem', color: '#93c5fd' }}>PATIENT</div>
              <div style={{ color: 'white', fontWeight: 700 }}>{patientCase.name}, {patientCase.age}</div>
            </div>

            <div style={{ background: 'rgba(147, 51, 234, 0.2)', border: '1px solid #a855f7', borderRadius: '8px', padding: '8px 16px' }}>
              <div style={{ fontSize: '0.75rem', color: '#e9d5ff' }}>DIAGNOSIS</div>
              <div style={{ color: 'white', fontWeight: 600, fontSize: '0.875rem' }}>{patientCase.tumorType}</div>
            </div>

            <div style={{ background: 'rgba(245, 158, 11, 0.2)', border: '1px solid #f59e0b', borderRadius: '8px', padding: '8px 16px' }}>
              <div style={{ fontSize: '0.75rem', color: '#fcd34d' }}>TUMOR SIZE</div>
              <div style={{ color: 'white', fontWeight: 700 }}>{patientCase.tumorSize} cm</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ background: 'rgba(15, 23, 42, 0.9)', border: '1px solid #475569', borderRadius: '8px', padding: '8px 16px', minWidth: '120px' }}>
              <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>ELAPSED</div>
              <div style={{ color: 'white', fontFamily: 'monospace', fontSize: '1.25rem' }}>{formatTime(elapsedTime)}</div>
            </div>

            <div style={{ background: 'rgba(15, 23, 42, 0.9)', border: timeRemaining < 300 ? '1px solid #ef4444' : '1px solid #475569', borderRadius: '8px', padding: '8px 16px', minWidth: '120px' }}>
              <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>REMAINING</div>
              <div style={{ color: timeColor, fontFamily: 'monospace', fontSize: '1.25rem' }}>{formatTime(timeRemaining)}</div>
            </div>

            <div style={{ background: 'rgba(16, 185, 129, 0.2)', border: '1px solid #10b981', borderRadius: '8px', padding: '8px 16px', minWidth: '100px' }}>
              <div style={{ fontSize: '0.75rem', color: '#6ee7b7' }}>SCORE</div>
              <div style={{ color: 'white', fontWeight: 700, fontSize: '1.5rem' }}>{taskProgress.score}</div>
            </div>

            <button
              onClick={onExitCase}
              style={{
                background: '#dc2626',
                color: 'white',
                padding: '8px 16px',
                borderRadius: '8px',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                transition: 'background 0.2s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#b91c1c'}
              onMouseLeave={(e) => e.currentTarget.style.background = '#dc2626'}
            >
              Exit Case
            </button>
          </div>
        </div>
      </div>

      {/* Left Sidebar - Objectives */}
      <div style={{
        position: 'absolute',
        left: 0,
        top: '80px',
        bottom: '80px',
        width: '320px',
        padding: '16px',
        pointerEvents: 'auto',
      }}>
        <div style={{
          background: 'rgba(15, 23, 42, 0.9)',
          border: '1px solid #475569',
          borderRadius: '8px',
          padding: '16px',
          height: '100%',
          overflowY: 'auto',
        }}>
          {/* Phase Indicator */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{ fontSize: '0.75rem', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
              Surgical Phase
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'white', marginBottom: '8px' }}>
              Phase {taskProgress.currentPhase} of {Math.max(...patientCase.objectives.map(o => o.phase))}
            </div>
            {currentObjective && (
              <div style={{ color: '#93c5fd', fontSize: '0.875rem' }}>{currentObjective.title}</div>
            )}

            {/* Progress Bar */}
            <div style={{ marginTop: '12px', background: '#1e293b', borderRadius: '999px', height: '8px', overflow: 'hidden' }}>
              <div style={{
                background: '#3b82f6',
                height: '100%',
                width: `${phaseProgress}%`,
                transition: 'width 0.5s',
              }} />
            </div>
            <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '4px' }}>
              {Math.round(phaseProgress)}% Complete
            </div>
          </div>

          {/* Current Objective */}
          {currentObjective && (
            <div style={{
              marginBottom: '24px',
              background: 'rgba(59, 130, 246, 0.1)',
              border: '1px solid #3b82f6',
              borderRadius: '8px',
              padding: '16px',
            }}>
              <div style={{ fontSize: '0.75rem', color: '#93c5fd', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
                Current Objective
              </div>
              <div style={{ color: 'white', fontWeight: 600, marginBottom: '8px' }}>{currentObjective.title}</div>
              <div style={{ fontSize: '0.875rem', color: '#d1d5db', marginBottom: '12px' }}>{currentObjective.description}</div>

              <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginBottom: '8px' }}>Required Actions:</div>
              <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                {currentObjective.requiredActions.map((action, idx) => (
                  <li key={idx} style={{ display: 'flex', gap: '8px', fontSize: '0.875rem', color: '#d1d5db', marginBottom: '4px' }}>
                    <span style={{ color: '#60a5fa' }}>▸</span>
                    <span>{action}</span>
                  </li>
                ))}
              </ul>

              <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid rgba(59, 130, 246, 0.3)' }}>
                <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>Success Criteria:</div>
                <div style={{ fontSize: '0.875rem', color: '#6ee7b7', marginTop: '4px' }}>{currentObjective.successCriteria}</div>
              </div>
            </div>
          )}

          {/* All Objectives List */}
          <div>
            <div style={{ fontSize: '0.75rem', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>
              All Objectives
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {patientCase.objectives.map((objective) => {
                const isCompleted = taskProgress.completedObjectives.includes(objective.id);
                const isCurrent = currentObjective?.id === objective.id;

                return (
                  <div
                    key={objective.id}
                    style={{
                      padding: '12px',
                      borderRadius: '6px',
                      border: isCurrent ? '1px solid #3b82f6' : '1px solid #475569',
                      background: isCurrent ? 'rgba(59, 130, 246, 0.2)' : 'rgba(30, 41, 59, 0.5)',
                      opacity: isCompleted ? 0.6 : 1,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                      <div style={{ flexShrink: 0, marginTop: '2px' }}>
                        {isCompleted ? (
                          <span style={{ color: '#10b981' }}>✓</span>
                        ) : isCurrent ? (
                          <span style={{ color: '#60a5fa' }}>▸</span>
                        ) : (
                          <span style={{ color: '#4b5563' }}>○</span>
                        )}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'white' }}>
                          {objective.title}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '2px' }}>
                          Phase {objective.phase}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Right Sidebar - Vital Signs & Instruments */}
      <div style={{
        position: 'absolute',
        right: 0,
        top: '80px',
        bottom: '80px',
        width: '288px',
        padding: '16px',
        pointerEvents: 'auto',
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', height: '100%' }}>
          {/* Vital Signs */}
          <div style={{ background: 'rgba(15, 23, 42, 0.9)', border: '1px solid #475569', borderRadius: '8px', padding: '16px' }}>
            <div style={{ fontSize: '0.75rem', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>
              Vital Signs
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.875rem', color: '#d1d5db' }}>Heart Rate</span>
                <span style={{ color: '#34d399', fontFamily: 'monospace', fontWeight: 700 }}>75 bpm</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.875rem', color: '#d1d5db' }}>Blood Pressure</span>
                <span style={{ color: '#34d399', fontFamily: 'monospace', fontWeight: 700 }}>120/80</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.875rem', color: '#d1d5db' }}>O₂ Saturation</span>
                <span style={{ color: '#34d399', fontFamily: 'monospace', fontWeight: 700 }}>98%</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.875rem', color: '#d1d5db' }}>Est. Blood Loss</span>
                <span style={{ color: '#fbbf24', fontFamily: 'monospace', fontWeight: 700 }}>50 mL</span>
              </div>
            </div>
          </div>

          {/* Instrument Tray */}
          <div style={{ background: 'rgba(15, 23, 42, 0.9)', border: '1px solid #475569', borderRadius: '8px', padding: '16px', flex: 1 }}>
            <div style={{ fontSize: '0.75rem', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>
              Surgical Instruments
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {[
                { name: 'Endoscope', icon: '🔬', active: true },
                { name: 'Suction', icon: '💨', active: false },
                { name: 'Microdebrider', icon: '⚙️', active: false },
                { name: 'Curette', icon: '🥄', active: false },
                { name: 'Bipolar', icon: '⚡', active: false },
                { name: 'Drill', icon: '🔧', active: false },
              ].map((instrument) => (
                <button
                  key={instrument.name}
                  style={{
                    padding: '12px',
                    borderRadius: '6px',
                    border: instrument.active ? '1px solid #3b82f6' : '1px solid #475569',
                    background: instrument.active ? 'rgba(59, 130, 246, 0.3)' : 'rgba(30, 41, 59, 0.5)',
                    color: instrument.active ? 'white' : '#9ca3af',
                    textAlign: 'center',
                    transition: 'all 0.2s',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => {
                    if (!instrument.active) {
                      e.currentTarget.style.background = 'rgba(51, 65, 85, 0.5)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!instrument.active) {
                      e.currentTarget.style.background = 'rgba(30, 41, 59, 0.5)';
                    }
                  }}
                >
                  <div style={{ fontSize: '1.5rem', marginBottom: '4px' }}>{instrument.icon}</div>
                  <div style={{ fontSize: '0.75rem' }}>{instrument.name}</div>
                </button>
              ))}
            </div>

            <div style={{ marginTop: '16px', padding: '8px', background: 'rgba(245, 158, 11, 0.2)', border: '1px solid #f59e0b', borderRadius: '4px', fontSize: '0.75rem', color: '#fcd34d' }}>
              💡 Instrument selection coming in next update
            </div>
          </div>

          {/* Critical Structures Warning */}
          <div style={{ background: 'rgba(220, 38, 38, 0.2)', border: '1px solid #ef4444', borderRadius: '8px', padding: '12px' }}>
            <div style={{ fontSize: '0.75rem', color: '#fca5a5', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
              ⚠️ Critical Structures
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {patientCase.criticalStructures.slice(0, 3).map((structure, idx) => (
                <div key={idx} style={{ fontSize: '0.75rem', color: '#fecaca' }}>• {structure}</div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar - AI Mentor */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)',
        padding: '16px',
        pointerEvents: 'auto',
      }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <div style={{
            background: 'rgba(30, 41, 59, 0.9)',
            border: '1px solid #3b82f6',
            borderRadius: '8px',
            padding: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}>
            <div style={{ fontSize: '1.5rem' }}>🤖</div>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#93c5fd' }}>AI SURGICAL MENTOR</div>
              <div style={{ color: 'white', fontSize: '0.875rem' }}>
                {currentObjective
                  ? `Focus on: ${currentObjective.description}`
                  : 'Awaiting next objective...'}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        aria-label="Endoscope controls"
        style={{
          position: 'absolute',
          left: '50%',
          bottom: '88px',
          transform: 'translateX(-50%)',
          background: 'rgba(15, 23, 42, 0.82)',
          border: '1px solid #475569',
          borderRadius: '999px',
          padding: '6px 12px',
          color: '#cbd5e1',
          fontSize: '0.72rem',
          whiteSpace: 'nowrap',
          userSelect: 'none',
        }}
      >
        I/K move · J/L strafe · Arrow keys aim · Q/E roll · 1–5 anatomy stage
      </div>
    </div>
  );
}
