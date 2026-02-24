# Copilot Instructions for myhtml3 Workspace

This repository is a small personal media server with a web UI. It uses Node.js/Express on the backend and plain HTML/JavaScript on the frontend. Below are key points that help Copilot (or any AI) become productive quickly.

## 1. High‑Level Architecture

- **Backend** lives in `server/`:
  - `maychu.js` is the entrypoint. It sets up an Express application listening on port 3000.
  - `arrangeFile.js` handles post‑upload processing: converts non‑H.264 MP4s via `ffmpeg`, removes duplicate uploads, and exposes `xuLyTatCaFile`/`donDepTrungLap` helpers. It exports an `arranging` flag used by middleware.
  - `portGuard.js` is a simple request logger and flood/scan detector; attached as a global middleware.
  - Uploads are first saved to `server/quarantine`; valid files are moved to `server/uploads`.
  - Static assets served from `client/` (main application) and `clientlogin/` (login page).
  - Authentication is session‑based (`express-session`) using a hard‑coded admin credential object in `maychu.js`.
  - API endpoints cover login (`/dangnhap`, `/xuly-dangnhap`), logout, user info, IP/storage stats, file upload (`/guifile`), download (`/download/:filename`), search, and endpoints for ESP device data, song/video listings, etc.

- **Frontend** is pure HTML/CSS/JS. There is no build step or bundler.
  - `client/` hosts the interactive player (`GETinteractive.html`) and supporting scripts (`script.js`, `mainpage.js`, etc.).
  - `clientlogin/` contains the login form and CSS.
  - JavaScript is heavily commented in Vietnamese and contains all player logic (audio controls, shuffle, repeat, UI animations).
  - Static paths in the client correspond directly to server routes (e.g. `/download/...`, `/videoshort/...`).

- **External dependencies**
  - Node packages (no `package.json`): `express`, `cors`, `multer`, `file-type@16`, `unidecode`, `express-session`.
  - Native binaries required: `ffmpeg` and `ffprobe` on the system `PATH` for video conversion.

## 2. Key Workflows & Commands

1. **Setup** (no automated script present):
   ```powershell
   cd e:\myhtml3\server
   npm install express cors multer file-type@16 unidecode express-session
   # ensure ffmpeg/ffprobe available globally
   ```
2. **Run server**:
   ```powershell
   node maychu.js
   ```
   Server logs go to `server/logs/port-activity.txt` and console. The web UI is at `http://localhost:3000` after logging in.
3. **Debugging**
   - Look at `console.log` statements in `maychu.js` and `arrangeFile.js`.
   - Flood/scan events are annotated by `portGuard`.
   - Storage usage and file lists are exposed via `/get-storage-usage`, `/layvideoshort`, `/songlist`.
4. **Configuration tweaks**
   - Admin account defined in `maychu.js` (`TAI_KHOAN_ADMIN`).
   - Allowed extensions in `allowedExts` array.
   - Bandwidth limits and maximum upload size are in `maychu.js`.
   - `server/uploads` size limit shown in response (`5000 MB`) is a hard‑coded string; adjust if necessary.

## 3. Project‑Specific Patterns & Conventions

- **Vietnamese comments/identifiers**: functions like `yeuCauDangNhap`, `sapxepFiles`, `donDepTrungLap`. Understanding or translating may be necessary when editing.
- **Filesystem naming**: uploaded files are prefixed with a Vietnamese timestamp `day DD-MM-YYYY at H_M_S`, and sanitized by `tenFileAnToan` (removes diacritics with `unidecode`, replaces spaces with `-`, strips forbidden chars).
- **Synchronous I/O**: the server frequently uses `fs.*Sync` (e.g. `readdirSync`, `statSync`). It's acceptable within this small app but be careful when adding new features.
- **Middleware ordering matters**: public (`clientlogin`) static middleware is registered before login‑required routes to avoid infinite redirects.
- **State tracking**: global variables (e.g. `duLieuJsonESP`, `trangThaiESPJson`) used for simple in‑memory data; persistence does not exist.
- **Session check**: `yeuCauDangNhap` returns 302 redirect to `/dangnhap` for unauthenticated requests; most protected routes chain it with `checkArranging`.
- **File‑type validation**: content sniffing via `file-type` library in `validateFileByContent`; MP3/MP4 have special base‑type allowances.

## 4. Integration Points & External Services

- The front‑end fetches from the same host; CORS is enabled globally.
- ESP devices post JSON to `/esp_sending`; the server holds latest reading in memory and returns it on `/dataesp`.
- Uploaded MP4/MP3 trigger the `xuLyTatCaFile` conversion which relies on `ffmpeg`.

## 5. Notes for AI Assistance

- When generating or modifying code, keep the Vietnamese naming consistent with existing patterns.
- There is no linter/formatter specified; follow the style in existing files (2‑space indentation, `'use strict'` at top of JS files).
- No build/test automation: tests are manual via the browser or hitting endpoints with tools like `curl`.
- Adding new dependencies requires updating the README (if you write one) and instructing the developer to install them manually.
- Be cautious modifying `arrangeFile.js`: the `arranging` export flag is used by middleware to block uploads/downloads while processing.

---

Please review and let me know if any section needs more detail or if I missed important conventions or workflows.