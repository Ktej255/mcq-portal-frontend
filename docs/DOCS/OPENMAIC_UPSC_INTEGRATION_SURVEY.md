# OpenMAIC to UPSC Portal Integration Survey

Date: 2026-05-22
Target system: MCQ Portal / UPSC Geography local module
Reference: https://github.com/THU-MAIC/OpenMAIC

## Executive Decision

OpenMAIC should be used as an architecture reference and optional sidecar classroom engine, not copied directly into the UPSC portal at this stage.

Reason: OpenMAIC is licensed under AGPL-3.0. Direct code integration into a commercial or closed portal can create licensing obligations. The safer path is:

1. Rebuild the useful classroom concepts inside our existing Next.js UPSC flow.
2. Keep a clean abstraction for future OpenMAIC sidecar connection.
3. Only copy or deeply merge OpenMAIC code after licensing is intentionally accepted.

## What OpenMAIC Actually Provides

OpenMAIC is a multi-agent interactive classroom system. Its main facilities are:

- Topic or document to classroom generation.
- AI teacher and AI classmates with role-based discussion.
- Slides, quizzes, interactive HTML simulations, PBL activities, whiteboard, TTS, and ASR.
- Streaming multi-agent chat through a stateless SSE API.
- A LangGraph director that decides which agent speaks next.
- A playback engine that moves between lecture, live mode, and discussion.
- An action engine for speech, whiteboard drawing, spotlight, laser, widget actions, video, and code/diagram rendering.
- Exports to PowerPoint, HTML, and classroom ZIP.
- Local provider support through Ollama/Lemonade and other OpenAI-compatible APIs.

## Current UPSC Geography State

Our Geography module already has the correct room-level learning loop:

- Command Room: day selection, next action, route control.
- Watch Room: demo lesson and completion gate.
- Talk Room: student explanation and scoring gate.
- Revisit Room: recovery path when score is low.
- Visual Lab: interactive concept practice and map/layer simulations.
- MCQ Readiness Room: fresh MCQ gate and local practice runner.
- Track Room: progress heatmap and room completion status.

Current estimate: approximately 82-85 percent functional for a local geography prototype. The structure exists, but the "AI classroom depth" is still basic. OpenMAIC directly helps with that missing depth.

## Where OpenMAIC Fits In Our Portal

### 1. Talk Room - Highest Priority

OpenMAIC's multi-agent classroom maps directly to our Talk Room.

Current state:
- Rule-based teacher feedback.
- Basic score-based routing to Revisit or next room.

OpenMAIC-style upgrade:
- AI Teacher asks recall and application questions.
- AI Student or Peer Challenger asks counter-questions.
- Examiner agent scores the response.
- Summarizer agent compresses the final learning point.
- Director decides whether student moves to Revisit, Visual Lab, or MCQ.

This is the first useful integration because it matches the user's intended flow: after watching a topic, student must explain what they learned before moving ahead.

### 2. Watch Room - Lecture Playback Engine

OpenMAIC's playback model maps to our Watch Room.

Current state:
- Demo lesson content and completion button.

OpenMAIC-style upgrade:
- Lesson becomes a sequence of scenes.
- Each scene can contain text, diagram, map, mini quiz, or short simulation.
- Proactive discussion card appears after the lecture.
- Completion automatically routes to Talk Room.

This gives our Watch Room a real "classroom" feeling without needing to build a full video platform first.

### 3. Visual Lab - Interactive Scene Types

OpenMAIC's Deep Interactive Mode maps to our Visual Lab.

Current state:
- Geography lab has earth layers, monsoon, India map, disaster/environment bridges, and visual concept practice.

OpenMAIC-style upgrade:
- Standard scene schema for map, simulation, mind map, quiz, whiteboard, and comparison.
- Teacher can highlight a region, explain a river basin, reveal layers, or animate monsoon flow.
- Geography can later support India map, rivers, national parks, wildlife sanctuaries, resources, climate, and disasters under one scene engine.

This is the second biggest benefit after Talk Room.

### 4. MCQ Room - AI Grading and Remediation

OpenMAIC's quiz grading maps to our MCQ and short-answer checks.

Current state:
- Local MCQ runner works with answer feedback.
- Existing old MCQ bank should be ignored as per latest direction.

OpenMAIC-style upgrade:
- Fresh MCQ can be attached to topic/day.
- Short explanation questions can be AI-graded.
- Wrong answers route to precise Revisit cards.
- MCQ should become one button in the larger learning loop, not the core product identity.

### 5. Provider Layer - Local First

OpenMAIC's multi-provider design is useful because cloud/Firebase/GCP may be down.

For our system:
- Add provider abstraction later for OpenAI-compatible local endpoints.
- Keep deterministic fallback so the portal works even with no key.
- Support local model endpoint when available, such as Ollama or Lemonade.

This lets the portal remain locally testable.

## What We Should Not Do

- Do not replace the current UPSC portal with OpenMAIC.
- Do not copy the whole OpenMAIC app into our repo.
- Do not make MCQ the central product experience again.
- Do not begin with 3D animations before the learning loop is stable.
- Do not depend on Google Cloud for local testing.

## Proposed Architecture Inside Our Portal

Create a local "MAIC adapter" layer:

```ts
type ClassroomScene =
  | { type: "lecture"; title: string; content: string; actions?: TeacherAction[] }
  | { type: "discussion"; title: string; agents: AgentRole[]; rubric: RubricRule[] }
  | { type: "visual"; title: string; visualMode: "map" | "layer" | "flow" | "timeline" }
  | { type: "quiz"; title: string; questions: FreshQuestion[] }
  | { type: "revisit"; title: string; compressedExplanation: string };
```

Then each Geography day becomes:

Watch Scene -> Talk Scene -> Lab Scene -> MCQ Scene -> Track Update

## First Implementation Action

The next real build action should be:

Build a MAIC-style Discussion Engine for Geography Talk Room.

Minimum local version:

- Teacher agent prompt/card.
- Peer challenger prompt/card.
- Examiner rubric.
- Student response text area.
- Score bands:
  - 0-39: Revisit required.
  - 40-69: Revisit recommended, retry Talk.
  - 70-84: Visual Lab unlocked.
  - 85-100: MCQ and next topic unlocked.
- Persist discussion transcript and score in local Geography progress.
- Keep deterministic fallback so it works locally with no API key.

After that:

1. Upgrade Watch Room to scene-based lecture playback.
2. Upgrade Visual Lab with geography scene schema.
3. Add fresh MCQ attachment and remediation routing.
4. Add optional LLM provider endpoint.
5. Consider OpenMAIC sidecar only after local flow is stable.

## Integration Verdict

OpenMAIC is very relevant, especially for Talk Room, Watch Room, Visual Lab, and AI grading. The right move is not a full merge. The right move is to bring its classroom model into our existing UPSC room system, starting with Geography, and preserve local-first operation.

