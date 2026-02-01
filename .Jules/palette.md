## 2025-05-23 - Interactive Cards as Buttons
**Learning:** When converting large interactive cards from `div` to `button` for accessibility, standard button resets are crucial (`width: 100%`, `text-align: left`, `appearance: none`, `background: none`). Also, using the native `disabled` attribute on buttons automatically blocks `onClick` events, simplifying logic compared to custom `isAvailable` checks.
**Action:** Use native `<button>` elements for all card-like selections, applying specific reset styles to maintain layout while gaining keyboard accessibility for free.
