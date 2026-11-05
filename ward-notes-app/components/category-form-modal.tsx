"use client";

import { useId, useState } from "react";
import { Check } from "lucide-react";
import { CATEGORY_ICONS, COLOR_STYLES } from "@/components/category-style";
import { fieldClass, primaryClass, quietClass } from "@/components/classes";
import { cn } from "@/lib/cn";
import { Modal } from "@/components/modal";
import { ICON_NAMES, TAG_COLOR_NAMES, type IconName, type TagColor } from "@/lib/types";

export function CategoryFormModal({
  title,
  initialName,
  initialIcon,
  initialColor,
  onSave,
  onClose,
}: {
  title: string;
  initialName: string;
  initialIcon: IconName;
  initialColor: TagColor;
  onSave: (name: string, icon: IconName, color: TagColor) => void;
  onClose: () => void;
}) {
  const nameId = useId();
  const [name, setName] = useState(initialName);
  const [icon, setIcon] = useState<IconName>(initialIcon);
  const [color, setColor] = useState<TagColor>(initialColor);

  return (
    <Modal title={title} onClose={onClose}>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (!name.trim()) return;
          onSave(name, icon, color);
        }}
        className="space-y-5"
      >
        <div>
          <label htmlFor={nameId} className="mb-1.5 block text-sm font-medium text-slate-700">
            Category name
          </label>
          <input
            id={nameId}
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Admission SOP"
            autoFocus
            maxLength={60}
            className={fieldClass}
          />
        </div>

        <fieldset>
          <legend className="mb-2 text-sm font-medium text-slate-700">Icon</legend>
          <div className="grid grid-cols-5 gap-2">
            {ICON_NAMES.map((name) => {
              const { Icon, label } = CATEGORY_ICONS[name];
              const selected = icon === name;
              return (
                <button
                  key={name}
                  type="button"
                  aria-label={label}
                  aria-pressed={selected}
                  onClick={() => setIcon(name)}
                  className={cn(
                    "grid h-12 place-items-center rounded-2xl border text-slate-600",
                    selected
                      ? "border-sky-500 bg-sky-50 text-sky-700"
                      : "border-slate-200 bg-white hover:bg-slate-50",
                  )}
                >
                  <Icon className="size-5" />
                </button>
              );
            })}
          </div>
        </fieldset>

        <fieldset>
          <legend className="mb-2 text-sm font-medium text-slate-700">Tag colour</legend>
          <div className="flex flex-wrap gap-2">
            {TAG_COLOR_NAMES.map((name) => {
              const style = COLOR_STYLES[name];
              const selected = color === name;
              return (
                <button
                  key={name}
                  type="button"
                  aria-label={style.label}
                  aria-pressed={selected}
                  onClick={() => setColor(name)}
                  className={cn(
                    "grid size-11 place-items-center rounded-full ring-2 ring-offset-2",
                    selected ? "ring-slate-900" : "ring-transparent",
                  )}
                >
                  <span className={cn("grid size-8 place-items-center rounded-full text-white", style.swatch)}>
                    {selected && <Check className="size-4" />}
                  </span>
                </button>
              );
            })}
          </div>
        </fieldset>

        <div className="flex justify-end gap-2">
          <button type="button" className={quietClass} onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className={primaryClass} disabled={!name.trim()}>
            Save category
          </button>
        </div>
      </form>
    </Modal>
  );
}
