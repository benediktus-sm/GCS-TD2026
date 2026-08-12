"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { useLocalGateStore } from "@/stores/local-gate-store";
import { findLocalAccount } from "@/lib/auth/local-accounts";

export function LocalLoginGate({ children }: { children: ReactNode }) {
  const unlocked = useLocalGateStore((s) => s.unlocked);
  const unlockWithAccount = useLocalGateStore((s) => s.unlockWithAccount);

  const [name, setName] = useState("");
  const [nim, setNim] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (unlocked) return <>{children}</>;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    const match = findLocalAccount(name, nim);
    if (match) {
      unlockWithAccount(match);
    } else {
      setError("Nama atau NIM tidak cocok.");
    }
  };

  return (
    <div className="h-dvh w-full flex items-center justify-center bg-bg-primary">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-panel border border-border-default bg-bg-secondary p-6 flex flex-col gap-4 shadow-lg shadow-black/40"
      >
        <div className="flex flex-col items-center gap-3 pb-1">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo swarnakasa.png" alt="" className="h-10 w-10 rounded" />
          <div className="flex flex-col items-center gap-1 text-center">
            <h1 className="text-sm font-semibold uppercase tracking-wider text-text-primary">
              Swarnakasa TD GCS
            </h1>
            <p className="text-xs text-text-tertiary">Limited Access.</p>
          </div>
        </div>

        <label className="flex flex-col gap-1 text-xs text-text-secondary">
          Nama
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded border border-border-default bg-bg-primary px-2 py-1.5 text-text-primary text-sm outline-none focus:border-accent-primary"
            autoComplete="off"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-text-secondary">
          NIM
          <input
            type="text"
            value={nim}
            onChange={(e) => setNim(e.target.value)}
            className="rounded border border-border-default bg-bg-primary px-2 py-1.5 text-text-primary text-sm outline-none focus:border-accent-primary"
            autoComplete="off"
          />
        </label>

        {error && <p className="text-xs text-status-error">{error}</p>}

        <button
          type="submit"
          className="rounded bg-accent-primary text-bg-primary text-xs font-semibold uppercase tracking-wider py-2 hover:opacity-90 transition-opacity"
        >
          Masuk
        </button>
      </form>
    </div>
  );
}
