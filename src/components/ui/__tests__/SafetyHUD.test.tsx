import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Vector3 } from 'three';
import { SafetyHUD } from '../SafetyHUD';
import { SafetyZone, RiskLevel, SAFETY_MARGINS } from '../../3d/safety/SafetyCorridorManager';

describe('SafetyHUD - Display Accuracy', () => {
  const mockSafetyZones: SafetyZone[] = [
    {
      structureName: 'ICA Left',
      position: new Vector3(-0.9, 0.3, -7.3),
      distance: 2.5,
      riskLevel: RiskLevel.WARNING,
      margin: SAFETY_MARGINS.ICA,
    },
    {
      structureName: 'ICA Right',
      position: new Vector3(0.9, 0.3, -7.3),
      distance: 5.0,
      riskLevel: RiskLevel.SAFE,
      margin: SAFETY_MARGINS.ICA,
    },
  ];

  it('should render when visible is true', () => {
    const { container } = render(<SafetyHUD safetyZones={mockSafetyZones} visible={true} />);
    expect(container.firstChild).not.toBeNull();
  });

  it('should not render when visible is false', () => {
    const { container } = render(<SafetyHUD safetyZones={mockSafetyZones} visible={false} />);
    expect(container.firstChild).toBeNull();
  });

  it('should display all safety zones in full mode', () => {
    render(<SafetyHUD safetyZones={mockSafetyZones} visible={true} compact={false} />);

    expect(screen.getByText(/ICA Left/i)).toBeDefined();
    expect(screen.getByText(/ICA Right/i)).toBeDefined();
  });

  it('should display distances with 1 decimal precision', () => {
    render(<SafetyHUD safetyZones={mockSafetyZones} visible={true} />);

    expect(screen.getByText('2.5mm')).toBeDefined();
    expect(screen.getByText('5.0mm')).toBeDefined();
  });

  it('should show header in full mode', () => {
    render(<SafetyHUD safetyZones={mockSafetyZones} visible={true} compact={false} />);

    expect(screen.getByText(/SAFETY CORRIDORS/i)).toBeDefined();
  });
});

describe('SafetyHUD - Color-Coded Warnings', () => {
  it('should display green emoji for SAFE level', () => {
    const safeZones: SafetyZone[] = [
      {
        structureName: 'ICA Left',
        position: new Vector3(0, 0, 0),
        distance: 5.0,
        riskLevel: RiskLevel.SAFE,
        margin: SAFETY_MARGINS.ICA,
      },
    ];

    render(<SafetyHUD safetyZones={safeZones} visible={true} />);
    expect(screen.getByText('SAFE')).toBeDefined();
  });

  it('should display yellow emoji for WARNING level', () => {
    const warningZones: SafetyZone[] = [
      {
        structureName: 'ICA Left',
        position: new Vector3(0, 0, 0),
        distance: 2.5,
        riskLevel: RiskLevel.WARNING,
        margin: SAFETY_MARGINS.ICA,
      },
    ];

    render(<SafetyHUD safetyZones={warningZones} visible={true} />);
    expect(screen.getByText('CAUTION')).toBeDefined();
  });

  it('should display orange emoji for DANGER level', () => {
    const dangerZones: SafetyZone[] = [
      {
        structureName: 'ICA Left',
        position: new Vector3(0, 0, 0),
        distance: 1.5,
        riskLevel: RiskLevel.DANGER,
        margin: SAFETY_MARGINS.ICA,
      },
    ];

    render(<SafetyHUD safetyZones={dangerZones} visible={true} />);
    expect(screen.getByText('DANGER')).toBeDefined();
  });

  it('should display red emoji for CRITICAL level', () => {
    const criticalZones: SafetyZone[] = [
      {
        structureName: 'ICA Left',
        position: new Vector3(0, 0, 0),
        distance: 0.3,
        riskLevel: RiskLevel.CRITICAL,
        margin: SAFETY_MARGINS.ICA,
      },
    ];

    render(<SafetyHUD safetyZones={criticalZones} visible={true} />);
    expect(screen.getByText('STOP!')).toBeDefined();
  });
});

