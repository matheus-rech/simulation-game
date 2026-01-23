/**
 * Case Selector - Pre-operative case selection screen
 *
 * Allows user to select patient case before starting surgery
 */

import { useState } from 'react';
import { PatientCase, CaseDifficulty, KnospGrade, getAvailableCases, ALL_CASES } from '../../data/patientCases';

interface CaseSelectorProps {
  onCaseSelected: (patientCase: PatientCase) => void;
  completedCaseIds: string[];
}

export function CaseSelector({ onCaseSelected, completedCaseIds }: CaseSelectorProps) {
  const [selectedCase, setSelectedCase] = useState<PatientCase | null>(null);
  const availableCases = getAvailableCases(completedCaseIds);

  const getDifficultyColor = (difficulty: CaseDifficulty): string => {
    switch (difficulty) {
      case CaseDifficulty.BEGINNER:
        return 'bg-green-600';
      case CaseDifficulty.INTERMEDIATE:
        return 'bg-yellow-600';
      case CaseDifficulty.ADVANCED:
        return 'bg-red-600';
      case CaseDifficulty.EXPERT:
        return 'bg-purple-600';
    }
  };

  const getDifficultyLabel = (difficulty: CaseDifficulty): string => {
    return difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
  };

  const getKnospLabel = (grade: KnospGrade): string => {
    return `Knosp Grade ${grade}`;
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-8">
      <div className="max-w-7xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-white mb-2">
            NeuroSim Surgical Training
          </h1>
          <p className="text-xl text-blue-200">
            Select a patient case to begin endoscopic endonasal surgery simulation
          </p>
        </div>

        {/* Case Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {ALL_CASES.map((patientCase) => {
            const isAvailable = availableCases.some(c => c.id === patientCase.id);
            const isCompleted = completedCaseIds.includes(patientCase.id);
            const isLocked = !isAvailable;

            return (
              <div
                key={patientCase.id}
                onClick={() => isAvailable && setSelectedCase(patientCase)}
                className={`
                  relative bg-white/10 backdrop-blur-md rounded-lg p-6 border-2 cursor-pointer
                  transition-all duration-200 hover:scale-105
                  ${selectedCase?.id === patientCase.id
                    ? 'border-blue-400 bg-blue-500/20'
                    : 'border-white/20 hover:border-blue-300'
                  }
                  ${isLocked ? 'opacity-50 cursor-not-allowed' : ''}
                `}
              >
                {/* Locked Overlay */}
                {isLocked && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
                    <div className="text-center">
                      <div className="text-4xl mb-2">🔒</div>
                      <div className="text-white font-semibold">Locked</div>
                      <div className="text-xs text-gray-300 mt-1">
                        Complete previous case to unlock
                      </div>
                    </div>
                  </div>
                )}

                {/* Completed Badge */}
                {isCompleted && (
                  <div className="absolute top-4 right-4 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded">
                    ✓ COMPLETED
                  </div>
                )}

                {/* Difficulty Badge */}
                <div className={`inline-block ${getDifficultyColor(patientCase.difficulty)} text-white text-xs font-bold px-3 py-1 rounded-full mb-4`}>
                  {getDifficultyLabel(patientCase.difficulty)}
                </div>

                {/* Patient Info */}
                <h3 className="text-2xl font-bold text-white mb-1">
                  {patientCase.name}
                </h3>
                <p className="text-blue-200 text-sm mb-4">
                  {patientCase.age} year old {patientCase.gender === 'M' ? 'Male' : 'Female'}
                </p>

                <div className="space-y-2 text-sm">
                  <div className="text-gray-200">
                    <span className="font-semibold">Chief Complaint:</span>
                    <p className="text-gray-300 mt-1">{patientCase.chiefComplaint}</p>
                  </div>

                  <div className="text-gray-200">
                    <span className="font-semibold">Diagnosis:</span>
                    <p className="text-gray-300 mt-1">{patientCase.diagnosis}</p>
                  </div>

                  <div className="flex gap-4 text-xs text-gray-300 mt-4 pt-4 border-t border-white/20">
                    <div>
                      <div className="font-semibold text-gray-200">Tumor Size</div>
                      <div>{patientCase.tumorSize} cm</div>
                    </div>
                    <div>
                      <div className="font-semibold text-gray-200">Invasion</div>
                      <div>{getKnospLabel(patientCase.knospGrade)}</div>
                    </div>
                    <div>
                      <div className="font-semibold text-gray-200">Time Limit</div>
                      <div>{patientCase.timeLimit} min</div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Case Details */}
        {selectedCase && (
          <div className="bg-white/10 backdrop-blur-md rounded-lg p-8 border-2 border-blue-400">
            <h2 className="text-3xl font-bold text-white mb-6">
              Pre-Operative Briefing: {selectedCase.name}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Left Column */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold text-blue-200 mb-2">Clinical Presentation</h3>
                  <ul className="list-disc list-inside text-gray-300 space-y-1">
                    {selectedCase.symptoms.map((symptom, idx) => (
                      <li key={idx}>{symptom}</li>
                    ))}
                  </ul>
                  <p className="text-sm text-gray-400 mt-2">Duration: {selectedCase.duration}</p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-blue-200 mb-2">Imaging Findings</h3>
                  <ul className="list-disc list-inside text-gray-300 space-y-1">
                    {selectedCase.imagingFindings.map((finding, idx) => (
                      <li key={idx}>{finding}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-blue-200 mb-2">Critical Structures</h3>
                  <ul className="list-disc list-inside text-gray-300 space-y-1">
                    {selectedCase.criticalStructures.map((structure, idx) => (
                      <li key={idx}>{structure}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold text-blue-200 mb-2">Surgical Objectives</h3>
                  <div className="space-y-3">
                    {selectedCase.objectives.map((objective) => (
                      <div key={objective.id} className="bg-white/5 rounded p-3">
                        <div className="font-semibold text-white">
                          Phase {objective.phase}: {objective.title}
                        </div>
                        <div className="text-sm text-gray-300 mt-1">
                          {objective.description}
                        </div>
                        {objective.timeLimit && (
                          <div className="text-xs text-gray-400 mt-1">
                            Time: {Math.floor(objective.timeLimit / 60)} minutes
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-blue-200 mb-2">Learning Objectives</h3>
                  <ul className="list-disc list-inside text-gray-300 space-y-1">
                    {selectedCase.learningObjectives.map((objective, idx) => (
                      <li key={idx}>{objective}</li>
                    ))}
                  </ul>
                </div>

                <div className="bg-red-500/20 border border-red-500 rounded p-4">
                  <h3 className="text-xl font-semibold text-red-200 mb-2">⚠️ Potential Complications</h3>
                  <ul className="list-disc list-inside text-red-100 space-y-1 text-sm">
                    {selectedCase.potentialComplications.map((complication, idx) => (
                      <li key={idx}>{complication}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Start Button */}
            <div className="flex justify-center mt-8">
              <button
                onClick={() => onCaseSelected(selectedCase)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xl px-12 py-4 rounded-lg transition-colors duration-200 shadow-lg hover:shadow-xl"
              >
                Begin Surgery →
              </button>
            </div>
          </div>
        )}

        {/* Instructions */}
        {!selectedCase && (
          <div className="text-center text-gray-400 mt-8">
            <p>Select a case above to view the pre-operative briefing</p>
            <p className="text-sm mt-2">Complete cases to unlock more difficult scenarios</p>
          </div>
        )}
      </div>
    </div>
  );
}
