## 2024-05-22 - Inline Styles & Focus Management
**Learning:** The project relies heavily on inline JS styles, which makes implementing standard CSS pseudo-classes (like `:focus-visible` or `:hover`) difficult without external stylesheets. This forces manual state management (e.g., `useState` for `isHovered`/`isFocused`) for basic interactive feedback.
**Action:** When adding new interactive components in this codebase, assume manual event handlers (`onMouseEnter`, `onFocus`, etc.) are necessary to provide accessible visual feedback, rather than relying on CSS classes.
