## 2024-05-22 - [Critical Missing Interaction Layer]
**Learning:** The application relied entirely on an unimplemented "hand-tracking" interface, leaving the core simulation unusable for standard users or development testing.
**Action:** When core interactions rely on specialized hardware/libraries (like MediaPipe), ALWAYS implement a fallback keyboard/mouse control scheme to ensure accessibility and testability.
