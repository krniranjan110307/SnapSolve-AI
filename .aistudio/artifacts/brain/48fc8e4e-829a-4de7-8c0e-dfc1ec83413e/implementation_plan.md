# SnapSolve AI — Visual Learning Assistant

SnapSolve AI transforms photos of textbook pages, handwritten class notes, scientific diagrams, and homework problems into clear explanations, structured summaries, key concept breakdowns, and interactive self-testing questions—powered securely on the server by Google's open-weights **Gemma 4 (`gemma-4-31b-it`)** multimodal model.

## User Review & Confirmed Decisions

> [!IMPORTANT]
> Thank you for confirming your core product preferences. Review the Phase 1 architecture, model specification, MVP boundaries, and phased roadmap below. Click **Proceed** when you are ready to advance to implementation, or let me know if you want to adjust any part of the plan first.

- **Core AI Model**: **Gemma 4 31B (`gemma-4-31b-it`)** via the official `@google/genai` SDK on the Express backend for maximum multimodal accuracy on dense diagrams, formulas, and handwritten notes.
- **Practice Question Experience**: **Interactive Multiple-Choice & Reveal-Answer Cards** with instant feedback, explanations, and optional hints so students actively test comprehension rather than passively reading answers.
- **Session Persistence**: **Browser Local Storage History** storing recent analyzed study sessions privately on the student's device with zero sign-up friction for hackathon demos.
- **Visual Aesthetic**: **Warm Academic Notebook** aesthetic supporting both crisp paper-light and low-glare dark study modes, built mobile-first for smartphone camera uploads and expanding into a balanced two-column study desk on desktop.

---

## 1. Overview & Core Concept

### Problem Statement
Students routinely get stuck studying from static visual materials—dense textbook paragraphs, Chalkboard/whiteboard photos taken in lecture, complex biology or physics diagrams, and messy handwritten notes. Standard text search cannot easily parse a photographed diagram or handwritten derivation, and generic chatbots often dump unformatted walls of text or simply give away homework answers without helping the student actually learn the underlying concept.

### Target Users & Primary Use Cases
- **Undergraduate & High School STEM Students**: Photographing circuit diagrams, organic chemistry pathways, calculus derivations, or physics free-body diagrams to get step-by-step conceptual breakdowns.
- **Humanities & Social Science Readers**: Uploading dense textbook pages or historical primary-source excerpts to extract structured summaries, core vocabulary, and self-quiz questions before an exam.
- **Lecture Note Reviewers**: Snapping photos of handwritten notebook pages or classroom whiteboards on a phone to organize messy notes into clean key concepts and follow-up Q&A.

### MVP Features vs. Future Post-Hackathon Features

| Scope Tier | Capabilities Included | Why It Belongs Here |
| :--- | :--- | :--- |
| **MVP (Hackathon Core)** | • Drag-and-drop, file picker, and mobile camera image capture<br>• Client-side file type/size validation, compression, preview & removal<br>• Optional student focus prompt (e.g., *"Explain step 3 of this proof"*)<br>• Real `gemma-4-31b-it` multimodal analysis returning structured JSON<br>• Tabbed Study Guide: Plain-English Explanation, Executive Summary, Key Concepts, and Interactive Practice Quiz (MCQ + Reveal Answer)<br>• Contextual Follow-Up Q&A thread anchored to the uploaded image<br>• Local browser history drawer to revisit or clear recent study snaps<br>• Light/Dark academic notebook theme + responsive mobile/desktop layout | Solves the complete student study loop end-to-end with zero fake data, zero login barriers, and rock-solid reliability during live hackathon judging. |
| **Future Roadmap (Post-MVP)** | • Multi-page PDF & batch chapter uploads<br>• Spaced-repetition Anki/CSV flashcard export<br>• Cloud sync & shared study-group notebooks<br>• Interactive canvas region cropping / bounding-box highlighting<br>• Voice read-aloud explanations for auditory learners | Valuable extensions that would dilute focus or add external failure points before the core visual study loop is proven. |

---

## 2. User Experience & Visual Design

