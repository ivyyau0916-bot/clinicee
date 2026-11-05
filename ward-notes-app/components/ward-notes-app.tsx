"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { AppSkeleton } from "@/components/app-skeleton";
import type { Crumb } from "@/components/breadcrumbs";
import { CategoryFormModal } from "@/components/category-form-modal";
import { CategoryGrid } from "@/components/category-grid";
import { primaryClass } from "@/components/classes";
import { ConfirmDialog } from "@/components/modal";
import { NoteEditor } from "@/components/note-editor";
import { NoteList } from "@/components/note-list";
import { SearchResults } from "@/components/search-results";
import { WardFormModal } from "@/components/ward-form-modal";
import { WardHeader, type WardChoice } from "@/components/ward-header";
import { useWardNotes } from "@/hooks/use-ward-notes";
import { searchNotes } from "@/lib/search";
import type { Category } from "@/lib/types";

type Screen =
  | { kind: "dashboard" }
  | { kind: "category"; categoryId: string }
  | { kind: "note"; categoryId: string; noteId: string };

type Dialog =
  | { type: "ward"; wardId?: string }
  | { type: "category"; categoryId?: string }
  | {
      type: "confirm";
      title: string;
      body: string;
      confirmLabel: string;
      onConfirm: () => void;
    };

