# SnapSolve AI — Visual Learning Assistant

**SnapSolve AI** is an open-source, mobile-first visual learning web application built for students. Upload or photograph textbook pages, handwritten class notes, scientific diagrams, or homework problems, and SnapSolve AI uses Google's open-weights **Gemma 4 (`gemma-4-31b-it`)** multimodal model on a secure Express backend to generate plain-English explanations, executive summaries, key concept glossaries, interactive self-testing quizzes, and contextual follow-up Q&A.

---

## Key Features

- **Flexible Study Image Capture**: Drag-and-drop files, browse local images, paste clipboard screenshots (`Ctrl+V` / `Cmd+V`), or snap photos directly from a smartphone camera.
- **Client-Side Validation & Canvas Optimization**: Validates file formats (`PNG`, `JPEG`, `WebP` up to `15 MB`) and downscales high-DPI camera photos cleanly in the browser for fast uploads on campus Wi-Fi.
- **Real Gemma 4 Multimodal Analysis (`gemma-4-31b-it`)**: Powered strictly server-side via `@google/genai` with structured JSON schema enforcement—zero hardcoded mock responses.
- **Honest Readability Warnings**: Alerts students when portions of a handwritten page or diagram are cropped or blurry instead of guessing unreadable symbols.
- **Active-Recall Practice Quiz**: Generates interactive multiple-choice cards (with instant verification, hints, and explanations) alongside open-ended conceptual self-check cards.
- **Contextual Follow-Up Tutor**: Keeps both your uploaded study image and generated study guide in context so you can ask follow-up questions about any step or equation.
- **Private Local Session History**: Automatically saves up to 10 recent study sessions in browser `localStorage` with zero sign-up friction.
- **Warm Academic Notebook UI**: Accessible Light ("Paper Light") and Dark ("Dark Desk") themes with keyboard navigation, zoom lightbox inspection, and `prefers-reduced-motion` support.

---

## Architecture & Security

```
Browser Client (React 19 + TypeScript + Tailwind CSS v4)
   │
   │  POST /api/analyze   (compressed base64 image + optional focus prompt)
   │  POST /api/followup  (image + study context + Q&A history + question)
   ▼
Express Server (server.ts + server/gemmaService.ts)
   │
   │  process.env.GEMINI_API_KEY (kept strictly on the server)
   ▼
Google GenAI API — Model: gemma-4-31b-it (Structured JSON Schema)
```

- **Zero Client Secret Exposure**: `@google/genai` is imported exclusively on the server (`server/gemmaService.ts`). The browser never sees `GEMINI_API_KEY`.
- **Shared TypeScript Contracts**: `src/types/study.ts` guarantees compile-time alignment between Express API responses and React UI components.

---

## Project Structure

```text
├── server/
│   └── gemmaService.ts          # Gemma 4 (gemma-4-31b-it) schema & multimodal calls
├── src/
│   ├── assets/images/           # Real sample study images for instant live testing
│   ├── components/
│   │   ├── FollowUpPanel.tsx    # Contextual follow-up tutor Q&A
│   │   ├── Header.tsx           # Accessible top navigation bar
│   │   ├── HowItWorksSection.tsx# Workflow & study photo capture tips
│   │   ├── PracticeQuizView.tsx # Interactive MCQ & reveal-answer cards
│   │   ├── SessionDrawer.tsx    # Local browser history slide-over drawer
│   │   ├── StudyDeck.tsx        # Tabbed explanation, concepts & markdown export
│   │   └── UploadStage.tsx      # Drag/drop, camera, paste, compression & zoom
│   ├── data/
│   │   └── sampleMaterials.ts   # Metadata for real sample study pages
│   ├── hooks/
│   │   ├── useLocalStorageSessions.ts
│   │   └── useTheme.ts
│   ├── types/
│   │   └── study.ts             # Shared frontend/backend TypeScript interfaces
│   ├── utils/
│   │   ├── imageProcessor.ts    # Validation & HTML5 Canvas compression
│   │   └── studyApi.ts          # Typed fetch client with AbortSignal support
│   ├── App.tsx
│   ├── index.css
│   └── main.tsx
├── server.ts                    # Express API + Vite middleware entry point
├── .env.example                 # Environment variable template
└── package.json
```

---

## Local Development Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure environment variables**:
   Copy `.env.example` to `.env` and add your Gemini API key:
   ```bash
   cp .env.example .env
   ```
   ```env
   GEMINI_API_KEY="your_actual_api_key_here"
   ```

3. **Start the full-stack development server (Port 3000)**:
   ```bash
   npm run dev
   ```

4. **Type-check & build for production**:
   ```bash
   npm run lint
   npm run build
   npm start
   ```

---

## 2-Minute Hackathon Live Demo Script

1. **The Hook (0:00–0:25)**:
   *"Every week, students snap photos of lecture whiteboards, dense textbook diagrams, and messy handwritten derivations—only to get stuck at midnight with no TA around. Generic chatbots dump walls of text or spoil homework answers. SnapSolve AI turns static study photos into active comprehension using Google's open-weights Gemma 4 multimodal model."*
2. **Upload & Live Gemma 4 Analysis (0:25–1:05)**:
   - Select the **Handwritten Projectile Motion Notes** (or snap a live photo from your phone).
   - Add a quick focus prompt: *"Explain why horizontal and vertical motion are separated here."*
   - Click **Analyze with Gemma 4** and point out that the image is compressed client-side and analyzed securely on the Express server via `gemma-4-31b-it` using structured JSON schemas.
3. **Active Study Loop (1:05–1:45)**:
   - Walk through the **Step-by-Step Explanation** and **Summary & Concepts** tabs.
   - Switch to **Practice Quiz**, answer a Multiple-Choice question live to show instant rationale feedback, and reveal a conceptual self-check answer.
   - Ask a **Follow-Up Question** at the bottom to demonstrate stateful visual tutoring.
4. **Wrap-Up (1:45–2:00)**:
   - Open **Saved Sessions** to show zero-login local browser persistence and toggle **Dark Desk** mode for late-night studying.
