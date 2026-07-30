# Palette's UX Journal

## 2024-05-22 - Interactive Cards as Buttons
**Learning:** Converting interactive `div` cards to `button` elements requires extensive style resets (appearance, background, border, font) but significantly improves accessibility by providing native keyboard support and screen reader announcement.
**Action:** When refactoring interactive cards, always ensure `onFocus` handlers match `onMouseEnter` handlers to provide visual feedback for keyboard users.
