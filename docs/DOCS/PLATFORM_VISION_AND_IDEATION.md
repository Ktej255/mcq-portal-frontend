# MCQ Portal & UPSC LMS: Platform Vision & Ideation

This document maps out the comprehensive product requirements, student journeys, pedagogical feedback loops, and standalone SaaS modules for the next generation of the platform.

---

## 1. Student Segmentations

1. **Beginner**
   * *Profile*: Completely new to the UPSC exam format, syllabus, and preparation patterns.
   * *Flow*: Forced welcoming navigation video, detailed survey/AI discussion, and mandatory 3-day induction session (syllabus overview, required reference books).
2. **Intermediate**
   * *Profile*: Completed basic coaching or self-study; understands the UPSC context but has not yet attempted the actual civil services exam.
   * *Flow*: Skippable welcome materials, micro-videos (92-second concept summaries), gap detection survey, and target-oriented concept tracking.
3. **Advanced**
   * *Profile*: Done with syllabus prep; has taken 1 or more real attempts.
   * *Flow*: Focuses on verbal communication, dynamic gap filling, high-level test reviews, and advanced mains/interview prep.

---

## 2. Onboarding & Welcoming Journey

```
[Welcome Navigation Video] (Skippable for Intermediate/Advanced)
           ↓
[AI-Guided Conversation Survey] (Language, Experience, Learning Style)
           ↓
[3-Step Self-Paced Induction Checklist] (Syllabus walkthrough & Booklists - skippable)
```

---

## 3. Pedagogical LMS Architecture

### Macro vs. Micro Planning
* **Macro-Planner (Fixed)**: Clear, rigid milestones (e.g., Geography in 30 days).
* **Micro-Planner (Dynamic)**: Manageable daily goals based on speed, yesterday's effort (e.g., if student studied 3 hours yesterday, target 3h 10m today), and daily focus levels.
* **Day 1 vs. Day 2+ Planning (AI Auto-Planning)**: On Day 1, the student determines their initial setup, reviews the orientation materials, and takes a baseline quiz to establish their baseline. From Day 2 onwards, the AI dynamically takes over and plans everything automatically, tailoring the daily goals, concept breakdown, and learning schedules based on the student's diagnosed capabilities, previous day's performance, and weak spots.

### Gamification & Visual Motivation (Points, Coins, and Badges)
* **Points/Coins Economy**: Every successful step (completing a daily task, clearing a recall gate, submitting an MCQ set, or uploading a written answer) awards coins/points. These coins can be accumulated in the student's profile and redeemed in the future for actual course materials, premium mock tests, or booking 1-to-1 live mentor calls.
* **Milestone Badges**: When students achieve high-level performance streaks (e.g., maintaining study streaks, getting a perfect score on the baseline or weekly quizzes, or clearing consecutive recall gates), the system generates visual milestone badges to provide visual motivation and document their year-long learning journey.

### Pre-Lecture Gap Identification
1. Student selects a topic (e.g., *Universe ➔ Dark Matter*).
2. **No Video is Displayed Initially**.
3. Student enters **AI Discussion Mode** and explains their current understanding of the topic (via speech-to-text or typing).
4. AI compares their answer to the master topic requirements:
   * Maps student knowledge against the UPSC syllabus benchmark.
   * Calculates the percentage gap (e.g., "Student knows 15%, 85% missing").
5. Displays a call-to-action: `"Let's Bridge the Gap"`.
6. Triggers the custom lecture video.

### In-Lecture Active Attention Monitoring
* **Interface**: Tailored for the web-first version.
* **Mechanism**: Requests standard browser camera and microphone access to monitor attention (gaze, physical posture, distraction signs, or vocal interruptions).
* **Intervention**: If distraction is detected, the video automatically pauses, and the conversational AI teacher intervenes to clear doubts or re-engage the student.

---

## 4. Evaluation, Analytics, & Retrospective Loops

### Spaced Repetition & MCQ Testing
* **UPSC MCQ Standards**: Supports 7 different UPSC-style question structures.
* **Hybrid Question Pipeline**:
  * **Founder Verified Store**: High-quality, human-curated questions checked by human assistants serve as the core dataset.
  * **AI Student-Specific Variations**: AI dynamically constructs customized test variations targeting individual weak spots, using the verified store as a structural anchor to prevent factual errors or hallucinations.
