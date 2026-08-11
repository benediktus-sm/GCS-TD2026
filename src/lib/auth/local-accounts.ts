// Exempt from 300 LOC soft rule: pure data table
/**
 * @module local-accounts
 * @description Hardcoded local login roster. Bypasses Convex entirely —
 * checked client-side only. Not cryptographically secure; this is a simple
 * access gate for a small, known set of users, not a real auth system.
 *
 * Roster and bypass key are read from NEXT_PUBLIC_* env vars (see
 * .env.local, gitignored) rather than committed to source, since this repo
 * is public — keeps the actual values out of git history. They still ship
 * inside the client JS bundle at build time, same as any client-only check.
 */

export interface LocalAccount {
  name: string;
  nim: string;
}

function parseAccounts(): LocalAccount[] {
  const raw = process.env.NEXT_PUBLIC_LOCAL_ACCOUNTS;
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (entry): entry is LocalAccount =>
        typeof entry?.name === "string" && typeof entry?.nim === "string"
    );
  } catch {
    return [];
  }
}

export const LOCAL_ACCOUNTS: LocalAccount[] = parseAccounts();

/** Master key that grants access without matching a specific account. */
export const BYPASS_KEY = process.env.NEXT_PUBLIC_BYPASS_KEY ?? "";

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

/** Returns the matched account's display name, or null if no match. */
export function findLocalAccount(name: string, nim: string): string | null {
  const match = LOCAL_ACCOUNTS.find(
    (account) => normalize(account.name) === normalize(name) && account.nim.trim() === nim.trim()
  );
  return match ? match.name : null;
}

export function isBypassKey(key: string): boolean {
  return BYPASS_KEY !== "" && key.trim() === BYPASS_KEY;
}
