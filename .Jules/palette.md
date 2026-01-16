## 2024-05-23 - Inline Styles & Manual State
**Learning:** This project uses inline styles (JS objects) for styling components instead of CSS classes or CSS-in-JS libraries. This requires manual implementation of hover and focus states using `onMouseEnter`/`onFocus` handlers.
**Action:** When creating or modifying interactive components, always implement state management for visual feedback (hover/focus) and apply styles dynamically.

## 2024-05-23 - Keyboard Shortcuts
**Learning:** Simulation controls benefit significantly from keyboard shortcuts (e.g., 'L' for Level, 'R' for Reset) as they allow quick actions without breaking immersion or requiring mouse movement.
**Action:** Always verify if a new control could benefit from a hotkey and implement it with a visible hint (e.g., `<kbd>`).