* **Weekly Schedule**:
  * **Monday to Friday**: Dynamic concept learning and gap closing.
  * **Saturday**: Comprehensive weekly evaluation test.
  * **Sunday**: Rest, review, and AI-Guided Retro.
* **Sunday AI-Guided Test Retro**: Rather than showing static text solutions, the AI launches an interactive discussion, questioning the student's choices (e.g., *"What logic did you apply to choose statement B over C?"*).
* **Retention Tracking**: Tests retention at 1-month and 6-month marks to map long-term recall.

### Non-Negotiable Mental Support & Privacy
* **Me-Time Session**: A daily space to speak out thoughts or write on paper. Solves isolation anxiety, trauma management, and emotional blocks.
* **Brain Dump & Privacy Rules**:
  * Voluntary venting logs. AI tracks stress to trigger meditation trial features.
  * **Security Guarantee**: Student logs and personal thoughts are strictly confidential. Data is never shared with third parties or external institutions.
  * **Opt-Out Control**: Students are provided with a toggle to completely opt out of personal data storage if preferred.

### Frictionless Mains Answer Uploads
* **Friction Minimization**: Simple capture-and-upload mechanism optimized for mobile users.
* **Automatic Ordering**: Uploaded pages are instantly stitched together using file/timestamp metadata and structured sequentially, minimizing steps to prevent session drop-outs.

---

## 5. Admin Panel & Standalone SaaS Ecosystem

The platform contains **13 distinct standalone/integrated modules** to be used directly or sold to corporate clients:

1. **Video Sales Letter (VSL) Funnel**: Interactive, conversational video marketing.
2. **Social Media Management**: Automated social scheduling and publishing.
3. **Ad Campaign Management**: Optimization and dashboard for marketing ads.
4. **CRM**: Customer relationship and lead management.
5. **AI Agents**: Custom conversational agents for support and teaching.
6. **LMS**: Core learning portal with customized tracking.
7. *(Operating System - Excluded for now)*
8. **1-to-1 Booking**: Session scheduling for mentorship.
9. **Webinar Management**: Direct integration for Google Meet and Zoom webinars.
10. **Finance Management**: Dual-purpose personal and business finance manager.
11. **Website Templates**: Readymade education templates.
12. **Funnel Templates**: Drag-and-drop checkout and sales paths.
13. **Micro-tool Websites**: Niche conversion tools.

---

## 6. Interactive VSL Funnel Architecture

```
[30-Sec Ad (YouTube)] ➔ [Landing Page Lead Capture]
                               ↓
                   [Interactive VSL (AI Chats)]
                               ↓
                 [₹399/mo direct payment pitch]
                               ↓
                 [Upsell / Downsell / Referrals]
```
* **AI Conversations**: Modern, lag-free text-to-speech with natural voices is utilized to hold attention during video milestones.
* **Payment Flow**: Direct ₹399/month entrance with annual upsell discounts, budget downsell triggers, and viral referral loops.

---

## 7. Interactive Onboarding & Dynamic Year-Plan Flow

To empower the student with full command of their learning path, the initial setup features an interactive onboarding flow rather than static checklist gates:

### Onboarding State & Triggers

