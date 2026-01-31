## 2025-05-23 - [CaseSelector Accessibility]
**Learning:** The project uses `div`s with inline styles for interactive cards, lacking accessibility. Converting to `<button>` requires explicit style resets (`appearance: none`, `background: none`, etc.) to match the existing design without breaking layout, especially with flex/grid containers.
**Action:** Always wrap interactive cards in `<button type="button">` with reset styles and `aria-pressed` for selection states. Ensure text contrast on badges meets WCAG AA (4.5:1) - original colors failed.
