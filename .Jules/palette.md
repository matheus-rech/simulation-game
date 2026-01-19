## 2025-10-26 - Accessible Keyboard Shortcuts
**Learning:** Adding `aria-keyshortcuts` alongside visual `<kbd>` hints provides a robust accessible experience for power users.
**Action:** When adding shortcuts, always include:
1. A visual indicator (e.g., `<kbd>L</kbd>`)
2. `aria-keyshortcuts="Key"` on the interactive element
3. A `title` attribute explaining the shortcut for mouse hover users.
