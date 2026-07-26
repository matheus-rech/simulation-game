## 2025-05-23 - Converting Divs to Buttons with Inline Styles
**Learning:** When refactoring interactive `div`s to `<button>` elements in this project (which uses inline styles), standard button resets must be applied explicitly to the `style` prop.
**Action:** Always add `appearance: 'none', background: 'none', border: 'none', textAlign: 'left', width: '100%', fontFamily: 'inherit', color: 'inherit'` to preserve the original design while gaining accessibility.
