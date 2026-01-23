/**
 * Case Selector - Pre-operative case selection screen
 * Using inline styles (no Tailwind dependency)
 */

import { useState } from 'react';
import { PatientCase, CaseDifficulty, KnospGrade, getAvailableCases, ALL_CASES } from '../../data/patientCases';

interface CaseSelectorProps {
  onCaseSelected: (patientCase: PatientCase) => void;
  completedCaseIds: string[];
  onEnterCurriculumMode?: () => void;
}

const styles = {
  container: {
    position: 'fixed' as const,
    inset: 0,
    background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #0f172a 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '32px',
    fontFamily: "'Segoe UI', sans-serif",
  },
  wrapper: {
    maxWidth: '1400px',
    width: '100%',
  },
  header: {
    textAlign: 'center' as const,
    marginBottom: '32px',
  },
  title: {
    fontSize: '3rem',
    fontWeight: 700,
    color: 'white',
    marginBottom: '8px',
  },
  subtitle: {
    fontSize: '1.25rem',
    color: '#bfdbfe',
  },
  caseGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: '24px',
    marginBottom: '32px',
  },
  caseCard: {
    position: 'relative' as const,
    background: 'rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(12px)',
    borderRadius: '12px',
    padding: '24px',
    border: '2px solid rgba(255, 255, 255, 0.2)',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  caseCardSelected: {
    border: '2px solid #60a5fa',
    background: 'rgba(96, 165, 250, 0.2)',
  },
  caseCardLocked: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
  lockedOverlay: {
    position: 'absolute' as const,
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(0, 0, 0, 0.5)',
    borderRadius: '12px',
    flexDirection: 'column' as const,
  },
  difficultyBadge: {
    display: 'inline-block',
    padding: '4px 12px',
    borderRadius: '999px',
    fontSize: '0.75rem',
    fontWeight: 700,
    color: 'white',
    marginBottom: '16px',
  },
  patientName: {
    fontSize: '1.5rem',
    fontWeight: 700,
    color: 'white',
    marginBottom: '4px',
  },
  patientInfo: {
    fontSize: '0.875rem',
    color: '#bfdbfe',
    marginBottom: '16px',
  },
  detailsBox: {
    background: 'rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(12px)',
    borderRadius: '12px',
    padding: '32px',
    border: '2px solid #60a5fa',
  },
  briefingTitle: {
    fontSize: '2rem',
    fontWeight: 700,
    color: 'white',
    marginBottom: '24px',
  },
  section: {
    marginBottom: '24px',
  },
  sectionTitle: {
    fontSize: '1.25rem',
    fontWeight: 600,
    color: '#bfdbfe',
    marginBottom: '8px',
  },
  list: {
    listStyle: 'disc',
    listStylePosition: 'inside',
    color: '#d1d5db',
  },
  startButton: {
    display: 'block',
    margin: '32px auto 0',
    background: '#2563eb',
    color: 'white',
    fontWeight: 700,
    fontSize: '1.25rem',
    padding: '16px 48px',
    borderRadius: '8px',
    border: 'none',
    cursor: 'pointer',
    transition: 'background 0.2s',
  },
};