export function WardNotesApp() {
  const notes = useWardNotes();
  const [screen, setScreen] = useState<Screen>({ kind: "dashboard" });
  const [query, setQuery] = useState("");
  const [dialog, setDialog] = useState<Dialog | null>(null);

  const searching = query.trim().length > 0;
  const category = findCategory(notes.activeWard?.categories, screen);
  const note = findNote(category, screen);
  const view: Screen["kind"] =
    screen.kind === "note" && category && note ? "note" : category ? "category" : "dashboard";

  const hits = useMemo(
    () => (notes.activeWard && searching ? searchNotes(notes.activeWard, query) : []),
    [notes.activeWard, query, searching],
  );

  if (!notes.hydrated) return <AppSkeleton />;

  if (notes.persistError && notes.wards.length === 0) {
    return (
      <div className="min-h-dvh">
        <main className="mx-auto flex min-h-dvh w-full max-w-lg items-center px-4 py-16">
          <section className="w-full rounded-3xl bg-white px-6 py-10 text-center shadow-sm ring-1 ring-slate-200/80">
            <h1 className="text-lg font-semibold text-slate-900">Clinicee is not connected</h1>
            <p className="mt-3 text-sm leading-6 text-rose-600" role="alert">
              {notes.persistError}
            </p>
            <p className="mt-3 text-sm leading-6 text-slate-500">
              Run supabase/schema.sql in the Supabase SQL editor. Put NEXT_PUBLIC_SUPABASE_URL and
              NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local, then restart the dev server.
            </p>
            <button type="button" className={`${primaryClass} mt-5`} onClick={() => window.location.reload()}>
              Try again
            </button>
          </section>
        </main>
      </div>
    );
  }

  const activeWard = notes.activeWard;
  const noteCount = activeWard?.categories.reduce((sum, item) => sum + item.notes.length, 0) ?? 0;
  const photoCount =
    activeWard?.categories.reduce(
      (sum, item) => sum + item.notes.reduce((inner, entry) => inner + entry.images.length, 0),
      0,
    ) ?? 0;
  const detail = activeWard
    ? [activeWard.description, countLabel(activeWard.categories.length, "category", "categories"), countLabel(noteCount, "note")]
        .filter(Boolean)
        .join(" · ")
    : "Add a ward to start a notebook";

  const crumbs = buildCrumbs({
    wardName: activeWard?.name,
    searching,
    view,
    categoryName: category?.name,
    categoryId: category?.id,
    noteTitle: note?.title,
    goDashboard: () => {
      setQuery("");
      setScreen({ kind: "dashboard" });
    },
    goCategory: (categoryId: string) => setScreen({ kind: "category", categoryId }),
  });

  const onBack =
    searching || view !== "dashboard"
      ? () => {
          if (searching) {
            setQuery("");
            return;
          }
          if (view === "note" && category) {
            setScreen({ kind: "category", categoryId: category.id });
            return;
          }
          setScreen({ kind: "dashboard" });
        }
      : undefined;

  const wardChoices: WardChoice[] = notes.wards.map((ward) => ({
    id: ward.id,
    name: ward.name,
    description: ward.description,
  }));

  const editingWard =
    dialog?.type === "ward" && dialog.wardId
      ? notes.wards.find((ward) => ward.id === dialog.wardId)
      : undefined;
  const editingCategory =
    dialog?.type === "category" && dialog.categoryId
      ? activeWard?.categories.find((item) => item.id === dialog.categoryId)
      : undefined;

  function askDeleteWard(wardId: string) {
    const ward = notes.wards.find((item) => item.id === wardId);
    setDialog({
      type: "confirm",
      title: `Delete ${ward?.name ?? "this ward"}?`,
      body: "Categories, notes, and photos in this ward will be removed from Supabase.",
      confirmLabel: "Delete ward",
      onConfirm: () => {
        notes.deleteWardById(wardId);
        setScreen({ kind: "dashboard" });
        setQuery("");
      },
    });
  }

  function askDeleteCategory(target: Category) {
    setDialog({
      type: "confirm",
      title: `Delete ${target.name}?`,
      body:
        target.notes.length > 0
          ? `${countLabel(target.notes.length, "note")} in this category will be removed from Supabase.`
          : "This category will be removed from Supabase.",
      confirmLabel: "Delete category",
      onConfirm: () => {
        notes.deleteCategoryById(target.id);
        setScreen({ kind: "dashboard" });
      },
    });
  }

  return (
    <div className="min-h-dvh">
      <WardHeader
        wardName={activeWard?.name ?? "No ward yet"}
        detail={detail}
        crumbs={crumbs}
        query={query}
        onQueryChange={setQuery}
        wards={wardChoices}
        activeWardId={activeWard?.id ?? ""}
        onSelectWard={(wardId) => {
          notes.selectWard(wardId);
          setScreen({ kind: "dashboard" });
          setQuery("");
        }}
        onAddWard={() => setDialog({ type: "ward" })}
        onEditWard={(wardId) => setDialog({ type: "ward", wardId })}
        onDeleteWard={askDeleteWard}
        onBack={onBack}
        persistError={notes.persistError}
        saving={notes.saving}
      />

      <main className="mx-auto w-full max-w-5xl px-4 pb-[max(2rem,env(safe-area-inset-bottom))] pt-5">
        {!activeWard ? (
          <section className="rounded-3xl bg-white px-6 py-12 text-center shadow-sm ring-1 ring-slate-200/80">
            <h2 className="text-lg font-semibold text-slate-900">Start with a ward</h2>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">
              Each ward keeps its own categories, checklists, and reference photos in Supabase.
            </p>
            <button type="button" onClick={() => setDialog({ type: "ward" })} className={`${primaryClass} mt-5`}>
              <Plus className="size-4" aria-hidden />
              Add ward
            </button>
          </section>
        ) : searching ? (
          <SearchResults
            query={query}
            hits={hits}
            onOpen={(categoryId, noteId) => {
              setQuery("");
              setScreen({ kind: "note", categoryId, noteId });
            }}
          />
        ) : view === "note" && category && note ? (
          <NoteEditor
            key={note.id}
            note={note}
            categoryName={category.name}
            color={category.color}
            onChange={(recipe) => notes.editNote(category.id, note.id, recipe)}
            onAddImage={(file) => notes.addNoteImage(category.id, note.id, file)}
            onCaptionImage={(imageId, caption) =>
              notes.editImageCaption(category.id, note.id, imageId, caption)
            }
            onDeleteImage={(imageId) => notes.deleteNoteImage(category.id, note.id, imageId)}
            onDelete={() => {
              const categoryId = category.id;
              const noteId = note.id;
              const title = note.title || "this note";
              setDialog({
                type: "confirm",
                title: `Delete ${title}?`,
                body: "The text, checklist, and photos in this note will be removed from Supabase.",
                confirmLabel: "Delete note",
                onConfirm: () => {
                  notes.deleteNote(categoryId, noteId);
                  setScreen({ kind: "category", categoryId });
                },
              });
            }}
          />
        ) : view === "category" && category ? (
          <NoteList
            category={category}
            onOpenNote={(noteId) => setScreen({ kind: "note", categoryId: category.id, noteId })}
            onCreate={(title) => {
              const noteId = notes.createNote(category.id, title);
              setScreen({ kind: "note", categoryId: category.id, noteId });
            }}
            onEditCategory={() => setDialog({ type: "category", categoryId: category.id })}
            onDeleteCategory={() => askDeleteCategory(category)}
          />
        ) : (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Categories</h2>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                {countLabel(photoCount, "photo")} saved with these notes. Sample entries are study
                reminders, not ward policy.
              </p>
            </div>
            <CategoryGrid
              categories={activeWard.categories}
              onOpen={(categoryId) => setScreen({ kind: "category", categoryId })}
              onEdit={(categoryId) => setDialog({ type: "category", categoryId })}
              onDelete={(categoryId) => {
                const target = activeWard.categories.find((item) => item.id === categoryId);
                if (target) askDeleteCategory(target);
              }}
              onAdd={() => setDialog({ type: "category" })}
            />
          </div>
        )}
      </main>

      {dialog?.type === "ward" && (
        <WardFormModal
          title={dialog.wardId ? "Edit ward" : "Add ward"}
          initialName={editingWard?.name ?? ""}
          initialDescription={editingWard?.description ?? ""}
          allowDelete={Boolean(dialog.wardId)}
          onClose={() => setDialog(null)}
          onSave={(name, description) => {
            if (dialog.wardId) notes.editWard(dialog.wardId, name, description);
            else {
              notes.createWard(name, description);
              setScreen({ kind: "dashboard" });
              setQuery("");
            }
            setDialog(null);
          }}
          onDelete={dialog.wardId ? () => askDeleteWard(dialog.wardId as string) : undefined}
        />
      )}

      {dialog?.type === "category" && (
        <CategoryFormModal
          title={dialog.categoryId ? "Edit category" : "Add category"}
          initialName={editingCategory?.name ?? ""}
          initialIcon={editingCategory?.icon ?? "clipboard"}
          initialColor={editingCategory?.color ?? "sky"}
          onClose={() => setDialog(null)}
          onSave={(name, icon, color) => {
            if (dialog.categoryId) notes.editCategory(dialog.categoryId, name, icon, color);
            else notes.createCategory(name, icon, color);
            setDialog(null);
          }}
        />
      )}

      {dialog?.type === "confirm" && (
        <ConfirmDialog
          title={dialog.title}
          body={dialog.body}
          confirmLabel={dialog.confirmLabel}
          onClose={() => setDialog(null)}
          onConfirm={() => {
            dialog.onConfirm();
            setDialog(null);
          }}
        />
      )}
    </div>
  );
}

