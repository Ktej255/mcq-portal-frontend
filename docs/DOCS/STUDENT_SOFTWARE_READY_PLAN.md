# Student Software Ready Plan: Step-by-Step Implementation Roadmap

This document outlines the step-by-step development roadmap to bring the student-facing portion of the MCQ Portal & UPSC LMS to **100% readiness**. It focuses on minimal user resistance, dynamic AI features, and clean, minimalist visual design.

---

## 🎯 Active Development Targets
1. **Student Portal Refinement**: Polishing existing logic, onboarding workflows, dynamic check rooms, and feedback interfaces cleanly (non-destructively).
2. **VSL Funnel Execution**: Fully completing the interactive, conversational Video Sales Letter funnel (lead capture, interactive AI overlays with high-quality natural voices, ₹399/mo payment pitch, and upsell/downsell redirects).

---

## 🎨 Core Design Directive
* **Minimalist UI**: Reduce overwhelming textual clutter. Keep layout structures lightweight by avoiding complex nested boxes or hardware-heavy glassmorphism blurs which scale poorly. Stick to the existing **Organic Warm Academic Theme** (warm cream backgrounds like `#f7f4ee`, crisp forest green text `#13251d`, and clean paper-white cards with thin `#dcd5c7` borders). Use simple accordion disclosures, tooltips, or clean side drawers for advanced/supplementary insights.
* **Frictionless Action**: Maintain a singular "Main Action" button on the dashboard that guides the student dynamically without page-juggling.
* **Non-Destructive Refinement Principle**: **Do not rewrite existing codebases from scratch.** Approximately 90% of the logic (such as dynamic scheduling engines in `DailyWorkspace.tsx` and speech-to-text components in `SubjectTalkRoom.tsx` / `GeographyTalkRoom.tsx`) is already built. Future agents must refine, connect, and polish these existing features to make them seamless, utilizing a destructive rewrite only as a last resort.

---

## 🛠️ Step-by-Step Development Roadmap

### Phase 1: Onboarding & 3-Step Self-Paced Induction Flow
* **Goal**: Provide baseline syllabus and material alignment without forcing calendar delays.
* **Step 1.1**: Build a Welcome Screen Overlay with navigation video and a prominent `Skip` toggle.
* **Step 1.2**: Implement the **3-Step Induction Checklist** (representing Syllabus Walkthrough, Reference Booklist, and Baseline Quiz). Allow the student to complete all 3 steps in a single day (self-paced checklist format) or skip immediately to the main tracks.
* **Step 1.3**: Link completion of the checklist or skip action to unlock and activate the dashboard's main study track button.


### Phase 2: In-Lecture Attention Monitoring & Active Pausing
* **Goal**: Prevent passive video watching and keep students focused.
* **Step 2.1**: Implement browser webcam permission requests inside `SubjectWatchRoom.tsx` and `GeographyWatchRoom.tsx`.
* **Step 2.2**: Integrate a lightweight, web-compatible attention model (e.g. eye-gaze offscreen check or face-away detection).
* **Step 2.3**: Build the **AI Intervention Overlay**:
  * If the student looks away or speaks to someone, pause the video.
  * Trigger a sliding drawer with the AI Teacher asking: *"I noticed you were away. Do you have a question about this segment, or should we resume?"*
* **Step 2.4**: Create a **Micro-Checkpoint Fallback**: If a student denies camera access, the video pauses at natural 5-minute intervals to ask a quick, single-click concept check.

### Phase 3: Sunday AI-Guided MCQ Retrospective Room
* **Goal**: Replace static test explanations with interactive mental framing.
* **Step 3.1**: Create a dedicated **Sunday Retro Room UI** (`SubjectRetroRoom.tsx`).
* **Step 3.2**: Implement the AI conversation agent that walks through the Saturday test questions:
  * Instead of showing the answer, the AI prompts the student: *"For question #4, you selected statement B over C. What was the underlying logic or neural connection you made?"*
  * The student responds verbally or by typing, and the AI guides them to correct the mental frame.
* **Step 3.3**: Save these behavioral reasoning patterns to the student profile in the database.

### Phase 4: Frictionless Mobile Mains Answer Upload
* **Goal**: Make writing evaluations fast and painless on mobile screens.
* **Step 4.1**: Build a mobile-optimized camera capture interface.
* **Step 4.2**: Implement **Auto-Stitching & Ordering**:
  * As the student takes snapshots, use image metadata (timestamp/filename) to automatically arrange pages sequentially.
  * Present a quick horizontal thumbnail ribbon so they can see "Page 1", "Page 2" and upload in a single tap (minimum clicks).
* **Step 4.3**: Connect to the backend PDF assembler for OCR and evaluation layout overlays.

### Phase 5: Brain Dump Notepad & Stress Alerts
* **Goal**: Provide mental relief and customized platform trials.
* **Step 5.1**: Place a **"Brain Dump" Button** floating on the dashboard.
* **Step 5.2**: Build a minimalist modal where students can type or talk freely to vent isolation, anxiety, or goals.
* **Step 5.3**: Implement backend text analysis to check stress levels. If stress flags spike:
  * Generate a supportive AI message.
  * Offer a **1-Month Free Trial** for the Meditation/Graphotherapy portal.

### Phase 6: Dynamic MCQ Variation Engine
* **Goal**: Create infinite, targeted practicing options while preserving facts.
* **Step 6.1**: Establish the **Verified Master Store** populated with your human-checked core questions.
* **Step 6.2**: Configure the backend dynamic builder (`attempts.py`/`tests.py`) to generate student-specific question variants:
  * Only modify option choices, negative wording (e.g., changing "correct" to "incorrect"), or context parameters.
  * Prevent the AI from generating factual data from scratch.
