import { ChevronRight } from "lucide-react";
import { colorStyle } from "@/components/category-style";
import { cn } from "@/lib/cn";
import type { SearchHit } from "@/lib/search";

export function SearchResults({
  query,
  hits,
  onOpen,
}: {
  query: string;
  hits: SearchHit[];
  onOpen: (categoryId: string, noteId: string) => void;
}) {
  return (
    <section>
      <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">
        {hits.length === 1 ? "1 matching note" : `${hits.length} matching notes`}
      </h2>
      <p className="sr-only" aria-live="polite">
        {hits.length === 1 ? "1 note matches the search" : `${hits.length} notes match the search`}
      </p>
      {hits.length === 0 ? (
        <div className="mt-4 rounded-3xl border border-dashed border-slate-200 bg-white/70 px-5 py-10 text-center">
          <p className="font-medium text-slate-800">No notes match “{query.trim()}”</p>
          <p className="mt-1 text-sm text-slate-500">Try a drug name, a checklist step, or part of a title.</p>
        </div>
      ) : (
        <ul className="mt-3 space-y-3">
          {hits.map((hit) => {
            const palette = colorStyle(hit.category.color);
            return (
              <li key={hit.note.id}>
                <button
                  type="button"
                  onClick={() => onOpen(hit.category.id, hit.note.id)}
                  className="flex w-full items-start gap-3 rounded-3xl bg-white p-4 text-left shadow-sm ring-1 ring-slate-200/80"
                >
                  <span className="min-w-0 flex-1">
                    <span className={cn("inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ring-1", palette.chip)}>
                      {hit.category.name}
                    </span>
                    <span className="mt-2 block font-semibold text-slate-900">
                      <Highlight text={hit.note.title} query={query} />
                    </span>
                    <span className="mt-1 line-clamp-2 block text-sm leading-6 text-slate-500">
                      <Highlight text={hit.snippet} query={query} />
                    </span>
                  </span>
                  <ChevronRight className="mt-1 size-5 shrink-0 text-slate-300" aria-hidden />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function Highlight({ text, query }: { text: string; query: string }) {
  const needle = query.trim();
  const index = needle ? text.toLowerCase().indexOf(needle.toLowerCase()) : -1;
  if (!needle || index === -1) return text;
  return (
    <>
      {text.slice(0, index)}
      <mark className="rounded bg-amber-100 px-0.5 text-inherit">{text.slice(index, index + needle.length)}</mark>
      {text.slice(index + needle.length)}
    </>
  );
}
