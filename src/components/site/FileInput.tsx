import { useRef, useState } from "react";
import { FileText, Upload, X } from "lucide-react";
import { MAX_DOC_MB, validateFile } from "@/lib/media";
import { Button } from "@/components/ui/button";

export function FileInput({
  accept, files, onChange, maxMb = MAX_DOC_MB, multiple = true, label = "اسحب الملفات هنا أو اضغط للاختيار",
}: {
  accept: string;
  files: File[];
  onChange: (files: File[]) => void;
  maxMb?: number;
  multiple?: boolean;
  label?: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const types = accept.split(",").map((t) => t.trim());

  function add(list: FileList | null) {
    if (!list) return;
    const next = [...files];
    for (const f of Array.from(list)) {
      const err = validateFile(f, types, maxMb);
      if (err) { setError(err); continue; }
      next.push(f);
    }
    onChange(next);
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => ref.current?.click()}
        className="flex w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed bg-secondary/50 p-6 text-sm text-muted-foreground hover:border-primary"
      >
        <Upload className="h-6 w-6" /> {label}
        <span className="text-xs">الحد الأقصى {maxMb} ميغابايت لكل ملف</span>
      </button>
      <input ref={ref} type="file" hidden accept={accept} multiple={multiple} onChange={(e) => { add(e.target.files); e.target.value = ""; }} />
      {error && <p className="mt-2 text-xs font-medium text-destructive">{error}</p>}
      {files.length > 0 && (
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {files.map((f, i) => (
            <li key={i} className="flex items-center gap-2 rounded-md border bg-card p-2 text-xs">
              {f.type.startsWith("image/") ? (
                <img src={URL.createObjectURL(f)} alt={f.name} className="h-10 w-10 rounded object-cover" />
              ) : (
                <FileText className="h-8 w-8 text-muted-foreground" />
              )}
              <span className="min-w-0 flex-1 truncate" dir="ltr">{f.name}</span>
              <Button type="button" variant="ghost" size="icon" className="h-7 w-7" aria-label="حذف الملف" onClick={() => onChange(files.filter((_, j) => j !== i))}>
                <X className="h-4 w-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
