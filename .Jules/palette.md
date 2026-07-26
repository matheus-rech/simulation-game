## 2024-05-22 - [Converted Interactive Divs to Buttons]
**Learning:** Replacing clickable `div`s with semantic `button` elements (while preserving visual styling) instantly provides keyboard accessibility (Tab, Enter/Space activation) and proper screen reader roles without needing manual `tabIndex` or `role` management.
**Action:** When creating interactive cards or list items, start with `button` and reset styles (`appearance: none`, `background: none`, `border: none`, `textAlign: left`) rather than starting with `div` and adding interactivity manually.
