import { fileToJpegBlob } from "@/lib/images";
import { createId } from "@/lib/ids";
import { seedState } from "@/lib/seed";
import { calloutsFromJson, checklistFromJson, colorFromJson, iconFromJson } from "@/lib/revive";
import type { Category, Note, NoteImage, Ward, WardNotesState } from "@/lib/types";
import { getSupabase } from "@/utils/supabase";

const BUCKET = "ward-images";

type DbError = { message: string; code?: string } | null;

function explain(error: DbError) {
  const message = error?.message || "Supabase request failed.";
  if (
    error?.code === "42P01" ||
    error?.code === "PGRST205" ||
    /does not exist/i.test(message) ||
    /schema cache/i.test(message)
  ) {
    return "Supabase tables are missing. Run supabase/schema.sql in the SQL editor, then reload.";
  }
  if (error?.code === "42501" || /row-level security/i.test(message)) {
    return "Supabase blocked this change. Run supabase/schema.sql so the anon policies are in place.";
  }
  if (/bucket not found/i.test(message)) {
    return "The ward-images storage bucket is missing. Run supabase/schema.sql in the SQL editor, then reload.";
  }
  return message;
}

function fail(error: DbError): never {
  throw new Error(explain(error));
}

function rowsOf(value: unknown): Record<string, unknown>[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object");
}

