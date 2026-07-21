"use client";

import { useId, useRef, useState, type DragEvent } from "react";
import { GripVertical, ImagePlus, Trash2, Upload } from "lucide-react";
import {
  removeProductImageFile,
  uploadProductImage,
  validateProductImageFile,
} from "@/lib/storage/product-images";

export interface ProductFormImage {
  id: string;
  url: string;
  path?: string;
  progress?: number;
  uploading?: boolean;
  error?: string;
}

interface ProductImageUploaderProps {
  images: ProductFormImage[];
  onChange: (images: ProductFormImage[]) => void;
}

export function ProductImageUploader({
  images,
  onChange,
}: ProductImageUploaderProps) {
  const inputId = useId();
  const dragIndexRef = useRef<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);

  async function handleFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) {
      return;
    }

    setIsSelecting(true);
    const files = Array.from(fileList);
    let working = [...images];

    for (const file of files) {
      const localId = crypto.randomUUID();
      const previewUrl = URL.createObjectURL(file);
      const validationError = validateProductImageFile(file);

      if (validationError) {
        working = [
          ...working,
          {
            id: localId,
            url: previewUrl,
            uploading: false,
            error: validationError,
            progress: 0,
          },
        ];
        onChange(working);
        continue;
      }

      const pending: ProductFormImage = {
        id: localId,
        url: previewUrl,
        uploading: true,
        progress: 0,
      };

      working = [...working, pending];
      onChange(working);

      try {
        const uploaded = await uploadProductImage(file, (progress) => {
          working = working.map((image) =>
            image.id === localId
              ? { ...image, progress, uploading: progress < 100 }
              : image
          );
          onChange(working);
        });

        URL.revokeObjectURL(previewUrl);
        working = working.map((image) =>
          image.id === localId
            ? {
                id: localId,
                url: uploaded.publicUrl,
                path: uploaded.path,
                uploading: false,
                progress: 100,
              }
            : image
        );
        onChange(working);
      } catch (error) {
        working = working.map((image) =>
          image.id === localId
            ? {
                ...image,
                uploading: false,
                progress: 0,
                error:
                  error instanceof Error ? error.message : "Upload failed.",
              }
            : image
        );
        onChange(working);
      }
    }

    setIsSelecting(false);
  }

  async function removeImage(image: ProductFormImage) {
    // Only remove freshly uploaded files; existing product images are cleaned up on save.
    if (image.path) {
      try {
        await removeProductImageFile(image.path);
      } catch {
        // Keep UI responsive even if storage cleanup fails.
      }
    }

    if (image.url.startsWith("blob:")) {
      URL.revokeObjectURL(image.url);
    }

    onChange(images.filter((item) => item.id !== image.id));
  }

  function onDragStart(index: number) {
    dragIndexRef.current = index;
  }

  function onDragOver(event: DragEvent<HTMLLIElement>, index: number) {
    event.preventDefault();
    setDragOverIndex(index);
  }

  function onDrop(index: number) {
    const from = dragIndexRef.current;
    dragIndexRef.current = null;
    setDragOverIndex(null);

    if (from === null || from === index) {
      return;
    }

    const next = [...images];
    const [moved] = next.splice(from, 1);
    next.splice(index, 0, moved);
    onChange(next);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-white">Product images</p>
          <p className="mt-1 text-xs text-neutral-400">
            Upload multiple images. Drag to reorder — first image is the cover.
          </p>
        </div>
        <label
          htmlFor={inputId}
          className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-neutral-700 bg-neutral-950 px-4 py-2 text-xs font-semibold text-neutral-100 transition hover:border-lime-400 hover:text-lime-300"
        >
          <Upload className="h-3.5 w-3.5" />
          {isSelecting ? "Uploading..." : "Add images"}
        </label>
        <input
          id={inputId}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          multiple
          className="sr-only"
          onChange={(event) => {
            void handleFiles(event.target.files);
            event.target.value = "";
          }}
        />
      </div>

      {images.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-700 bg-neutral-950/60 px-4 py-10 text-center">
          <ImagePlus className="h-8 w-8 text-neutral-500" />
          <p className="mt-3 text-sm text-neutral-400">No images yet</p>
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {images.map((image, index) => (
            <li
              key={image.id}
              draggable={!image.uploading}
              onDragStart={() => onDragStart(index)}
              onDragOver={(event) => onDragOver(event, index)}
              onDrop={() => onDrop(index)}
              onDragEnd={() => {
                dragIndexRef.current = null;
                setDragOverIndex(null);
              }}
              className={`group relative overflow-hidden rounded-xl border bg-neutral-950 ${
                dragOverIndex === index
                  ? "border-lime-400"
                  : "border-neutral-800"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={image.url}
                alt={`Product image ${index + 1}`}
                className="aspect-square w-full object-cover"
              />

              <div className="absolute inset-x-0 top-0 flex items-center justify-between bg-gradient-to-b from-black/70 to-transparent p-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-black/50 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-white">
                  <GripVertical className="h-3 w-3" />
                  {index === 0 ? "Cover" : `#${index + 1}`}
                </span>
                <button
                  type="button"
                  onClick={() => void removeImage(image)}
                  className="rounded-full bg-black/50 p-1.5 text-white transition hover:bg-red-600"
                  aria-label="Remove image"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>

              {(image.uploading || image.error) && (
                <div className="absolute inset-x-0 bottom-0 bg-black/75 px-3 py-2">
                  {image.uploading && (
                    <>
                      <div className="mb-1 flex justify-between text-[10px] text-neutral-200">
                        <span>Uploading</span>
                        <span>{image.progress ?? 0}%</span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-neutral-700">
                        <div
                          className="h-full origin-left rounded-full bg-lime-400 transition-transform duration-150"
                          // Dynamic upload progress requires a runtime transform value.
                          style={{
                            transform: `scaleX(${Math.min(
                              Math.max((image.progress ?? 0) / 100, 0),
                              1
                            )})`,
                          }}
                        />
                      </div>
                    </>
                  )}
                  {image.error && (
                    <p className="text-[11px] text-red-300">{image.error}</p>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
