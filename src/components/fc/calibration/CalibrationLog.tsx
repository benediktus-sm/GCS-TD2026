"use client";

import { useRef, useEffect } from "react";
import { Trash2, Terminal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { type CalibrationLogEntry, SEVERITY_COLORS } from "./calibration-types";

export function CalibrationLog({
  logEntries,
  onClear,
}: {
  logEntries: CalibrationLogEntry[];
  onClear: () => void;
}) {
  const logContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = logContainerRef.current;
    if (!container) return;
    // Scroll only the log container, never the parent page/layout.
    container.scrollTop = container.scrollHeight;
  }, [logEntries]);

  return (
    <div className="xl:sticky xl:top-6 xl:self-start">
      <div className="border border-border-default bg-bg-secondary rounded-lg overflow-hidden">
        {/* Terminal Header */}
        <div className="flex items-center justify-between px-3.5 py-2.5 bg-bg-tertiary/50 border-b border-border-default">
          <div className="flex items-center gap-2">
            <Terminal size={14} className="text-text-tertiary" />
            <h3 className="text-xs font-medium text-text-primary">
              Calibration Log
            </h3>
            {logEntries.length > 0 && (
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-bg-primary text-text-tertiary">
                {logEntries.length}
              </span>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClear}
            className="h-6 w-6 p-0 text-text-tertiary hover:text-text-primary"
            title="Clear log"
          >
            <Trash2 size={13} />
          </Button>
        </div>

        {/* Monospace Log Content */}
        <div
          ref={logContainerRef}
          className="h-[440px] overflow-y-auto overscroll-contain p-3 font-mono text-[10px] space-y-1 bg-bg-primary/60"
        >
          {logEntries.length === 0 ? (
            <p className="text-text-tertiary italic">No calibration messages recorded yet.</p>
          ) : (
            logEntries.map((entry, i) => (
              <div key={i} className="flex gap-2">
                <span className="text-text-tertiary shrink-0">
                  {new Date(entry.timestamp).toLocaleTimeString("en-US", {
                    hour12: false,
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  })}
                </span>
                <span className={cn(SEVERITY_COLORS[entry.severity] ?? "text-text-tertiary")}>
                  {entry.text}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}