### Key User Flows
1. **Zero-State Arrival & Quick Demo Guidance**: Students land on a clean, distraction-free study workspace featuring a prominent upload stage on the left/top, clear guidance on supported study materials (textbooks, handwritten notes, diagrams, problems), and quick access to saved local sessions.
2. **Capture, Validate & Preview**: On mobile, tapping the upload card opens the phone camera or photo library; on desktop, students drag-and-drop, paste from clipboard, or browse files. Invalid formats or oversized files trigger an immediate, helpful inline message. Valid images display a crisp preview with zoom inspection, an optional *"What are you stuck on?"* prompt input, and a one-tap **Remove / Replace** action.
3. **Structured Visual Analysis**: Clicking **Analyze Study Material** compresses the image if needed and sends it to the backend. A calm, informative skeleton progress state keeps layout geometry stable while Gemma 4 inspects the visual content.
4. **Active Study & Self-Testing**: Results render in a structured **Concept & Practice Deck**:
   - **Overview & Summary**: High-level takeaway and detected subject/topic metadata rendered as quiet inline text (`Biology · Cellular Respiration · Intermediate`).
   - **Step-by-Step Explanation**: Scannable, well-paced prose breaking down the visual material clearly without walls of text.
   - **Key Concepts**: Core terms, formulas, and definitions presented with clean hairline dividers.
   - **Practice Questions**: Interactive multiple-choice options with immediate right/wrong rationale plus open-ended thought questions with a **Reveal Answer** toggle and hint reveal.
5. **Contextual Follow-Up Q&A**: At the bottom of the study guide, students can ask targeted follow-up questions (*"Why did the sign flip on the second line?"*) while the server keeps both the uploaded image and prior explanation in Gemma 4's context.

### Visual Identity & Theme
- **Aesthetic Direction**: **Warm Academic Editorial Studio**—inspired by high-craft university press notebooks and scientific lab journals, avoiding neon AI clichés, decorative status tickers, or pill-badge clutter.
- **Color Palette (60-30-10 Discipline)**:
  - *60% Dominant Neutral Canvas*: Soft warm alabaster paper (`#FAFAF9` / `stone-50`) in Light Mode; deep low-glare obsidian ink (`#0C0A09` / `stone-950`) in Dark Mode.
  - *30% Structural Surfaces*: Crisp white notebook sheets (`#FFFFFF`) with subtle stone hairline borders (`#E7E5E4`) in Light Mode; elevated charcoal cards (`#1C1917`) with muted borders (`#292524`) in Dark Mode.
  - *10% Semantic Focal Accent*: Deep Academic Cobalt (`#1D4ED8` light / `#3B82F6` dark) reserved strictly for primary CTAs, active tabs, and focus rings; semantic Emerald (`#059669`) and Amber/Coral (`#D97706` / `#DC2626`) always paired with explicit icons and text labels (`Correct`, `Review Concept`)—never color alone.
- **Typography & Hierarchy (2+1 Font Rule)**:
  - *Display & Section Headings*: `Fraunces` (editorial optical-size serif conveying academic warmth and authority, `text-wrap: balance`).
  - *Body Prose & UI Controls*: `Plus Jakarta Sans` (15px–16px body with generous `1.65` line-height for effortless reading).
  - *Formulas, Equations & Metrics*: `IBM Plex Mono` with `tabular-nums` for mathematical expressions, step numbers, and quiz tallies.
- **Two-Zone Responsive Layout & Ergonomics**:
  - *Desktop (`1440px` baseline)*: Full-width two-zone sandbox (`max-w-7xl`)—Left Zone (`42%`) holds the sticky uploaded material viewer, zoom controls, and session switcher; Right Zone (`58%`) holds the tabbed Study Guide, interactive quiz cards, and follow-up tutor chat.
  - *Mobile (`375px–430px`)*: Ergonomic single-column flow with $\ge 44 \times 44\text{px}$ touch hitboxes, camera-ready upload CTA in natural thumb reach, and sticky top navigation kept strictly under 15% of viewport height.

---

## 3. Key Product Decisions, Model Specs & Risk Mitigations

### Gemma 4 Model Specification (Verified)
> [!NOTE]
> **Exact Model Identifier**: `gemma-4-31b-it` accessed via the official `@google/genai` TypeScript SDK (`^2.4.0`) on our Node.js/Express server.

- **Why `gemma-4-31b-it`?**: Gemma 4 31B Instruction-Tuned is a dense multimodal model with native vision encoding, a **256K token context window**, strong STEM/diagram reasoning, native `systemInstruction` support, and native **Structured Outputs** (`responseMimeType: "application/json"` + `responseSchema`).
- **Beginner-Friendly Explanation of Structured Outputs**: Instead of hoping the AI formats its reply nicely with markdown headings (which frequently breaks frontend UIs), we give Gemma 4 a strict JSON blueprint (`responseSchema`). That guarantees every successful response arrives with predictable `title`, `subject`, `summary`, `explanationSteps`, `keyConcepts`, and `practiceQuestions` fields ready for interactive React components.

