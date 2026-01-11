## 2024-05-23 - Sticky Focus in Inline Styles
**Learning:** The `HUDButton` component uses manual React state (`onFocus`/`onBlur`) to simulate focus rings because the app uses inline styles. This causes "sticky focus" where the focus ring persists after a mouse click, which is visually distracting for mouse users.
**Action:** In the future, consider using a hook that detects interaction modality (keyboard vs mouse) to apply focus styles conditionally, or if possible, use a CSS-in-JS solution that supports pseudo-classes to restore standard `:focus-visible` behavior.
