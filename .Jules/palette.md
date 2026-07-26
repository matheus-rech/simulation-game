## 2024-05-24 - Interactive Card Accessibility
**Learning:** Replacing interactive `div` cards with `<button>` elements significantly improves accessibility by providing native keyboard support and screen reader semantics. However, it requires explicit CSS resets (textAlign, appearance, border, background) to match the original design.
**Action:** Default to `<button type="button">` for interactive cards. Apply standard reset styles (`textAlign: 'left'`, `appearance: 'none'`, `width: '100%'`, `fontFamily: 'inherit'`, `color: 'inherit'`) and map hover states to focus states for keyboard users.
