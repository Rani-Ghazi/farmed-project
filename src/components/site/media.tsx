import { ImageOff } from "lucide-react";
import { useSignedUrl } from "@/lib/media";
import { cn } from "@/lib/utils";

export function MediaImage({
  path,
  alt,
  className,
  bucket = "media",
}: {
  path?: string | null;
  alt: string;
  className?: string;
  bucket?: "media" | "request-attachments";
}) {
  const url = useSignedUrl(path, bucket);
  if (!path)
    return (
      <div className={cn("flex items-center justify-center bg-muted blueprint text-muted-foreground", className)}>
        <ImageOff className="h-8 w-8 opacity-50" aria-hidden />
        <span className="sr-only">{alt}</span>
      </div>
    );
  if (!url) return <div className={cn("animate-pulse bg-muted", className)} />;
  return <img src={url} alt={alt} loading="lazy" className={cn("object-cover", className)} />;
}

export function MediaVideo({ path, className, bucket = "media" }: { path: string; className?: string; bucket?: "media" | "request-attachments" }) {
  const url = useSignedUrl(path, bucket);
  if (!url) return <div className={cn("animate-pulse bg-muted", className)} />;
  return <video src={url} controls preload="metadata" className={cn("bg-ink", className)} />;
}

export function MediaLink({ path, label, bucket = "request-attachments" }: { path: string; label: string; bucket?: "media" | "request-attachments" }) {
  const url = useSignedUrl(path, bucket);
  return (
    <a href={url ?? "#"} target="_blank" rel="noreferrer" className="text-primary underline underline-offset-4">
      {label}
    </a>
  );
}
