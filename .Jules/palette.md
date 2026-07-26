## 2025-05-20 - Legacy Div-Buttons Pattern
**Learning:** The codebase frequently uses `div` elements with `onClick` and inline styles for interactive cards, lacking native keyboard accessibility and screen reader support. These components rely on `onMouseEnter/Leave` for visual feedback.
**Action:** When converting to semantic `<button>` elements, you must:
1. Reset native button styles (appearance: none, width: 100%, text-align: left).
2. Explicitly mirror `onMouseEnter` logic in `onFocus` and `onMouseLeave` in `onBlur` to provide equivalent keyboard feedback.
