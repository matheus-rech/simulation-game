## 2025-05-18 - Legacy UI Reachability
**Learning:** The "Legacy UI" (Training Mode) controls, specifically "Advance Level", were programmatically unreachable because of the default `curriculumMode` state and conditional rendering logic.
**Action:** Always verify UI element reachability before implementing features for them. Added an explicit entry point via "Enter Skills Training Mode" button to make these controls accessible.

## 2025-05-18 - Keyboard Shortcuts in Reusable Components
**Learning:** Adding a `shortcut` prop to generic button components (like `HUDButton`) is a scalable way to improve accessibility and learnability of keyboard controls. Visual hints (`<kbd>`) significantly improve discoverability.
**Action:** Pattern to be reused for future UI controls.