export function CaseSelector({ onCaseSelected, completedCaseIds, onEnterCurriculumMode }: CaseSelectorProps) {
  const [selectedCase, setSelectedCase] = useState<PatientCase | null>(null);
  const availableCases = getAvailableCases(completedCaseIds);

  const getDifficultyColor = (difficulty: CaseDifficulty): string => {
    switch (difficulty) {
      case CaseDifficulty.BEGINNER: return '#16a34a';
      case CaseDifficulty.INTERMEDIATE: return '#ca8a04';
      case CaseDifficulty.ADVANCED: return '#dc2626';
      case CaseDifficulty.EXPERT: return '#9333ea';
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.wrapper}>
        <div style={styles.header}>
          <h1 style={styles.title}>NeuroSim Surgical Training</h1>
          <p style={styles.subtitle}>Select a patient case to begin endoscopic endonasal surgery simulation</p>
        </div>

        <div style={styles.caseGrid}>
          {ALL_CASES.map((patientCase) => {
            const isAvailable = availableCases.some(c => c.id === patientCase.id);
            const isCompleted = completedCaseIds.includes(patientCase.id);
            const isLocked = !isAvailable;
            const isSelected = selectedCase?.id === patientCase.id;

            return (
              <div
                key={patientCase.id}
                onClick={() => isAvailable && setSelectedCase(patientCase)}
                style={{
                  ...styles.caseCard,
                  ...(isSelected ? styles.caseCardSelected : {}),
                  ...(isLocked ? styles.caseCardLocked : {}),
                }}
                onMouseEnter={(e) => {
                  if (isAvailable && !isSelected) {
                    e.currentTarget.style.transform = 'scale(1.05)';
                    e.currentTarget.style.borderColor = '#93c5fd';
                  }
                }}
                onMouseLeave={(e) => {
                  if (isAvailable && !isSelected) {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                  }
                }}
              >
                {isLocked && (
                  <div style={styles.lockedOverlay}>
                    <div style={{ fontSize: '3rem', marginBottom: '8px' }}>🔒</div>
                    <div style={{ color: 'white', fontWeight: 600 }}>Locked</div>
                    <div style={{ fontSize: '0.75rem', color: '#d1d5db', marginTop: '4px' }}>
                      Complete previous case to unlock
                    </div>
                  </div>
                )}

                {isCompleted && (
                  <div style={{
                    position: 'absolute',
                    top: '16px',
                    right: '16px',
                    background: '#16a34a',
                    color: 'white',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    padding: '4px 8px',
                    borderRadius: '4px',
                  }}>
                    ✓ COMPLETED
                  </div>
                )}

                <div style={{ ...styles.difficultyBadge, background: getDifficultyColor(patientCase.difficulty) }}>
                  {patientCase.difficulty.toUpperCase()}
                </div>

                <h3 style={styles.patientName}>{patientCase.name}</h3>
                <p style={styles.patientInfo}>
                  {patientCase.age} year old {patientCase.gender === 'M' ? 'Male' : 'Female'}
                </p>

                <div style={{ fontSize: '0.875rem', color: '#d1d5db' }}>
                  <div style={{ marginBottom: '8px' }}>
                    <strong>Chief Complaint:</strong>
                    <p style={{ marginTop: '4px', color: '#9ca3af' }}>{patientCase.chiefComplaint}</p>
                  </div>

                  <div style={{ display: 'flex', gap: '16px', fontSize: '0.75rem', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid rgba(255, 255, 255, 0.2)' }}>
                    <div>
                      <div style={{ fontWeight: 600, color: '#d1d5db' }}>Tumor Size</div>
                      <div>{patientCase.tumorSize} cm</div>
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, color: '#d1d5db' }}>Knosp Grade</div>
                      <div>{patientCase.knospGrade}</div>
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, color: '#d1d5db' }}>Time Limit</div>
                      <div>{patientCase.timeLimit} min</div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {selectedCase && (
          <div style={styles.detailsBox}>
            <h2 style={styles.briefingTitle}>Pre-Operative Briefing: {selectedCase.name}</h2>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
              <div>
                <div style={styles.section}>
                  <h3 style={styles.sectionTitle}>Clinical Presentation</h3>
                  <ul style={styles.list}>
                    {selectedCase.symptoms.map((symptom, idx) => (
                      <li key={idx}>{symptom}</li>
                    ))}
                  </ul>
                  <p style={{ fontSize: '0.875rem', color: '#9ca3af', marginTop: '8px' }}>
                    Duration: {selectedCase.duration}
                  </p>
                </div>

                <div style={styles.section}>
                  <h3 style={styles.sectionTitle}>Critical Structures</h3>
                  <ul style={styles.list}>
                    {selectedCase.criticalStructures.map((structure, idx) => (
                      <li key={idx}>{structure}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div>
                <div style={styles.section}>
                  <h3 style={styles.sectionTitle}>Surgical Objectives</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {selectedCase.objectives.map((objective) => (
                      <div key={objective.id} style={{ background: 'rgba(255, 255, 255, 0.05)', borderRadius: '8px', padding: '12px' }}>
                        <div style={{ fontWeight: 600, color: 'white' }}>
                          Phase {objective.phase}: {objective.title}
                        </div>
                        <div style={{ fontSize: '0.875rem', color: '#d1d5db', marginTop: '4px' }}>
                          {objective.description}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <button
              style={styles.startButton}
              onClick={() => onCaseSelected(selectedCase)}
              onMouseEnter={(e) => e.currentTarget.style.background = '#1d4ed8'}
              onMouseLeave={(e) => e.currentTarget.style.background = '#2563eb'}
            >
              Begin Surgery →
            </button>
          </div>
        )}

        {!selectedCase && (
          <div style={{ textAlign: 'center', color: '#9ca3af', marginTop: '32px' }}>
            <p style={{ marginBottom: '16px' }}>Select a case above to view the pre-operative briefing</p>
            {onEnterCurriculumMode && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', margin: '16px 0' }}>
                  <span style={{ fontSize: '0.875rem', opacity: 0.5 }}>— OR —</span>
                </div>
                <button
                  onClick={onEnterCurriculumMode}
                  style={{
                    background: 'transparent',
                    border: '1px solid #3b82f6',
                    color: '#60a5fa',
                    padding: '8px 16px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    transition: 'all 0.2s',
                    fontFamily: 'inherit'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  Enter Skills Training Mode
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
