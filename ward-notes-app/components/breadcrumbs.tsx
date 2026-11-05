import { ChevronRight } from "lucide-react";

export type Crumb = {
  label: string;
  onClick?: () => void;
};

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  if (items.length < 2) return null;

  return (
    <nav aria-label="Breadcrumb" className="no-scrollbar mt-3 overflow-x-auto">
      <ol className="flex min-w-max items-center gap-1 text-sm">
        {items.map((item, index) => {
          const last = index === items.length - 1;
          return (
            <li key={`${item.label}-${index}`} className="flex items-center gap-1">
              {index > 0 && (
                <ChevronRight className="size-3.5 shrink-0 text-slate-300" aria-hidden />
              )}
              {last || !item.onClick ? (
                <span
                  className="max-w-44 truncate font-medium text-slate-800 sm:max-w-64"
                  aria-current={last ? "page" : undefined}
                >
                  {item.label}
                </span>
              ) : (
                <button
                  type="button"
                  onClick={item.onClick}
                  className="max-w-44 truncate rounded-full px-1 text-sky-700 sm:max-w-64"
                >
                  {item.label}
                </button>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
