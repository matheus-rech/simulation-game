# Palette's UX Journal

This journal documents critical UX and accessibility learnings for the NeuroSim project.

## 2024-05-23 - Keyboard Shortcuts and HUD Hints
**Learning:** Users often miss keyboard shortcuts in simulation games if they are not explicitly hinted in the UI.
**Action:** When adding keyboard shortcuts, always include a visual indicator (like `<kbd>`) in the corresponding UI element (buttons, tooltips) to aid discovery and retention.

## 2024-05-23 - Application State Management
**Learning:** Application state (level, scope angle, tip position) is centrally managed in `src/App.tsx`, which simplifies adding global shortcuts that modify this state.
**Action:** Leverage the central state in `App.tsx` for global interactions rather than dispersing logic across components.
