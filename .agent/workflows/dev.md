---
description: Start the local dev servers for backend (FastAPI/uvicorn) and frontend (Vite)
---

## Backend — FastAPI Dev Server

1. Ensure Python dependencies are installed.
// turbo
2. Run `pip install -r requirements.txt` in `c:\Users\aarya\Desktop\Project-Athena\backend`.

3. Start the FastAPI server with hot-reload.
4. Run `uvicorn main:app --reload --host 0.0.0.0 --port 8000` in `c:\Users\aarya\Desktop\Project-Athena\backend` as a background process.

5. Confirm the backend is running at http://localhost:8000.

## Frontend — Vite Dev Server

6. Ensure Node dependencies are installed.
// turbo
7. Run `npm install` in `c:\Users\aarya\Desktop\Project-Athena\frontend` (only if `node_modules` is missing).

8. Start the Vite dev server.
9. Run `npm run dev` in `c:\Users\aarya\Desktop\Project-Athena\frontend` as a background process.

10. Confirm the frontend is running (typically at http://localhost:5173) and report both URLs to the user.
