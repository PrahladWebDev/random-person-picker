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

/**
 * Picks `count` different people, every person having the same chance.
 * Uses a partial Fisher–Yates shuffle on a copy, so nobody is picked twice
 * and the input array isn't modified.
 */
export function pickRandomPeople(people: Person[], count: number): Person[] {
  if (people.length === 0) {
    throw new Error('Cannot pick from an empty list of people.');
  }
  const n = Math.max(1, Math.min(count, people.length));
  const pool = [...people];
  for (let i = 0; i < n; i++) {
    const j = i + Math.floor(Math.random() * (pool.length - i));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, n);
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
