"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Trash2, X, ZoomIn, ZoomOut } from "lucide-react";
import { cn } from "@/lib/cn";
import type { NoteImage } from "@/lib/types";

const SCALES = [1, 1.5, 2, 3];

export function Lightbox({
  images,
  index,
  onIndex,
  onClose,
  onDelete,
}: {
  images: NoteImage[];
  index: number;
  onIndex: (index: number) => void;
  onClose: () => void;
  onDelete: () => void;
}) {
  const image = images[index];
  if (!image) return null;

  return (
    <LightboxFrame
      key={image.id}
      image={image}
      index={index}
      total={images.length}
      onClose={onClose}
      onDelete={onDelete}
      onPrev={index > 0 ? () => onIndex(index - 1) : undefined}
      onNext={index < images.length - 1 ? () => onIndex(index + 1) : undefined}
    />
  );
}

function LightboxFrame({
  image,
  index,
  total,
  onClose,
  onDelete,
  onPrev,
  onNext,
}: {
  image: NoteImage;
  index: number;
  total: number;
  onClose: () => void;
  onDelete: () => void;
  onPrev?: () => void;
  onNext?: () => void;
}) {
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowLeft") onPrev?.();
      if (event.key === "ArrowRight") onNext?.();
      if (event.key === "+" || event.key === "=") {
        setScale((current) => stepScale(current, 1));
      }
      if (event.key === "-" || event.key === "_") {
        setScale((current) => stepScale(current, -1));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose, onNext, onPrev]);

  return (
    <div
      className="fixed inset-0 z-[60] flex flex-col bg-slate-950 text-white"
      role="dialog"
      aria-modal="true"
      aria-label="Photo preview"
    >
      <div className="flex items-center justify-between gap-2 px-3 py-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <p className="pl-2 text-sm text-slate-300">
          {index + 1} / {total}
        </p>
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="Zoom out"
            onClick={() => setScale((current) => stepScale(current, -1))}
            disabled={scale <= 1}
            className="grid size-11 place-items-center rounded-full hover:bg-white/10 disabled:opacity-30"
          >
            <ZoomOut className="size-5" />
          </button>
          <button
            type="button"
            aria-label="Zoom in"
            onClick={() => setScale((current) => stepScale(current, 1))}
            disabled={scale >= 3}
            className="grid size-11 place-items-center rounded-full hover:bg-white/10 disabled:opacity-30"
          >
            <ZoomIn className="size-5" />
          </button>
          <button
            type="button"
            aria-label="Delete photo"
            onClick={onDelete}
            className="grid size-11 place-items-center rounded-full text-rose-200 hover:bg-white/10"
          >
            <Trash2 className="size-5" />
          </button>
          <button
            type="button"
            aria-label="Close preview"
            onClick={onClose}
            className="grid size-11 place-items-center rounded-full hover:bg-white/10"
          >
            <X className="size-5" />
          </button>
        </div>
      </div>

      <div className="relative min-h-0 flex-1">
        {onPrev && (
          <button
            type="button"
            aria-label="Previous photo"
            onClick={onPrev}
            className="absolute left-2 top-1/2 z-10 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-white/10 hover:bg-white/20"
          >
            <ChevronLeft className="size-6" />
          </button>
        )}
        {onNext && (
          <button
            type="button"
            aria-label="Next photo"
            onClick={onNext}
            className="absolute right-2 top-1/2 z-10 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-white/10 hover:bg-white/20"
          >
            <ChevronRight className="size-6" />
          </button>
        )}
        <div
          className={cn(
            "h-full overflow-auto p-4",
            scale === 1 && "grid place-items-center",
          )}
          onClick={onClose}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={image.url}
            alt={image.caption || "Attached reference photo"}
            onClick={(event) => event.stopPropagation()}
            onDoubleClick={(event) => {
              event.stopPropagation();
              setScale((current) => (current === 1 ? 2 : 1));
            }}
            className="max-w-none rounded-lg"
            style={
              scale === 1
                ? { maxHeight: "70dvh", maxWidth: "100%", width: "auto", height: "auto" }
                : { width: `${scale * 100}%`, maxWidth: "none", height: "auto" }
            }
          />
        </div>
      </div>

      <p className="px-6 pb-[max(1rem,env(safe-area-inset-bottom))] text-center text-sm text-slate-200">
        {image.caption || "No caption"} · double-tap the photo to zoom
      </p>
    </div>
  );
}

function stepScale(current: number, direction: 1 | -1) {
  const index = Math.max(0, SCALES.indexOf(current));
  const next = SCALES[Math.min(SCALES.length - 1, Math.max(0, index + direction))];
  return next ?? current;
}
