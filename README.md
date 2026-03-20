
## Deploy on Vercel

This repository is configured for Vercel deployment with:

- Frontend: Vite app from `frontend/`
- Backend API: Serverless function entry at `api/[...path].js` using Express app from `backend/server.js`

### Steps

1. Import this repo into Vercel
2. Keep root directory as repository root
3. Add required Environment Variables in Vercel project settings:
	- `GROQ_API_KEY` (for `/api/ai-report-summary`, `/api/ai-chat`)
	- `OPENAI_API_KEY` (for `/api/fix-suggestions`)
	- `GOOGLE_VISION_API_KEY` and/or `OCR_SPACE_API_KEY` (for `/api/ocr`)
4. Deploy

### Notes

- WebSocket live updates are disabled in Vercel serverless mode; frontend automatically falls back to HTTP polling.
- Local development remains unchanged (`backend` on `:3000`, `frontend` on `:5173`).

### Vercel Troubleshooting

- **500 on `/api/ocr`**
	- Ensure at least one OCR provider key is configured:
		- `GOOGLE_VISION_API_KEY` and/or
		- `OCR_SPACE_API_KEY`
	- Redeploy after setting env vars.

- **503 or 502 on AI endpoints** (`/api/ai-report-summary`, `/api/ai-chat`, `/api/fix-suggestions`)
	- Check required keys:
		- `GROQ_API_KEY` for report summary + chat
		- `OPENAI_API_KEY` for fix suggestions
	- If keys were added after first deploy, trigger a new deploy.

- **Frontend loads but API calls fail**
	- Confirm Vercel serves both static app and serverless API from the same project.
	- Keep `vercel.json` at repo root.
	- Verify requests are going to `/api/...` in browser network tab.

- **Live updates not real-time on Vercel**
	- Expected behavior: Vercel serverless deployment uses HTTP fallback (no persistent WebSocket server).
	- For full real-time sockets, run backend on a dedicated Node host.

- **Large image OCR errors**
	- Capture a clearer, smaller image before upload.
	- Retry with better lighting and less background noise.

- **Local works, Vercel fails**
	- Compare local `.env` keys with Vercel Environment Variables.
	- Ensure variable names match exactly (case-sensitive).

## Mobile PWA

You can use the frontend like a mobile app by adding it to your home screen.

### Install on Android (Chrome)

1. Open the app URL in Chrome
2. Tap the menu (⋮)
3. Select **Add to Home screen**
4. Confirm to install the app icon

### Install on iPhone (Safari)

1. Open the app URL in Safari
2. Tap the **Share** button
3. Select **Add to Home Screen**
4. Tap **Add**

### Notes

- Home-screen install works as a PWA-style shortcut experience.
- Full offline support requires service worker and web manifest configuration (not yet enabled in this repo).

### Scanning (Google Vision API + Gemini API)

In Mobile PWA mode, scanning can follow this flow:

1. Capture/upload image from device camera or gallery
2. OCR text extraction using **Google Vision API**
3. Text understanding and summarization using **Gemini API**
4. Show structured insights in the app UI

Backend setup requirement:

- Configure Google Vision and Gemini API keys securely on backend environment variables before enabling scan endpoints.
