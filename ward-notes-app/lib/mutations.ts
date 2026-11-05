import { createId } from "@/lib/ids";
import type {
  Callout,
  CalloutKind,
  Category,
  ChecklistItem,
  IconName,
  Note,
  TagColor,
  Ward,
  WardNotesState,
} from "@/lib/types";

function mapActive(state: WardNotesState, mapper: (ward: Ward) => Ward): WardNotesState {
  return {
    ...state,
    wards: state.wards.map((ward) => (ward.id === state.activeWardId ? mapper(ward) : ward)),
  };
}

export function makeWard(name: string, description: string): Ward {
  return {
    id: createId("ward"),
    name: name.trim() || "New ward",
    description: description.trim(),
    categories: [],
  };
}

export function makeCategory(name: string, icon: IconName, color: TagColor): Category {
  return {
    id: createId("cat"),
    name: name.trim() || "New category",
    icon,
    color,
    notes: [],
  };
}

export function makeNote(title: string): Note {
  return {
    id: createId("note"),
    title: title.trim() || "Untitled note",
    content: "",
    checklist: [],
    callouts: [],
    images: [],
    updatedAt: new Date().toISOString(),
  };
}

export function makeChecklistItem(text = ""): ChecklistItem {
  return { id: createId("check"), text, done: false };
}

export function makeCallout(kind: CalloutKind, text = ""): Callout {
  return { id: createId("callout"), kind, text };
}

export function setActiveWard(state: WardNotesState, wardId: string): WardNotesState {
  if (!state.wards.some((ward) => ward.id === wardId)) return state;
  if (state.activeWardId === wardId) return state;
  return { ...state, activeWardId: wardId };
}

export function insertWard(state: WardNotesState, ward: Ward): WardNotesState {
  return { wards: [...state.wards, ward], activeWardId: ward.id };
}

export function renameWard(
  state: WardNotesState,
  wardId: string,
  name: string,
  description: string,
): WardNotesState {
  return {
    ...state,
    wards: state.wards.map((ward) =>
      ward.id === wardId
        ? {
            ...ward,
            name: name.trim() || ward.name,
            description: description.trim(),
          }
        : ward,
    ),
  };
}

export function removeWard(state: WardNotesState, wardId: string): WardNotesState {
  const wards = state.wards.filter((ward) => ward.id !== wardId);
  const activeWardId =
    state.activeWardId === wardId ? (wards[0]?.id ?? "") : state.activeWardId;
  return { wards, activeWardId };
}

export function insertCategory(state: WardNotesState, category: Category): WardNotesState {
  return mapActive(state, (ward) => ({
    ...ward,
    categories: [...ward.categories, category],
  }));
}

export function updateCategory(
  state: WardNotesState,
  categoryId: string,
  patch: Pick<Category, "name" | "icon" | "color">,
): WardNotesState {
  return mapActive(state, (ward) => ({
    ...ward,
    categories: ward.categories.map((category) =>
      category.id === categoryId
        ? {
            ...category,
            name: patch.name.trim() || category.name,
            icon: patch.icon,
            color: patch.color,
          }
        : category,
    ),
  }));
}

export function deleteCategory(state: WardNotesState, categoryId: string): WardNotesState {
  return mapActive(state, (ward) => ({
    ...ward,
    categories: ward.categories.filter((category) => category.id !== categoryId),
  }));
}

export function insertNote(state: WardNotesState, categoryId: string, note: Note): WardNotesState {
  return mapActive(state, (ward) => ({
    ...ward,
    categories: ward.categories.map((category) =>
      category.id === categoryId ? { ...category, notes: [note, ...category.notes] } : category,
    ),
  }));
}

export function changeNote(
  state: WardNotesState,
  categoryId: string,
  noteId: string,
  recipe: (note: Note) => Note,
): WardNotesState {
  return mapActive(state, (ward) => ({
    ...ward,
    categories: ward.categories.map((category) => {
      if (category.id !== categoryId) return category;
      return {
        ...category,
        notes: category.notes.map((note) => {
          if (note.id !== noteId) return note;
          const next = recipe(note);
          return { ...next, id: note.id, updatedAt: new Date().toISOString() };
        }),
      };
    }),
  }));
}

export function removeNote(
  state: WardNotesState,
  categoryId: string,
  noteId: string,
): WardNotesState {
  return mapActive(state, (ward) => ({
    ...ward,
    categories: ward.categories.map((category) =>
      category.id === categoryId
        ? { ...category, notes: category.notes.filter((note) => note.id !== noteId) }
        : category,
    ),
  }));
}
