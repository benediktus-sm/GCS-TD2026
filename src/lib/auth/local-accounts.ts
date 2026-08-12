// Exempt from 300 LOC soft rule: pure data table
/**
 * @module local-accounts
 * @description Hardcoded local login roster. Bypasses Convex entirely —
 * checked client-side only. Not cryptographically secure; this is a simple
 * access gate for a small, known set of users, not a real auth system.
 */

export interface LocalAccount {
  name: string;
  nim: string;
}

export const LOCAL_ACCOUNTS: LocalAccount[] = [
  { name: "Benediktus Satryawan Marbun", nim: "125130008" },
  { name: "Muhammad Dharil Pradipta", nim: "124490074" },
  { name: "Ahda Fawadhih", nim: "124130060" },
];

/** Master key that grants access without matching a specific account. */
export const BYPASS_KEY = "IVDyQimDzlPC";

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

/**
 * Returns the matched account's display name, or null if no match.
 * Typing the bypass key into the name field grants access as "Bypass",
 * regardless of what's in the NIM field — there's no separate UI for it.
 */
export function findLocalAccount(name: string, nim: string): string | null {
  if (name.trim() === BYPASS_KEY) return "Bypass";

  const match = LOCAL_ACCOUNTS.find(
    (account) => normalize(account.name) === normalize(name) && account.nim.trim() === nim.trim()
  );
  return match ? match.name : null;
}
