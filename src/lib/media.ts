import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"];
export const DOC_TYPES = ["application/pdf", ...IMAGE_TYPES];
export const MAX_IMAGE_MB = 10;
export const MAX_VIDEO_MB = 50;
export const MAX_DOC_MB = 10;

export function validateFile(file: File, types: string[], maxMb: number): string | null {
  if (!types.includes(file.type)) return `نوع الملف "${file.name}" غير مسموح.`;
  if (file.size > maxMb * 1024 * 1024) return `حجم الملف "${file.name}" يتجاوز ${maxMb} ميغابايت.`;
  return null;
}

function ext(file: File) {
  const e = file.name.split(".").pop();
  return e && e.length <= 5 ? e.toLowerCase() : "bin";
}

const MAX_IMAGE_DIM = 1920;
const WEBP_QUALITY = 0.82;

/**
 * Compress an image before upload: resize to a sensible max dimension and
 * convert to WebP. Returns the original file if compression fails or the
 * result would be larger (e.g. already-optimized small images).
 */
export async function compressImage(file: File): Promise<{ blob: Blob; ext: string }> {
  if (!IMAGE_TYPES.includes(file.type) || file.type === "image/webp") {
    return { blob: file, ext: ext(file) };
  }
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_IMAGE_DIM / Math.max(bitmap.width, bitmap.height));
    const w = Math.round(bitmap.width * scale);
    const h = Math.round(bitmap.height * scale);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("no canvas");
    ctx.drawImage(bitmap, 0, 0, w, h);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", WEBP_QUALITY));
    if (!blob || blob.size >= file.size) return { blob: file, ext: ext(file) };
    return { blob, ext: "webp" };
  } catch {
    return { blob: file, ext: ext(file) };
  }
}

/** Upload to a bucket; returns storage path. Images are compressed to WebP first. */
export async function uploadFile(bucket: "media" | "request-attachments", folder: string, file: File) {
  const isImage = IMAGE_TYPES.includes(file.type);
  const { blob, ext: e } = isImage ? await compressImage(file) : { blob: file as Blob, ext: ext(file) };
  const path = `${folder}/${crypto.randomUUID()}.${e}`;
  const { error } = await supabase.storage.from(bucket).upload(path, blob, { contentType: isImage ? blob.type : file.type });
  if (error) throw error;
  return path;
}

/** Media files live in a private bucket with a public read policy, so we serve signed URLs. */
export function useSignedUrl(path?: string | null, bucket: "media" | "request-attachments" = "media") {
  return useQuery({
    queryKey: ["signed", bucket, path],
    enabled: !!path,
    staleTime: 1000 * 60 * 50,
    queryFn: async () => {
      if (!path) return null;
      if (/^https?:\/\//.test(path)) return path;
      const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, 60 * 60 * 6);
      if (error) throw error;
      return data.signedUrl;
    },
  }).data;
}

export async function removeFile(bucket: "media" | "request-attachments", path?: string | null) {
  if (!path || /^https?:\/\//.test(path)) return;
  await supabase.storage.from(bucket).remove([path]);
}