```
[ Welcome Video ] ──(Completed)──> [ 3 Baseline Induction MCQs ]
                                                   │
                                                   ▼
[ "Let's Start the Journey" Button ] ──(Click)──> [ Screen Takeover Animation ]
                                                   │
                                                   ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                       Interactive Yearly Plan Visualizer                     │
│  - Prominently maps core domains: Gaps in:                                  │
│    Learning  ──(arrow)──> Understanding  ──(arrow)──> Personality           │
│  - Animated boxes display detailed focus areas of each audited domain.      │
└─────────────────────────────────────────────────────────────────────────────┘
                                                   │
                                                   ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        Dynamic Plan Customization Query                     │
│  - Prompt: "Which year is your first UPSC attempt?" (e.g. 2026, 2027, 2028) │
│  - Prompt: "Which month are you starting?" (e.g. September, July)            │
└─────────────────────────────────────────────────────────────────────────────┘
                                                   │
                                                   ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         Customized Calendar Generator                       │
│  - System generates a custom pace based on available months.                 │
│  - Multi-Year Pacing Guard: Slower scheduling for long targets (e.g. 2028)   │
│    to sustain interest.                                                      │
│  - 2-3 Day Buffers: Automatically inserted after every subject block to      │
│    accommodate health, family, and personal responsibilities.                │
└─────────────────────────────────────────────────────────────────────────────┘
                                                   │
                                                   ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                      Subject-wise Plan Pacing Sequence                      │
│  - Clicking a subject card pulls up its explanation:                        │
│    - Duration card (e.g. "Geography: 30 days")                              │
│    - Written justification explaining "Why this subject is picked first"     │
└─────────────────────────────────────────────────────────────────────────────┘
                                                   │
                                                   ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           Joyful Completion Screen                          │
│  - Splash screen with positive triggers: "Congratulations! You have completed│
│    the first step. Let's start the UPSC journey!"                           │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 8. Detailed Study-Recall-Gap-Fill Loop (Intermediate Flow)

Intermediate students require active recall gates and structured gap-filling. The topic study loop is strictly linear and interactive:

### 8.1 Entry & Selection
1. **Subject Landing Page:** Student opens the subject space (e.g., Geography).
2. **Major Topic Index:** Displays the primary topics (e.g., *Universe*).
3. **Subtopic Dropdowns:** Clicking the main topic slides open an accordion dropdown of subtopics (e.g. *Part 1: Definitions*, *Part 2: Historical Models*, *Part 3: Big Bang*, etc.).
4. **Select Subtopic:** Clicking a subtopic locks the focus state and opens the active recall canvas.

### 8.2 Speech Active Recall & Gap Detection
1. **Speech Recall Canvas:** Displays a minimalist dark canvas with a glowing pulsing microphone icon in the center.
2. **Active Speech Capture:** Student clicks the mic and speaks their explanation of the subtopic. Spoken words are transcribed in real-time on screen.
3. **AI Evaluation Gate:** Once submitted (or when they hit Enter), the system queries `/api/upsc/teacher/discuss` to evaluate the explanation against the **Master Content Reference** (specific definitions of the subtopic).
4. **Results Comparison:** Displays two columns showing what was successfully recalled (highlighted in green) and the concept gaps (highlighted in red/amber).
5. **Bridge Action:** A prominent button invites them to `"Fill the Gap"`.

### 8.3 Step-by-Step Interactive Gap Filling
1. **Sensory Fragmented Slides:** Clicking "Fill the Gap" opens the Slide PPT deck showing **only the gap slides**.
2. **Fragmented Reveal:** To avoid cognitive overload and engage multiple senses:
   - Slide text is hidden initially.
   - Student clicks the slide to reveal the first half of the explanation.
   - Student clicks again to reveal the next segment and associated maps/diagrams.
3. **Slide Spoken Reinforcement:** 
   - When the slide contents are fully revealed and read, the student cannot simply click "Next".
   - The student must **speak back** a quick explanation of the slide content they just read.
   - The microphone captures and evaluates this local recall.
4. **Visual Validation Progress Bar:**
   - On completing a slide's spoken reinforcement, a progress bar animates: `"You have filled 12% of the gap"`.
   - Displays time-to-mastery statistics (e.g. "3 minutes spent ➔ 10% gap closed").
5. **Funnel Progression:** This continues slide-by-slide until the target subtopic gap is fully closed.

### 8.4 Evaluation & Completion Reports
1. **Subtopic MCQs:** Once the gap is closed, the student is presented with mock questions specific to the subtopic in a clean multi-statement format.
2. **Comprehensive Report:** Submitting the test generates an overall report showing their progression:
   $$\text{Session Start (e.g. 10\% Command)} \longrightarrow \text{Session End (e.g. 75\% Command)}$$
   Displays a summary of time invested, keywords matched, and the active command level.
3. **Social Media-Style Addiction Scroll:** Upon closing the report, the page automatically slides to the next queued subtopic, creating a low-friction "auto-scroll" study hook.

---

## 9. Behavioral Tracking & Voice Interruption Rules

To prevent background voice monitoring from becoming a barrier or distraction, specific behavioral heuristics are applied:

1. **Ignore Short Sounds:** Any voice activity or ambient noise lasting less than 12 seconds is automatically ignored (filtered out as normal sighs, coughs, or brief interruptions).
2. **Conversation Trigger:** The "Ask AI Teacher" popup is only triggered if sustained voice activity is detected for **more than 15-30 seconds**.
3. **Sentiment & Frustration Tracking:**
   - If the popup is dismissed repeatedly or the student speaks with high speed or stressed vocal tone, the system tags the state as `"Frustrated"`.
   - The AI automatically backs off, reduces the frequency of checkpoints, and displays a comforting micro-message.
   - All emotional responses and sentiment markers are logged silently to refine future coach prompts.

---

## 10. Master Topic Reference: Universe Module

The master hierarchical syllabus content used by the AI to evaluate student recall and target gap-repair slides:

### Part 1: INTRODUCTION & DEFINITION
1. Definition of Universe
2. Vastness and Scale of Universe
3. Universe vs Cosmos - Distinction
4. Expansion of Universe (Ongoing Research)
5. Unknown Limits and Boundaries

### Part 2: HISTORICAL VIEWS & EVOLUTION OF THOUGHT
#### 2.1 Ancient Perspectives
6. Geocentric Model (Earth-centered)
   - Ptolemy's Model
   - Historical acceptance
7. Heliocentric Model (Sun-centered)
   - Aristarchus (First proposer - 270 BC)
   - Copernicus (Heliocentric Revolution - 1543)
   - Galileo's Evidence (Telescopic observations)
#### 2.2 Modern Understanding
8. Current Heliocentric-Centric Model
9. Evolution of Cosmological Models

### Part 3: ORIGIN OF UNIVERSE
#### 3.1 Big Bang Theory (Foundation)
10. What is Big Bang?
11. Timeline: Universe began ~13.8 billion years ago
12. Singularity Concept (Infinite density, infinite mass, zero volume)
13. The Explosion and Expansion
#### 3.2 Evidence Supporting Big Bang
14. Hubble's Law & Red-Shift ( Edwin Hubble 1929, redshift/blueshift wavelength changes)
15. Cosmic Microwave Background Radiation (CMBR) (Discovery 1965 by Penzias & Wilson, leftover Big Bang heat)
16. Abundance of Light Elements (Hydrogen and Helium distribution, nucleosynthesis)
17. Galaxy Distribution and Formation Patterns
#### 3.3 Alternative & Emerging Theories
18. Steady State Theory (Outdated, continuous creation)
19. Oscillating Universe Theory
20. Multiverse Theory

### Part 4: STRUCTURE OF UNIVERSE
#### 4.1 Largest Scale Organization
21. Observable Universe vs Entire Universe
22. Galaxy Clusters, Superclusters, Cosmic Web, Voids
#### 4.2 Dark Matter & Dark Energy
23. Dark Matter (27% of universe composition, gravitational detection)
24. Dark Energy (68% of universe composition, accelerating expansion, cosmological constant)
#### 4.3 Composition of Universe
25. Ordinary Matter (Baryonic) vs Non-baryonic Matter

### Part 5: GALAXIES
#### 5.1 Galaxy Classification
26. Spiral Galaxies (Disk-shape, spiral arms, Milky Way, Andromeda)
27. Elliptical Galaxies (Old stars, less gas, most abundant type)
28. Irregular Galaxies
#### 5.2 Famous Galaxies
29. Andromeda Galaxy (Nearest major neighbor, future merger in 4.5 billion years)
30. Triangulum, Sombrero, Whirlpool Galaxies

### Part 6: MILKY WAY (OUR GALAXY)
31. Definition and Composition (Gas, dust, 100-400 billion stars)
32. Size: ~100,000 light-years across; Age: ~13.6 billion years
33. Structure: Sagittarius A* (central supermassive black hole), bulge, disc, halo
34. Sun's Position: Orion Arm, ~26,000 light-years from center, orbital period of 225-250 million years (Galactic year)

### Part 7: STARS
#### 7.1 Properties & Life Cycle
35. Definition, spectral classification (O, B, A, F, G, K, M), color-temperature (blue is hottest, red is coolest)
36. Hertzsprung-Russell (HR) Diagram
37. Life cycle of low-mass stars: Nebula ➔ Protostar ➔ Main Sequence ➔ Red Giant ➔ White Dwarf ➔ Black Dwarf
38. Life cycle of massive stars: Red Supergiant ➔ Supernova ➔ Neutron Star (Pulsars) or Black Hole (Event Horizon, Singularity)

### Part 8: CONSTELLATIONS
39. Definition, reconocimiento of 88 constellations, zodiac, navigational use
40. Famous examples: Ursa Major, Ursa Minor, Orion, Leo

### Part 9: THE SUN (OUR STAR)
41. Age: ~5 billion years, mass: 1 solar mass
42. Internal Structure: Core (15m °C, fusion), Radiative zone, Convective zone
43. Atmosphere: Photosphere (5,500°C surface), Chromosphere, Transition region, Corona (1-3m °C)
44. Phenomena: Sunspots (11-year cycle), Solar flares, Coronal Mass Ejections (CMEs), Solar wind, Prominences
45. Space Weather (2026 Current Affairs): Auroras, geomagnetic storms, satellite and power grid disruptions

### Part 10: SOLAR SYSTEM
46. Origin Theories: Gaseous Hypothesis (Kant), Nebular Hypothesis (Laplace), Planetesimal Hypothesis (Chamberlin), Modern disc accretion
47. Division: Inner planets (Rocky: Mercury, Venus, Earth, Mars), Asteroid Belt (Ceres), Outer planets (Jovian: Jupiter, Saturn, Uranus, Neptune)

### Part 11: PLANETS DETAILED STUDY
48. Mercury (88-day revolution, extreme temp, BepiColombo)
49. Venus (retrograde rotation, runaway greenhouse, phosphine search)
50. Earth (axial tilt 23.5°, Milankovitch cycles)
51. Mars (thin atmosphere, subsurface ice, Perseverance operations)
52. Jupiter (Ganymede, Europa ocean potential, JUICE mission)
53. Saturn (major rings, Titan methane lakes, Enceladus geysers)
54. Uranus (98° tilt on side, ice giant)
55. Neptune (Triton retrograde orbit, ice giant)

### Part 12: DWARF PLANETS & DEEP REGIONS
56. Definition, Pluto (reclassified 2006, Charon, New Horizons), Eris, Haumea, Makemake
57. Ceres (Asteroid belt dwarf)
58. Kuiper Belt & Oort Cloud cometary reservoir

### Part 13: ASTEROIDS
59. Composition, Main Belt, Near-Earth Asteroids (NEAs)
60. Notable: Vesta, Eros, Bennu (OSIRIS-REx), Apophis (2029 close approach), Psyche (metallic)

### Part 14: COMETS
61. Composition (ice, dust), elliptical orbits, tails pointing away from Sun
62. Famous: Halley's (75-76 years), Hale-Bopp, NEOWISE

### Part 15: METEORS, METEOROIDS & METEORITES
63. Definitions (in space, in atmosphere, on ground), meteor showers (Perseids, Geminids)
64. Stony, stony-iron, and iron meteorites

### Part 16: EXOPLANETS & HABITABLE ZONES
65. Detection (transit, radial velocity), Hot Jupiters, Super-Earths
66. Goldilocks Zone (circumstellar habitable zone), TRAPPIST-1, Proxima Centauri b

### Part 17: SPACE EXPLORATION & CURRENT AFFAIRS (2026)
67. NASA Artemis lunar return, Mars Sample Return
68. ESA JUICE (Jupiter), Euclid (dark matter)
69. ISRO Aditya-L1, Gaganyaan, Chandrayaan-4 planning
70. Private Spaceflight (SpaceX Starship, Starlink)

### Part 18: GRAVITATIONAL WAVES & BLACK HOLES
71. Gravitational waves (LIGO/Virgo, spacetime ripples)
72. Black holes: Event Horizon, Accretion disk, imaging (M87*, Sgr A* via EHT)

---

## 11. Gamification & Points Economy

To keep students motivated through the long and intense UPSC preparation timeline, the platform features a persistent XP/Points and Coins economy coupled with custom achievement badges:

### 11.1 Economy Rules
- **XP (Experience Points)**: Reflects cumulative learning effort. Earned points level up the student's profile.
- **Coins**: Redeemed for virtual/physical resources (mentorship, mock papers, optional check sheets).
- **Core Activity Earnings**:
  - `onboarding`: Completed custom roadmapping — **+100 XP, +20 Coins** (Unlocks: `"First Steps"` badge).
  - `recall-clear`: Passed an AI Teacher active speech recall gate — **+50 XP, +10 Coins** (Unlocks: `"Feynman Apprentice"` badge).
  - `mcq-complete`: Completed a fresh MCQ practice set — **+40 XP, +8 Coins**.
  - `perfect-score`: Completed an MCQ practice set with 100% correct answers — **+100 XP, +20 Coins** (Unlocks: `"Trap Dodger"` badge).
  - `retro-complete`: Completed the Sunday AI-Guided Retrospective — **+80 XP, +15 Coins** (Unlocks: `"Insight Builder"` badge).
  - `streak-3`: Maintained a 3-day active recall streak — **+150 XP, +30 Coins** (Unlocks: `"Consistent Catalyst"` badge).
  - `streak-7`: Maintained a 7-day active recall streak — **+400 XP, +80 Coins** (Unlocks: `"Grit Commander"` badge).

### 11.2 Milestone Badges UX
Earned achievements are saved in the `StudentProfile` model. Unlocks trigger a celebratory full-screen overlay or animated bottom-right toast message. Coins and XP are displayed prominently in the global navigation header.

---

## 12. Progressive Gap-Fill Meter & Fragmented Reveal UX

 Pedagogical research shows that showing a wall of text causes instant cognitive fatigue. To address this, our watch and repair rooms present information incrementally:

### 12.1 Segmented Click Reveal
1. **Initial State**: The slide appears with text blurred or blanked out.
2. **First Click**: Reveals the core thesis statement or heading segment.
3. **Second Click**: Reveals the supporting bullets, cause-effect chains, and maps.
4. **Interactive Validation**: The student cannot move to the next slide without speaking back the concepts.

### 12.2 Progressive Gap-Fill Meter
A dynamic visual progress bar at the bottom of the slide viewer calculates:
$$\text{Gap Closed \%} = \frac{\text{Current Recalled Concepts}}{\text{Expected Recall Points}} \times 100$$
The meter animates in real-time as the student clicks through segments, speaks, and completes local slide validations, providing immediate reinforcement.

---

## 13. Multi-Year Pacing Guard Algorithm

Students preparing for different target attempt years (e.g., 2026 vs 2028) have completely different pacing needs:

### 13.1 Calendar Customization
- **Multiplier**:
  - `2026`: 6 months or less available. Multiplier = **0.6x** study days (Fast-paced crash course).
  - `2027`: 12 months available. Multiplier = **1.0x** study days (Standard curriculum speed).
  - `2028+`: 24 months available. Multiplier = **2.0x** study days (Sustained interest pacing).
- **Dynamic Buffer Insertion**:
  - `2026`: **1 day** of buffer after each subject block.
  - `2027`: **2 days** of buffer after each subject block.
  - `2028+`: **4 days** of buffer after each subject block to prevent early preparation burnout.

### 13.2 Sequence Justifications
Dynamic sequence engine matches duration, buffers, and start months to output structured study windows (e.g. Geography in June, Environment in July), displaying them as interactive nodes on the student's dashboard timeline.

---

## 14. Auto-Scroll Study Addiction Hook

To keep students in flow state and remove navigation friction:
1. When the student completes a subtopic evaluation (MCQ or speech recall), the system compiles and displays the **Daily Command Report**.
2. Clicking "Next Topic" or closing the report triggers a smooth, automated slide scroll effect.
3. The viewport automatically transitions to the next queued subtopic in the syllabus path.
4. If a revision item is due, the view shifts to the revision dashboard, prompting immediate spaced retrieval.


---

## 15. Daily Mission Control — Authoritative Student Walkthrough (Founder Brain Dump, 2026-06-15)

> This section consolidates and supersedes the scattered onboarding/loop notes above into a single, ordered, end-to-end spec for the **UPSC Daily Mission Control** experience. The guiding principle is **"command in the student's hand"**: the student drives every step by tapping/clicking; the system reacts. On mobile, taps; on desktop, clicks. The current brain dump is written for the **Intermediate** segment (the reference segment for the pilot).

### 15.1 Guiding Principle
The student is always in command. Nothing auto-plays the plan *at* the student — the student taps to reveal the next box, the next domain, the next subject. Every action returns a *visible* result.

### 15.2 Sequence Overview
```
Welcome Video (done)
  -> 3-Step Induction (done)
    -> Subject brief + 3 BASELINE MCQs  [MUST become dynamic, not static]
      -> "Let's Start the Journey" button
        -> Full-screen takeover animation
          -> Interactive Yearly Plan Visualizer (tap box -> arrow -> next box)
            -> Domains shown: Content -> Communication -> Personality   [PENDING: confirm domain names]
              -> "Which year is your first attempt?" (2026 / 2027 / 2028)
              -> "Which month are you starting?" (e.g. Sept / July)
                -> Background: customized plan generated (pace + 2-3 day buffers after each subject)
                  -> Subject sequence cards (tap each): duration + WRITTEN justification "why this subject first"
                    -> Joyful Completion screen (adaptive, student-tuned wording)
                      -> Enter first subject