function findCategory(categories: Category[] | undefined, screen: Screen) {
  if (!categories || screen.kind === "dashboard") return undefined;
  return categories.find((item) => item.id === screen.categoryId);
}

function findNote(category: Category | undefined, screen: Screen) {
  if (!category || screen.kind !== "note") return undefined;
  return category.notes.find((item) => item.id === screen.noteId);
}

function countLabel(count: number, singular: string, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`;
}

function buildCrumbs({
  wardName,
  searching,
  view,
  categoryName,
  categoryId,
  noteTitle,
  goDashboard,
  goCategory,
}: {
  wardName?: string;
  searching: boolean;
  view: Screen["kind"];
  categoryName?: string;
  categoryId?: string;
  noteTitle?: string;
  goDashboard: () => void;
  goCategory: (categoryId: string) => void;
}): Crumb[] {
  if (!wardName) return [];
  const crumbs: Crumb[] = [
    {
      label: wardName,
      onClick: view === "dashboard" && !searching ? undefined : goDashboard,
    },
  ];
  if (searching) {
    crumbs.push({ label: "Search" });
  } else if (view === "category" && categoryName) {
    crumbs.push({ label: categoryName });
  } else if (view === "note" && categoryName && categoryId) {
    crumbs.push({ label: categoryName, onClick: () => goCategory(categoryId) });
    crumbs.push({ label: noteTitle || "Untitled note" });
  }
  return crumbs;
}
