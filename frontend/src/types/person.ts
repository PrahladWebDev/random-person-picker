export type Person = {
  id: string;
  name: string;
  imageUri?: string;
  /** Set when this person came from the saved list, so we never re-save a duplicate. */
  savedId?: string;
};

// A person saved on the backend (MongoDB), with a photo hosted on Cloudinary.
// Kept separate from `Person` because it carries server-only fields — once
// added to a session, a SavedPerson is converted into a plain `Person`.
export type SavedPerson = {
  _id: string;
  name: string;
  imageUrl?: string;
  createdAt?: string;
};

// A named set of saved people, loaded in one tap.
export type SavedGroup = {
  _id: string;
  name: string;
  memberIds: string[];
};

// One past pick, stored per account on the backend.
export type HistoryEntry = {
  _id: string;
  winners: Array<{ name: string; imageUrl?: string }>;
  poolSize: number;
  createdAt: string;
};

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  VerifyEmail: { email: string };
  ForgotPassword: undefined;
  ResetPassword: { email: string };
  Home: undefined;
  NumberOfPeople: undefined;
  AddPeople: { count: number };
  ImportContacts: undefined;
  Review: undefined;
  RandomPicker: undefined;
  Winner: { winners: Person[]; poolSize: number };
  History: undefined;
  SavedPeople: undefined;
};
