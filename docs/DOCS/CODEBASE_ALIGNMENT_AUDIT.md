# MCQ Portal & UPSC LMS: Codebase Alignment Audit

This document tracks the audit of the existing Next.js frontend, FastAPI backend, and Supabase database schemas compared against the founder's vision.

---

## 📊 Alignment Rating: **52%**
The baseline system is exceptionally strong in core pedagogical workflows (dynamic dashboard planning, voice-based AI talk rooms, and standard quiz engines) but requires implementation of advanced AI triggers, document handling, and adjacent business tools.

---

## ✅ 1. Aligning Components (Fully/Partially Built)

### A. Pedagogy & Student Flows
* **Stage Classification**: `DailyWorkspace.tsx` successfully reads student profiles and segments users:
  * `not-started` ➔ **Beginner**: Forced video lesson, then Talk to 95%, then MCQ.
  * `coaching-complete` ➔ **Intermediate**: Check knowledge first, repair missing gaps, then MCQ.
  * `multiple-attempts` ➔ **Advanced**: Gap diagnosis, precision repair, MCQ.
* **AI Discussion Check (Talk to 95%)**: Both `SubjectTalkRoom.tsx` and `GeographyTalkRoom.tsx` are equipped with voice transcription hooks (`navigator.mediaDevices.getUserMedia` for audio recording) allowing students to discuss conceptual topics before and after lectures.
* **Syllabus & Planner Calendar**: Static calendars map out the 200+ day macro schedule across Geography, History, Economy, and Science & Tech subjects.
* **Daily Start Check (Me-Time)**: Built into the workspace dashboard as a mood selector, providing tailored reset strategies based on stress or fatigue.
* **Spaced Repetition Scheduler**: Configured via database models (`revision_queues`) and backend APIs (`revision.py`) to trigger automatic concept revisions.

### B. Marketing & Sales Backbone
* **VSL Funnel Base**: Includes PostgreSQL tables for funnels, pages, templates, sessions, and leads.
* **Interactive Player Hook**: The frontend features a custom video player (`VSLPlayer.tsx`) connected to an AI chat widget (`AIChat.tsx`) that activates automatically when the student crosses the video watch threshold.

---

## ⚠️ 2. Not Aligning (Requires Refactoring)

* **Static Test Explanations**: Currently, MCQ test reviews only display flat explanation strings. Needs transition to the interactive Sunday AI review room where the AI questions the student's choices.
* **Static MCQ Pipeline**: The system imports static CSV files for quiz questions. Needs adaptation to generate student-specific question variants dynamically from the human-verified question repository.
* **Funnel Checkouts**: Lead capture is implemented, but the direct payment funnel (₹399/mo entry with upsells/downsells) is not integrated on the client side.

---

## ❌ 3. Missing Components (To Be Built)

* **In-Lecture Attention Tracking**: No video-based gaze detection or webcam attentiveness verification is written in the watch room components.
* **Mains Multi-Page Upload**: Missing a mobile-responsive camera capture and automatic image stitching interface.
* **Brain Dump & Mood Alerts**: No venting notepad or backend text analysis exists to auto-trigger the meditation trials.
* **3-Day Induction Program**: Onboarding currently skips the formal booklist/syllabus overview stage.
* **Standalone Business SaaS Suite**: 12 of the 13 listed modules (such as the Personal & Business Finance management tool, Webinar controllers, and CRM panels) do not have code files or active components.
