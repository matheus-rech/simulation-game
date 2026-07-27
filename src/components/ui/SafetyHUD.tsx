import { useMemo } from 'react';
import { SafetyZone, RiskLevel } from '../3d/safety/SafetyCorridorManager';

export interface SafetyHUDProps {
  /** Current safety zones from SafetyCorridorManager */
  safetyZones: SafetyZone[];

  /** Show/hide the HUD */
  visible?: boolean;

  /** Compact mode (minimal info) */
  compact?: boolean;
}

/**
 * Safety HUD Display
 *
 * Shows real-time distance and risk level for critical anatomical structures.
 * Provides visual feedback with color-coded warnings.
 *
 * @example
 * <SafetyHUD safetyZones={currentZones} visible={showSafety} />
 */
export function SafetyHUD({ safetyZones, visible = true, compact = false }: SafetyHUDProps) {
  /**
   * Get emoji indicator for risk level
   */
  const getRiskEmoji = (level: RiskLevel): string => {
    switch (level) {
      case RiskLevel.SAFE: return '🟢';
      case RiskLevel.WARNING: return '🟡';
      case RiskLevel.DANGER: return '🟠';
      case RiskLevel.CRITICAL: return '🔴';
    }
  };

  /**
   * Get text label for risk level
   */
  const getRiskLabel = (level: RiskLevel): string => {
    switch (level) {
      case RiskLevel.SAFE: return 'SAFE';
      case RiskLevel.WARNING: return 'CAUTION';
      case RiskLevel.DANGER: return 'DANGER';
      case RiskLevel.CRITICAL: return 'STOP!';
    }
  };

  /**
   * Get color for risk level
   */
  const getRiskColor = (level: RiskLevel): string => {
    switch (level) {
      case RiskLevel.SAFE: return '#00ff00';
      case RiskLevel.WARNING: return '#ffff00';
      case RiskLevel.DANGER: return '#ff8800';
      case RiskLevel.CRITICAL: return '#ff0000';
    }
  };

  /**
   * Calculate overall safety status
   */
  const overallRisk = useMemo(() => {
    if (safetyZones.length === 0) return RiskLevel.SAFE;

    const risks = safetyZones.map(z => z.riskLevel);

    if (risks.includes(RiskLevel.CRITICAL)) return RiskLevel.CRITICAL;
    if (risks.includes(RiskLevel.DANGER)) return RiskLevel.DANGER;
    if (risks.includes(RiskLevel.WARNING)) return RiskLevel.WARNING;
    return RiskLevel.SAFE;
  }, [safetyZones]);

  /**
   * Find closest critical structure
   */
  const closestStructure = useMemo(() => {
    if (safetyZones.length === 0) return null;
    return safetyZones.reduce((closest, zone) =>
      zone.distance < closest.distance ? zone : closest
    );
  }, [safetyZones]);

  if (!visible) return null;

  // Compact mode: just show closest structure
  if (compact) {
    if (!closestStructure) return null;

    return (
      <div
        style={{
          position: 'fixed',
          top: '120px',
          right: '20px',
          padding: '12px 20px',
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          border: `2px solid ${getRiskColor(closestStructure.riskLevel)}`,
          borderRadius: '8px',
          color: 'white',
          fontFamily: 'monospace',
          fontSize: '14px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)',
          animation: closestStructure.riskLevel === RiskLevel.CRITICAL ? 'pulse 0.5s infinite' : 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>{getRiskEmoji(closestStructure.riskLevel)}</span>
          <span style={{ fontWeight: 'bold' }}>{closestStructure.structureName}:</span>
          <span style={{ color: getRiskColor(closestStructure.riskLevel) }}>
            {closestStructure.distance.toFixed(1)}mm
          </span>
          <span style={{ color: getRiskColor(closestStructure.riskLevel), fontWeight: 'bold' }}>
            {getRiskLabel(closestStructure.riskLevel)}
          </span>
        </div>
      </div>
    );
  }

  // Full mode: show all structures
  return (
    <div
      style={{
        position: 'fixed',
        top: '120px',
        right: '20px',
        padding: '16px',
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        border: `2px solid ${getRiskColor(overallRisk)}`,
        borderRadius: '12px',
        color: 'white',
        fontFamily: 'monospace',
        fontSize: '13px',
        minWidth: '280px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
        animation: overallRisk === RiskLevel.CRITICAL ? 'pulse 0.5s infinite' : 'none',
      }}
    >
      {/* Header */}
      <div
        style={{
          borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
          paddingBottom: '8px',
          marginBottom: '12px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span style={{ fontWeight: 'bold', fontSize: '14px' }}>⚠️ SAFETY CORRIDORS</span>
        <span
          style={{
            color: getRiskColor(overallRisk),
            fontWeight: 'bold',
            fontSize: '12px',
          }}
        >
          {getRiskLabel(overallRisk)}
        </span>
      </div>

      {/* Structure list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {safetyZones.map((zone, idx) => (
          <div
            key={idx}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '6px 8px',
              backgroundColor:
                zone.riskLevel === RiskLevel.CRITICAL || zone.riskLevel === RiskLevel.DANGER
                  ? 'rgba(255, 0, 0, 0.1)'
                  : 'rgba(255, 255, 255, 0.05)',
              borderRadius: '4px',
              borderLeft: `3px solid ${getRiskColor(zone.riskLevel)}`,
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>{getRiskEmoji(zone.riskLevel)}</span>
              <span style={{ fontWeight: 'bold', fontSize: '12px' }}>{zone.structureName}</span>
            </span>
            <span
              style={{
                color: getRiskColor(zone.riskLevel),
                fontWeight: 'bold',
              }}
            >
              {zone.distance.toFixed(1)}mm
            </span>
          </div>
        ))}
      </div>

      {/* Safety guidelines */}
      <div
        style={{
          marginTop: '12px',
          paddingTop: '8px',
          borderTop: '1px solid rgba(255, 255, 255, 0.2)',
          fontSize: '11px',
          color: 'rgba(255, 255, 255, 0.7)',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div>🟢 Safe: {'>'}3mm ICA, {'>'}2mm MWCS</div>
          <div>🟡 Caution: 2-3mm ICA, 1-2mm MWCS</div>
          <div>🟠 Danger: 1-2mm ICA, 0.5-1mm MWCS</div>
          <div>🔴 Critical: {'<'}1mm ICA, {'<'}0.5mm MWCS</div>
        </div>
      </div>

      {/* Critical warning banner */}
      {overallRisk === RiskLevel.CRITICAL && (
        <div
          style={{
            marginTop: '12px',
            padding: '8px',
            backgroundColor: 'rgba(255, 0, 0, 0.2)',
            border: '1px solid #ff0000',
            borderRadius: '4px',
            textAlign: 'center',
            fontWeight: 'bold',
            color: '#ff0000',
            animation: 'pulse 0.5s infinite',
          }}
        >
          ⚠️ STOP IMMEDIATELY ⚠️
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
      `}</style>
    </div>
  );
}
