## 2025-05-18 - Clickable Cards Pattern
**Learning:** Found critical navigation components (CaseSelector) implemented as clickable `div`s with inline styles, lacking keyboard support and ARIA roles.
**Action:** Convert such cards to `<button>` elements, reset default button styles via `appearance: none`, and replicate hover effects with `onFocus`.
