# Hardware Diagnostics & Device Health Analyzer

## Project Idea

This project provides a lightweight, privacy-first system health analyzer.
Users run a local script on their machine, send read-only diagnostics to the backend, and get component-level health insights, recommendations, and AI-assisted summaries.

Core goals:
- Keep diagnostics simple and transparent
- Avoid invasive system changes
- Support desktop and mobile/PWA usage
- Enable production deployment with runtime API key support

## What Is Done in This Project

- React + Vite frontend with dashboard, analysis, component detail, results, instructions, scan, and settings pages
- Express backend with diagnostics APIs and evaluation logic
- OCR pipeline integrated with **Google Vision API** (with optional Roboflow fallback)
- AI chat/summaries/fix suggestions integrated with **Groq**
- Runtime API-key entry flow in frontend (`/settings`) with header-based backend overrides
- Vercel-ready deployment setup (`vercel.json`, serverless API entrypoint)
- Script standardization completed:
  - `diagnostics.sh`, `diagnostics.ps1`, `diagnostics.bat`
- Frontend instructions and landing flow updated for both Bash and PowerShell scripts
- Frontend tests added and passing for major components/pages

## Tech Stack

- Frontend: React, Vite
- Backend: Node.js, Express
- Testing: Vitest, Testing Library
- OCR: Google Vision API (+ optional Roboflow fallback)
- AI: Groq API
- Deployment: Vercel (static frontend + serverless API)

## Local Development

### 1) Install dependencies

From repo root:

`npm --prefix backend install && npm --prefix frontend install`

### 2) Configure environment

Create backend env from sample and set values:

- `GROQ_API_KEY`
- `GOOGLE_VISION_API_KEY`
- `ROBOFLOW_API_KEY`
- `ROBOFLOW_PROJECT_NAME`
- `ROBOFLOW_PROJECT_VERSION`
- `ROBOFLOW_WORKSPACE` (optional)

### 3) Run backend and frontend

- Backend: `npm --prefix backend start`
- Frontend: `npm --prefix frontend run dev`

Default local URLs:
- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3000`

## Script Usage (Both Files)

### Windows (PowerShell file)

Use `diagnostics.ps1`:
1. Download `diagnostics.ps1` from the home page.
2. Open PowerShell in the download folder.
3. If needed once: `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser`
4. Run: `.\diagnostics.ps1`

The script defaults to `https://hardware-diagnostics.vercel.app`.

Examples:
- Vercel backend: `$env:API_BASE='https://hardware-diagnostics.vercel.app'; .\diagnostics.ps1`
- Local development override: `$env:API_BASE='http://localhost:3000'; .\diagnostics.ps1`

### Linux/macOS (Bash file)

Use `diagnostics.sh`:
1. Download `diagnostics.sh` from the home page.
2. Open terminal in the download folder.
3. Make executable: `chmod +x diagnostics.sh`
4. Run: `./diagnostics.sh`

The script defaults to `https://hardware-diagnostics.vercel.app`.

Examples:
- Vercel backend: `API_BASE=https://hardware-diagnostics.vercel.app ./diagnostics.sh`
- Local development override: `API_BASE=http://localhost:3000 ./diagnostics.sh`

## Deploy on Vercel

This repository is configured for Vercel deployment with:

- Frontend: Vite app from `frontend/`
- Backend API: Serverless function entry at `api/[...path].js` using Express app from `backend/server.js`

### Steps

1. Import this repo into Vercel
2. Keep root directory as repository root
3. Add required environment variables in Vercel project settings:
   - `GROQ_API_KEY`
  - `GOOGLE_VISION_API_KEY`
   - `ROBOFLOW_API_KEY`
   - `ROBOFLOW_PROJECT_NAME`
   - `ROBOFLOW_PROJECT_VERSION`
   - `ROBOFLOW_WORKSPACE` (optional)
4. Deploy

### Notes

- WebSocket live updates are disabled in Vercel serverless mode; frontend falls back to HTTP polling.
- Local development remains unchanged (`backend` on `:3000`, `frontend` on `:5173`).
- You can add keys directly in production via `/settings` (stored in browser local storage and sent as request headers).

### Vercel Troubleshooting

- **500 on `/api/ocr`**
  - Ensure `GOOGLE_VISION_API_KEY` is set (primary OCR).
  - If using fallback, also set `ROBOFLOW_API_KEY`, `ROBOFLOW_PROJECT_NAME`, and `ROBOFLOW_PROJECT_VERSION`.
  - Redeploy after updating env vars.

- **503/502 on AI endpoints** (`/api/ai-report-summary`, `/api/ai-chat`, `/api/fix-suggestions`)
  - Ensure `GROQ_API_KEY` is set.
  - Trigger a new deploy if keys were added later.

- **Frontend loads but API fails**
  - Keep `vercel.json` at repository root.
  - Verify frontend calls `/api/...` endpoints.

- **Live updates are not real-time on Vercel**
  - Expected: serverless uses HTTP fallback (no persistent websocket process).

## Mobile PWA

You can use the frontend like a mobile app by adding it to your home screen.

### Install on Android (Chrome)

1. Open the app URL in Chrome
2. Tap the menu (⋮)
3. Select **Add to Home screen**
4. Confirm install

### Install on iPhone (Safari)

1. Open the app URL in Safari
2. Tap **Share**
3. Select **Add to Home Screen**
4. Tap **Add**

### Scanning (Google Vision OCR + Groq)

Flow:
1. Capture/upload image
2. OCR with Google Vision API
3. Text understanding/summarization with Groq
4. Show structured output in UI
