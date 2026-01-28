## 2025-01-28 - Semantic Buttons for Complex Cards
**Learning:** Converting complex interactive 'div cards' to semantic `<button>` elements provides free keyboard accessibility but requires extensive style resets (appearance, text-align, background, border, font) and explicit `onFocus` handlers to match `onMouseEnter` visuals.
**Action:** Use a reusable 'CardButton' pattern with standard resets and unified focus/hover styling logic.