function asText(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function asPosition(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function mapImage(row: Record<string, unknown>): NoteImage | null {
  if (typeof row.id !== "string" || typeof row.url !== "string") return null;
  return {
    id: row.id,
    url: row.url,
    storagePath: asText(row.storage_path),
    caption: asText(row.caption),
  };
}

function mapNote(row: Record<string, unknown>): Note | null {
  if (typeof row.id !== "string") return null;
  const images = rowsOf(row.note_images)
    .sort((left, right) => asPosition(left.position) - asPosition(right.position))
    .flatMap((image) => {
      const mapped = mapImage(image);
      return mapped ? [mapped] : [];
    });
  return {
    id: row.id,
    title: asText(row.title, "Untitled note"),
    content: asText(row.content),
    checklist: checklistFromJson(row.checklist),
    callouts: calloutsFromJson(row.callouts),
    images,
    updatedAt: asText(row.updated_at, "2026-01-01T00:00:00.000Z"),
  };
}

function mapCategory(row: Record<string, unknown>): Category | null {
  if (typeof row.id !== "string") return null;
  const notes = rowsOf(row.notes).flatMap((note) => {
    const mapped = mapNote(note);
    return mapped ? [mapped] : [];
  });
  return {
    id: row.id,
    name: asText(row.name, "Untitled category"),
    icon: iconFromJson(row.icon),
    color: colorFromJson(row.color),
    notes,
  };
}

function mapWard(row: Record<string, unknown>): Ward | null {
  if (typeof row.id !== "string") return null;
  const categories = rowsOf(row.categories)
    .sort((left, right) => asPosition(left.position) - asPosition(right.position))
    .flatMap((category) => {
      const mapped = mapCategory(category);
      return mapped ? [mapped] : [];
    });
  return {
    id: row.id,
    name: asText(row.name, "Untitled ward"),
    description: asText(row.description),
    categories,
  };
}

export async function loadWardNotes(): Promise<WardNotesState> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("wards")
    .select(
      `
      id, name, description, created_at,
      categories (
        id, name, icon, color, position,
        notes (
          id, title, content, checklist, callouts, updated_at,
          note_images ( id, url, caption, storage_path, position )
        )
      )
    `,
    )
    .order("created_at", { ascending: true });
  if (error) fail(error);

  const wards = rowsOf(data).flatMap((ward) => {
    const mapped = mapWard(ward);
    return mapped ? [mapped] : [];
  });

  const settings = await supabase.from("app_settings").select("active_ward_id").eq("id", 1).maybeSingle();
  if (settings.error) fail(settings.error);
  const requested = asText(settings.data?.active_ward_id);
  const activeWardId = wards.some((ward) => ward.id === requested) ? requested : (wards[0]?.id ?? "");
  return { wards, activeWardId };
}

export async function loadOrSeed(): Promise<WardNotesState> {
  const state = await loadWardNotes();
  if (state.wards.length > 0) return state;
  try {
    await seedDatabase();
  } catch (error) {
    const again = await loadWardNotes().catch(() => null);
    if (again && again.wards.length > 0) return again;
    throw error;
  }
  return loadWardNotes();
}

async function seedDatabase() {
  const supabase = getSupabase();
  const uploaded: string[] = [];
  const imageRows: {
    id: string;
    note_id: string;
    url: string;
    caption: string;
    storage_path: string;
    position: number;
  }[] = [];

  try {
    for (const ward of seedState.wards) {
      for (const category of ward.categories) {
        for (const note of category.notes) {
          for (const [index, image] of note.images.entries()) {
            const published = await publishDataUrl(note.id, image.id, image.url);
            uploaded.push(published.storagePath);
            imageRows.push({
              id: image.id,
              note_id: note.id,
              url: published.url,
              caption: image.caption,
              storage_path: published.storagePath,
              position: index,
            });
          }
        }
      }
    }

    const { error: wardError } = await supabase.from("wards").insert(
      seedState.wards.map((ward) => ({
        id: ward.id,
        name: ward.name,
        description: ward.description,
      })),
    );
    if (wardError) fail(wardError);

    const { error: categoryError } = await supabase.from("categories").insert(
      seedState.wards.flatMap((ward) =>
        ward.categories.map((category, position) => ({
          id: category.id,
          ward_id: ward.id,
          name: category.name,
          icon: category.icon,
          color: category.color,
          position,
        })),
      ),
    );
    if (categoryError) fail(categoryError);

    const { error: noteError } = await supabase.from("notes").insert(
      seedState.wards.flatMap((ward) =>
        ward.categories.flatMap((category) =>
          category.notes.map((note) => ({
            id: note.id,
            category_id: category.id,
            title: note.title,
            content: note.content,
            checklist: note.checklist,
            callouts: note.callouts,
            updated_at: note.updatedAt,
          })),
        ),
      ),
    );
    if (noteError) fail(noteError);

    if (imageRows.length > 0) {
      const { error: imageError } = await supabase.from("note_images").insert(imageRows);
      if (imageError) fail(imageError);
    }

    const { error: settingsError } = await supabase.from("app_settings").upsert({
      id: 1,
      active_ward_id: seedState.activeWardId || null,
    });
    if (settingsError) fail(settingsError);
  } catch (error) {
    await removeStorage(uploaded).catch(() => undefined);
    await supabase
      .from("wards")
      .delete()
      .in(
        "id",
        seedState.wards.map((ward) => ward.id),
      )
      .then(() => undefined, () => undefined);
    throw error;
  }
}

export async function saveActiveWard(wardId: string) {
  const { error } = await getSupabase()
    .from("app_settings")
    .upsert({ id: 1, active_ward_id: wardId || null });
  if (error) fail(error);
}

export async function insertWardRow(ward: Ward) {
  const { error } = await getSupabase().from("wards").insert({
    id: ward.id,
    name: ward.name,
    description: ward.description,
  });
  if (error) fail(error);
}

export async function updateWardRow(wardId: string, name: string, description: string) {
  const { error } = await getSupabase()
    .from("wards")
    .update({ name, description })
    .eq("id", wardId);
  if (error) fail(error);
}

export async function deleteWardRow(ward: Ward) {
  await removeStorage(storagePathsForWard(ward));
  const { error } = await getSupabase().from("wards").delete().eq("id", ward.id);
  if (error) fail(error);
}

export async function insertCategoryRow(wardId: string, category: Category, position: number) {
  const { error } = await getSupabase().from("categories").insert({
    id: category.id,
    ward_id: wardId,
    name: category.name,
    icon: category.icon,
    color: category.color,
    position,
  });
  if (error) fail(error);
}

export async function updateCategoryRow(categoryId: string, category: Pick<Category, "name" | "icon" | "color">) {
  const { error } = await getSupabase()
    .from("categories")
    .update({
      name: category.name,
      icon: category.icon,
      color: category.color,
    })
    .eq("id", categoryId);
  if (error) fail(error);
}

export async function deleteCategoryRow(category: Category) {
  await removeStorage(storagePathsForCategory(category));
  const { error } = await getSupabase().from("categories").delete().eq("id", category.id);
  if (error) fail(error);
}

export async function insertNoteRow(categoryId: string, note: Note) {
  const { error } = await getSupabase().from("notes").insert({
    id: note.id,
    category_id: categoryId,
    title: note.title,
    content: note.content,
    checklist: note.checklist,
    callouts: note.callouts,
    updated_at: note.updatedAt,
  });
  if (error) fail(error);
}

export async function saveNoteRow(note: Note) {
  const { error } = await getSupabase()
    .from("notes")
    .update({
      title: note.title,
      content: note.content,
      checklist: note.checklist,
      callouts: note.callouts,
      updated_at: note.updatedAt,
    })
    .eq("id", note.id);
  if (error) fail(error);
}

export async function deleteNoteRow(note: Note) {
  await removeStorage(note.images.map((image) => image.storagePath));
  const { error } = await getSupabase().from("notes").delete().eq("id", note.id);
  if (error) fail(error);
}

export async function uploadNoteImage(
  parent: NoteParent,
  file: File,
  position: number,
): Promise<NoteImage> {
  await ensureNoteSaved(parent);
  const id = createId("img");
  const blob = await fileToJpegBlob(file);
  const storagePath = `${parent.note.id}/${id}.jpg`;
  await uploadBlob(storagePath, blob, "image/jpeg");
  const url = publicUrl(storagePath);
  const { error } = await getSupabase().from("note_images").insert({
    id,
    note_id: parent.note.id,
    url,
    caption: "",
    storage_path: storagePath,
    position,
  });
  if (error) {
    await removeStorage([storagePath]).catch(() => undefined);
    fail(error);
  }
  return { id, url, storagePath, caption: "" };
}

type NoteParent = {
  ward: Pick<Ward, "id" | "name" | "description">;
  category: Pick<Category, "id" | "name" | "icon" | "color"> & { position: number };
  note: Note;
};

async function ensureNoteSaved({ ward, category, note }: NoteParent) {
  const supabase = getSupabase();
  const existing = await supabase.from("notes").select("id").eq("id", note.id).maybeSingle();
  if (existing.error) fail(existing.error);
  if (existing.data) return;

  const categoryRow = await supabase.from("categories").select("id").eq("id", category.id).maybeSingle();
  if (categoryRow.error) fail(categoryRow.error);
  if (!categoryRow.data) {
    const wardRow = await supabase.from("wards").select("id").eq("id", ward.id).maybeSingle();
    if (wardRow.error) fail(wardRow.error);
    if (!wardRow.data) {
      const { error } = await supabase.from("wards").upsert({
        id: ward.id,
        name: ward.name,
        description: ward.description,
      });
      if (error) fail(error);
    }
    const { error } = await supabase.from("categories").upsert({
      id: category.id,
      ward_id: ward.id,
      name: category.name,
      icon: category.icon,
      color: category.color,
      position: category.position,
    });
    if (error) fail(error);
  }

  const { error } = await supabase.from("notes").upsert({
    id: note.id,
    category_id: category.id,
    title: note.title,
    content: note.content,
    checklist: note.checklist,
    callouts: note.callouts,
    updated_at: note.updatedAt,
  });
  if (error) fail(error);
}

export async function saveImageCaption(imageId: string, caption: string) {
  const { error } = await getSupabase().from("note_images").update({ caption }).eq("id", imageId);
  if (error) fail(error);
}

export async function deleteImageRow(image: NoteImage) {
  await removeStorage([image.storagePath]);
  const { error } = await getSupabase().from("note_images").delete().eq("id", image.id);
  if (error) fail(error);
}

function storagePathsForWard(ward: Ward) {
  return ward.categories.flatMap((category) => storagePathsForCategory(category));
}

function storagePathsForCategory(category: Category) {
  return category.notes.flatMap((note) => note.images.map((image) => image.storagePath));
}

async function publishDataUrl(noteId: string, imageId: string, dataUrl: string) {
  const blob = dataUrlToBlob(dataUrl);
  const extension = blob.type.includes("svg") ? "svg" : "jpg";
  const storagePath = `seed/${noteId}/${imageId}.${extension}`;
  await uploadBlob(storagePath, blob, blob.type || "application/octet-stream");
  return { url: publicUrl(storagePath), storagePath };
}

async function uploadBlob(path: string, body: Blob, contentType: string) {
  const { error } = await getSupabase().storage.from(BUCKET).upload(path, body, {
    contentType,
    upsert: true,
  });
  if (error) fail(error);
}

function publicUrl(path: string) {
  const { data } = getSupabase().storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

async function removeStorage(paths: string[]) {
  const unique = [...new Set(paths.filter(Boolean))];
  if (unique.length === 0) return;
  const { error } = await getSupabase().storage.from(BUCKET).remove(unique);
  if (error) fail(error);
}

function dataUrlToBlob(dataUrl: string) {
  const match = /^data:([^;,]+)?(?:;charset=[^;,]+)?(;base64)?,(.*)$/.exec(dataUrl);
  if (!match) throw new Error("Couldn't read a sample image.");
  const mime = match[1] || "application/octet-stream";
  const payload = match[3] ?? "";
  if (match[2]) {
    const binary = atob(payload);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
    return new Blob([bytes], { type: mime });
  }
  return new Blob([decodeURIComponent(payload)], { type: mime });
}
