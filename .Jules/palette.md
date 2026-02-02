## 2025-05-20 - Non-semantic interactive elements
**Learning:** The application uses `div`s with `onClick` handlers for interactive elements (like `CaseSelector` cards) instead of semantic `button` elements. This requires manual handling of keyboard accessibility and role management, which was missing.
**Action:** Convert these to `<button type="button">` and use `disabled` attributes. Reset default button styles (appearance: none, text-align, etc.) to match the existing design while gaining native accessibility features.