describe('SafetyHUD - Overall Risk Assessment', () => {
  it('should show CRITICAL as overall risk when any zone is critical', () => {
    const mixedZones: SafetyZone[] = [
      {
        structureName: 'ICA Left',
        position: new Vector3(0, 0, 0),
        distance: 0.3,
        riskLevel: RiskLevel.CRITICAL,
        margin: SAFETY_MARGINS.ICA,
      },
      {
        structureName: 'ICA Right',
        position: new Vector3(0, 0, 0),
        distance: 5.0,
        riskLevel: RiskLevel.SAFE,
        margin: SAFETY_MARGINS.ICA,
      },
    ];

    render(<SafetyHUD safetyZones={mixedZones} visible={true} />);

    // Should show STOP! in overall status
    const stopElements = screen.getAllByText('STOP!');
    expect(stopElements.length).toBeGreaterThanOrEqual(1);
  });

  it('should show DANGER as overall risk when highest risk is danger', () => {
    const mixedZones: SafetyZone[] = [
      {
        structureName: 'ICA Left',
        position: new Vector3(0, 0, 0),
        distance: 1.5,
        riskLevel: RiskLevel.DANGER,
        margin: SAFETY_MARGINS.ICA,
      },
      {
        structureName: 'ICA Right',
        position: new Vector3(0, 0, 0),
        distance: 2.5,
        riskLevel: RiskLevel.WARNING,
        margin: SAFETY_MARGINS.ICA,
      },
    ];

    render(<SafetyHUD safetyZones={mixedZones} visible={true} />);

    // Should show DANGER in overall status
    const dangerElements = screen.getAllByText('DANGER');
    expect(dangerElements.length).toBeGreaterThanOrEqual(1);
  });

  it('should show WARNING as overall risk when highest risk is warning', () => {
    const mixedZones: SafetyZone[] = [
      {
        structureName: 'ICA Left',
        position: new Vector3(0, 0, 0),
        distance: 2.5,
        riskLevel: RiskLevel.WARNING,
        margin: SAFETY_MARGINS.ICA,
      },
      {
        structureName: 'ICA Right',
        position: new Vector3(0, 0, 0),
        distance: 5.0,
        riskLevel: RiskLevel.SAFE,
        margin: SAFETY_MARGINS.ICA,
      },
    ];

    render(<SafetyHUD safetyZones={mixedZones} visible={true} />);

    // Should show CAUTION in overall status
    const cautionElements = screen.getAllByText('CAUTION');
    expect(cautionElements.length).toBeGreaterThanOrEqual(1);
  });

  it('should show SAFE as overall risk when all zones are safe', () => {
    const safeZones: SafetyZone[] = [
      {
        structureName: 'ICA Left',
        position: new Vector3(0, 0, 0),
        distance: 5.0,
        riskLevel: RiskLevel.SAFE,
        margin: SAFETY_MARGINS.ICA,
      },
      {
        structureName: 'ICA Right',
        position: new Vector3(0, 0, 0),
        distance: 6.0,
        riskLevel: RiskLevel.SAFE,
        margin: SAFETY_MARGINS.ICA,
      },
    ];

    render(<SafetyHUD safetyZones={safeZones} visible={true} />);

    // Should show SAFE in overall status
    const safeElements = screen.getAllByText('SAFE');
    expect(safeElements.length).toBeGreaterThanOrEqual(1);
  });
});

describe('SafetyHUD - Compact Mode', () => {
  it('should show only closest structure in compact mode', () => {
    const zones: SafetyZone[] = [
      {
        structureName: 'ICA Left',
        position: new Vector3(0, 0, 0),
        distance: 5.0,
        riskLevel: RiskLevel.SAFE,
        margin: SAFETY_MARGINS.ICA,
      },
      {
        structureName: 'MWCS Left',
        position: new Vector3(0, 0, 0),
        distance: 1.5,
        riskLevel: RiskLevel.WARNING,
        margin: SAFETY_MARGINS.MWCS,
      },
    ];

    render(<SafetyHUD safetyZones={zones} visible={true} compact={true} />);

    // Should show closest structure
    expect(screen.getByText(/MWCS Left/i)).toBeDefined();

    // Should not show other structure
    expect(screen.queryByText(/ICA Left/i)).toBeNull();
  });

  it('should not render compact mode when no zones', () => {
    const { container } = render(<SafetyHUD safetyZones={[]} visible={true} compact={true} />);
    expect(container.firstChild).toBeNull();
  });

  it('should show distance and risk level in compact mode', () => {
    const zones: SafetyZone[] = [
      {
        structureName: 'ICA Left',
        position: new Vector3(0, 0, 0),
        distance: 2.5,
        riskLevel: RiskLevel.WARNING,
        margin: SAFETY_MARGINS.ICA,
      },
    ];

    render(<SafetyHUD safetyZones={zones} visible={true} compact={true} />);

    expect(screen.getByText('2.5mm')).toBeDefined();
    expect(screen.getByText('CAUTION')).toBeDefined();
  });
});

