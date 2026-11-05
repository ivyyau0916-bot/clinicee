import type { Category, Note, Ward } from "@/lib/types";

export type SearchHit = {
  category: Category;
  note: Note;
  snippet: string;
};

export function notePreview(note: Note) {
  const content = note.content.trim();
  if (content) return content;
  const step = note.checklist.find((item) => item.text.trim());
  if (step) return step.text;
  const callout = note.callouts.find((item) => item.text.trim());
  if (callout) return callout.text;
  return "No content yet";
}

function snippetFrom(source: string, needle: string) {
  const index = source.toLowerCase().indexOf(needle);
  if (index === -1) return null;
  const start = Math.max(0, index - 28);
  const end = Math.min(source.length, index + needle.length + 52);
  const prefix = start > 0 ? "…" : "";
  const suffix = end < source.length ? "…" : "";
  return `${prefix}${source.slice(start, end).trim()}${suffix}`;
}

export function searchNotes(ward: Ward, query: string): SearchHit[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return [];

  const hits: SearchHit[] = [];
  for (const category of ward.categories) {
    for (const note of category.notes) {
      const fields = [
        note.title,
        note.content,
        category.name,
        ...note.checklist.map((item) => item.text),
        ...note.callouts.map((item) => item.text),
        ...note.images.map((image) => image.caption),
      ];
      if (!fields.some((field) => field.toLowerCase().includes(needle))) continue;

      const snippet =
        snippetFrom(note.content, needle) ??
        snippetFrom(note.checklist.map((item) => item.text).join(" · "), needle) ??
        snippetFrom(note.callouts.map((item) => item.text).join(" · "), needle) ??
        snippetFrom(note.images.map((image) => image.caption).join(" · "), needle) ??
        notePreview(note);

      hits.push({ category, note, snippet });
    }
  }
  return hits;
}
