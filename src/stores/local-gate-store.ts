/**
 * @module local-gate-store
 * @description Zustand store for the local login gate (hardcoded roster +
 * bypass key). Entirely independent of Convex auth — this only controls
 * whether the app UI renders past the landing/login screen.
 *
 * Uses sessionStorage (not localStorage) intentionally: each new tab or
 * browser session must log in again, but a page refresh within the same
 * tab stays logged in.
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface LocalGateState {
  unlocked: boolean;
  activeUser: string | null;
  unlockWithAccount: (displayName: string) => void;
  unlockWithBypass: () => void;
  lock: () => void;
}

export const useLocalGateStore = create<LocalGateState>()(
  persist(
    (set) => ({
      unlocked: false,
      activeUser: null,
      unlockWithAccount: (displayName) => set({ unlocked: true, activeUser: displayName }),
      unlockWithBypass: () => set({ unlocked: true, activeUser: "Bypass" }),
      lock: () => set({ unlocked: false, activeUser: null }),
    }),
    {
      name: "local-gate-store",
      version: 1,
      storage: createJSONStorage(() => sessionStorage),
      migrate: (persisted) => persisted as LocalGateState,
    }
  )
);
