# Palette's Journal

## 2026-01-24 - Converting Interactive Divs to Buttons
**Learning:** Legacy UI components (like `CaseSelector`) often use `div` elements with `onClick` for interaction, lacking keyboard accessibility (tab index, enter/space keys) and screen reader support.
**Action:** When encountering such patterns, refactor them into semantic `<button>` elements. Reset default button styles (background, border, text-align) to match the existing design, and map `onClick` to the button. This automatically provides keyboard support (`Tab`, `Enter`, `Space`) and accessibility roles. Remember to handle `disabled` states and add `aria-label` if the content is complex.
