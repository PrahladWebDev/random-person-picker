# RandomPick API

A tiny Express + MongoDB (Mongoose) + Cloudinary API that lets the app remember
people across sessions, so you don't have to retype names and re-pick photos
every time. Every saved person belongs to a signed-in account — one account
never sees another account's saved names/photos.

## Auth endpoints

| Method | Path                          | Body (JSON)                          | Description                                     |
|--------|-------------------------------|---------------------------------------|--------------------------------------------------|
| POST   | /api/auth/register            | `email`, `password`                   | Create an account, emails a 6-digit code          |
| POST   | /api/auth/verify-email        | `email`, `code`                       | Confirm the code, returns a login token           |
| POST   | /api/auth/resend-verification | `email`                               | Re-send the verification code                     |
| POST   | /api/auth/login               | `email`, `password`                   | Sign in, returns a login token                    |
| POST   | /api/auth/forgot-password     | `email`                               | Emails a 6-digit password-reset code               |
| POST   | /api/auth/reset-password      | `email`, `code`, `newPassword`        | Confirm the code and set a new password            |

## Saved-people endpoints

All of these require `Authorization: Bearer <token>` (the token returned by
verify-email/login/reset-password). They only ever return/modify the
signed-in account's own saved people.

| Method | Path              | Body (multipart/form-data)     | Description                        |
|--------|-------------------|---------------------------------|-------------------------------------|
| GET    | /api/people       | —                                | List this account's saved people    |
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
   - `JWT_SECRET` — any long random string (e.g.
     `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`)
   - `GMAIL_USER` — the Gmail address OTP/reset emails will be sent from
   - `GMAIL_APP_PASSWORD` — a 16-character **App Password**, not your normal
     Gmail password. Turn on 2-Step Verification on that Google account, then
     generate one at https://myaccount.google.com/apppasswords
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