### Architectural Decisions & Trade-Offs
- **Server-Side Express API Proxy (`/api/*`) vs. Direct Browser Calls**
  - *Chosen Approach*: Express backend (`server.ts`) initializes `GoogleGenAI` using `process.env.GEMINI_API_KEY` and exposes clean JSON endpoints (`/api/analyze` and `/api/followup`).
  - *Why*: Keeps your API secret completely invisible to browser DevTools and GitHub visitors, enforces payload size validation on the server, and satisfies hackathon security judging criteria.
- **Client-Side Canvas Image Optimization Before Upload**
  - *Chosen Approach*: Automatically resize ultra-high-resolution smartphone camera photos (often 8–15 MB) down to a crisp max dimension (`1600px`, JPEG/WebP quality `0.85`) in the browser before sending base64 data to the server.
  - *Why*: Cuts upload time on college Wi-Fi from ~8 seconds to under 1 second and prevents HTTP `413 Payload Too Large` errors while preserving complete text and diagram legibility for Gemma 4.
- **Local Browser Storage (`localStorage`) with Thumbnail Compression**
  - *Chosen Approach*: Store the last 10 study sessions locally with lightweight compressed image previews and full structured study guides.
  - *Why*: Gives students instant session recall without requiring OAuth/database setup, while avoiding the 5 MB browser `localStorage` quota ceiling.

### Main Technical Risks & How We Address Them
1. **Blurry, Rotated, or Illegible Handwritten Uploads**: Prompt Gemma 4 via `systemInstruction` to explicitly report a `readabilityWarning` field when parts of an image are cut off or illegible rather than hallucinating missing numbers, and surface a friendly retry tip to the student.
2. **Large Smartphone Camera Photos Crashing Requests**: Enforce both client-side validation/downscaling (accepting PNG, JPEG, WebP up to 15 MB raw, compressed prior to transit) and Express JSON body limits (`10mb`) with descriptive HTTP 400 error messages.
3. **Model Latency on Dense STEM Reasoning**: Configure `gemma-4-31b-it` with balanced thinking configuration so complex math/diagrams are reasoned through accurately without timing out, paired with clear step-by-step loading feedback and an AbortController cancel button.
4. **Malformed JSON or Network Dropouts**: Wrap server responses in strict schema validation (`try/catch` JSON parsing + field checks) and return structured error payloads (`code`, `message`, `retryable`) so the UI never white-screens.

---

## 4. Technical Architecture & Development Roadmap

### System Architecture & Modular Organization
In beginner-friendly terms, the application is split into **four clean layers** so each part has one job and is easy for teammates or hackathon judges to read on GitHub:
1. **Presentation Components (Frontend UI)**: Focused React components for the header, upload/preview stage, explanation reader, interactive quiz cards, follow-up thread, and history drawer.
2. **Client State & Utilities**: Custom React hooks and pure TypeScript helpers handling image validation, canvas compression, API requests, and safe `localStorage` persistence.
3. **Shared TypeScript Contracts**: Strict data interfaces shared between frontend and backend so request/response shapes stay in sync at compile time.
4. **Secure Express API Server**: Server-side route handlers and Gemma 4 prompt/schema builders that hold `GEMINI_API_KEY` privately and talk to Google's GenAI API.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        BROWSER CLIENT (React 19 + TS)                       │
│                                                                             │
│  ┌───────────────────────────────┐     ┌─────────────────────────────────┐  │
│  │   LEFT / TOP SANDBOX STAGE    │     │   RIGHT / BOTTOM STUDY DECK     │  │
│  │ • Upload / Camera / Paste     │     │ • Summary & Step Explanations   │  │
│  │ • File Validator & Compressor │     │ • Key Concepts Glossary         │  │
│  │ • Interactive Zoom Preview    │     │ • Interactive MCQ & Reveal Quiz │  │
│  │ • Optional Focus Prompt       │     │ • Contextual Follow-Up Q&A      │  │
│  └───────────────┬───────────────┘     └────────────────▲────────────────┘  │
│                  │                                      │                   │
│                  ▼                                      │                   │
│  ┌──────────────────────────────────────────────────────┴────────────────┐  │
│  │               STUDY SESSION STATE & LOCAL PERSISTENCE                 │  │
│  │ • Active Session Store  • Loading / Abort / Error States              │  │
│  │ • Browser LocalStorage History (Recent 10 Sessions + Safe Quota)      │  │
│  └───────────────────────────────┬───────────────────────────────────────┘  │
└──────────────────────────────────┼──────────────────────────────────────────┘
                                   │ HTTPS JSON (POST /api/analyze, /api/followup)
                                   ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                      SECURE BACKEND SERVER (Express + TS)                   │
