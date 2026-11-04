import { Field } from "@/components/site/SupportDialog";
import { FileInput } from "@/components/site/FileInput";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { IMAGE_TYPES, MAX_IMAGE_MB } from "@/lib/media";
import { SERVICE_QUESTIONS, type Answers } from "@/lib/service-questions";

function Pills({ options, value, onChange }: { options: { value: string; label: string }[]; value: unknown; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2" role="radiogroup">
      {options.map((o) => (
        <button key={o.value} type="button" role="radio" aria-checked={value === o.value} onClick={() => onChange(o.value)}
          className={cn("rounded-md border px-4 py-2 text-sm font-medium transition-colors",
            value === o.value ? "border-primary bg-primary text-primary-foreground" : "bg-background hover:border-primary")}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

const YES_NO = [{ value: "yes", label: "نعم" }, { value: "no", label: "لا" }];

export function ServiceQuestions({ service, answers, onChange, files, onFiles, errors }: {
  service: string;
  answers: Answers;
  onChange: (key: string, v: Answers[string]) => void;
  files: Record<string, File[]>;
  onFiles: (key: string, f: File[]) => void;
  errors: Record<string, string>;
}) {
  const qs = SERVICE_QUESTIONS[service];
  if (!qs?.length) return null;
  return (
    <div className="space-y-4 rounded-2xl border-2 border-accent/50 bg-card p-6 shadow-card md:p-8 animate-fade-up">
      <h2 className="flex items-center gap-3 text-xl font-bold"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-sm text-accent-foreground">★</span>أسئلة خاصة بالخدمة</h2>
      {qs.map((q) => {
        const label = q.label + (q.required ? " *" : "");
        const err = errors[q.key];
        const v = answers[q.key];
        return (
          <Field key={`${service}-${q.key}`} label={label} hint={q.hint} error={err}>
            {q.type === "yesno" && <Pills options={YES_NO} value={v} onChange={(x) => onChange(q.key, x)} />}
            {q.type === "choice" && <Pills options={q.options!} value={v} onChange={(x) => onChange(q.key, x)} />}
            {q.type === "number" && <Input type="number" min={0} step="any" dir="ltr" value={(v as string | number | null) ?? ""} onChange={(e) => onChange(q.key, e.target.value)} />}
            {q.type === "multi" && (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {q.options!.map((o) => {
                  const arr = Array.isArray(v) ? v : [];
                  const checked = arr.includes(o.value);
                  return (
                    <label key={o.value} className="flex cursor-pointer items-center gap-2 rounded-md border p-2 text-sm">
                      <Checkbox checked={checked} onCheckedChange={(c) => onChange(q.key, c ? [...arr, o.value] : arr.filter((x) => x !== o.value))} />
                      {o.label}
                    </label>
                  );
                })}
              </div>
            )}
            {q.type === "images" && <FileInput accept={IMAGE_TYPES.join(",")} files={files[q.key] ?? []} onChange={(f) => onFiles(q.key, f)} maxMb={MAX_IMAGE_MB} label="أضف صوراً" />}
            {err && <span data-error />}
          </Field>
        );
      })}
    </div>
  );
}
