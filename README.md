# TrustLens — AI Media Verification Platform
> **See. Verify. Trust.** Probabilistic, evidence-led media verification designed to support, not replace, human judgment.

[![Vercel Deployment](https://img.shields.io/badge/Deployment-Vercel-black?style=flat&logo=vercel)](https://ai-ano.vercel.app)
[![Automated Tests](https://img.shields.io/badge/Tests-49%20Passing-success?style=flat&logo=vitest)](https://github.com/alwinjosegeorge/Ai-Ano)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-blue?style=flat&logo=typescript)](https://www.typescriptlang.org)
[![Gemini 3.5](https://img.shields.io/badge/AI-Gemini%203.5%20Flash%20Lite-orange?style=flat&logo=google)](https://ai.google.dev)

---

## 1. Problem Statement
In an era dominated by rapid advancements in generative artificial intelligence (diffusion models, deepfake generators, voice clones, and synthetic manipulation), distinguishing authentic digital content from synthetically generated or altered media has become critically challenging.

Current detection tools suffer from critical flaws:
* **Black-Box Opacity**: Many tools produce an arbitrary percentage (e.g. "97% Fake") without explaining what forensic artifacts led to that score.
* **False Certainty**: Binary classification fails to reflect the nuanced, probabilistic nature of media analysis.
* **Lack of Context**: Synthetic media often repurposes genuine imagery with misleading captions, crops, or out-of-context dates.

## 2. The Solution: TrustLens
**TrustLens** (*"Is it AI?"*) is a comprehensive, evidence-led digital media forensics and verification platform. It allows journalists, researchers, fact-checkers, and everyday digital citizens to inspect suspicious images, audio clips, and videos for signals of generative AI and synthetic manipulation.

Rather than issuing unverifiable absolute verdicts, TrustLens delivers **structured, explainable forensic assessments** that highlight tangible evidence—including anatomical consistency, lighting irregularities, sensor noise distribution, compression artifacts, and timeline context.

---

## 3. Key Features
* **Multimodal Verification**:
  * **Images**: JPG, JPEG, PNG, WEBP (up to 10 MB).
  * **Audio**: MP3, WAV, OGG, M4A.
  * **Video**: MP4, WEBM, MOV.
  * **Direct URLs**: Verification via direct image/media links.
* **Live Camera Capture**: Real-time in-browser webcam capture via WebRTC to verify physical scenes on the spot.
* **Probabilistic Scoring**:
  * Overall Risk Score (0–100).
  * AI Generation Probability (0–100%).
  * Synthetic Manipulation Probability (0–100%).
  * Forensic Confidence Level (`High`, `Medium`, `Low`).
* **Explainable AI**: Plain-language synthesis explaining *why* media was flagged, bridging the gap between raw signals and user comprehension.
* **Evidence Breakdown**: Categorized evidence cards (`visual`, `metadata`, `context`) tagged with severity levels (`HIGH`, `MEDIUM`, `LOW`).
* **Source & Context Verification**:
  * Provenance timeline tracing.
  * Context comparison against circulating archives.
  * Conditional media comparison (only shown when matching versions actually exist).
* **Exportable Verification Reports**: Instant, downloadable structured forensic reports (`trustlens-report-[id].txt`).
* **Dual-Key Failover Engine**: Server-side fallback logic automatically routes requests to a secondary Gemini API key if rate limits (`429`) or server spikes (`503`) occur.

---

## 4. How the AI Forensic Pipeline Works
1. **Client-Side Pre-Validation**: Files are inspected for MIME type and clamped to a 10 MB threshold before buffer ingestion to prevent bandwidth and memory waste.
2. **Chunked Ingestion**: File buffers are converted to base64 using a 32 KB chunked algorithm to avoid call stack limits and memory spikes.
3. **Server-Side Forensic Analysis**:
   * The file is passed to Google's **Gemini 3.5 Flash Lite** model with a structured forensic prompt.
   * Gemini evaluates lighting consistency, specular reflections, anatomical coherence (hands, fingers, eyes), edge artifacts, audio waveforms, and metadata clues from file naming.
4. **Resilient Sanitization**: The response is parsed and validated by an automated parser (`src/lib/result-parser.ts`) that guarantees schema conformity, clamps all scores, normalizes verdicts, and provides forensic fallbacks even if the model outputs unexpected formats.
5. **Data-Driven Result Hydration**: Results are stored in the server layer and hydrated into an accessible, responsive dashboard.

---

## 5. Technology Stack
* **Framework**: [TanStack Start](https://tanstack.com/start) + [TanStack Router](https://tanstack.com/router)
* **Frontend**: React 19, TypeScript, Tailwind CSS v4, Lucide Icons, Radix UI primitives
* **Backend**: TanStack Start Server Functions, Node.js HTTP Adapters for Vercel Serverless
* **AI Provider**: [@google/genai](https://www.npmjs.com/package/@google/genai) (Gemini 3.5 Flash Lite)
* **Testing**: [Vitest 5](https://vitest.dev), [@testing-library/react](https://testing-library.com), jsdom
* **Deployment**: [Vercel](https://vercel.com) (Fluid Compute with Vercel Serverless Functions)

---

## 6. Architecture & Security Considerations
* **Zero Client-Side Credentials**: `GEMINI_API_KEY` and `GEMINI_API_KEY_BACKUP` are stored exclusively in server environment variables. They are never bundled into client JavaScript.
* **Payload Size Protection**: Server functions reject any payload exceeding the 20 MB base64 safety limit (~15 MB raw media) to mitigate Denial of Service (DoS) risks.
* **Read-Only Serverless Filesystem Support**: Analysis storage dynamically adapts to `/tmp` in serverless cloud environments (AWS Lambda / Vercel) with an in-memory safety fallback.
* **No Secret Leaks**: `.gitignore` strictly guards `.env`, credentials, build artifacts, and development logs.
* **Safe Error Surfaces**: Internal stack traces and raw cloud errors are caught and translated to user-friendly messages.

---

## 7. Automated Testing Suite

TrustLens features a comprehensive automated testing suite built with **Vitest** and **React Testing Library**.

### Test Suite Overview:
* **`src/lib/media-validator.test.ts`**: Unit tests for file format verification (image/audio/video), extension matching, 10 MB size limits, empty file rejection, and URL syntax validation.
* **`src/lib/result-parser.test.ts`**: Unit tests for markdown fence stripping, score clamping, verdict normalization, schema fallback injection, and malformed JSON resilience.
* **`src/server/db.test.ts`**: Unit tests for persistent storage, result retrieval by ID, collection queries, and non-existent ID safety.
* **`src/server/gemini.test.ts`**: Integration tests for API execution, missing key detection, rate-limit (`429`) failover to backup key, high demand (`503`) handling, and non-JSON output recovery.
* **`src/components/media-upload.test.tsx`**: Component tests verifying tab switching, preview rendering, live camera controls, removal actions, validation error alerts, and accessible controls.
* **`src/components/result-dashboard.test.tsx`**: Component tests ensuring low-risk authentic results display proper wording, high-risk results display review warnings, source verification properly handles zero matches, and report generation triggers.
* **`tests/routes/analyze.test.tsx`**: End-to-end integration tests for the analysis page workflow, loading spinners, and error alerts.

### Running the Tests:
```bash
# Run all automated tests once
npm test

# Run tests in watch mode
npm run test:watch
```

**Result**: 49 / 49 tests passing across 7 test suites with 100% pass rate.

---

## 8. Local Setup & Installation

### Prerequisites:
* Node.js 18+ (tested on Node v20/v24)
* A Google Gemini API Key from [Google AI Studio](https://aistudio.google.com/)

### Step-by-Step:
1. **Clone the repository**:
   ```bash
   git clone https://github.com/alwinjosegeorge/Ai-Ano.git
   cd Ai-Ano
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env` file in the project root:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   GEMINI_API_KEY_BACKUP=optional_backup_gemini_api_key
   ```

4. **Run development server**:
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173` in your browser.

5. **Run test suite**:
   ```bash
   npm test
   ```

6. **Build for production**:
   ```bash
   npm run build
   ```

---

## 9. Deployment (Vercel)

This project is configured for one-click continuous deployment on Vercel:

1. Import the repository into your Vercel account.
2. In **Project Settings** > **Environment Variables**, add:
   * `GEMINI_API_KEY`
   * `GEMINI_API_KEY_BACKUP` (optional, for failover)
3. The build configuration is managed automatically via `vercel.json` and `api/index.js`.
4. Deploy!

Live Production URL: [https://ai-ano.vercel.app](https://ai-ano.vercel.app)

---

## 10. Responsible AI & Forensic Disclaimer
TrustLens does **not** claim absolute mathematical certainty in its media assessments. Digital forensics on compressed web media inherently deals with statistical probabilities. Factors such as lossy re-encoding, heavy social media filters, artistic lighting, and novel generative algorithms can create both false positives and false negatives.

TrustLens is designed as an investigative aid to assist human fact-checkers, journalists, and citizens in making informed decisions. Always corroborate digital media findings with origin sources, contextual verification, and journalistic investigation before reaching definitive conclusions.

---

© 2026 TrustLens — Truth in Media Verification.
