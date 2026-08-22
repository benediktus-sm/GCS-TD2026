"use client";

import { cn } from "@/lib/utils";
import { Loader2, CheckCircle2, XCircle, Circle, AlertCircle, Info, Check, X, Play, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CompassProgressDisplay, CompassResultsDisplay } from "./compass-display";

export type CalibrationStatus = "idle" | "in_progress" | "waiting_accept" | "cal_warning" | "success" | "error";

export interface CalibrationStep {
  label: string;
  description: string;
}

export interface CompassProgressEntry {
  compassId: number;
  completionPct: number;
  calStatus: number;
  completionMask: number[];
  direction: { x: number; y: number; z: number };
}

export interface CompassResultEntry {
  compassId: number;
  ofsX: number; ofsY: number; ofsZ: number;
  fitness: number; calStatus: number;
  diagX: number; diagY: number; diagZ: number;
  offdiagX: number; offdiagY: number; offdiagZ: number;
  orientationConfidence: number;
  oldOrientation: number; newOrientation: number; scaleFactor: number;
}

interface CalibrationWizardProps {
  title: string;
  description: string;
  steps: CalibrationStep[];
  currentStep: number;
  status: CalibrationStatus;
  progress?: number;
  statusMessage?: string;
  waitingForConfirm?: boolean;
  onConfirm?: () => void;
  confirmLabel?: string;
  compassProgress?: CompassProgressEntry[];
  compassResults?: CompassResultEntry[];
  failureFixes?: string[];
  preTips?: string[];
  onStart: () => void;
  onCancel?: () => void;
  onForceSave?: () => void;
  unsupportedNotice?: string;
  className?: string;
}

const statusBadge: Record<CalibrationStatus, { label: string; className: string }> = {
  idle: { label: "Ready", className: "bg-bg-tertiary text-text-tertiary border-border-default/60" },
  in_progress: { label: "Calibrating", className: "bg-accent-primary/20 text-accent-primary border-accent-primary/30" },
  waiting_accept: { label: "Review & Accept", className: "bg-status-warning/20 text-status-warning border-status-warning/30" },
  cal_warning: { label: "Review Results", className: "bg-status-warning/20 text-status-warning border-status-warning/30" },
  success: { label: "Complete", className: "bg-status-success/20 text-status-success border-status-success/30" },
  error: { label: "Failed", className: "bg-status-error/20 text-status-error border-status-error/30" },
};

