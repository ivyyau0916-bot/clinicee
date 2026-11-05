"use client";

import { useState } from "react";
import { ChevronRight, ImageIcon, ListChecks, Pencil, Plus, Trash2 } from "lucide-react";
import { CategoryIcon } from "@/components/category-style";
import { fieldClass, iconButtonClass, primaryClass } from "@/components/classes";
import { cn } from "@/lib/cn";
import { formatUpdated } from "@/lib/format";
import { notePreview } from "@/lib/search";
import type { Category } from "@/lib/types";

export function NoteList({
  category,
  onOpenNote,
  onCreate,
  onEditCategory,
  onDeleteCategory,
}: {
  category: Category;
  onOpenNote: (noteId: string) => void;
  onCreate: (title: string) => void;
  onEditCategory: () => void;
  onDeleteCategory: () => void;
}) {
  const [title, setTitle] = useState("");
  const notes = [...category.notes].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <CategoryIcon icon={category.icon} color={category.color} />
        <div className="min-w-0 flex-1">
          <h2 className="text-xl font-semibold tracking-tight text-slate-900">{category.name}</h2>
          <p className="text-sm text-slate-500">
            {notes.length === 1 ? "1 note" : `${notes.length} notes`}
          </p>
        </div>
        <button
          type="button"
          className={iconButtonClass}
          aria-label={`Edit ${category.name}`}
          onClick={onEditCategory}
        >
          <Pencil className="size-4" />
        </button>
        <button
          type="button"
          className={cn(iconButtonClass, "hover:bg-rose-50 hover:text-rose-600")}
          aria-label={`Delete ${category.name}`}
          onClick={onDeleteCategory}
        >
          <Trash2 className="size-4" />
        </button>
      </div>

      <form
        className="flex flex-col gap-2 sm:flex-row"
        onSubmit={(event) => {
          event.preventDefault();
          if (!title.trim()) return;
          onCreate(title);
          setTitle("");
        }}
      >
        <label className="sr-only" htmlFor="new-note-title">
          New note title
        </label>
        <input
          id="new-note-title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="New note title"
          maxLength={120}
          className={fieldClass}
        />
        <button type="submit" className={primaryClass} disabled={!title.trim()}>
          <Plus className="size-4" aria-hidden />
          Add note
        </button>
      </form>

      {notes.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-200 bg-white/70 px-5 py-10 text-center">
          <p className="font-medium text-slate-800">No notes in this category yet</p>
          <p className="mt-1 text-sm text-slate-500">Add the first SOP, habit, or bedside reminder.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {notes.map((note) => {
            const done = note.checklist.filter((item) => item.done).length;
            const total = note.checklist.length;
            return (
              <li key={note.id}>
                <button
                  type="button"
                  onClick={() => onOpenNote(note.id)}
                  className="flex w-full items-start gap-3 rounded-3xl bg-white p-4 text-left shadow-sm ring-1 ring-slate-200/80 transition hover:ring-sky-200"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold text-slate-900">{note.title}</span>
                    <span className="mt-1 line-clamp-2 block text-sm leading-6 text-slate-500">
                      {notePreview(note)}
                    </span>
                    <span className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                      <span>{formatUpdated(note.updatedAt)}</span>
                      {total > 0 && (
                        <span className="inline-flex items-center gap-1">
                          <ListChecks className="size-3.5" aria-hidden />
                          {done}/{total}
                        </span>
                      )}
                      {note.images.length > 0 && (
                        <span className="inline-flex items-center gap-1">
                          <ImageIcon className="size-3.5" aria-hidden />
                          {note.images.length === 1 ? "1 photo" : `${note.images.length} photos`}
                        </span>
                      )}
                    </span>
                  </span>
                  <ChevronRight className="mt-1 size-5 shrink-0 text-slate-300" aria-hidden />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
