# AI-Powered Interview Platform — Backend

This directory contains the backend API and server-side logic for the AI Interview Platform.

Purpose
- Serves API endpoints for interviews, jobs, candidates, and results.
- Handles AI integrations and persistence.

Quick start (Windows)
1. Ensure Python 3.10+ is installed.
2. Create and activate a virtual environment:
   - `python -m venv venv`
   - `venv\\Scripts\\activate`
3. Install dependencies:
   - `pip install -r requirements.txt` (create `requirements.txt` if missing)
4. Run the server for development:
   - `uvicorn main:app --reload`

Notes
- Store secrets (DB URL, API keys) in a `.env` file or environment variables.
- See `main.py` for the app entrypoint and route definitions.
