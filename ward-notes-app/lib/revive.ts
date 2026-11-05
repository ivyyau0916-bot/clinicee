import type {
  Callout,
  CalloutKind,
  Category,
  ChecklistItem,
  IconName,
  Note,
  NoteImage,
  TagColor,
  Ward,
  WardNotesState,
} from "@/lib/types";
import { ICON_NAMES, TAG_COLOR_NAMES } from "@/lib/types";

function asString(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

export function iconFromJson(value: unknown): IconName {
  return typeof value === "string" && (ICON_NAMES as readonly string[]).includes(value)
    ? (value as IconName)
    : "book";
}

export function colorFromJson(value: unknown): TagColor {
  return typeof value === "string" && (TAG_COLOR_NAMES as readonly string[]).includes(value)
    ? (value as TagColor)
    : "sky";
}

export function checklistFromJson(value: unknown): ChecklistItem[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const row = item as Partial<ChecklistItem>;
    if (typeof row.id !== "string") return [];
    return [{ id: row.id, text: asString(row.text), done: Boolean(row.done) }];
  });
}

export function calloutsFromJson(value: unknown): Callout[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const row = item as Partial<Callout>;
    if (typeof row.id !== "string") return [];
    const kind: CalloutKind = row.kind === "warning" ? "warning" : "tip";
    return [{ id: row.id, kind, text: asString(row.text) }];
  });
}

function normalizeImages(value: unknown): NoteImage[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const row = item as Partial<NoteImage>;
    const url = typeof row.url === "string" ? row.url : "";
    if (typeof row.id !== "string" || !url) return [];
    return [
      {
        id: row.id,
        url,
        storagePath: asString(row.storagePath),
        caption: asString(row.caption),
      },
    ];
  });
}

function normalizeNote(value: unknown): Note | null {
  if (!value || typeof value !== "object") return null;
  const note = value as Partial<Note>;
  if (typeof note.id !== "string") return null;
  return {
    id: note.id,
    title: asString(note.title, "Untitled note"),
    content: asString(note.content),
    checklist: checklistFromJson(note.checklist),
    callouts: calloutsFromJson(note.callouts),
    images: normalizeImages(note.images),
    updatedAt: asString(note.updatedAt, "2026-01-01T00:00:00.000Z"),
  };
}

function normalizeCategory(value: unknown): Category | null {
  if (!value || typeof value !== "object") return null;
  const category = value as Partial<Category>;
  if (typeof category.id !== "string") return null;
  const notes = Array.isArray(category.notes)
    ? category.notes.flatMap((note) => {
        const normalized = normalizeNote(note);
        return normalized ? [normalized] : [];
      })
    : [];
  return {
    id: category.id,
    name: asString(category.name, "Untitled category"),
    icon: iconFromJson(category.icon),
    color: colorFromJson(category.color),
    notes,
  };
}

function normalizeWard(value: unknown): Ward | null {
  if (!value || typeof value !== "object") return null;
  const ward = value as Partial<Ward>;
  if (typeof ward.id !== "string") return null;
  const categories = Array.isArray(ward.categories)
    ? ward.categories.flatMap((category) => {
        const normalized = normalizeCategory(category);
        return normalized ? [normalized] : [];
      })
    : [];
  return {
    id: ward.id,
    name: asString(ward.name, "Untitled ward"),
    description: asString(ward.description),
    categories,
  };
}

export function reviveState(raw: unknown): WardNotesState | null {
  if (!raw || typeof raw !== "object") return null;
  const record = raw as { wards?: unknown; activeWardId?: unknown };
  if (!Array.isArray(record.wards)) return null;

  const wards = record.wards.flatMap((ward) => {
    const normalized = normalizeWard(ward);
    return normalized ? [normalized] : [];
  });

  if (record.wards.length > 0 && wards.length === 0) return null;

  const requested = typeof record.activeWardId === "string" ? record.activeWardId : "";
  const activeWardId = wards.some((ward) => ward.id === requested)
    ? requested
    : (wards[0]?.id ?? "");

  return { wards, activeWardId };
}