│                                                                             │
│  ┌───────────────────────────────┐     ┌─────────────────────────────────┐  │
│  │   REQUEST GUARD & VALIDATOR   │────▶│   GEMMA 4 MULTIMODAL SERVICE    │  │
│  │ • MIME & Payload Size Check   │     │ • @google/genai SDK (Server)    │  │
│  │ • Prompt Sanitization         │     │ • Model: gemma-4-31b-it         │  │
│  │ • Structured Error Responses  │     │ • Strict JSON responseSchema    │  │
│  └───────────────────────────────┘     └────────────────┬────────────────┘  │
└─────────────────────────────────────────────────────────┼───────────────────┘
                                                          │ GEMINI_API_KEY
                                                          ▼
                                         ┌─────────────────────────────────┐
                                         │   Google GenAI API (Gemma 4)    │
                                         └─────────────────────────────────┘
```

### Recommended Technology Stack
- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Lucide React (functional icons), Motion (subtle $\le 200\text{ms}$ compositor transitions).
- **Backend**: Node.js + Express (`server.ts`) integrated with Vite middleware on port `3000` in development and static `dist/` serving in production.
- **AI Integration**: Official `@google/genai` SDK calling `gemma-4-31b-it` strictly from the server.

### Interactive Component & State Mapping
- **Upload & Validation Controller**: Handles file drop, file input, camera capture (`accept="image/*" capture="environment"` on mobile), and clipboard paste (`Ctrl+V`) $\rightarrow$ validates MIME type (`image/jpeg`, `image/png`, `image/webp`) and file size $\rightarrow$ generates compressed preview data URL + allows instant removal/reset.
- **Study Guide Tab & Quiz Controller**: Switches cleanly between *Explanation*, *Summary & Concepts*, and *Practice Quiz* views $\rightarrow$ tracks selected MCQ choice per card, reveals answer rationale, tallies score (`tabular-nums`), and resets quiz attempts on demand.
- **Follow-Up Tutor Controller**: Appends student follow-up questions to an active Q&A list $\rightarrow$ sends compressed image + concise study context + question history to `/api/followup` $\rightarrow$ renders grounded answers or inline retry buttons if an error occurs.
- **Session History & Theme Controller**: Persists completed analyses to `localStorage`, restores any past session in one click, deletes individual/all history items, and toggles Light/Dark academic themes seamlessly.

### Step-by-Step 8-Phase Development Roadmap
1. **Phase 1 — Architecture & Specification (Current Phase)**: Define problem, Gemma 4 (`gemma-4-31b-it`) capabilities, UI/UX design system, modular architecture, risks, and roadmap.
2. **Phase 2 — Polished, Accessible UI Shell**: Set up the academic notebook typography (`Fraunces`, `Plus Jakarta Sans`, `IBM Plex Mono`), Light/Dark theme tokens, responsive Two-Zone layout, empty states, and navigation shell.
3. **Phase 3 — Image Upload, Preview, Validation & Removal**: Build drag-and-drop, mobile camera/gallery input, clipboard paste, client-side validation, canvas compression, zoomable preview, and clean reset controls.
4. **Phase 4 — Secure Server & Real Gemma 4 Integration**: Build the Express server (`server.ts`) with Vite integration, keep `GEMINI_API_KEY` server-only, wire `@google/genai` with `gemma-4-31b-it`, and enforce structured JSON output schemas.
5. **Phase 5 — Explanations, Summaries, Key Concepts & Interactive Practice Quiz**: Render real Gemma 4 outputs across step-by-step explanations, executive summaries, concept cards, and interactive multiple-choice / reveal-answer practice quizzes, plus local session history.
6. **Phase 6 — Contextual Follow-Up Q&A & Robust Error Handling**: Add `/api/followup` multimodal Q&A grounded in the uploaded image, AbortController cancellation, readability warnings, and graceful retry states.
7. **Phase 7 — End-to-End Verification, Security & Responsiveness**: Verify TypeScript compilation, lint cleanliness, server secret isolation, mobile touch ergonomics, and real multimodal API responses.
8. **Phase 8 — Hackathon Documentation & Demo Readiness**: Create a GitHub-ready `README.md`, architecture overview, setup instructions, and a crisp 2-minute hackathon pitch & live demo script.
