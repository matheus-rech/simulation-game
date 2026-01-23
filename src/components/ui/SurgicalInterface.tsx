/**
 * Surgical Interface - Immersive OR-style UI overlay
 *
 * Replaces basic HUD with operating room context
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

export function SurgicalInterface({
  patientCase,
  taskProgress,
  currentObjective,
  elapsedTime,
  timeRemaining,
  phaseProgress,
  onExitCase,
}: SurgicalInterfaceProps) {
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimeColor = (): string => {
    if (timeRemaining < 300) return 'text-red-400'; // <5 min
    if (timeRemaining < 900) return 'text-yellow-400'; // <15 min
    return 'text-green-400';
  };

  return (
    <div className="fixed inset-0 pointer-events-none">
      {/* Top Bar - Patient Info & Timer */}
      <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/80 to-transparent p-4 pointer-events-auto">
        <div className="flex items-center justify-between max-w-screen-xl mx-auto">
          {/* Patient Info */}
          <div className="flex items-center gap-6">
            <div className="bg-blue-600/20 border border-blue-500 rounded-lg px-4 py-2">
              <div className="text-xs text-blue-300">PATIENT</div>
              <div className="text-white font-bold">{patientCase.name}, {patientCase.age}</div>
            </div>

            <div className="bg-purple-600/20 border border-purple-500 rounded-lg px-4 py-2">
              <div className="text-xs text-purple-300">DIAGNOSIS</div>
              <div className="text-white font-semibold text-sm">{patientCase.tumorType}</div>
            </div>

            <div className="bg-amber-600/20 border border-amber-500 rounded-lg px-4 py-2">
              <div className="text-xs text-amber-300">TUMOR SIZE</div>
              <div className="text-white font-bold">{patientCase.tumorSize} cm</div>
            </div>
          </div>

          {/* Timer & Score */}
          <div className="flex items-center gap-4">
            <div className="bg-slate-800/90 border border-slate-600 rounded-lg px-4 py-2 min-w-[120px]">
              <div className="text-xs text-gray-400">ELAPSED</div>
              <div className="text-white font-mono text-xl">{formatTime(elapsedTime)}</div>
            </div>

            <div className={`bg-slate-800/90 border ${timeRemaining < 300 ? 'border-red-500' : 'border-slate-600'} rounded-lg px-4 py-2 min-w-[120px]`}>
              <div className="text-xs text-gray-400">REMAINING</div>
              <div className={`${getTimeColor()} font-mono text-xl`}>{formatTime(timeRemaining)}</div>
            </div>

            <div className="bg-green-600/20 border border-green-500 rounded-lg px-4 py-2 min-w-[100px]">
              <div className="text-xs text-green-300">SCORE</div>
              <div className="text-white font-bold text-2xl">{taskProgress.score}</div>
            </div>

            <button
              onClick={onExitCase}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
            >
              Exit Case
            </button>
          </div>
        </div>
      </div>

      {/* Left Sidebar - Objectives & Phase Progress */}
      <div className="absolute left-0 top-20 bottom-20 w-80 p-4 pointer-events-auto">
        <div className="bg-slate-900/90 border border-slate-700 rounded-lg p-4 h-full overflow-y-auto">
          {/* Phase Indicator */}
          <div className="mb-6">
            <div className="text-xs text-gray-400 uppercase tracking-wide mb-2">Surgical Phase</div>
            <div className="text-2xl font-bold text-white mb-2">
              Phase {taskProgress.currentPhase} of {Math.max(...patientCase.objectives.map(o => o.phase))}
            </div>
            {currentObjective && (
              <div className="text-blue-300 text-sm">{currentObjective.title}</div>
            )}

            {/* Phase Progress Bar */}
            <div className="mt-3 bg-slate-800 rounded-full h-2 overflow-hidden">
              <div
                className="bg-blue-500 h-full transition-all duration-500"
                style={{ width: `${phaseProgress}%` }}
              />
            </div>
            <div className="text-xs text-gray-400 mt-1">{Math.round(phaseProgress)}% Complete</div>
          </div>

          {/* Current Objective */}
          {currentObjective && (
            <div className="mb-6 bg-blue-600/10 border border-blue-500 rounded-lg p-4">
              <div className="text-xs text-blue-300 uppercase tracking-wide mb-2">Current Objective</div>
              <div className="text-white font-semibold mb-2">{currentObjective.title}</div>
              <div className="text-sm text-gray-300 mb-3">{currentObjective.description}</div>

              <div className="text-xs text-gray-400 mb-2">Required Actions:</div>
              <ul className="space-y-1">
                {currentObjective.requiredActions.map((action, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-gray-300">
                    <span className="text-blue-400">▸</span>
                    <span>{action}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-3 pt-3 border-t border-blue-500/30">
                <div className="text-xs text-gray-400">Success Criteria:</div>
                <div className="text-sm text-green-300 mt-1">{currentObjective.successCriteria}</div>
              </div>
            </div>
          )}

          {/* All Objectives List */}
          <div>
            <div className="text-xs text-gray-400 uppercase tracking-wide mb-3">All Objectives</div>
            <div className="space-y-2">
              {patientCase.objectives.map((objective) => {
                const isCompleted = taskProgress.completedObjectives.includes(objective.id);
                const isCurrent = currentObjective?.id === objective.id;

                return (
                  <div
                    key={objective.id}
                    className={`
                      p-3 rounded border
                      ${isCurrent ? 'bg-blue-600/20 border-blue-500' : 'bg-slate-800/50 border-slate-700'}
                      ${isCompleted ? 'opacity-60' : ''}
                    `}
                  >
                    <div className="flex items-start gap-2">
                      <div className="flex-shrink-0 mt-0.5">
                        {isCompleted ? (
                          <span className="text-green-400">✓</span>
                        ) : isCurrent ? (
                          <span className="text-blue-400">▸</span>
                        ) : (
                          <span className="text-gray-600">○</span>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-white">
                          {objective.title}
                        </div>
                        <div className="text-xs text-gray-400 mt-0.5">
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
      <div className="absolute right-0 top-20 bottom-20 w-72 p-4 pointer-events-auto">
        <div className="space-y-4 h-full flex flex-col">
          {/* Vital Signs Monitor */}
          <div className="bg-slate-900/90 border border-slate-700 rounded-lg p-4">
            <div className="text-xs text-gray-400 uppercase tracking-wide mb-3">Vital Signs</div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-300">Heart Rate</span>
                <span className="text-green-400 font-mono font-bold">75 bpm</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-300">Blood Pressure</span>
                <span className="text-green-400 font-mono font-bold">120/80</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-300">O₂ Saturation</span>
                <span className="text-green-400 font-mono font-bold">98%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-300">Est. Blood Loss</span>
                <span className="text-yellow-400 font-mono font-bold">50 mL</span>
              </div>
            </div>
          </div>

          {/* Instrument Tray */}
          <div className="bg-slate-900/90 border border-slate-700 rounded-lg p-4 flex-1">
            <div className="text-xs text-gray-400 uppercase tracking-wide mb-3">Surgical Instruments</div>
            <div className="grid grid-cols-2 gap-2">
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
                  className={`
                    p-3 rounded border text-center transition-all
                    ${instrument.active
                      ? 'bg-blue-600/30 border-blue-500 text-white'
                      : 'bg-slate-800/50 border-slate-600 text-gray-400 hover:bg-slate-700/50'
                    }
                  `}
                >
                  <div className="text-2xl mb-1">{instrument.icon}</div>
                  <div className="text-xs">{instrument.name}</div>
                </button>
              ))}
            </div>

            <div className="mt-4 p-2 bg-amber-600/20 border border-amber-500 rounded text-xs text-amber-200">
              💡 Instrument selection coming in next update
            </div>
          </div>

          {/* Critical Structures Warning */}
          <div className="bg-red-600/20 border border-red-500 rounded-lg p-3">
            <div className="text-xs text-red-300 uppercase tracking-wide mb-2">⚠️ Critical Structures</div>
            <div className="space-y-1">
              {patientCase.criticalStructures.slice(0, 3).map((structure, idx) => (
                <div key={idx} className="text-xs text-red-200">• {structure}</div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar - Mentor Feedback */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 pointer-events-auto">
        <div className="max-w-screen-xl mx-auto">
          <div className="bg-slate-800/90 border border-blue-500 rounded-lg p-3 flex items-center gap-3">
            <div className="text-2xl">🤖</div>
            <div>
              <div className="text-xs text-blue-300">AI SURGICAL MENTOR</div>
              <div className="text-white text-sm">
                {currentObjective
                  ? `Focus on: ${currentObjective.description}`
                  : 'Awaiting next objective...'
                }
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
