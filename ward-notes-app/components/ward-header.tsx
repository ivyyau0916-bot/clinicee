"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ArrowLeft, Check, ChevronDown, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { Breadcrumbs, type Crumb } from "@/components/breadcrumbs";
import { iconButtonClass } from "@/components/classes";
import { cn } from "@/lib/cn";

export type WardChoice = {
  id: string;
  name: string;
  description: string;
};

export function WardHeader({
  wardName,
  detail,
  crumbs,
  query,
  onQueryChange,
  wards,
  activeWardId,
  onSelectWard,
  onAddWard,
  onEditWard,
  onDeleteWard,
  onBack,
  persistError,
  saving,
}: {
  wardName: string;
  detail: string;
  crumbs: Crumb[];
  query: string;
  onQueryChange: (value: string) => void;
  wards: WardChoice[];
  activeWardId: string;
  onSelectWard: (wardId: string) => void;
  onAddWard: () => void;
  onEditWard: (wardId: string) => void;
  onDeleteWard: (wardId: string) => void;
  onBack?: () => void;
  persistError: string | null;
  saving: boolean;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const searchId = useId();
  const listId = useId();

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
      <div className="mx-auto w-full max-w-5xl px-4 pb-4 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <div ref={rootRef}>
          <div className="flex items-center gap-2">
            {onBack && (
              <button type="button" onClick={onBack} aria-label="Go back" className={iconButtonClass}>
                <ArrowLeft className="size-5" />
              </button>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-sky-700">
                Clinicee
              </p>
              <h1 className="mt-0.5">
                <button
                  type="button"
                  className="flex max-w-full items-center gap-1 text-left"
                  aria-expanded={open}
                  aria-controls={listId}
                  aria-haspopup="listbox"
                  onClick={() => setOpen((current) => !current)}
                >
                  <span className="truncate text-2xl font-semibold tracking-tight text-slate-900">
                    {wardName}
                  </span>
                  <ChevronDown
                    className={cn("size-5 shrink-0 text-sky-700 transition", open && "rotate-180")}
                    aria-hidden
                  />
                </button>
              </h1>
              <p className="truncate text-sm text-slate-500">{detail}</p>
            </div>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onAddWard();
              }}
              className="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-full bg-sky-600 px-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700"
            >
              <Plus className="size-4" aria-hidden />
              Add ward
            </button>
          </div>
          {open && (
              <div
                id={listId}
                role="listbox"
                aria-label="Switch ward"
                className="mt-3 overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-slate-200"
              >
                <p className="px-3 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                  Switch ward
                </p>
                <div className="max-h-80 overflow-y-auto p-2">
                  {wards.length === 0 && (
                    <p className="px-3 py-4 text-sm text-slate-500">No wards yet.</p>
                  )}
                  {wards.map((ward) => {
                    const selected = ward.id === activeWardId;
                    return (
                      <div
                        key={ward.id}
                        className={cn(
                          "flex items-center gap-1 rounded-xl pr-1",
                          selected ? "bg-sky-50" : "hover:bg-slate-50",
                        )}
                      >
                        <button
                          type="button"
                          role="option"
                          aria-selected={selected}
                          className="flex min-w-0 flex-1 items-center gap-2 px-3 py-3 text-left"
                          onClick={() => {
                            onSelectWard(ward.id);
                            setOpen(false);
                          }}
                        >
                          <Check
                            className={cn("size-4 shrink-0", selected ? "text-sky-600" : "text-transparent")}
                            aria-hidden
                          />
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-semibold text-slate-900">
                              {ward.name}
                            </span>
                            {ward.description && (
                              <span className="block truncate text-xs text-slate-500">
                                {ward.description}
                              </span>
                            )}
                          </span>
                        </button>
                        <button
                          type="button"
                          className={iconButtonClass}
                          aria-label={`Rename ${ward.name}`}
                          onClick={() => {
                            setOpen(false);
                            onEditWard(ward.id);
                          }}
                        >
                          <Pencil className="size-4" />
                        </button>
                        <button
                          type="button"
                          className={cn(iconButtonClass, "hover:bg-rose-50 hover:text-rose-600")}
                          aria-label={`Delete ${ward.name}`}
                          onClick={() => {
                            setOpen(false);
                            onDeleteWard(ward.id);
                          }}
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
          )}
        </div>

        <div className="relative mt-3">
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400"
            aria-hidden
          />
          <label htmlFor={searchId} className="sr-only">
            Search notes in this ward
          </label>
          <input
            id={searchId}
            type="search"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Search titles and notes"
            autoComplete="off"
            className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-10 pr-12 text-base text-slate-900 outline-none placeholder:text-slate-400 focus:border-sky-400 focus:bg-white"
          />
          {query && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => onQueryChange("")}
              className="absolute right-1.5 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-full text-slate-400 hover:bg-slate-200/70 hover:text-slate-700"
            >
              <X className="size-4" />
            </button>
          )}
        </div>

        <Breadcrumbs items={crumbs} />

        <p className={cn("mt-2 text-xs", persistError ? "text-rose-600" : "text-slate-400")} role="status">
          {persistError ?? (saving ? "Saving…" : "Saved")}
        </p>
      </div>
    </header>
  );
}
