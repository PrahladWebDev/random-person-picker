export type Person = {
  id: string;
  name: string;
  imageUri?: string;
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

export type RootStackParamList = {
  Home: undefined;
  NumberOfPeople: undefined;
  AddPeople: { count: number };
  Review: undefined;
  RandomPicker: undefined;
  Winner: { winner: Person };
  SavedPeople: undefined;
};
