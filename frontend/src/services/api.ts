import { SavedPerson } from '../types/person';

// Set EXPO_PUBLIC_API_URL in a .env file at the project root, e.g.
//   EXPO_PUBLIC_API_URL=http://192.168.1.23:4000/api
// (see backend/README.md for how to run the API). Falls back to localhost,
// which only works for a web build or an iOS simulator on the same machine.
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000/api';

export class ApiError extends Error {}

async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (body?.error) message = body.error;
    } catch {
      // response wasn't JSON — keep the generic message
    }
    throw new ApiError(message);
  }
  return res.json();
}

/** Fetch every person that's been saved for reuse across sessions. */
export function fetchSavedPeople(): Promise<SavedPerson[]> {
  return fetch(`${API_URL}/people`).then((res) => handle<SavedPerson[]>(res));
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
export function createSavedPerson(name: string, imageUri?: string): Promise<SavedPerson> {
  const form = buildPhotoFormData(name, imageUri);
  return fetch(`${API_URL}/people`, { method: 'POST', body: form }).then((res) =>
    handle<SavedPerson>(res)
  );
}

/** Update a saved person's name and/or replace their photo. */
export function updateSavedPerson(
  id: string,
  updates: { name?: string; imageUri?: string }
): Promise<SavedPerson> {
  const form = new FormData();
  if (updates.name) form.append('name', updates.name);
  if (updates.imageUri) {
    appendPhoto(form, updates.imageUri);
  }
  return fetch(`${API_URL}/people/${id}`, { method: 'PUT', body: form }).then((res) =>
    handle<SavedPerson>(res)
  );
}

/** Permanently delete a saved person (and their Cloudinary photo). */
export function deleteSavedPerson(id: string): Promise<void> {
  return fetch(`${API_URL}/people/${id}`, { method: 'DELETE' }).then((res) =>
    handle<void>(res)
  );
}
