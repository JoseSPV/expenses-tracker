"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { Person } from "@/lib/session/placeholders";

const PersonContext = createContext<Person | null>(null);

export function PersonProvider({ person, children }: { person: Person | null; children: ReactNode }) {
  return <PersonContext.Provider value={person}>{children}</PersonContext.Provider>;
}

export function usePerson(): Person | null {
  return useContext(PersonContext);
}
