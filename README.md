# RandomPick

Split into two independent folders:

- **`backend/`** — Express + MongoDB + Cloudinary API. See `backend/README.md`.
- **`frontend/`** — the Expo (React Native) app. See `frontend/README.md`.

## Quick start

```bash
# 1. Backend
cd backend
npm install
cp .env.example .env   # fill in MONGODB_URI + Cloudinary keys
npm run dev

# 2. Frontend (in a second terminal)
cd frontend
npm install
cp .env.example .env   # set EXPO_PUBLIC_API_URL to the backend's LAN IP, e.g.
                        # EXPO_PUBLIC_API_URL=http://192.168.1.23:4000/api
npx expo start
```

Run them from separate terminals — they're two separate `npm install`s / `package.json`s now, not one workspace.

## Fixes in this copy

- **"Pick Again" now re-shuffles.** It previously picked the next winner instantly and swapped the Winner screen for itself with no animation. It now sends you back through the shuffle screen so "Pick Again" looks the same as the first pick.
- **Photo upload failures are no longer silent.** The backend used to log the real error to its own console but always send the app a generic "Failed to save person." — so a bad Cloudinary key and a bad Mongo URI looked identical, with no way to tell why a photo didn't save. The actual error message (e.g. "Invalid api_key") is now returned to the app and shown in its alert, and the server also warns at startup if Cloudinary env vars are missing.

## If photos still aren't storing, check in this order

1. **`backend/.env` exists and has real values.** Only `.env.example` ships in the zip — copy it to `.env` and fill in `MONGODB_URI` and the three `CLOUDINARY_*` keys from your Cloudinary dashboard. Missing/wrong keys now log a warning when the server starts and show the real Cloudinary error in the app's alert instead of a generic message.
2. **`frontend/.env` points at a reachable backend.** `EXPO_PUBLIC_API_URL` defaults to `http://localhost:4000/api`, which only works in a web build or iOS simulator on the same machine. On a physical phone via Expo Go, `localhost` means the *phone itself* — it can't reach your computer. Set it to your computer's LAN IP instead (e.g. `http://192.168.1.23:4000/api`), and make sure the phone and computer are on the same network.
3. **MongoDB is actually running/reachable** at the `MONGODB_URI` you set — if it isn't, the server fails to boot entirely (it exits with a connection error on start), which is easy to mistake for "runs fine but photos don't save."
