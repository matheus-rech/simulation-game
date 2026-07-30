## 2025-02-12 - Case Selector Accessibility
**Learning:** The case selection screen used `div` elements with `onClick` handlers for case cards, making them inaccessible to keyboard and screen reader users. The "locked" state was purely visual.
**Action:** Converted case cards to `<button>` elements with `type="button"`. Used `aria-pressed` to indicate selection and `disabled` attribute for locked cases. Implemented visible focus states using `onFocus`/`onBlur` to match hover styles. In future, always use interactive elements for selection grids.
