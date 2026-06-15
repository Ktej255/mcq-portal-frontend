# Founder Journey & Codebase Evolution Context

This document provides the historical context, founder background, educational philosophy, and technical evolution of **Sarit Classes** and the **MCQ Portal** project. It serves as a persistent context ledger for any AI assistant collaborating on this workspace.

---

## 1. Founder Profile & Background

* **Profession & Expertise**: UPSC educator with a deep background in offline/online academic training, lecture planning, classroom management, and student psychology. Former teacher at Prince Eduhub (Sikar) for 4 years/sessions, managing classes of up to 240 UPSC students simultaneously with personalized attention.
* **Academic & Technical Training**: Graduate from IIT Madras in Data Science. Invested extensively (₹20-25 Lakhs) in self-improvement during 2023–2024, acquiring deep expertise in software engineering, data science, communication, and personality development.
* **Core Philosophy**: A strong belief in **Discipline, Responsibility, and Self-Control** as the key pillars for student success and software execution alike.

---

## 2. Chronological Timeline (2019 – 2026)

### 2019–2020: The Genesis of Sarit Classes
* **Action**: Sarit Classes was founded. Focused on uploading long-form, high-intensity Geography UPSC content (ranging from 1 to 3 hours without a break in a single take).
* **Outcome**: Established teaching fluency. The content built a professional portfolio that led to teaching a 202-hour Geography Optional course in Jaipur during the COVID-19 phase, generating ₹1.5 Lakhs in initial capital.

### December 2023 – May 2025: Upskilling & Independence
* **Action**: Undertook a rigorous period of self-improvement (IIT Madras Data Science program, advanced software learning). 
* **Outcome**: Realized the immense potential of AI. Left Prince Eduhub (where salary was 18 LPA) in May 2025 to build a digital platform independently. Developed the custom website `sarithclasses.com` in 45 days.

### July 2025 – August 2025: Paid Cohorts & UPSC Batches
* **Action**: Launched webinars in late July. Got 35 registrations and enrolled the first cohort of 10 paid students. Split them into two batches:
  * **Batch 1**: High-intensity UPSC focus (level 1 fee: ₹1,000; level 2 fee: ₹30,000 one-time or ₹12,000/mo EMIs).
  * **Batch 2**: Standard UPSC focus.
* **Timeline**: Started 10-day trial on August 11, 2025. Core work officially commenced on **August 18, 2025**.

### August 2025 – November 2025: The Manual Evaluation Era
* **Action**: Executed an innovative, intensive daily mains answer writing cycle for the subjects: **GS3 ➔ GS4 ➔ GS1 ➔ GS2**. Over 500 questions were manually written, evaluated, and compiled.
* **Result**: High satisfaction but unsustainable manual workload (writing reports in 5–10 minutes, generating model answers, and tracking metrics for multiple students).

### November 2025 – March 2026: The Software Mess & Monolith Era
* **Action**: Attempted to automate the evaluation system using AI. Over time, the scope ballooned into a massive monolith containing 10+ isolated portals (Student, Teacher, Admin, Batch 2, Meditation, Graphotherapy, Sadhana, RAS, Arias).
* **Issues**: Software took longer than expected. Shifting requirements (Mains Answer Checker ➔ Prelims MCQs ➔ Polity Subject Portal with 40,000+ confused questions uploaded 6-7 times).
* **Turning Point (March 22, 2026)**: Honest discussion with students. The monolith looked visually impressive but was functionally broken and unusable. Decided to slash down the portals.

### April 2026 – Present: Monorepo Transition & Clean Slate
* **Action**: Attempted a monorepo transition, tried building a 40-day automated planner (ultimately delivered via PDF due to software bugs). Abandoned the messy, legacy codebase.
* **Outcome**: Initiated a fresh, clean-slate workspace in the **MCQ Portal** directory to implement a stable, reliable, and functional application.

---

## 3. Educational & Pedagogical Design

The software's workflow must align with the founder's proven, high-conversion teaching methodology:

### The 21-Question Subject Mastery Framework
Instead of overwhelming students with massive textbook lists, subjects (e.g., Economy, Polity) are distilled into exactly **21 comprehensive questions**. Masterfully answering these 21 questions guarantees complete coverage of the subject syllabus.

### The Mains Answer-Writing Feedback Loop
The software aims to replicate the highly effective manual cycle:
```
[20 Mins] Student Writes Initial Answer
    ↓
[60 Mins] Study Model Answer, Hidden Topics & Connecting Knowledge
    ↓
[20 Mins] Student Rewrites the Answer (Integrating Learned Knowledge)
    ↓
[10 Mins] System Evaluates & Delivers Performance Report
```
* **Hidden Topics**: Crucial areas examiners expect the candidate to address, which are not obvious from the question text itself.
* **Connecting Knowledge**: Synthesizing interdisciplinary links to make answers stand out.

---

## 4. Technical Architecture Shifts & Lessons Learned

| Technical Phase | Stack/Structure | Failure Modes / Issues | Key Takeaway |
| :--- | :--- | :--- | :--- |
| **Phase 1: Initial LMS** | Tutor LMS (WordPress) | Lacked custom evaluation flow, static content | Need bespoke logic for UPSC-style answer-writing. |
| **Phase 2: The Monolith** | Multi-portal app (10+ portals) | Scope creep, configuration drift, broken paths, 403 Forbidden errors | Build small, isolated, functional modules first. Avoid merging unrelated domains (e.g., Graphotherapy and UPSC) into one codebase. |
| **Phase 3: MCQ Uploads** | Large CSV/JSON uploads | Uploaded 40,000+ MCQs multiple times; data schema got corrupted | MCQs require deterministic indexing, clear schemas, and clean validation. |
| **Phase 4: MCQ Portal** | Next.js, FastAPI, PostgreSQL, Firebase | Active workspace: stable, modular, focused on UPSC MCQ and analytics. | **Current focus.** Build clean, robust features on this codebase. |

---

## 5. Guidelines for AI Collaboration

When starting new modules, features, or fixing bugs in this project, the AI assistant **MUST** adhere to the following principles:

1. **Reference this Context**: Always read and acknowledge the journey to understand the pedagogical context (UPSC prep, high-stakes testing, 21-question structure, and clean codebases).
2. **Prioritize Simplicity & Focus**: Do not suggest features outside the current scope. Do not try to merge meditation, graphotherapy, or other portals into the MCQ Portal unless explicitly instructed.
3. **Robust Data Import**: MCQ importing and parsing must have strict validation to avoid database corruption (which previously caused major delays).
4. **Clean Code & Strong Auth**: Focus on solid role-based access control (Admin vs Student) and eliminate routing or authentication race conditions (e.g., intermittent 403 Forbidden errors).
5. **No Placeholders**: Maintain complete functionality. Any demo content or images must be fully realized.
