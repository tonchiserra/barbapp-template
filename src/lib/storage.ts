import { createClient } from "@/lib/supabase/client";

export const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB

export const ALLOWED_IMAGE_TYPES = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/svg+xml",
];

interface ValidationResult {
  valid: boolean;
  error?: string;
}

export function validateImageFile(file: File): ValidationResult {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: "Formato no permitido. Usa PNG, JPG, WebP o SVG.",
    };
  }

  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: "La imagen debe pesar menos de 2MB.",
    };
  }

  return { valid: true };
}

export async function uploadImage(
  file: File,
  bucket: string,
  path: string,
): Promise<{ url: string | null; error: string | null }> {
  const validation = validateImageFile(file);
  if (!validation.valid) {
    return { url: null, error: validation.error! };
  }

  const supabase = createClient();

  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    upsert: true,
  });

  if (error) {
    return { url: null, error: "Error al subir la imagen. Intenta de nuevo." };
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);

  // Append cache-busting param so browser/CDN fetches the new file
  // when the same path is overwritten with a different image.
  return { url: `${data.publicUrl}?v=${Date.now()}`, error: null };
}

export async function deleteImage(
  bucket: string,
  path: string,
): Promise<{ error: string | null }> {
  const supabase = createClient();

  const { error } = await supabase.storage.from(bucket).remove([path]);

  if (error) {
    return { error: "Error al eliminar la imagen." };
  }

  return { error: null };
}
