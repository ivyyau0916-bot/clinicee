import { Pencil, Plus, Trash2 } from "lucide-react";
import { CategoryIcon, colorStyle } from "@/components/category-style";
import { iconButtonClass } from "@/components/classes";
import { cn } from "@/lib/cn";
import type { Category } from "@/lib/types";

export function CategoryGrid({
  categories,
  onOpen,
  onEdit,
  onDelete,
  onAdd,
}: {
  categories: Category[];
  onOpen: (categoryId: string) => void;
  onEdit: (categoryId: string) => void;
  onDelete: (categoryId: string) => void;
  onAdd: () => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {categories.map((category) => {
        const palette = colorStyle(category.color);
        const count = category.notes.length;
        return (
          <article
            key={category.id}
            className="relative flex flex-col overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200/80"
          >
            <span className={cn("absolute inset-y-0 left-0 w-1.5", palette.bar)} aria-hidden />
            <button
              type="button"
              onClick={() => onOpen(category.id)}
              className="flex flex-1 flex-col items-start px-4 pb-2 pt-4 text-left"
            >
              <CategoryIcon icon={category.icon} color={category.color} />
              <h2 className="mt-4 text-base font-semibold leading-snug text-slate-900">{category.name}</h2>
              <p className="mt-1 text-sm text-slate-500">{count === 1 ? "1 note" : `${count} notes`}</p>
            </button>
            <div className="flex justify-end px-1 pb-1">
              <button
                type="button"
                className={iconButtonClass}
                aria-label={`Edit ${category.name}`}
                onClick={() => onEdit(category.id)}
              >
                <Pencil className="size-4" />
              </button>
              <button
                type="button"
                className={cn(iconButtonClass, "hover:bg-rose-50 hover:text-rose-600")}
                aria-label={`Delete ${category.name}`}
                onClick={() => onDelete(category.id)}
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          </article>
        );
      })}
      <button
        type="button"
        onClick={onAdd}
        className="flex min-h-40 flex-col items-center justify-center gap-2 rounded-3xl border border-dashed border-sky-300 bg-sky-50/70 px-4 text-sm font-semibold text-sky-800 transition hover:bg-sky-100/80"
      >
        <Plus className="size-5" aria-hidden />
        Add category
      </button>
    </div>
  );
}
