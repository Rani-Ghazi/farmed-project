import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Field } from "@/components/site/SupportDialog";
import { MediaImage } from "@/components/site/media";
import { FileInput } from "@/components/site/FileInput";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { IMAGE_TYPES, MAX_IMAGE_MB, removeFile, uploadFile } from "@/lib/media";
import { PROJECT_TYPES, slugify } from "@/lib/constants";
import type { Database } from "@/integrations/supabase/types";

export const Route = createFileRoute("/_authenticated/admin/services")({ component: ServicesAdmin });

type Service = Database["public"]["Tables"]["services"]["Row"];

const emptyForm = { name: "", project_type: "other", short_description: "", description: "", sort_order: "0", is_published: true };

function ServicesAdmin() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Service | "new" | null>(null);
  const q = useQuery({
    queryKey: ["adminServices"],
    queryFn: async () => {
      const { data, error } = await supabase.from("services").select("*").order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  async function remove(s: Service) {
    const { error } = await supabase.from("services").delete().eq("id", s.id);
    if (error) { toast.error("تعذّر الحذف"); return; }
    if (s.image_url) await removeFile("media", s.image_url);
    toast.success("تم حذف الخدمة");
    qc.invalidateQueries({ queryKey: ["adminServices"] });
    qc.invalidateQueries({ queryKey: ["services"] });
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">الخدمات</h1>
        <Button onClick={() => setEditing("new")}><Plus className="h-4 w-4" /> خدمة جديدة</Button>
      </div>
      {q.isLoading ? <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div> : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {(q.data ?? []).map((s) => (
            <div key={s.id} className="flex gap-4 rounded-lg border bg-card p-4 shadow-card">
              <MediaImage path={s.image_url} alt={s.name} className="h-24 w-24 shrink-0 rounded-md" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold">{s.name}</h3>
                  {!s.is_published && <span className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">مخفية</span>}
                </div>
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{s.short_description}</p>
                <div className="mt-3 flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => setEditing(s)}><Pencil className="h-3.5 w-3.5" /> تعديل</Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild><Button size="sm" variant="ghost" className="text-destructive"><Trash2 className="h-3.5 w-3.5" /> حذف</Button></AlertDialogTrigger>
                    <AlertDialogContent dir="rtl">
                      <AlertDialogHeader><AlertDialogTitle>حذف الخدمة "{s.name}"؟</AlertDialogTitle><AlertDialogDescription>لا يمكن التراجع عن هذا الإجراء.</AlertDialogDescription></AlertDialogHeader>
                      <AlertDialogFooter><AlertDialogCancel>إلغاء</AlertDialogCancel><AlertDialogAction onClick={() => remove(s)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">حذف</AlertDialogAction></AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {editing && <ServiceDialog service={editing === "new" ? null : editing} onClose={() => setEditing(null)} />}
    </div>
  );
}

function ServiceDialog({ service, onClose }: { service: Service | null; onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState(service ? {
    name: service.name, project_type: service.project_type ?? "other", short_description: service.short_description ?? "",
    description: service.description ?? "", sort_order: String(service.sort_order), is_published: service.is_published,
  } : emptyForm);
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);

  async function save() {
    if (form.name.trim().length < 2) { toast.error("اسم الخدمة مطلوب"); return; }
    setBusy(true);
    try {
      let image_url = service?.image_url ?? null;
      if (files[0]) {
        await removeFile("media", image_url);
        image_url = await uploadFile("media", "services", files[0]);
      }
      const payload = {
        name: form.name.trim(), project_type: form.project_type as never, short_description: form.short_description || null,
        description: form.description || null, sort_order: Number(form.sort_order) || 0, is_published: form.is_published, image_url,
      };
      const { error } = service
        ? await supabase.from("services").update(payload).eq("id", service.id)
        : await supabase.from("services").insert({ ...payload, slug: slugify(form.name) });
      if (error) throw error;
      toast.success("تم حفظ الخدمة");
      qc.invalidateQueries({ queryKey: ["adminServices"] });
      qc.invalidateQueries({ queryKey: ["services"] });
      onClose();
    } catch {
      toast.error("تعذّر الحفظ");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent dir="rtl" className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader className="text-right"><DialogTitle>{service ? "تعديل الخدمة" : "خدمة جديدة"}</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <Field label="اسم الخدمة *"><Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} /></Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="نوع المشروع المرتبط">
              <Select value={form.project_type} onValueChange={(v) => setForm((f) => ({ ...f, project_type: v }))} dir="rtl">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{PROJECT_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="الترتيب"><Input type="number" dir="ltr" value={form.sort_order} onChange={(e) => setForm((f) => ({ ...f, sort_order: e.target.value }))} /></Field>
          </div>
          <Field label="وصف مختصر"><Textarea rows={2} value={form.short_description} onChange={(e) => setForm((f) => ({ ...f, short_description: e.target.value }))} /></Field>
          <Field label="الوصف الكامل"><Textarea rows={4} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} /></Field>
          <Field label="صورة الخدمة">
            {service?.image_url && !files.length && <MediaImage path={service.image_url} alt="" className="mb-2 aspect-video w-40 rounded-md" />}
            <FileInput accept={IMAGE_TYPES.join(",")} files={files} onChange={setFiles} maxMb={MAX_IMAGE_MB} multiple={false} label={service?.image_url ? "استبدال الصورة" : "اختر صورة"} />
          </Field>
          <label className="flex items-center gap-3">
            <Switch checked={form.is_published} onCheckedChange={(v) => setForm((f) => ({ ...f, is_published: v }))} />
            <span className="text-sm font-semibold">ظاهرة في الموقع</span>
          </label>
          <Button className="w-full" onClick={save} disabled={busy}>{busy && <Loader2 className="h-4 w-4 animate-spin" />} حفظ</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
