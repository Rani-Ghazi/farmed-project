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

/** Upload to a bucket; returns storage path. */
export async function uploadFile(bucket: "media" | "request-attachments", folder: string, file: File) {
  const path = `${folder}/${crypto.randomUUID()}.${ext(file)}`;
  const { error } = await supabase.storage.from(bucket).upload(path, file, { contentType: file.type });
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
