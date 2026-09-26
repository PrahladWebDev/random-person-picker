import { Person } from '../types/person';

/**
 * Picks one person at random with equal probability for every entry.
 */
export function pickRandomPerson(people: Person[]): Person {
  if (people.length === 0) {
    throw new Error('Cannot pick from an empty list of people.');
  }
  const index = Math.floor(Math.random() * people.length);
  return people[index];
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
