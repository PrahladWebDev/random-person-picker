import React, { createContext, useContext, useMemo, useState, ReactNode } from 'react';
import { Person } from '../types/person';
import { generateId } from '../utils/randomPicker';

type PeopleContextValue = {
  people: Person[];
  setPeopleCount: (count: number) => void;
  updatePerson: (id: string, updates: Partial<Omit<Person, 'id'>>) => void;
  removePerson: (id: string) => void;
  clearAll: () => void;
  allNamed: boolean;
  /** Appends people (e.g. picked from the saved-people list) to the current session. */
  addPeople: (newPeople: Array<Omit<Person, 'id'>>) => void;
  /** Replaces the whole session list (used by Saved People / Import so re-picking never stacks duplicates). */
  replacePeople: (newPeople: Array<Omit<Person, 'id'>>) => void;
  /** ids of people who already won this session (used by "no repeats"). */
  pastWinnerIds: string[];
  recordWinners: (ids: string[]) => void;
  resetWinners: () => void;
};

const PeopleContext = createContext<PeopleContextValue | undefined>(undefined);

export function PeopleProvider({ children }: { children: ReactNode }) {
  const [people, setPeople] = useState<Person[]>([]);
  const [pastWinnerIds, setPastWinnerIds] = useState<string[]>([]);

  const setPeopleCount = (count: number) => {
    setPeople((prev) => {
      const next = [...prev];
      if (count > next.length) {
        for (let i = next.length; i < count; i++) {
          next.push({ id: generateId(), name: '' });
        }
      } else {
        next.length = count;
      }
      return next;
    });
  };

  const updatePerson = (id: string, updates: Partial<Omit<Person, 'id'>>) => {
    setPeople((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));
  };

  const removePerson = (id: string) => {
    setPeople((prev) => prev.filter((p) => p.id !== id));
  };

  const clearAll = () => {
    setPeople([]);
    setPastWinnerIds([]);
  };

  const recordWinners = (ids: string[]) => {
    setPastWinnerIds((prev) => [...new Set([...prev, ...ids])]);
  };

  const resetWinners = () => setPastWinnerIds([]);

  const addPeople = (newPeople: Array<Omit<Person, 'id'>>) => {
    setPeople((prev) => [...prev, ...newPeople.map((p) => ({ ...p, id: generateId() }))]);
  };

  const replacePeople = (newPeople: Array<Omit<Person, 'id'>>) => {
    setPeople(newPeople.map((p) => ({ ...p, id: generateId() })));
    setPastWinnerIds([]); // brand-new list, so nobody has won yet
  };

  const allNamed = useMemo(
    () => people.length >= 2 && people.every((p) => p.name.trim().length > 0),
    [people]
  );

  const value: PeopleContextValue = {
    people,
    setPeopleCount,
    updatePerson,
    removePerson,
    clearAll,
    allNamed,
    addPeople,
    replacePeople,
    pastWinnerIds,
    recordWinners,
    resetWinners,
  };

  return <PeopleContext.Provider value={value}>{children}</PeopleContext.Provider>;
}

export function usePeople() {
  const ctx = useContext(PeopleContext);
  if (!ctx) throw new Error('usePeople must be used within a PeopleProvider');
  return ctx;
}
