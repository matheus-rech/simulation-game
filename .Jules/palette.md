## 2024-05-24 - Inline Styles and Semantic Elements
**Learning:** This project relies heavily on inline styles without a CSS reset. When converting non-semantic elements (like `div`) to semantic ones (like `button`), explicit style resets (e.g., `textAlign: 'left'`, `background: 'none'`, `width: '100%'`) are crucial to maintain the original design.
**Action:** Always verify default browser styles when swapping tags and override them explicitly in the `style` prop.
