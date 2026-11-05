"use client";

import { useEffect, useRef, useState } from "react";
import { Check, GripVertical, Lightbulb, Plus, Trash2, TriangleAlert } from "lucide-react";
import { ImageGallery } from "@/components/image-gallery";
import { colorStyle } from "@/components/category-style";
import { dangerClass, fieldClass } from "@/components/classes";
import { cn } from "@/lib/cn";
import { formatUpdated } from "@/lib/format";
import { makeCallout, makeChecklistItem } from "@/lib/mutations";
import type { CalloutKind, ChecklistItem, Note } from "@/lib/types";

export function NoteEditor({
  note,
  categoryName,
  color,
  onChange,
  onDelete,
  onAddImage,
  onCaptionImage,
  onDeleteImage,
}: {
  note: Note;
  categoryName: string;
  color: string;
  onChange: (recipe: (note: Note) => Note) => void;
  onDelete: () => void;
  onAddImage: (file: File) => Promise<void>;
  onCaptionImage: (imageId: string, caption: string) => void;
  onDeleteImage: (imageId: string) => void;
}) {
  const focusId = useRef<string | null>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const dragIdRef = useRef<string | null>(null);
  const draftRef = useRef<ChecklistItem[] | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [order, setOrder] = useState<ChecklistItem[] | null>(null);
  const palette = colorStyle(color);
  const checklist = order ?? note.checklist;
  const done = checklist.filter((item) => item.done).length;

  useEffect(() => {
    if (!focusId.current) return;
    document.getElementById(focusId.current)?.focus();
    focusId.current = null;
  }, [note.checklist, note.callouts]);

  function addChecklistItem() {
    const item = makeChecklistItem();
    focusId.current = item.id;
    onChange((current) => ({ ...current, checklist: [...current.checklist, item] }));
  }

  function startReorder(event: React.PointerEvent<HTMLButtonElement>, id: string) {
    if (event.button !== 0) return;
    event.preventDefault();
    const start = note.checklist;
    const pointerId = event.pointerId;
    dragIdRef.current = id;
    draftRef.current = start;
    setDragId(id);
    setOrder(start);

    const applyAt = (clientY: number) => {
      const current = draftRef.current ?? start;
      const next = reorderChecklist(current, id, clientY, listRef.current);
      if (next === current) return;
      draftRef.current = next;
      setOrder(next);
    };
    const finish = (clientY: number) => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onEnd);
      window.removeEventListener("pointercancel", onEnd);
      applyAt(clientY);
      const next = draftRef.current;
      dragIdRef.current = null;
      draftRef.current = null;
      setDragId(null);
      setOrder(null);
      if (next && !sameChecklistOrder(next, start)) {
        onChange((current) => ({ ...current, checklist: next }));
      }
    };
    const onMove = (moveEvent: PointerEvent) => {
      if (moveEvent.pointerId !== pointerId) return;
      applyAt(moveEvent.clientY);
    };
    const onEnd = (endEvent: PointerEvent) => {
      if (endEvent.pointerId !== pointerId) return;
      finish(endEvent.clientY);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onEnd);
    window.addEventListener("pointercancel", onEnd);
  }

  function moveChecklistBy(id: string, delta: number) {
    onChange((current) => {
      const index = current.checklist.findIndex((row) => row.id === id);
      const target = index + delta;
      if (index < 0 || target < 0 || target >= current.checklist.length) return current;
      const checklist = [...current.checklist];
      const [row] = checklist.splice(index, 1);
      checklist.splice(target, 0, row);
      return { ...current, checklist };
    });
  }

  function addCallout(kind: CalloutKind) {
    const callout = makeCallout(kind);
    focusId.current = callout.id;
    onChange((current) => ({ ...current, callouts: [...current.callouts, callout] }));
  }

  return (
    <div className="space-y-4">
      <div className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-200/80">
        <span className={cn("inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1", palette.chip)}>
          {categoryName}
        </span>
        <label htmlFor="note-title" className="sr-only">
          Note title
        </label>
        <input
          id="note-title"
          value={note.title}
          onChange={(event) => {
            const title = event.target.value;
            onChange((current) => ({ ...current, title }));
          }}
          maxLength={120}
          className="mt-3 w-full bg-transparent text-2xl font-semibold tracking-tight text-slate-900 outline-none placeholder:text-slate-300"
          placeholder="Note title"
        />
        <p className="mt-1 text-xs text-slate-400">Updated {formatUpdated(note.updatedAt)}</p>
        <label htmlFor="note-content" className="sr-only">
          Note
        </label>
        <textarea
          id="note-content"
          value={note.content}
          onChange={(event) => {
            const content = event.target.value;
            onChange((current) => ({ ...current, content }));
          }}
          rows={6}
          placeholder="Write the SOP, habit, or bedside reminder…"
          className={cn(fieldClass, "mt-4 min-h-36 resize-y leading-relaxed")}
        />
      </div>

      <section className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-200/80">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">Checklist</h2>
          <p className="text-xs text-slate-500">
            {checklist.length === 0 ? "No steps yet" : `${done} of ${checklist.length} done`}
          </p>
        </div>
        <ul ref={listRef} className="mt-3 space-y-1" aria-label="Checklist">
          {checklist.map((item) => (
            <li
              key={item.id}
              data-check-id={item.id}
              className={cn(
                "flex items-start gap-1 rounded-2xl pr-1",
                dragId === item.id && "bg-sky-50 ring-1 ring-sky-200",
              )}
            >
              <button
                type="button"
                aria-label="Drag to reorder"
                aria-pressed={dragId === item.id}
                onPointerDown={(event) => startReorder(event, item.id)}
                onKeyDown={(event) => {
                  if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return;
                  event.preventDefault();
                  moveChecklistBy(item.id, event.key === "ArrowUp" ? -1 : 1);
                }}
                className={cn(
                  "mt-0.5 grid size-11 shrink-0 cursor-grab touch-none place-items-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-600 active:cursor-grabbing",
                  dragId === item.id && "cursor-grabbing text-sky-700",
                )}
              >
                <GripVertical className="size-5" aria-hidden />
              </button>
              <button
                type="button"
                role="checkbox"
                aria-checked={item.done}
                aria-label={item.done ? "Mark step as not done" : "Mark step as done"}
                onClick={() =>
                  onChange((current) => ({
                    ...current,
                    checklist: current.checklist.map((row) =>
                      row.id === item.id ? { ...row, done: !row.done } : row,
                    ),
                  }))
                }
                className={cn(
                  "mt-2 grid size-7 shrink-0 place-items-center rounded-full border",
                  item.done ? "border-sky-600 bg-sky-600 text-white" : "border-slate-300 bg-white",
                )}
              >
                {item.done && <Check className="size-4" />}
              </button>
              <input
                id={item.id}
                value={item.text}
                onChange={(event) => {
                  const text = event.target.value;
                  onChange((current) => ({
                    ...current,
                    checklist: current.checklist.map((row) =>
                      row.id === item.id ? { ...row, text } : row,
                    ),
                  }));
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    addChecklistItem();
                  }
                }}
                placeholder="Step"
                className={cn(
                  "min-h-11 flex-1 bg-transparent py-2 text-base outline-none",
                  item.done ? "text-slate-400 line-through decoration-slate-400" : "text-slate-800",
                )}
              />
              <button
                type="button"
                aria-label="Remove step"
                onClick={() =>
                  onChange((current) => ({
                    ...current,
                    checklist: current.checklist.filter((row) => row.id !== item.id),
                  }))
                }
                className="mt-1 grid size-10 place-items-center rounded-full text-slate-400 hover:bg-rose-50 hover:text-rose-600"
              >
                <Trash2 className="size-4" />
              </button>
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={addChecklistItem}
          className="mt-2 inline-flex h-11 items-center gap-2 rounded-full px-3 text-sm font-semibold text-sky-700 hover:bg-sky-50"
        >
          <Plus className="size-4" aria-hidden />
          Add step
        </button>
      </section>

      <section className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-200/80">
        <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">Callouts</h2>
        <div className="mt-3 space-y-3">
          {note.callouts.map((callout) => {
            const warning = callout.kind === "warning";
            return (
              <div
                key={callout.id}
                className={cn(
                  "rounded-2xl border p-3",
                  warning ? "border-amber-200 bg-amber-50" : "border-sky-200 bg-sky-50",
                )}
              >
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.12em]",
                      warning ? "text-amber-800" : "text-sky-800",
                    )}
                  >
                    {warning ? <TriangleAlert className="size-4" /> : <Lightbulb className="size-4" />}
                    {warning ? "Warning" : "Tip"}
                  </span>
                  <button
                    type="button"
                    aria-label="Remove callout"
                    onClick={() =>
                      onChange((current) => ({
                        ...current,
                        callouts: current.callouts.filter((row) => row.id !== callout.id),
                      }))
                    }
                    className="grid size-9 place-items-center rounded-full text-slate-500 hover:bg-white"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
                <textarea
                  id={callout.id}
                  value={callout.text}
                  onChange={(event) => {
                    const text = event.target.value;
                    onChange((current) => ({
                      ...current,
                      callouts: current.callouts.map((row) =>
                        row.id === callout.id ? { ...row, text } : row,
                      ),
                    }));
                  }}
                  rows={3}
                  placeholder={warning ? "What should the team stop and check?" : "A shortcut that helps on this ward"}
                  className="w-full resize-y bg-transparent text-base leading-relaxed text-slate-800 outline-none placeholder:text-slate-400"
                />
              </div>
            );
          })}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => addCallout("warning")}
            className="inline-flex h-11 items-center gap-2 rounded-full bg-amber-100 px-3 text-sm font-semibold text-amber-900"
          >
            <TriangleAlert className="size-4" aria-hidden />
            Add warning
          </button>
          <button
            type="button"
            onClick={() => addCallout("tip")}
            className="inline-flex h-11 items-center gap-2 rounded-full bg-sky-100 px-3 text-sm font-semibold text-sky-900"
          >
            <Lightbulb className="size-4" aria-hidden />
            Add tip
          </button>
        </div>
      </section>

      <ImageGallery
        images={note.images}
        onAdd={onAddImage}
        onCaption={onCaptionImage}
        onDelete={onDeleteImage}
      />

      <button type="button" onClick={onDelete} className={dangerClass}>
        <Trash2 className="size-4" aria-hidden />
        Delete note
      </button>
    </div>
  );
}

function sameChecklistOrder(left: ChecklistItem[], right: ChecklistItem[]) {
  return left.length === right.length && left.every((item, index) => item.id === right[index]?.id);
}

function reorderChecklist(
  list: ChecklistItem[],
  id: string,
  clientY: number,
  container: HTMLUListElement | null,
) {
  if (!container) return list;
  const from = list.findIndex((item) => item.id === id);
  if (from < 0) return list;

  const rows = [...container.querySelectorAll<HTMLElement>("[data-check-id]")];
  let insertAt = 0;
  let placed = false;
  let seen = 0;
  for (const row of rows) {
    if (row.dataset.checkId === id) continue;
    const rect = row.getBoundingClientRect();
    if (!placed && clientY < rect.top + rect.height / 2) {
      insertAt = seen;
      placed = true;
    }
    seen += 1;
  }
  if (!placed) insertAt = seen;
  if (insertAt === from) return list;

  const item = list[from];
  const next = list.filter((entry) => entry.id !== id);
  next.splice(insertAt, 0, item);
  return next;
}
