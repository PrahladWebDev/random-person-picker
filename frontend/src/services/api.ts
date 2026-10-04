import { SavedPerson, SavedGroup, HistoryEntry } from '../types/person';
import { getStoredToken, clearStoredSession, notifySessionExpired } from '../context/AuthContext';

// Set EXPO_PUBLIC_API_URL in a .env file at the project root, e.g.
//   EXPO_PUBLIC_API_URL=http://192.168.1.23:4000/api
// (see backend/README.md for how to run the API). Falls back to localhost,
// which only works for a web build or an iOS simulator on the same machine.
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000/api';

export class ApiError extends Error {}

// Every request carries this account's sign-in token, so the backend only
// ever returns/modifies people saved by this account, not anyone else's.
// Without this header, saved people (names + photos) would be visible to
// every signed-in user — see backend/src/routes/people.js.
async function authHeaders(): Promise<Record<string, string>> {
  const token = await getStoredToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (body?.error) message = body.error;
    } catch {
      // response wasn't JSON — keep the generic message
    }
    if (res.status === 401) {
      // Token missing/expired/invalid — drop the stale session so the app
      // falls back to the sign-in screen instead of silently failing every
      // subsequent request.
      await clearStoredSession();
      notifySessionExpired();
    }
    throw new ApiError(message);
  }
  return res.json();
}

/** Fetch every person this device has saved for reuse across sessions. */
export async function fetchSavedPeople(): Promise<SavedPerson[]> {
  const headers = await authHeaders();
  return fetch(`${API_URL}/people`, { headers }).then((res) => handle<SavedPerson[]>(res));
}

// Expo SDK 57's own global fetch has an unreliable multipart encoder for
// local file/content URIs (converting via Blob corrupts the image — see
// EXPO_PUBLIC_USE_RN_FETCH below). React Native's native fetch handles this
// classic { uri, name, type } shape correctly and reads the real file bytes.
function appendPhoto(form: FormData, imageUri: string) {
  const filename = imageUri.split('/').pop() || 'photo.jpg';
  const match = /\.(\w+)$/.exec(filename);
  const ext = match ? match[1].toLowerCase() : 'jpg';
  const type = ext === 'png' ? 'image/png' : 'image/jpeg';
  form.append('photo', { uri: imageUri, name: filename, type } as unknown as Blob);
}

function buildPhotoFormData(name: string, imageUri?: string) {
  const form = new FormData();
  form.append('name', name);
  if (imageUri) {
    appendPhoto(form, imageUri);
  }
  return form;
}

/** Save a new person (name + optional photo) for reuse in future sessions. */
export async function createSavedPerson(name: string, imageUri?: string): Promise<SavedPerson> {
  const form = buildPhotoFormData(name, imageUri);
  const headers = await authHeaders();
  return fetch(`${API_URL}/people`, { method: 'POST', body: form, headers }).then((res) =>
    handle<SavedPerson>(res)
  );
}

/** Update a saved person's name and/or replace their photo. */
export async function updateSavedPerson(
  id: string,
  updates: { name?: string; imageUri?: string }
): Promise<SavedPerson> {
  const form = new FormData();
  if (updates.name) form.append('name', updates.name);
  if (updates.imageUri) {
    appendPhoto(form, updates.imageUri);
  }
  const headers = await authHeaders();
  return fetch(`${API_URL}/people/${id}`, { method: 'PUT', body: form, headers }).then((res) =>
    handle<SavedPerson>(res)
  );
}

/** Permanently delete a saved person (and their Cloudinary photo). */
export async function deleteSavedPerson(id: string): Promise<void> {
  const headers = await authHeaders();
  return fetch(`${API_URL}/people/${id}`, { method: 'DELETE', headers }).then((res) =>
    handle<void>(res)
  );
}

// ---------------------------------------------------------------- Groups --

/** Fetch this account's saved groups. */
export async function fetchGroups(): Promise<SavedGroup[]> {
  const headers = await authHeaders();
  return fetch(`${API_URL}/groups`, { headers }).then((res) => handle<SavedGroup[]>(res));
}

/** Create a group from a set of saved-person ids. */
export async function createGroup(name: string, memberIds: string[]): Promise<SavedGroup> {
  const headers = { ...(await authHeaders()), 'Content-Type': 'application/json' };
  return fetch(`${API_URL}/groups`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ name, memberIds }),
  }).then((res) => handle<SavedGroup>(res));
}

/** Delete a group (the people in it are untouched). */
export async function deleteGroup(id: string): Promise<void> {
  const headers = await authHeaders();
  return fetch(`${API_URL}/groups/${id}`, { method: 'DELETE', headers }).then((res) =>
    handle<void>(res)
  );
}

// --------------------------------------------------------------- History --

/** Fetch past picks, newest first. */
export async function fetchHistory(): Promise<HistoryEntry[]> {
  const headers = await authHeaders();
  return fetch(`${API_URL}/history`, { headers }).then((res) => handle<HistoryEntry[]>(res));
}

/** Record a pick. Only remote (http) photo URLs are kept by the server. */
export async function addHistory(
  winners: Array<{ name: string; imageUrl?: string }>,
  poolSize: number
): Promise<HistoryEntry> {
  const headers = { ...(await authHeaders()), 'Content-Type': 'application/json' };
  return fetch(`${API_URL}/history`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ winners, poolSize }),
  }).then((res) => handle<HistoryEntry>(res));
}

export async function deleteHistoryEntry(id: string): Promise<void> {
  const headers = await authHeaders();
  return fetch(`${API_URL}/history/${id}`, { method: 'DELETE', headers }).then((res) =>
    handle<void>(res)
  );
}

export async function clearHistory(): Promise<void> {
  const headers = await authHeaders();
  return fetch(`${API_URL}/history`, { method: 'DELETE', headers }).then((res) =>
    handle<void>(res)
  );
}