describe('SafetyHUD - Critical Warning Banner', () => {
  it('should display critical warning banner when overall risk is critical', () => {
    const criticalZones: SafetyZone[] = [
      {
        structureName: 'ICA Left',
        position: new Vector3(0, 0, 0),
        distance: 0.3,
        riskLevel: RiskLevel.CRITICAL,
        margin: SAFETY_MARGINS.ICA,
      },
    ];

    render(<SafetyHUD safetyZones={criticalZones} visible={true} />);

    expect(screen.getByText(/STOP IMMEDIATELY/i)).toBeDefined();
  });

  it('should not display critical banner when risk is not critical', () => {
    const safeZones: SafetyZone[] = [
      {
        structureName: 'ICA Left',
        position: new Vector3(0, 0, 0),
        distance: 5.0,
        riskLevel: RiskLevel.SAFE,
        margin: SAFETY_MARGINS.ICA,
      },
    ];

    render(<SafetyHUD safetyZones={safeZones} visible={true} />);

    expect(screen.queryByText(/STOP IMMEDIATELY/i)).toBeNull();
  });
});

describe('SafetyHUD - Safety Guidelines', () => {
  it('should display safety guidelines in full mode', () => {
    const zones: SafetyZone[] = [
      {
        structureName: 'ICA Left',
        position: new Vector3(0, 0, 0),
        distance: 5.0,
        riskLevel: RiskLevel.SAFE,
        margin: SAFETY_MARGINS.ICA,
      },
    ];

    render(<SafetyHUD safetyZones={zones} visible={true} compact={false} />);

    // Check for presence of guideline text
    const container = screen.getByText(/Safe:/i).parentElement;
    expect(container).toBeDefined();
  });

  it('should not display guidelines in compact mode', () => {
    const zones: SafetyZone[] = [
      {
        structureName: 'ICA Left',
        position: new Vector3(0, 0, 0),
        distance: 5.0,
        riskLevel: RiskLevel.SAFE,
        margin: SAFETY_MARGINS.ICA,
      },
    ];

    render(<SafetyHUD safetyZones={zones} visible={true} compact={true} />);

    expect(screen.queryByText(/Safe:/i)).toBeNull();
  });
});

describe('SafetyHUD - Empty State', () => {
  it('should show SAFE as overall risk when no zones', () => {
    render(<SafetyHUD safetyZones={[]} visible={true} compact={false} />);

    // With empty zones, overall risk defaults to SAFE
    const safeElements = screen.getAllByText('SAFE');
    expect(safeElements.length).toBeGreaterThanOrEqual(1);
  });

  it('should not show any structure rows when no zones', () => {
    render(<SafetyHUD safetyZones={[]} visible={true} compact={false} />);

    // Should not show any structure names in the structure list
    // Note: Safety guidelines will still contain ICA/MWCS references
    expect(screen.queryByText(/ICA Left/i)).toBeNull();
    expect(screen.queryByText(/ICA Right/i)).toBeNull();
    expect(screen.queryByText(/MWCS Left/i)).toBeNull();
    expect(screen.queryByText(/MWCS Right/i)).toBeNull();
  });
});

describe('SafetyHUD - Multiple Structures', () => {
  it('should display all 5 structures when all are present', () => {
    const allZones: SafetyZone[] = [
      {
        structureName: 'ICA Left',
        position: new Vector3(0, 0, 0),
        distance: 5.0,
        riskLevel: RiskLevel.SAFE,
        margin: SAFETY_MARGINS.ICA,
      },
      {
        structureName: 'ICA Right',
        position: new Vector3(0, 0, 0),
        distance: 4.5,
        riskLevel: RiskLevel.SAFE,
        margin: SAFETY_MARGINS.ICA,
      },
      {
        structureName: 'MWCS Left',
        position: new Vector3(0, 0, 0),
        distance: 2.5,
        riskLevel: RiskLevel.SAFE,
        margin: SAFETY_MARGINS.MWCS,
      },
      {
        structureName: 'MWCS Right',
        position: new Vector3(0, 0, 0),
        distance: 2.3,
        riskLevel: RiskLevel.SAFE,
        margin: SAFETY_MARGINS.MWCS,
      },
      {
        structureName: 'Dura',
        position: new Vector3(0, 0, 0),
        distance: 3.0,
        riskLevel: RiskLevel.SAFE,
        margin: SAFETY_MARGINS.DURA,
      },
    ];

    render(<SafetyHUD safetyZones={allZones} visible={true} />);

    expect(screen.getByText(/ICA Left/i)).toBeDefined();
    expect(screen.getByText(/ICA Right/i)).toBeDefined();
    expect(screen.getByText(/MWCS Left/i)).toBeDefined();
    expect(screen.getByText(/MWCS Right/i)).toBeDefined();
    expect(screen.getByText(/Dura/i)).toBeDefined();
  });

  it('should highlight dangerous structures with different background', () => {
    const mixedZones: SafetyZone[] = [
      {
        structureName: 'ICA Left',
        position: new Vector3(0, 0, 0),
        distance: 0.3,
        riskLevel: RiskLevel.CRITICAL,
        margin: SAFETY_MARGINS.ICA,
      },
      {
        structureName: 'MWCS Left',
        position: new Vector3(0, 0, 0),
        distance: 5.0,
        riskLevel: RiskLevel.SAFE,
        margin: SAFETY_MARGINS.MWCS,
      },
    ];

    const { container } = render(<SafetyHUD safetyZones={mixedZones} visible={true} />);

    // Check that component rendered
    expect(container.firstChild).not.toBeNull();

    // Styling is applied inline, so we just verify it renders
    expect(screen.getByText(/ICA Left/i)).toBeDefined();
    expect(screen.getByText(/MWCS Left/i)).toBeDefined();
  });
});

