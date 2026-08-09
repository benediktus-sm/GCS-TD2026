"use client";

/**
 * Battery registry editor — table of battery packs + per-row edit form.
 *
 * Mirrors the {@link AircraftRegistryEditor} shape so the Settings page
 * stays visually consistent. Cycle count + health % auto-update from the
 * recordCycle() hook.
 *
 * @license GPL-3.0-only
 */

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Archive } from "lucide-react";
import { useBatteryRegistryStore } from "@/stores/battery-registry-store";
import type { BatteryPack, BatteryChemistry } from "@/lib/types/operator";

function genId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `pack-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function BatteryRegistryEditor() {
  const t = useTranslations("operator");
  const packsMap = useBatteryRegistryStore((s) => s.packs);
  const upsert = useBatteryRegistryStore((s) => s.upsert);
  const update = useBatteryRegistryStore((s) => s.update);
  const remove = useBatteryRegistryStore((s) => s.remove);
  const retire = useBatteryRegistryStore((s) => s.retire);
  const loadFromIDB = useBatteryRegistryStore((s) => s.loadFromIDB);

  useEffect(() => {
    void loadFromIDB();
  }, [loadFromIDB]);

  const packs = Object.values(packsMap).sort((a, b) => a.label.localeCompare(b.label));
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = selectedId ? packsMap[selectedId] : undefined;
  const [showRetired, setShowRetired] = useState(false);
  const visible = showRetired ? packs : packs.filter((p) => !p.retiredAt);

  const chemistryOptions = [
    { value: "LiPo", label: "LiPo" },
    { value: "Li-Ion", label: "Li-Ion" },
    { value: "LiFePO4", label: "LiFePO4" },
    { value: "Li-HV", label: "Li-HV" },
    { value: "NiMH", label: "NiMH" },
    { value: "Other", label: t("other") || "Other" },
  ];

  const handleAdd = () => {
    const id = genId();
    const fresh: BatteryPack = {
      id,
      label: t("newBatteryPack") || "New battery pack",
      chemistry: "LiPo",
      cells: 6,
      capacityMah: 1300,
      cycleCount: 0,
      healthPercent: 100,
    };
    upsert(fresh);
    setSelectedId(id);
  };

  const handleDelete = (id: string) => {
    if (typeof window !== "undefined" && !window.confirm(t("delConfirmBattery"))) return;
    remove(id);
    if (selectedId === id) setSelectedId(null);
  };

  const handleRetire = (id: string) => {
    if (typeof window !== "undefined" && !window.confirm(t("retireConfirmBattery"))) return;
    retire(id);
  };

  return (
    <Card title={t("batteries")} padding={true}>
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-text-secondary">
            {t("packsRegistered", { count: visible.length })}
            {!showRetired && packs.length > visible.length && (
              <span className="text-text-tertiary">
                {t("packsRetiredHidden", { count: packs.length - visible.length })}
              </span>
            )}
          </span>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1 text-[10px] text-text-tertiary">
              <input
                type="checkbox"
                checked={showRetired}
                onChange={(e) => setShowRetired(e.target.checked)}
              />
              {t("showRetired")}
            </label>
            <Button variant="secondary" size="sm" icon={<Plus size={12} />} onClick={handleAdd}>
              {t("addPack")}
            </Button>
          </div>
        </div>

        {visible.length === 0 ? (
          <p className="text-[10px] text-text-tertiary">
            {t("noBatteries")}
          </p>
        ) : (
          <div className="border border-border-default rounded">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border-default">
                  <th className="px-2 py-1.5 text-left text-[10px] uppercase text-text-secondary">{t("tblLabel")}</th>
                  <th className="px-2 py-1.5 text-left text-[10px] uppercase text-text-secondary">{t("tblChem")}</th>
                  <th className="px-2 py-1.5 text-right text-[10px] uppercase text-text-secondary">{t("tblCells")}</th>
                  <th className="px-2 py-1.5 text-right text-[10px] uppercase text-text-secondary">{t("tblCapacity") || "mAh"}</th>
                  <th className="px-2 py-1.5 text-right text-[10px] uppercase text-text-secondary">{t("tblCycles")}</th>
                  <th className="px-2 py-1.5 text-right text-[10px] uppercase text-text-secondary">{t("tblHealth")}</th>
                  <th className="px-2 py-1.5" />
                </tr>
              </thead>
              <tbody>
                {visible.map((p) => (
                  <tr
                    key={p.id}
                    onClick={() => setSelectedId(p.id)}
                    className={`border-b border-border-default cursor-pointer hover:bg-bg-tertiary ${
                      selectedId === p.id ? "bg-accent-primary/10" : ""
                    } ${p.retiredAt ? "opacity-50" : ""}`}
                  >
                    <td className="px-2 py-1.5 text-text-primary">
                      {p.label}
                      {p.retiredAt && <span className="ml-1 text-[9px] text-text-tertiary">{t("retired")}</span>}
                    </td>
                    <td className="px-2 py-1.5 text-text-secondary">{p.chemistry ?? "—"}</td>
                    <td className="px-2 py-1.5 text-right text-text-primary font-mono tabular-nums">
                      {p.cells ?? "—"}
                    </td>
                    <td className="px-2 py-1.5 text-right text-text-primary font-mono tabular-nums">
                      {p.capacityMah ?? "—"}
                    </td>
                    <td className="px-2 py-1.5 text-right text-text-primary font-mono tabular-nums">
                      {p.cycleCount ?? 0}
                    </td>
                    <td className="px-2 py-1.5 text-right text-text-primary font-mono tabular-nums">
                      {p.healthPercent !== undefined ? `${p.healthPercent.toFixed(1)}%` : "—"}
                    </td>
                    <td className="px-2 py-1.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {!p.retiredAt && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRetire(p.id);
                            }}
                            className="text-text-tertiary hover:text-status-warning transition-colors"
                            aria-label="Retire"
                            title="Retire pack"
                          >
                            <Archive size={12} />
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(p.id);
                          }}
                          className="text-text-tertiary hover:text-status-error transition-colors"
                          aria-label="Delete"
                          title="Delete pack"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {selected && (
          <div className="border-t border-border-default pt-3">
            <h4 className="text-[11px] uppercase tracking-wider text-text-secondary mb-2">{selected.label}</h4>
            <div className="grid grid-cols-2 gap-3">
              <Input
                label={t("label")}
                value={selected.label}
                onChange={(e) => update(selected.id, { label: e.target.value })}
              />
              <Input
                label={t("serialNumber")}
                value={selected.serial ?? ""}
                onChange={(e) => update(selected.id, { serial: e.target.value })}
              />
              <Select
                label={t("chemistry")}
                value={selected.chemistry ?? "LiPo"}
                onChange={(v) => update(selected.id, { chemistry: v as BatteryChemistry })}
                options={chemistryOptions}
              />
              <Input
                label={t("cellCount")}
                type="number"
                value={selected.cells?.toString() ?? ""}
                onChange={(e) => update(selected.id, { cells: e.target.value ? Number(e.target.value) : undefined })}
              />
              <Input
                label={t("capacity")}
                type="number"
                value={selected.cells?.toString() ?? ""}
                onChange={(e) => update(selected.id, { capacityMah: e.target.value ? Number(e.target.value) : undefined })}
              />
              <Input
                label={t("cRating")}
                value={selected.cRating ?? ""}
                onChange={(e) => update(selected.id, { cRating: e.target.value })}
                placeholder="65C"
              />
              <Input
                label={t("manufacturer")}
                value={selected.manufacturer ?? ""}
                onChange={(e) => update(selected.id, { manufacturer: e.target.value })}
              />
              <Input
                label={t("model")}
                value={selected.model ?? ""}
                onChange={(e) => update(selected.id, { model: e.target.value })}
              />
              <Input
                label={t("purchaseDate")}
                type="date"
                value={selected.purchaseDate ?? ""}
                onChange={(e) => update(selected.id, { purchaseDate: e.target.value })}
              />
              <Input
                label={t("lastCharged")}
                type="date"
                value={selected.lastChargedAt?.slice(0, 10) ?? ""}
                onChange={(e) => update(selected.id, { lastChargedAt: e.target.value })}
              />
              <Input
                label={t("cycleCount")}
                type="number"
                value={selected.cycleCount?.toString() ?? "0"}
                onChange={(e) =>
                  update(selected.id, {
                    cycleCount: e.target.value ? Number(e.target.value) : 0,
                  })
                }
              />
              <Input
                label={t("health")}
                type="number"
                value={selected.healthPercent?.toString() ?? ""}
                onChange={(e) =>
                  update(selected.id, {
                    healthPercent: e.target.value ? Number(e.target.value) : undefined,
                  })
                }
              />
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
