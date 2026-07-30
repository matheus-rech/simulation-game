## 2024-05-21 - Semantic Buttons for Interactive Cards
**Learning:** Interactive "card" components were implemented as `div`s, lacking keyboard accessibility.
**Action:** Convert these to `<button>` elements. Ensure `type="button"`, `aria-pressed` for selection states, and replicate visual states (hover/focus) using `onFocus`/`onBlur` if inline styles are used. Avoid `aria-label` on the container if it contains readable text; let the content speak for itself.
