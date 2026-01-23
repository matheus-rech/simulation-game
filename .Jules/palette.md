## 2025-05-25 - [Inline Styles & Accessibility]
**Learning:** This repo relies heavily on inline styles, which complicates pseudo-classes (:hover, :focus). However, replacing div-based interactive elements with semantic <button> elements works well with inline styles if you manually manage focus/hover states or use CSS-in-JS patterns.
**Action:** When encountering non-accessible interactive divs, refactor into small sub-components (e.g., CaseCard) that use native <button> elements and manage visual state internally, ensuring both accessibility and design fidelity.
