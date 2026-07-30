## 2026-01-26 - Semantic Buttons with Inline Styles
**Learning:** When converting `div` to `button` in this project, standard CSS resets must be applied inline (`textAlign: 'left'`, `width: '100%'`, `background: 'none'`, `border: 'none'` etc) because there is no global CSS reset.
**Action:** Always include style resets in the `style` prop when replacing non-semantic elements with buttons.
