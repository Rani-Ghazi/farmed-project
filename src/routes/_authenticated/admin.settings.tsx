import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Field } from "@/components/site/SupportDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { settingsQuery } from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/admin/settings")({ component: Settings });

const FIELDS: { key: string; label: string; ltr?: boolean; placeholder?: string }[] = [
  { key: "phone", label: "رقم الهاتف", ltr: true, placeholder: "+249 ..." },
  { key: "whatsapp", label: "واتساب", ltr: true, placeholder: "+249 ..." },
  { key: "email", label: "البريد الإلكتروني", ltr: true, placeholder: "info@example.com" },
  { key: "address", label: "العنوان" },
  { key: "facebook", label: "فيسبوك (رابط)", ltr: true },
  { key: "twitter", label: "إكس / تويتر (رابط)", ltr: true },
  { key: "instagram", label: "إنستغرام (رابط)", ltr: true },
  { key: "linkedin", label: "لينكدإن (رابط)", ltr: true },
  { key: "youtube", label: "يوتيوب (رابط)", ltr: true },
];

function Settings() {
  const qc = useQueryClient();
  const q = useQuery(settingsQuery);
  const [form, setForm] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (q.data) {
      const f: Record<string, string> = {};
      FIELDS.forEach(({ key }) => (f[key] = (q.data as Record<string, string | null>)[key] ?? ""));
      setForm(f);
    }
  }, [q.data]);

  async function save() {
    setBusy(true);
    const payload: Record<string, string | null> = {};
    FIELDS.forEach(({ key }) => (payload[key] = form[key]?.trim() || null));
    const { error } = await supabase.from("site_settings").update(payload).eq("id", 1);
    setBusy(false);
    if (error) { toast.error("تعذّر الحفظ"); return; }
    toast.success("تم حفظ الإعدادات");
    qc.invalidateQueries({ queryKey: ["site_settings"] });
  }

  if (q.isLoading) return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold">الإعدادات</h1>
      <p className="mt-1 text-sm text-muted-foreground">بيانات التواصل وروابط التواصل الاجتماعي الظاهرة في الموقع.</p>
      <div className="mt-8 space-y-4 rounded-lg border bg-card p-6 shadow-card">
        {FIELDS.map((f) => (
          <Field key={f.key} label={f.label}>
            <Input dir={f.ltr ? "ltr" : undefined} value={form[f.key] ?? ""} placeholder={f.placeholder} onChange={(e) => setForm((s) => ({ ...s, [f.key]: e.target.value }))} />
          </Field>
        ))}
        <Button className="w-full" onClick={save} disabled={busy}>{busy && <Loader2 className="h-4 w-4 animate-spin" />} حفظ الإعدادات</Button>
      </div>
    </div>
  );
}
