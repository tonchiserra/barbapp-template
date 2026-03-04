"use client";

import * as React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { uploadImage, deleteImage, validateImageFile } from "@/lib/storage";

interface ImageUploadProps {
  bucket: string;
  path: string;
  currentUrl?: string;
  onUpload: (url: string) => void;
  onRemove: () => void;
  className?: string;
}

export function ImageUpload({
  bucket,
  path,
  currentUrl,
  onUpload,
  onRemove,
  className,
}: ImageUploadProps) {
  const [uploading, setUploading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);

    const validation = validateImageFile(file);
    if (!validation.valid) {
      setError(validation.error!);
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    setUploading(true);

    const result = await uploadImage(file, bucket, path);

    if (result.error) {
      setError(result.error);
    } else if (result.url) {
      onUpload(result.url);
    }

    setUploading(false);
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleRemove = async () => {
    setError(null);
    setUploading(true);

    const result = await deleteImage(bucket, path);

    if (result.error) {
      setError(result.error);
    } else {
      onRemove();
    }

    setUploading(false);
  };

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {currentUrl ? (
        <div className="flex items-center gap-4">
          <div className="relative h-32 w-32 overflow-hidden rounded-xl border bg-secondary">
            <Image
              src={currentUrl}
              alt="Logo actual"
              fill
              className="object-cover"
            />
          </div>
          <div className="flex flex-col items-start gap-1.5">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="text-sm font-medium text-primary hover:text-primary/80 disabled:opacity-40"
            >
              {uploading ? "Subiendo..." : "Cambiar imagen"}
            </button>
            <button
              type="button"
              onClick={handleRemove}
              disabled={uploading}
              className="text-sm font-medium text-destructive hover:text-destructive/80 disabled:opacity-40"
            >
              Eliminar
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className={cn(
            "flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-input px-6 py-8",
            "text-muted-foreground transition-colors duration-200",
            "hover:border-primary/50 hover:bg-accent/50",
            "disabled:opacity-40",
          )}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-8 w-8"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" x2="12" y1="3" y2="15" />
          </svg>
          <span className="text-sm font-medium">
            {uploading ? "Subiendo..." : "Subir imagen"}
          </span>
          <span className="text-xs">PNG, JPG, WebP o SVG. Max 2MB.</span>
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/svg+xml"
        onChange={handleFileChange}
        className="hidden"
      />

      {error && (
        <p className="text-sm font-medium text-destructive">{error}</p>
      )}
    </div>
  );
}