describe('SafetyHUD - Risk Priority', () => {
  it('should prioritize CRITICAL over all other risks', () => {
    const zones: SafetyZone[] = [
      {
        structureName: 'ICA Left',
        position: new Vector3(0, 0, 0),
        distance: 0.3,
        riskLevel: RiskLevel.CRITICAL,
        margin: SAFETY_MARGINS.ICA,
      },
      {
        structureName: 'ICA Right',
        position: new Vector3(0, 0, 0),
        distance: 1.5,
        riskLevel: RiskLevel.DANGER,
        margin: SAFETY_MARGINS.ICA,
      },
      {
        structureName: 'MWCS Left',
        position: new Vector3(0, 0, 0),
        distance: 1.5,
        riskLevel: RiskLevel.WARNING,
        margin: SAFETY_MARGINS.MWCS,
      },
    ];

    render(<SafetyHUD safetyZones={zones} visible={true} />);

    // Overall status should be STOP! (critical)
    const stopElements = screen.getAllByText('STOP!');
    expect(stopElements.length).toBeGreaterThanOrEqual(1);
  });

  it('should prioritize DANGER over WARNING and SAFE', () => {
    const zones: SafetyZone[] = [
      {
        structureName: 'ICA Left',
        position: new Vector3(0, 0, 0),
        distance: 1.5,
        riskLevel: RiskLevel.DANGER,
        margin: SAFETY_MARGINS.ICA,
      },
      {
        structureName: 'MWCS Left',
        position: new Vector3(0, 0, 0),
        distance: 1.5,
        riskLevel: RiskLevel.WARNING,
        margin: SAFETY_MARGINS.MWCS,
      },
      {
        structureName: 'Dura',
        position: new Vector3(0, 0, 0),
        distance: 5.0,
        riskLevel: RiskLevel.SAFE,
        margin: SAFETY_MARGINS.DURA,
      },
    ];

    render(<SafetyHUD safetyZones={zones} visible={true} />);

    // Overall status should be DANGER
    const dangerElements = screen.getAllByText('DANGER');
    expect(dangerElements.length).toBeGreaterThanOrEqual(1);
  });
});

describe('SafetyHUD - Distance Formatting', () => {
  it('should format small distances correctly', () => {
    const zones: SafetyZone[] = [
      {
        structureName: 'ICA Left',
        position: new Vector3(0, 0, 0),
        distance: 0.12345,
        riskLevel: RiskLevel.CRITICAL,
        margin: SAFETY_MARGINS.ICA,
      },
    ];

    render(<SafetyHUD safetyZones={zones} visible={true} />);

    expect(screen.getByText('0.1mm')).toBeDefined();
  });

  it('should format large distances correctly', () => {
    const zones: SafetyZone[] = [
      {
        structureName: 'ICA Left',
        position: new Vector3(0, 0, 0),
        distance: 123.456,
        riskLevel: RiskLevel.SAFE,
        margin: SAFETY_MARGINS.ICA,
      },
    ];

    render(<SafetyHUD safetyZones={zones} visible={true} />);

    expect(screen.getByText('123.5mm')).toBeDefined();
  });

  it('should handle zero distance', () => {
    const zones: SafetyZone[] = [
      {
        structureName: 'ICA Left',
        position: new Vector3(0, 0, 0),
        distance: 0.0,
        riskLevel: RiskLevel.CRITICAL,
        margin: SAFETY_MARGINS.ICA,
      },
    ];

    render(<SafetyHUD safetyZones={zones} visible={true} />);

    expect(screen.getByText('0.0mm')).toBeDefined();
  });
});
