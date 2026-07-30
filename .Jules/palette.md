## 2025-05-23 - Inline Style Resets for Semantic Elements
**Learning:** When converting `div`s to `button`s in this inline-style heavy codebase, user agent styles (text-align, color, font, border, background) aggressively override inherited styles.
**Action:** Always apply explicit resets (`textAlign: 'left'`, `width: '100%'`, `fontFamily: 'inherit'`, `color: 'inherit'`, `background: 'none'`, `border: 'none'`) when semanticizing interactive elements to preserve the original visual design.
