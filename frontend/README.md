# RandomPick – Random Person Picker

Built for **Expo SDK 57** (React Native 0.86, React 19.2, Expo Go 57).

## Setup

```bash
npm install
cp .env.example .env   # point EXPO_PUBLIC_API_URL at your running backend (see backend/README.md)
npx expo start
```

Scan the QR code with **Expo Go** (SDK 57 build) on Android/iOS, or press `a` / `i` for a simulator.

The backend (Express + MongoDB + Cloudinary) that powers "Saved People" lives in
[`./backend`](./backend) — see its README for setup. The app works fine without
it, except the "Use Saved People" / "Save to My People" actions will show a
connection error until the API is running and reachable.

## Flow

Home → Number of People → Add People (name + optional photo) → Review → Random Picker (shuffle animation, with sound) → Winner (Pick Again / Edit People / Start Over).

Home also has **Use Saved People**, which opens a list of people saved via the
backend (photo included) — pick any number of them and jump straight to Review.
From Review, **Save to My People** persists the current list to the backend so
it's available next time.

## Notes

- The current session's people list is still in-memory (React Context) — only
  people explicitly saved via "Save to My People" / the Saved People screen
  persist across app restarts, in MongoDB, with photos hosted on Cloudinary.
- Photo picking uses `expo-image-picker`; permission is requested at pick time and cancellation is handled gracefully.
- Selection uses `Math.floor(Math.random() * people.length)` so every person has equal probability.
- The shuffle plays a short tick sound on every step (`expo-audio`) and a chime when it lands on the winner; haptics still fire alongside them.
- Light/dark mode is automatic via `useColorScheme`.
- SDK 57 dropped the `newArchEnabled` app.json key — the New Architecture is the only architecture, so nothing to configure there.