```

### 15.3 Post-Induction Brief + Baseline MCQs
- After induction, the student receives a **short brief** on the subject/sector.
- Then **3 baseline MCQs**. **Current state: these are static and must be reworked.** Baseline MCQs should be drawn dynamically based on the student's declared level and target year so the baseline is *measured*, not decorative. (See PENDING DECISION #2 on dynamic strategy: verified-bank selection vs AI generation.)

### 15.4 "Let's Start the Journey" -> Screen Takeover -> Yearly Plan Visualizer
- A prominent **"Let's Start the Journey"** button triggers a **full-screen takeover animation** (coded, not video).
- The takeover opens the **Interactive Yearly Plan Visualizer**: animated boxes connected by animated arrows. The student **taps a box, an arrow animates, the next box appears**. (Implementation may be a simple box->arrow->box reveal, or a more creative spatial/timeline visualization — designer's discretion, but it must feel premium and student-driven.)
- The visualizer communicates the three audit domains we coach toward the UPSC goal: **Content -> Communication -> Personality** (i.e., gaps in *learning*, *understanding*, and *personality*). Messaging: "Here is where we will check and close your gaps to reach your UPSC goal."

### 15.5 Dynamic Plan Generation (Year + Month Driven)
- The visualizer asks: **first-attempt year** (2026/2027/2028) and **start month**.
- In the background the system generates a **customized calendar**: how much time to devote and when, scaled by months available (see Section 13 Pacing Guard).
- **Buffers are mandatory**: 2-3 days after every subject block. Rationale: the longer the runway (e.g., 2026 student targeting 2028), the lower the adherence; buffers absorb health issues, family functions, and other responsibilities, keeping the student on-plan.

### 15.6 Subject Sequence Cards
- The student taps through subject cards **step by step**. Each card shows: **subject name + duration** (e.g., "Geography: 30 days").
- Tapping a card reveals a short **written justification** (video later; written content for now) explaining **why this subject is sequenced first/next**, tuned to the months available for *that* student.
- This sequence is **highly dynamic** and student-specific. On submit, the student's choices update their plan and are highlighted.

### 15.7 Joyful Completion
- A **celebratory, joyful-color completion screen**: "You've completed the first step of your journey — let's start the UPSC journey!"
- Psychological wording is **adaptive, not fixed** — tuned by student interaction, not hardcoded.

### 15.8 Subject Room -> Topic -> Subtopic (Intermediate Loop)
1. Student enters the subject and sees all **major topics** (e.g., *Universe*).
2. Tapping a major topic opens an **accordion dropdown** of **subtopics**.
3. Tapping a subtopic opens a **focus window (pop-up)** containing the **active-recall canvas**.

### 15.9 Speak-First Gap Detection
- The recall canvas shows a **microphone**. The student **speaks** their understanding; speech is transcribed live.
- On submit, the AI **evaluates the explanation against the Master Content** for that subtopic and computes the **gap**.
  - **Dependency:** Master Content does not yet exist as gradable content (only a topic list). The master-content ingestion system must be built. See `MASTER_CONTENT_GEOGRAPHY_UNIVERSE.md` for the seeded Universe topic hierarchy (460+ nodes).
- A **"Fill the Gap"** (Bridge the Gap) button appears.

### 15.10 Fragmented Reveal Repair (Multi-Sensory)
- "Fill the Gap" opens a **slide/PPT-like deck of only the gap concepts**.
- **Content is never dumped at once** (multi-sensory engagement): the student taps to reveal the **first half**, then the next portion, then the next — until the slide is complete.
- The student then taps **Next**, and on the next slide must **speak back** what they just learned. The speak-back is captured and evaluated.
- A **visual validation progress bar** animates: "You spent 3 minutes -> 10% gap closed." Effort must always produce a visible result.
- This repeats slide-by-slide until the subtopic gap is fully closed.

### 15.11 Subtopic MCQs + Progression Report
- On closing the gap, the student gets **subtopic-specific MCQs** (e.g., Dark Matter, 2026-aligned).
- **MCQ format is strict**: multi-statement items must use proper multi-statement layout (numbered statements + "How many are correct?" style), **never a paragraph blob**.
- On submit, a **report** is generated showing not just MCQ results but the **command progression**: e.g., "30 minutes ago you were at 10% -> now you are at 60-70% on this topic."

### 15.12 Addictive Auto-Scroll to Next Subtopic
- Modeled on social-media infinite scroll, but for study: closing the report **auto-scrolls** the student straight into the **next queued subtopic**, removing navigation friction and building a daily study habit/flow state. Over time this conditions the study reflex.

### 15.13 Behavioral Safety Rules for the AI Pop-Up (Critical — must not backfire)
The "Ask AI Teacher" intervention pop-up is a **feature, not a disruption**. It must never become a barrier:
- **Ignore short audio**: voice/ambient activity under ~12 seconds is ignored (coughs, sighs, brief talk).
- **Trigger window**: only sustained voice activity of roughly **15-30 seconds** triggers the intervention.
- **Emotion/frustration tracking**: when the pop-up appears, detect whether the student is **frustrated** (repeated dismissals, high speech rate, stressed tone). On frustration, the AI **backs off**, reduces checkpoint frequency, and shows a comforting micro-message.
- **Silent behavioral logging**: the triggering words and emotional markers are logged silently (behavioral profile) to refine future coaching. This is a behavioral-data feature and must be treated as privacy-sensitive (see Me-Time opt-out rules).

### 15.14 Pricing (Reconciliation Note)
The implemented product now uses a **4-tier model** — Foundation ₹399, Plus ₹699, Pro ₹999, Ultimate ₹1299/mo — with compounding annual discounts (15% / 25% / 35% for 1/2/3 years), defaulting new students to **Foundation**. This supersedes the single ₹399 plan in Section 6 *if confirmed* (see PENDING DECISION #7).

---

## 16. Pending Decisions (Open — do NOT implement assumptions until resolved)

1. ~~**Segments — 3 or 4?**~~ **RESOLVED (2026-06-15):** There are exactly **3 learner LEVELS** — Beginner / Intermediate / Advanced — and **4 PRICING TIERS** — Foundation / Plus / Pro / Ultimate. The "4" referred to pricing, not learner segments.
2. **Baseline MCQ dynamism** — verified-bank selection (recommended for a measurable baseline) vs AI generation.
3. **Master Content authoring** — build ingestion system for human-authored content vs AI-drafted-then-verified content. The 460-topic Universe list is a table of contents, not gradable content.
4. **AI cost/latency ceiling** — target cost-per-student-per-month for the multi-call speak/grade/repair/speak-back loop; caching + model-tier strategy.
5. **Camera attention monitoring** — defer to voice/idle signals for pilot (recommended) vs build camera gaze now.
6. **Domain naming** — "Content -> Communication -> Personality" (latest) vs "Learning -> Understanding -> Personality" (Section 7). Lock one.
7. ~~**Pricing canonical**~~ **RESOLVED (2026-06-15):** The **4-tier model is canonical** — Foundation ₹399 / Plus ₹699 / Pro ₹999 / Ultimate ₹1299 per month, with compounding annual discounts (15% / 25% / 35% for 1 / 2 / 3 years), defaulting new students to Foundation. This supersedes the single ₹399 plan in Section 6.
