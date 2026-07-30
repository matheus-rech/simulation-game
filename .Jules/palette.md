## 2025-05-18 - Accessibility of Card Buttons
**Learning:** When converting complex cards to `<button>` elements, avoid placing `aria-label` on the container if it overrides necessary child content (e.g., clinical details).
**Action:** Use visually hidden text (e.g., `<span className="sr-only">Selected: </span>`) to convey state without suppressing the button's rich content.
