# Study Tool AI - Backend

This is the backend API for the Study Tool AI application. It handles file uploads, connects to Google Gemini AI, and processes YouTube content.

## Setup

1.  **Install Dependencies:**
    ```bash
    npm install
    ```

2.  **Environment Variables:**
    Create a `.env` file in this directory with the following:
    ```env
    PORT=5000
    MONGO_URI=mongodb+srv://<your-connection-string>
    GEMINI_API_KEY=your_gemini_api_key_here
    ```

3.  **Run Locally:**
    ```bash
    npm start
    ```
    The server will run on `http://localhost:5000`.

## Deployment (Render)

- **Root Directory:** `backend`
- **Build Command:** `npm install`
- **Start Command:** `npm start`
- **Environment Variables:** Set `GEMINI_API_KEY` and `MONGO_URI` in the Render dashboard.

## Features
- **PDF Analysis:** Visual processing of PDFs.
- **YouTube Processing:** Captions + Audio fallback (native `.webm` support).
- **AI Chat:** Interactive study sessions.
