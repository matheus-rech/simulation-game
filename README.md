# NeuroSim – Endoscopic Transsphenoidal Surgery Serious Game

**NeuroSim** is a web-based serious game designed for **neurosurgery resident training**, focusing on the **endoscopic endonasal transsphenoidal approach** to pituitary adenomas, including navigation to the sphenoid sinus, identification of the sphenoid ostium, and progressive management of cavernous sinus–related challenges.

This project is **educational only** and is **not intended for clinical decision-making**.

---

## 🎯 Educational Goals

- Teach safe **endoscopic nasal navigation**
- Reinforce **anatomical landmarks** (septum, turbinates, sphenoid ostium)
- Simulate **medial wall cavernous sinus awareness**
- Train **economy of motion** and tremor control
- Expose trainees to **complication recognition** (e.g., ICA injury)
- Provide **real-time coaching feedback** via a virtual attending surgeon

---

## 🧠 Core Features

- **Hand-tracked endoscope control** using MediaPipe Hands
- **Physics-based scope behavior** (depth, angle, rotation)
- **Collision detection** with key anatomical structures
- **Patient vitals simulation** reacting to surgical events
- **Objective-driven levels** with scoring and grading
- **AI attending surgeon panel** (stubbed, no API keys required)
- **Multi-level progression** from basic navigation to crisis management
- **Fully client-side** (no backend required)

---

## ⚙️ Fidelity Toggle Behavior

The in-app **High Fidelity** toggle controls rendering quality. By default, the
experience starts in **balanced** mode for unknown devices. Devices that
advertise higher hardware capabilities may start in high fidelity, but the
simulation will always respect the operating system’s **prefers-reduced-motion**
setting and fall back to balanced mode for reduced motion users. The endoscope
view uses this toggle to enable post-processing (Bloom/DOF/Noise) and scale
particle counts accordingly.
