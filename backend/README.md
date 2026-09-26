# RandomPick API

A tiny Express + MongoDB (Mongoose) + Cloudinary API that lets the app remember
people across sessions, so you don't have to retype names and re-pick photos
every time.

## Endpoints

| Method | Path              | Body (multipart/form-data)     | Description                        |
|--------|-------------------|---------------------------------|-------------------------------------|
| GET    | /api/people       | —                                | List all saved people               |
| POST   | /api/people       | `name`, `photo` (file, optional) | Create a saved person                |
| PUT    | /api/people/:id   | `name?`, `photo?` (file)         | Update a saved person's name/photo   |
| DELETE | /api/people/:id   | —                                | Delete a saved person                |

Photos are uploaded straight through to Cloudinary (folder `randompick/people`);
only the resulting `imageUrl` / `imagePublicId` are stored in MongoDB.

## Setup

1. `cd backend && npm install`
2. Copy `.env.example` to `.env` and fill in:
   - `MONGODB_URI` — a local MongoDB instance or an Atlas connection string
   - `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` — from your
     Cloudinary dashboard's "Account Details" panel
3. `npm run dev` (or `npm start`) — the API listens on `PORT` (default `4000`)

## Pointing the app at this API

In the Expo app, set `EXPO_PUBLIC_API_URL` to wherever this server is reachable
from your phone/simulator, e.g.:

```
EXPO_PUBLIC_API_URL=http://192.168.1.23:4000/api
```

Use your computer's LAN IP (not `localhost`) when testing on a physical device,
since the phone can't reach your computer's `localhost`. When you deploy the
API (Render, Railway, Fly.io, etc.), point it at that public URL instead.
