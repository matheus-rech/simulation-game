/**
 * MentorOverlay Component
 *
 * Displays AI surgical mentor feedback during simulation.
 * Features:
 * - Avatar with mood indicators
 * - Speech bubble with recommendations
 * - Safety status indicator
 * - Structure highlighting controls
 * - Streaming text animation
 */

import { useEffect, useState } from 'react';
import { MentorResponse } from '../../services/ai/ClaudeVisionService';

// ============================================================================
// Types
// ============================================================================

export interface MentorOverlayProps {
  /** Current mentor response */
  response: MentorResponse | null;
  /** Is mentor analyzing? */
  isAnalyzing: boolean;
  /** Error message */
  error: string | null;
  /** Show confidence scores */
  showConfidence?: boolean;
  /** Callback when structure is clicked for highlighting */
  onHighlightStructure?: (structure: string) => void;
  /** Is streaming? */
  isStreaming?: boolean;
  /** Streaming text */
  streamingText?: string;
  /** Position (top-right, bottom-right, etc.) */
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

// ============================================================================
// Styles
// ============================================================================

const getPositionStyle = (position: string) => {
  const baseStyle = {
    position: 'absolute' as const,
    zIndex: 50,
    maxWidth: 400,
  };

  switch (position) {
    case 'top-left':
      return { ...baseStyle, top: 80, left: 16 };
    case 'top-right':
      return { ...baseStyle, top: 80, right: 16 };
    case 'bottom-left':
      return { ...baseStyle, bottom: 16, left: 16 };
    case 'bottom-right':
      return { ...baseStyle, bottom: 16, right: 16 };
    default:
      return { ...baseStyle, top: 80, right: 16 };
  }
};

const styles = {
  container: (position: string) => ({
    ...getPositionStyle(position),
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 12,
  }),
  mentorCard: {
    background: 'rgba(15, 10, 10, 0.92)',
    borderRadius: 12,
    padding: 16,
    border: '1px solid rgba(247, 229, 218, 0.15)',
    backdropFilter: 'blur(10px)',
    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
    paddingBottom: 8,
    borderBottom: '1px solid rgba(247, 229, 218, 0.1)',
  },
  avatar: (tone: string) => ({
    width: 48,
    height: 48,
    borderRadius: '50%',
    background: getAvatarColor(tone),
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.5rem',
    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
  }),
  mentorInfo: {
    flex: 1,
  },
  mentorTitle: {
    margin: 0,
    fontSize: '0.95rem',
    fontWeight: 600,
    color: '#f7e5da',
  },
  safetyBadge: (level: string) => ({
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: 4,
    fontSize: '0.75rem',
    fontWeight: 600,
    background: getSafetyColor(level),
    color: '#fff',
    textTransform: 'uppercase' as const,
  }),
  speechBubble: {
    padding: 12,
    background: 'rgba(247, 229, 218, 0.05)',
    borderRadius: 8,
    color: '#f7e5da',
    fontSize: '0.9rem',
    lineHeight: 1.5,
    minHeight: 60,
  },
  streamingIndicator: {
    display: 'inline-block',
    width: 8,
    height: 8,
    borderRadius: '50%',
    background: '#4CAF50',
    marginLeft: 4,
    animation: 'pulse 1s ease-in-out infinite',
  },
  structuresSection: {
    marginTop: 8,
  },
  structuresTitle: {
    margin: '0 0 6px 0',
    fontSize: '0.8rem',
    fontWeight: 600,
    color: 'rgba(247, 229, 218, 0.7)',
    textTransform: 'uppercase' as const,
  },
  structuresList: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: 6,
  },
  structureTag: {
    padding: '4px 10px',
    background: 'rgba(100, 150, 255, 0.2)',
    border: '1px solid rgba(100, 150, 255, 0.4)',
    borderRadius: 6,
    fontSize: '0.8rem',
    color: '#a0c4ff',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  confidence: {
    marginTop: 8,
    fontSize: '0.75rem',
    color: 'rgba(247, 229, 218, 0.6)',
    textAlign: 'right' as const,
  },
  errorCard: {
    background: 'rgba(183, 28, 43, 0.9)',
    borderRadius: 8,
    padding: 12,
    color: '#fff',
    fontSize: '0.85rem',
    border: '1px solid rgba(255, 68, 68, 0.5)',
  },
  loadingCard: {
    background: 'rgba(15, 10, 10, 0.92)',
    borderRadius: 12,
    padding: 16,
    border: '1px solid rgba(100, 150, 255, 0.3)',
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  spinner: {
    width: 24,
    height: 24,
    border: '3px solid rgba(100, 150, 255, 0.2)',
    borderTopColor: '#6496ff',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
};

// ============================================================================
// Helper Functions
// ============================================================================

function getAvatarColor(tone: string): string {
  switch (tone) {
    case 'encouraging':
      return 'linear-gradient(135deg, #4CAF50, #66BB6A)';
    case 'cautionary':
      return 'linear-gradient(135deg, #FF9800, #FFB74D)';
    case 'urgent':
      return 'linear-gradient(135deg, #F44336, #E57373)';
    default:
      return 'linear-gradient(135deg, #2196F3, #64B5F6)';
  }
}

function getSafetyColor(level: string): string {
  switch (level) {
    case 'safe':
      return '#4CAF50';
    case 'caution':
      return '#FF9800';
    case 'danger':
      return '#FF5722';
    case 'critical':
      return '#F44336';
    default:
      return '#2196F3';
  }
}

function getAvatarEmoji(tone: string): string {
  switch (tone) {
    case 'encouraging':
      return '😊';
    case 'cautionary':
      return '🤔';
    case 'urgent':
      return '⚠️';
    default:
      return '👨‍⚕️';
  }
}

// ============================================================================
// Component
// ============================================================================

export function MentorOverlay({
  response,
  isAnalyzing,
  error,
  showConfidence = true,
  onHighlightStructure,
  isStreaming = false,
  streamingText = '',
  position = 'top-right',
}: MentorOverlayProps) {
  const [highlightedStructures, setHighlightedStructures] = useState<Set<string>>(new Set());

  // Clear highlights when response changes
  useEffect(() => {
    setHighlightedStructures(new Set());
  }, [response]);

  const handleStructureClick = (structure: string) => {
    const newHighlighted = new Set(highlightedStructures);
    if (newHighlighted.has(structure)) {
      newHighlighted.delete(structure);
    } else {
      newHighlighted.add(structure);
    }
    setHighlightedStructures(newHighlighted);

    if (onHighlightStructure) {
      onHighlightStructure(structure);
    }
  };

  // ==========================================================================
  // Render: Error State
  // ==========================================================================

  if (error) {
    return (
      <div style={styles.container(position)}>
        <div style={styles.errorCard}>
          <strong>AI Mentor Error</strong>
          <div style={{ marginTop: 4 }}>{error}</div>
        </div>
      </div>
    );
  }

  // ==========================================================================
  // Render: Loading State
  // ==========================================================================

  if (isAnalyzing && !isStreaming) {
    return (
      <div style={styles.container(position)}>
        <div style={styles.loadingCard}>
          <div style={styles.spinner} />
          <span style={{ color: '#f7e5da', fontSize: '0.9rem' }}>
            Analyzing surgical field...
          </span>
        </div>
      </div>
    );
  }

  // ==========================================================================
  // Render: No Response Yet
  // ==========================================================================

  if (!response && !isStreaming) {
    return null;
  }

  // ==========================================================================
  // Render: Mentor Response
  // ==========================================================================

  const displayText = isStreaming ? streamingText : response?.recommendation || '';
  const tone = response?.tone || 'encouraging';
  const safetyLevel = response?.safetyAssessment || 'safe';
  const structures = response?.structuresVisible || [];
  const confidence = response?.confidence || 0;

  return (
    <div style={styles.container(position)}>
      <div style={styles.mentorCard}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.avatar(tone)}>{getAvatarEmoji(tone)}</div>
          <div style={styles.mentorInfo}>
            <h3 style={styles.mentorTitle}>AI Surgical Mentor</h3>
            <span style={styles.safetyBadge(safetyLevel)}>{safetyLevel}</span>
          </div>
        </div>

        {/* Speech Bubble */}
        <div style={styles.speechBubble}>
          {displayText}
          {isStreaming && <span style={styles.streamingIndicator} />}
        </div>

        {/* Visible Structures */}
        {structures.length > 0 && (
          <div style={styles.structuresSection}>
            <h4 style={styles.structuresTitle}>Visible Structures</h4>
            <div style={styles.structuresList}>
              {structures.map(structure => (
                <button
                  key={structure}
                  style={{
                    ...styles.structureTag,
                    opacity: highlightedStructures.has(structure) ? 1 : 0.7,
                    background: highlightedStructures.has(structure)
                      ? 'rgba(100, 150, 255, 0.4)'
                      : 'rgba(100, 150, 255, 0.2)',
                  }}
                  onClick={() => handleStructureClick(structure)}
                  type="button"
                >
                  {structure}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Confidence Score */}
        {showConfidence && confidence > 0 && (
          <div style={styles.confidence}>
            Confidence: {(confidence * 100).toFixed(0)}%
          </div>
        )}
      </div>

      {/* Add CSS animations */}
      <style>
        {`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
}
