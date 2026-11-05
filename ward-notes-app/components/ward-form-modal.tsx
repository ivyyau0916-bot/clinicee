"use client";

import { useId, useState } from "react";
import { dangerClass, fieldClass, primaryClass, quietClass } from "@/components/classes";
import { Modal } from "@/components/modal";

export function WardFormModal({
  title,
  initialName,
  initialDescription,
  allowDelete,
  onSave,
  onDelete,
  onClose,
}: {
  title: string;
  initialName: string;
  initialDescription: string;
  allowDelete?: boolean;
  onSave: (name: string, description: string) => void;
  onDelete?: () => void;
  onClose: () => void;
}) {
  const nameId = useId();
  const descriptionId = useId();
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription);

  return (
    <Modal title={title} onClose={onClose}>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (!name.trim()) return;
          onSave(name, description);
        }}
        className="space-y-4"
      >
        <div>
          <label htmlFor={nameId} className="mb-1.5 block text-sm font-medium text-slate-700">
            Ward name
          </label>
          <input
            id={nameId}
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Ward 7A"
            autoFocus
            maxLength={60}
            autoCapitalize="words"
            className={fieldClass}
          />
        </div>
        <div>
          <label htmlFor={descriptionId} className="mb-1.5 block text-sm font-medium text-slate-700">
            Short description
          </label>
          <input
            id={descriptionId}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Acute medical"
            maxLength={80}
            className={fieldClass}
          />
        </div>
        <p className="text-xs leading-5 text-slate-500">
          Wards, notes, and photos are saved to Supabase.
        </p>
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          {allowDelete && onDelete ? (
            <button type="button" className={dangerClass} onClick={onDelete}>
              Delete ward
            </button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <button type="button" className={quietClass} onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className={primaryClass} disabled={!name.trim()}>
              Save ward
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
