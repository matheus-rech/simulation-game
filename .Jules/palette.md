## 2024-05-22 - Semantic Button Conversion
**Learning:** Converting complex interactive cards from `div`s to `button` elements provides immediate keyboard accessibility but requires explicit style resets (`appearance: 'none'`, `textAlign: 'left'`, `width: '100%'`) to match existing designs.
**Action:** When refactoring clickable cards with inline styles, always implement parallel `onFocus`/`onBlur` handlers to match `onMouseEnter`/`onMouseLeave` visual feedback for keyboard users.
