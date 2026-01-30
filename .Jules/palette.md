## 2024-05-23 - Interactive Cards Accessibility
**Learning:** Interactive cards (like in `CaseSelector`) were implemented as `div`s with `onClick`, lacking keyboard accessibility and semantics.
**Action:** Convert such components to `<button>` elements with `type="button"`, reset default button styles (background, border, padding, text-align) using an inline style object like `resetButton`, and apply original styles. Use `disabled` attribute for locked states and `aria-pressed` for selection. Ensure `onFocus`/`onBlur` handlers replicate hover effects for keyboard users.
