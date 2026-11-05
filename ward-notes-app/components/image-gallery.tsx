"use client";

import { useRef, useState } from "react";
import { Camera, ImagePlus, Trash2 } from "lucide-react";
import { Lightbox } from "@/components/lightbox";
import type { NoteImage } from "@/lib/types";

export function ImageGallery({
  images,
  onAdd,
  onCaption,
  onDelete,
}: {
  images: NoteImage[];
  onAdd: (file: File) => Promise<void>;
  onCaption: (imageId: string, caption: string) => void;
  onDelete: (imageId: string) => void;
}) {
  const libraryRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const visibleIndex = openIndex != null && images[openIndex] ? openIndex : null;

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      await onAdd(file);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Couldn't add that photo.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-200/80">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">Photos</h2>
          <p className="mt-1 text-sm text-slate-500">Reference charts and equipment stay with this note.</p>
        </div>
      </div>

      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          disabled={busy}
          onClick={() => libraryRef.current?.click()}
          className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-sky-600 text-sm font-semibold text-white disabled:bg-sky-300"
        >
          <ImagePlus className="size-4" aria-hidden />
          {busy ? "Adding photo…" : "Upload photo"}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => cameraRef.current?.click()}
          className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl border border-slate-200 text-sm font-semibold text-slate-700 disabled:opacity-50"
        >
          <Camera className="size-4" aria-hidden />
          Take photo
        </button>
        <input
          ref={libraryRef}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            void handleFile(file);
          }}
        />
        <input
          ref={cameraRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="sr-only"
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            void handleFile(file);
          }}
        />
      </div>
      {error && (
        <p className="mt-2 text-sm text-rose-600" role="alert">
          {error}
        </p>
      )}

      {images.length > 0 && (
        <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {images.map((image, index) => (
            <li key={image.id}>
              <figure className="space-y-2">
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setOpenIndex(index)}
                    className="block w-full overflow-hidden rounded-2xl ring-1 ring-slate-200"
                    aria-label={image.caption ? `Open photo: ${image.caption}` : "Open photo"}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={image.url}
                      alt={image.caption || "Attached reference photo"}
                      className="aspect-square w-full object-cover"
                    />
                  </button>
                  <button
                    type="button"
                    aria-label="Delete photo"
                    onClick={() => onDelete(image.id)}
                    className="absolute right-2 top-2 grid size-10 place-items-center rounded-full bg-white/95 text-rose-600 shadow"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
                <input
                  value={image.caption}
                  onChange={(event) => onCaption(image.id, event.target.value)}
                  placeholder="Caption"
                  maxLength={140}
                  aria-label="Photo caption"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-base text-slate-800 outline-none placeholder:text-slate-400 focus:border-sky-400"
                />
              </figure>
            </li>
          ))}
        </ul>
      )}

      {visibleIndex != null && (
        <Lightbox
          images={images}
          index={visibleIndex}
          onIndex={setOpenIndex}
          onClose={() => setOpenIndex(null)}
          onDelete={() => {
            const image = images[visibleIndex];
            if (!image) return;
            onDelete(image.id);
            if (images.length <= 1) setOpenIndex(null);
            else if (visibleIndex === images.length - 1) setOpenIndex(visibleIndex - 1);
          }}
        />
      )}
    </section>
  );
}