export function CalibrationWizard({
  title, description, steps, currentStep, status, progress, statusMessage,
  waitingForConfirm, onConfirm, confirmLabel = "Confirm Position",
  compassProgress, compassResults, failureFixes, preTips,
  onStart, onCancel, onForceSave, unsupportedNotice, className,
}: CalibrationWizardProps) {
  const badge = statusBadge[status];
  const is6PosAccel = steps.length === 6;

  return (
    <div className={cn("border border-border-default bg-bg-secondary p-4.5 rounded-lg space-y-4", className)}>
      {/* Title & Status Badge Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-medium text-text-primary">{title}</h3>
          <p className="text-xs text-text-tertiary mt-0.5 leading-relaxed">{description}</p>
        </div>
        <span className={cn("text-[10px] font-mono font-medium px-2 py-0.5 rounded border shrink-0", badge.className)}>
          {badge.label}
        </span>
      </div>

      {/* Pre-flight checklist / tips */}
      {preTips && preTips.length > 0 && status === "idle" && (
        <div className="rounded border border-border-default/80 bg-bg-tertiary/40 p-3 space-y-2">
          <p className="text-[11px] font-medium text-text-secondary flex items-center gap-1.5">
            <Info size={13} className="text-accent-primary shrink-0" />
            <span>Pre-calibration Checklist</span>
          </p>
          <ol className="space-y-1 pl-1">
            {preTips.map((tip, i) => (
              <li key={i} className="text-[11px] text-text-tertiary flex items-start gap-2">
                <span className="text-text-secondary font-mono text-[10px] shrink-0 mt-0.5">{i + 1}.</span>
                <span className="leading-snug">{tip}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Calibration Steps */}
      {steps.length > 0 && (
        <div>
          {/* 6-Position Accelerometer Step Grid */}
          {is6PosAccel ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {steps.map((step, i) => {
                const isComplete =
                  status === "success" ||
                  status === "waiting_accept" ||
                  status === "cal_warning" ||
                  (status === "in_progress" && i < currentStep);
                const isCurrent = status === "in_progress" && i === currentStep;
                const isFailed = status === "error" && i === currentStep;

                return (
                  <div
                    key={i}
                    className={cn(
                      "p-2.5 rounded border transition-colors",
                      isCurrent
                        ? "border-accent-primary bg-accent-primary/10"
                        : isComplete
                        ? "border-status-success/30 bg-status-success/5"
                        : isFailed
                        ? "border-status-error/30 bg-status-error/5"
                        : "border-border-default/60 bg-bg-tertiary/30"
                    )}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="text-[10px] font-mono text-text-tertiary">Position {i + 1}</span>
                      {isComplete ? (
                        <CheckCircle2 size={14} className="text-status-success" />
                      ) : isFailed ? (
                        <XCircle size={14} className="text-status-error" />
                      ) : isCurrent ? (
                        <Loader2 size={14} className="text-accent-primary animate-spin" />
                      ) : (
                        <Circle size={14} className="text-text-tertiary/60" />
                      )}
                    </div>
                    <span className={cn("text-xs font-medium block truncate", isCurrent ? "text-text-primary" : "text-text-secondary")}>
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Standard step list */
            <div className="space-y-1.5">
              {steps.map((step, i) => {
                const isComplete =
                  status === "success" ||
                  status === "waiting_accept" ||
                  status === "cal_warning" ||
                  (status === "in_progress" && i < currentStep);
                const isCurrent = status === "in_progress" && i === currentStep;
                const isFailed = status === "error" && i === currentStep;

                return (
                  <div
                    key={i}
                    className={cn(
                      "flex items-start gap-2.5 p-2 rounded border transition-colors",
                      isCurrent
                        ? "border-accent-primary/60 bg-accent-primary/10"
                        : isComplete
                        ? "border-status-success/20 bg-status-success/5"
                        : "border-border-default/40 bg-bg-tertiary/20"
                    )}
                  >
                    <div className="mt-0.5 shrink-0">
                      {isComplete ? (
                        <CheckCircle2 size={14} className="text-status-success" />
                      ) : isFailed ? (
                        <XCircle size={14} className="text-status-error" />
                      ) : isCurrent ? (
                        <Loader2 size={14} className="text-accent-primary animate-spin" />
                      ) : (
                        <Circle size={14} className="text-text-tertiary/50" />
                      )}
                    </div>
                    <div className="flex-1">
                      <span className={cn("text-xs font-medium block", isCurrent ? "text-text-primary" : "text-text-secondary")}>
                        {step.label}
                      </span>
                      {isCurrent && (
                        <p className="text-[10px] text-text-tertiary mt-0.5">{step.description}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Compass progress readout */}
      {compassProgress && compassProgress.length > 0 && status === "in_progress" && (
        <CompassProgressDisplay entries={compassProgress} />
      )}

      {/* Clean progress bar */}
      {(!compassProgress || compassProgress.length === 0) &&
        status === "in_progress" &&
        progress !== undefined &&
        !waitingForConfirm && (
          <div className="space-y-1">
            <div className="h-1.5 bg-bg-tertiary rounded-full overflow-hidden w-full">
              <div
                className="h-full bg-accent-primary transition-all duration-300"
                style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
              />
            </div>
            <span className="text-[10px] font-mono text-text-tertiary block">{Math.round(progress)}%</span>
          </div>
        )}

      {/* Compass Results Display */}
      {compassResults && compassResults.length > 0 && (
        <CompassResultsDisplay results={compassResults} />
      )}

      {/* Status feedback message */}
      {statusMessage && (
        <p
          className={cn(
            "text-[10px] font-mono leading-relaxed",
            status === "error"
              ? "text-status-error"
              : status === "waiting_accept" || status === "cal_warning"
              ? "text-status-warning"
              : "text-text-tertiary"
          )}
        >
          {statusMessage}
        </p>
      )}

      {/* Troubleshooting guide on warning / error */}
      {(status === "error" || status === "cal_warning") && failureFixes && failureFixes.length > 0 && (
        <div
          className={cn(
            "px-3 py-2.5 rounded border text-xs space-y-1",
            status === "cal_warning"
              ? "border-status-warning/30 bg-status-warning/10 text-status-warning"
              : "border-status-error/30 bg-status-error/10 text-status-error"
          )}
        >
          <p className="font-medium text-xs flex items-center gap-1.5">
            <AlertCircle size={13} />
            <span>Troubleshooting</span>
          </p>
          <ul className="space-y-0.5 text-[11px] text-text-secondary pl-1">
            {failureFixes.map((fix, i) => (
              <li key={i} className="flex items-start gap-1.5">
                <span className="text-status-error shrink-0">•</span>
                <span>{fix}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Unsupported notice */}
      {unsupportedNotice && status === "idle" && (
        <div className="border border-status-warning/30 bg-status-warning/10 rounded px-3 py-2">
          <p className="text-[11px] text-status-warning">{unsupportedNotice}</p>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-2 pt-1">
        {status === "cal_warning" && onForceSave ? (
          <>
            <Button variant="primary" size="sm" onClick={onForceSave}>
              Force Save Offsets
            </Button>
            <Button variant="secondary" size="sm" onClick={onStart}>
              Retry
            </Button>
          </>
        ) : waitingForConfirm && onConfirm ? (
          <>
            <Button variant="primary" size="sm" onClick={onConfirm}>
              {confirmLabel}
            </Button>
            {onCancel && (
              <Button variant="danger" size="sm" onClick={onCancel}>
                Cancel
              </Button>
            )}
          </>
        ) : status === "in_progress" && onCancel ? (
          <>
            <Button variant="secondary" size="sm" loading>
              Calibrating...
            </Button>
            <Button variant="danger" size="sm" onClick={onCancel}>
              Cancel
            </Button>
          </>
        ) : unsupportedNotice ? (
          <Button variant="secondary" size="sm" disabled>
            Not Available
          </Button>
        ) : (
          <Button
            variant={status === "success" ? "secondary" : "primary"}
            size="sm"
            onClick={onStart}
          >
            {status === "success" ? "Re-calibrate" : status === "error" || status === "cal_warning" ? "Retry" : "Start"}
          </Button>
        )}
      </div>
    </div>
  );
}


