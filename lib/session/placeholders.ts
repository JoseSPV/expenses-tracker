export interface Person {
  name: string;
  email: string;
}

export interface BookSummary {
  id: string;
  name: string;
}

export interface Invite {
  id: string;
  bookName: string;
}

export type BookList = { ok: true; books: BookSummary[] } | { ok: false; reason: "unavailable" };

export type SessionAction = { ok: true } | { ok: false; reason: "unavailable" };

/** Placeholder. The real list will come from Supabase for the signed-in person. */
export function listBooks(): BookList {
  return { ok: false, reason: "unavailable" };
}

/** Placeholder. Pending invites will come from Supabase. */
export function listInvites(): Invite[] {
  return [];
}

/** Placeholder. Creating a book will be one Supabase call. */
export function createBook(_name: string): SessionAction {
  return { ok: false, reason: "unavailable" };
}

/** Placeholder. Accepting or declining an invite will be one Supabase call. */
export function respondToInvite(_id: string, _accept: boolean): SessionAction {
  return { ok: false, reason: "unavailable" };
}

/** Placeholder. Deleting the account will be one Supabase call. */
export function deleteAccount(): SessionAction {
  return { ok: false, reason: "unavailable" };
}
