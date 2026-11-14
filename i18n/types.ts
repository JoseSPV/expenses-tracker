import type es from "./dictionaries/es.json";

/** The Spanish dictionary is the source of truth for the shape every locale must provide. */
export type Dictionary = typeof es;

export type SeedText = Dictionary["seed"];

export interface PluralForms {
  one: string;
  other: string;
}
