"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  changeNote,
  deleteCategory,
  insertCategory,
  insertNote,
  insertWard,
  makeCategory,
  makeNote,
  makeWard,
  removeNote,
  removeWard,
  renameWard,
  setActiveWard,
  updateCategory,
} from "@/lib/mutations";
import {
  deleteCategoryRow,
  deleteImageRow,
  deleteNoteRow,
  deleteWardRow,
  insertCategoryRow,
  insertNoteRow,
  insertWardRow,
  loadOrSeed,
  loadWardNotes,
  saveActiveWard,
  saveImageCaption,
  saveNoteRow,
  updateCategoryRow,
  updateWardRow,
  uploadNoteImage,
} from "@/lib/supabase/repository";
import type { IconName, Note, NoteImage, TagColor, WardNotesState } from "@/lib/types";
import { isSupabaseConfigured } from "@/utils/supabase";

const EMPTY: WardNotesState = { wards: [], activeWardId: "" };
const SAVE_DELAY_MS = 400;

const SETUP_ERROR =
  "Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local, then restart the dev server.";

export function useWardNotes() {
  const configured = isSupabaseConfigured();
  const [hydrated, setHydrated] = useState(!configured);
  const [state, setState] = useState<WardNotesState>(EMPTY);
  const [persistError, setPersistError] = useState<string | null>(configured ? null : SETUP_ERROR);
  const [saving, setSaving] = useState(configured);
  const stateRef = useRef(state);
  const pendingRef = useRef(0);
  const timersRef = useRef(new Map<string, number>());
  const chainRef = useRef(Promise.resolve());
  const imageSeq = useRef(0);

  const replace = useCallback((next: WardNotesState) => {
    stateRef.current = next;
    setState(next);
  }, []);

  const refreshSaving = useCallback(() => {
    setSaving(pendingRef.current > 0 || timersRef.current.size > 0);
  }, []);

  const recover = useCallback(
    async (previous: WardNotesState, error: unknown) => {
      setPersistError(error instanceof Error ? error.message : "Couldn't save that change.");
      try {
        replace(await loadWardNotes());
      } catch {
        replace(previous);
      }
    },
    [replace],
  );

  const enqueue = useCallback((task: () => Promise<boolean | void>) => {
    const run = chainRef.current.then(task, task);
    chainRef.current = run.then(
      () => undefined,
      () => undefined,
    );
    return run;
  }, []);

  const runMutation = useCallback(
    (previous: WardNotesState, task: () => Promise<void>) => {
      pendingRef.current += 1;
      refreshSaving();
      void enqueue(async () => {
        try {
          await task();
          setPersistError(null);
        } catch (error) {
          await recover(previous, error);
        } finally {
          pendingRef.current = Math.max(0, pendingRef.current - 1);
          refreshSaving();
        }
      });
    },
    [enqueue, recover, refreshSaving],
  );

  const schedule = useCallback(
    (timerKey: string, task: () => Promise<boolean | void>) => {
      const existing = timersRef.current.get(timerKey);
      if (existing) window.clearTimeout(existing);
      const timer = window.setTimeout(() => {
        timersRef.current.delete(timerKey);
        refreshSaving();
        pendingRef.current += 1;
        refreshSaving();
        void enqueue(async () => {
          try {
            const saved = await task();
            if (saved !== false) setPersistError(null);
          } catch (error) {
            setPersistError(error instanceof Error ? error.message : "Couldn't save that change.");
          } finally {
            pendingRef.current = Math.max(0, pendingRef.current - 1);
            refreshSaving();
          }
        });
      }, SAVE_DELAY_MS);
      timersRef.current.set(timerKey, timer);
      refreshSaving();
    },
    [enqueue, refreshSaving],
  );

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    let cancelled = false;
    pendingRef.current += 1;
    loadOrSeed()
      .then((loaded) => {
        if (cancelled) return;
        replace(loaded);
        setPersistError(null);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setPersistError(error instanceof Error ? error.message : "Couldn't load notes.");
      })
      .finally(() => {
        pendingRef.current = Math.max(0, pendingRef.current - 1);
        if (!cancelled) {
          refreshSaving();
          setHydrated(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [refreshSaving, replace]);

  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      for (const timer of timers.values()) window.clearTimeout(timer);
      timers.clear();
    };
  }, []);

  const selectWard = useCallback(
    (wardId: string) => {
      const previous = stateRef.current;
      const next = setActiveWard(previous, wardId);
      if (next === previous) return;
      replace(next);
      runMutation(previous, () => saveActiveWard(wardId));
    },
    [replace, runMutation],
  );

  const createWard = useCallback(
    (name: string, description: string) => {
      const ward = makeWard(name, description);
      const previous = stateRef.current;
      replace(insertWard(previous, ward));
      runMutation(previous, async () => {
        await insertWardRow(ward);
        await saveActiveWard(ward.id);
      });
      return ward.id;
    },
    [replace, runMutation],
  );

  const editWard = useCallback(
    (wardId: string, name: string, description: string) => {
      const previous = stateRef.current;
      const next = renameWard(previous, wardId, name, description);
      replace(next);
      const saved = next.wards.find((ward) => ward.id === wardId);
      if (!saved) return;
      runMutation(previous, () => updateWardRow(wardId, saved.name, saved.description));
    },
    [replace, runMutation],
  );

  const deleteWardById = useCallback(
    (wardId: string) => {
      const previous = stateRef.current;
      const ward = previous.wards.find((item) => item.id === wardId);
      if (!ward) return;
      const next = removeWard(previous, wardId);
      replace(next);
      runMutation(previous, async () => {
        await deleteWardRow(ward);
        await saveActiveWard(next.activeWardId);
      });
    },
    [replace, runMutation],
  );

  const createCategory = useCallback(
    (name: string, icon: IconName, color: TagColor) => {
      const previous = stateRef.current;
      const ward = previous.wards.find((item) => item.id === previous.activeWardId);
      if (!ward) return "";
      const category = makeCategory(name, icon, color);
      const position = ward.categories.length;
      replace(insertCategory(previous, category));
      runMutation(previous, () => insertCategoryRow(ward.id, category, position));
      return category.id;
    },
    [replace, runMutation],
  );

  const editCategory = useCallback(
    (categoryId: string, name: string, icon: IconName, color: TagColor) => {
      const previous = stateRef.current;
      const next = updateCategory(previous, categoryId, { name, icon, color });
      replace(next);
      const category = next.wards
        .flatMap((ward) => ward.categories)
        .find((item) => item.id === categoryId);
      if (!category) return;
      runMutation(previous, () =>
        updateCategoryRow(categoryId, {
          name: category.name,
          icon: category.icon,
          color: category.color,
        }),
      );
    },
    [replace, runMutation],
  );

  const deleteCategoryById = useCallback(
    (categoryId: string) => {
      const previous = stateRef.current;
      const category = previous.wards
        .flatMap((ward) => ward.categories)
        .find((item) => item.id === categoryId);
      if (!category) return;
      replace(deleteCategory(previous, categoryId));
      runMutation(previous, () => deleteCategoryRow(category));
    },
    [replace, runMutation],
  );

  const createNote = useCallback(
    (categoryId: string, title: string) => {
      const note = makeNote(title);
      const previous = stateRef.current;
      replace(insertNote(previous, categoryId, note));
      pendingRef.current += 1;
      refreshSaving();
      void enqueue(async () => {
        try {
          await insertNoteRow(categoryId, note);
          setPersistError(null);
        } catch (error) {
          await recover(previous, error);
        } finally {
          pendingRef.current = Math.max(0, pendingRef.current - 1);
          refreshSaving();
        }
      });
      return note.id;
    },
    [enqueue, recover, refreshSaving, replace],
  );

  const editNote = useCallback(
    (categoryId: string, noteId: string, recipe: (note: Note) => Note) => {
      replace(changeNote(stateRef.current, categoryId, noteId, recipe));
      schedule(`note:${noteId}`, async () => {
        const latest = findNote(stateRef.current, categoryId, noteId);
        if (!latest) return false;
        await saveNoteRow(latest);
      });
    },
    [replace, schedule],
  );

  const deleteNote = useCallback(
    (categoryId: string, noteId: string) => {
      const previous = stateRef.current;
      const note = findNote(previous, categoryId, noteId);
      if (!note) return;
      const timer = timersRef.current.get(`note:${noteId}`);
      if (timer) {
        window.clearTimeout(timer);
        timersRef.current.delete(`note:${noteId}`);
      }
      replace(removeNote(previous, categoryId, noteId));
      pendingRef.current += 1;
      refreshSaving();
      void enqueue(async () => {
        try {
          await deleteNoteRow(note);
          setPersistError(null);
        } catch (error) {
          await recover(previous, error);
        } finally {
          pendingRef.current = Math.max(0, pendingRef.current - 1);
          refreshSaving();
        }
      });
    },
    [enqueue, recover, refreshSaving, replace],
  );

  const addNoteImage = useCallback(
    async (categoryId: string, noteId: string, file: File) => {
      const position = Date.now() * 1000 + (imageSeq.current % 1000);
      imageSeq.current += 1;
      pendingRef.current += 1;
      refreshSaving();
      try {
        await enqueue(async () => {
          const parent = findNoteContext(stateRef.current, categoryId, noteId);
          if (!parent) throw new Error("That note is no longer open.");
          const image = await uploadNoteImage(parent, file, position);
          replace(
            changeNote(stateRef.current, categoryId, noteId, (note) => ({
              ...note,
              images: note.images.some((item) => item.id === image.id)
                ? note.images
                : [...note.images, image],
            })),
          );
          const latest = findNote(stateRef.current, categoryId, noteId);
          if (latest) await saveNoteRow(latest);
        });
        setPersistError(null);
      } catch (error) {
        setPersistError(error instanceof Error ? error.message : "Couldn't add that photo.");
        throw error;
      } finally {
        pendingRef.current = Math.max(0, pendingRef.current - 1);
        refreshSaving();
      }
    },
    [enqueue, refreshSaving, replace],
  );

  const editImageCaption = useCallback(
    (categoryId: string, noteId: string, imageId: string, caption: string) => {
      replace(
        changeNote(stateRef.current, categoryId, noteId, (note) => ({
          ...note,
          images: note.images.map((image) => (image.id === imageId ? { ...image, caption } : image)),
        })),
      );
      schedule(`caption:${imageId}`, async () => {
        const image = findImage(stateRef.current, imageId);
        if (!image) return false;
        await saveImageCaption(image.id, image.caption);
      });
      schedule(`note:${noteId}`, async () => {
        const latest = findNote(stateRef.current, categoryId, noteId);
        if (!latest) return false;
        await saveNoteRow(latest);
      });
    },
    [replace, schedule],
  );

  const deleteNoteImage = useCallback(
    (categoryId: string, noteId: string, imageId: string) => {
      const previous = stateRef.current;
      const image = findImage(previous, imageId);
      if (!image) return;
      const timer = timersRef.current.get(`caption:${imageId}`);
      if (timer) {
        window.clearTimeout(timer);
        timersRef.current.delete(`caption:${imageId}`);
      }
      replace(
        changeNote(previous, categoryId, noteId, (note) => ({
          ...note,
          images: note.images.filter((item) => item.id !== imageId),
        })),
      );
      pendingRef.current += 1;
      refreshSaving();
      void enqueue(async () => {
        try {
          await deleteImageRow(image);
          const latest = findNote(stateRef.current, categoryId, noteId);
          if (latest) await saveNoteRow(latest);
          setPersistError(null);
        } catch (error) {
          await recover(previous, error);
        } finally {
          pendingRef.current = Math.max(0, pendingRef.current - 1);
          refreshSaving();
        }
      });
    },
    [enqueue, recover, refreshSaving, replace],
  );

  const activeWard = state.wards.find((ward) => ward.id === state.activeWardId);

  return {
    hydrated,
    saving,
    persistError,
    wards: state.wards,
    activeWard,
    selectWard,
    createWard,
    editWard,
    deleteWardById,
    createCategory,
    editCategory,
    deleteCategoryById,
    createNote,
    editNote,
    deleteNote,
    addNoteImage,
    editImageCaption,
    deleteNoteImage,
  };
}

function findNoteContext(state: WardNotesState, categoryId: string, noteId: string) {
  for (const ward of state.wards) {
    const position = ward.categories.findIndex((category) => category.id === categoryId);
    if (position < 0) continue;
    const category = ward.categories[position];
    const note = category?.notes.find((item) => item.id === noteId);
    if (!category || !note) return null;
    return { ward, category: { ...category, position }, note };
  }
  return null;
}

function findNote(state: WardNotesState, categoryId: string, noteId: string) {
  for (const ward of state.wards) {
    for (const category of ward.categories) {
      if (category.id !== categoryId) continue;
      const note = category.notes.find((item) => item.id === noteId);
      if (note) return note;
    }
  }
  return null;
}

function findImage(state: WardNotesState, imageId: string): NoteImage | null {
  for (const ward of state.wards) {
    for (const category of ward.categories) {
      for (const note of category.notes) {
        const image = note.images.find((item) => item.id === imageId);
        if (image) return image;
      }
    }
  }
  return null;
}
