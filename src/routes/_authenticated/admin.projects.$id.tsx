import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, Eye, EyeOff, Loader2, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Field } from "@/components/site/SupportDialog";
import { MediaImage } from "@/components/site/media";
import { FileInput } from "@/components/site/FileInput";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { IMAGE_TYPES, MAX_IMAGE_MB, MAX_VIDEO_MB, removeFile, uploadFile, VIDEO_TYPES } from "@/lib/media";
import { PROJECT_STATUSES, PROJECT_TYPES, slugify, SUDAN_STATES } from "@/lib/constants";
import type { RequestStatus } from "@/lib/constants";

export const Route = createFileRoute("/_authenticated/admin/projects/$id")({ component: ProjectEditor });

const empty = {
  title: "", project_type: "cooler", state: "", locality: "", village: "", short_description: "", description: "",
  need_reason: "", estimated_cost: "", beneficiaries: "", status: "published" as RequestStatus, is_published: false,
  is_featured: false, project_date: "",
};

function ProjectEditor() {
  const { id } = Route.useParams();
  const isNew = id === "new";
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [form, setForm] = useState(empty);
  const [cover, setCover] = useState<string | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [videos, setVideos] = useState<string[]>([]);
  const [newCover, setNewCover] = useState<File[]>([]);
  const [newImages, setNewImages] = useState<File[]>([]);
  const [newVideos, setNewVideos] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);

  const q = useQuery({
    queryKey: ["adminProject", id],
    enabled: !isNew,
    queryFn: async () => {
      const { data, error } = await supabase.from("projects").select("*, project_media(*)").eq("id", id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    const p = q.data;
    if (!p) return;
    setForm({
      title: p.title, project_type: p.project_type, state: p.state ?? "", locality: p.locality ?? "", village: p.village ?? "",
      short_description: p.short_description ?? "", description: p.description ?? "", need_reason: p.need_reason ?? "",
      estimated_cost: p.estimated_cost?.toString() ?? "", beneficiaries: p.beneficiaries?.toString() ?? "",
      status: p.status, is_published: p.is_published, is_featured: p.is_featured, project_date: p.project_date ?? "",
    });
    setCover(p.cover_image);
    const media = p.project_media ?? [];
    setImages(media.filter((m) => m.kind === "image").map((m) => m.url));
    setVideos(media.filter((m) => m.kind === "video").map((m) => m.url));
  }, [q.data]);

  const set = (k: keyof typeof empty) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function save() {
    if (form.title.trim().length < 2) { toast.error("عنوان المشروع مطلوب"); return; }
    setBusy(true);
    try {
      let coverPath = cover;
      if (newCover[0]) {
        await removeFile("media", cover);
        coverPath = await uploadFile("media", "projects", newCover[0]);
      }
      const payload = {
        title: form.title.trim(), project_type: form.project_type as never, state: form.state || null,
        locality: form.locality || null, village: form.village || null, short_description: form.short_description || null,
        description: form.description || null, need_reason: form.need_reason || null,
        estimated_cost: form.estimated_cost ? Number(form.estimated_cost) : null,
        beneficiaries: form.beneficiaries ? Number(form.beneficiaries) : null,
        status: form.status, is_published: form.is_published, is_featured: form.is_featured,
        project_date: form.project_date || null, cover_image: coverPath,
      };
      let projectId = id;
      if (isNew) {
        const { data, error } = await supabase.from("projects").insert({ ...payload, slug: slugify(form.title) }).select("id").single();
        if (error) throw error;
        projectId = data.id;
      } else {
        const { error } = await supabase.from("projects").update(payload).eq("id", id);
        if (error) throw error;
      }
      const upImages = await Promise.all(newImages.map((f) => uploadFile("media", "projects", f)));
      const upVideos = await Promise.all(newVideos.map((f) => uploadFile("media", "projects", f)));
      const rows = [
        ...upImages.map((url) => ({ project_id: projectId, kind: "image", url })),
        ...upVideos.map((url) => ({ project_id: projectId, kind: "video", url })),
      ];
      if (rows.length) {
        const { error } = await supabase.from("project_media").insert(rows);
        if (error) throw error;
      }
      toast.success("تم حفظ المشروع");
      qc.invalidateQueries({ queryKey: ["adminProjects"] });
      qc.invalidateQueries({ queryKey: ["projects", "public"] });
      if (isNew) navigate({ to: "/admin/projects/$id", params: { id: projectId }, replace: true });
      else { setNewCover([]); setNewImages([]); setNewVideos([]); qc.invalidateQueries({ queryKey: ["adminProject", id] }); }
    } catch {
      toast.error("تعذّر حفظ المشروع");
    } finally {
      setBusy(false);
    }
  }

  async function deleteMedia(kind: "image" | "video", url: string) {
    const { error } = await supabase.from("project_media").delete().eq("project_id", id).eq("url", url);
    if (!error) {
      await removeFile("media", url);
      if (kind === "image") setImages((l) => l.filter((u) => u !== url));
      else setVideos((l) => l.filter((u) => u !== url));
      toast.success("تم حذف الملف");
    }
  }

  async function remove() {
    const { error } = await supabase.from("projects").delete().eq("id", id);
    if (error) { toast.error("تعذّر الحذف"); return; }
    // Clean up storage files (media rows are removed by the DB cascade)
    await Promise.all([removeFile("media", cover), ...images.map((u) => removeFile("media", u)), ...videos.map((u) => removeFile("media", u))]);
    toast.success("تم حذف المشروع");
    navigate({ to: "/admin/projects" });
  }

  if (!isNew && q.isLoading) return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  if (!isNew && !q.data) return <p className="text-muted-foreground">المشروع غير موجود.</p>;

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button asChild variant="ghost" size="sm"><Link to="/admin/projects"><ArrowRight className="h-4 w-4" /> كل المشاريع</Link></Button>
        {!isNew && q.data?.is_published && (
          <Button asChild variant="outline" size="sm"><Link to="/projects/$slug" params={{ slug: q.data.slug }}><Eye className="h-4 w-4" /> عرض في الموقع</Link></Button>
        )}
      </div>
      <h1 className="mt-4 text-2xl font-bold">{isNew ? "مشروع جديد" : "تعديل المشروع"}</h1>

      <div className="mt-8 space-y-6">
        <section className="space-y-4 rounded-lg border bg-card p-6 shadow-card">
          <Field label="عنوان المشروع *"><Input value={form.title} onChange={set("title")} /></Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="نوع المشروع">
              <Select value={form.project_type} onValueChange={(v) => setForm((f) => ({ ...f, project_type: v }))} dir="rtl">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{PROJECT_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="الحالة">
              <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v as RequestStatus }))} dir="rtl">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{PROJECT_STATUSES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
          </div>
          <Field label="وصف مختصر (يظهر في البطاقات)"><Textarea rows={2} value={form.short_description} onChange={set("short_description")} /></Field>
          <Field label="الوصف الكامل"><Textarea rows={5} value={form.description} onChange={set("description")} /></Field>
          <Field label="لماذا يحتاج المجتمع هذا المشروع؟"><Textarea rows={3} value={form.need_reason} onChange={set("need_reason")} /></Field>
        </section>

        <section className="space-y-4 rounded-lg border bg-card p-6 shadow-card">
          <h2 className="font-bold">الموقع والأرقام</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="الولاية">
              <Select value={form.state} onValueChange={(v) => setForm((f) => ({ ...f, state: v }))} dir="rtl">
                <SelectTrigger><SelectValue placeholder="اختر" /></SelectTrigger>
                <SelectContent>{SUDAN_STATES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="المحلية"><Input value={form.locality} onChange={set("locality")} /></Field>
            <Field label="المنطقة / القرية"><Input value={form.village} onChange={set("village")} /></Field>
            <Field label="التكلفة التقديرية ($)"><Input type="number" min={0} dir="ltr" value={form.estimated_cost} onChange={set("estimated_cost")} /></Field>
            <Field label="عدد المستفيدين"><Input type="number" min={0} dir="ltr" value={form.beneficiaries} onChange={set("beneficiaries")} /></Field>
            <Field label="تاريخ المشروع"><Input type="date" dir="ltr" value={form.project_date} onChange={set("project_date")} /></Field>
          </div>
        </section>

        <section className="space-y-5 rounded-lg border bg-card p-6 shadow-card">
          <h2 className="font-bold">الصور والفيديو</h2>
          <div>
            <p className="mb-2 text-sm font-semibold">الصورة الرئيسية</p>
            {cover && !newCover.length && (
              <div className="relative mb-2 w-48">
                <MediaImage path={cover} alt="الصورة الرئيسية" className="aspect-[4/3] w-full rounded-md" />
                <Button type="button" variant="destructive" size="icon" className="absolute -top-2 -left-2 h-6 w-6" aria-label="حذف الصورة" onClick={async () => { await removeFile("media", cover); setCover(null); }}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            )}
            <FileInput accept={IMAGE_TYPES.join(",")} files={newCover} onChange={setNewCover} maxMb={MAX_IMAGE_MB} multiple={false} label={cover ? "استبدال الصورة الرئيسية" : "اختر الصورة الرئيسية"} />
          </div>
          <div>
            <p className="mb-2 text-sm font-semibold">صور إضافية</p>
            {images.length > 0 && (
              <div className="mb-2 grid grid-cols-3 gap-2 sm:grid-cols-4">
                {images.map((u) => (
                  <div key={u} className="relative">
                    <MediaImage path={u} alt="" className="aspect-[4/3] w-full rounded-md" />
                    <Button type="button" variant="destructive" size="icon" className="absolute -top-2 -left-2 h-6 w-6" aria-label="حذف" onClick={() => deleteMedia("image", u)}><Trash2 className="h-3 w-3" /></Button>
                  </div>
                ))}
              </div>
            )}
            <FileInput accept={IMAGE_TYPES.join(",")} files={newImages} onChange={setNewImages} maxMb={MAX_IMAGE_MB} label="أضف صوراً" />
          </div>
          <div>
            <p className="mb-2 text-sm font-semibold">فيديوهات</p>
            {videos.length > 0 && (
              <ul className="mb-2 space-y-1 text-sm">
                {videos.map((u) => (
                  <li key={u} className="flex items-center justify-between rounded border p-2">
                    <span className="truncate" dir="ltr">{u.split("/").pop()}</span>
                    <Button type="button" variant="ghost" size="icon" aria-label="حذف" onClick={() => deleteMedia("video", u)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </li>
                ))}
              </ul>
            )}
            <FileInput accept={VIDEO_TYPES.join(",")} files={newVideos} onChange={setNewVideos} maxMb={MAX_VIDEO_MB} label="أضف فيديوهات" />
          </div>
        </section>

        <section className="flex flex-wrap items-center gap-6 rounded-lg border bg-card p-6 shadow-card">
          <label className="flex items-center gap-3">
            <Switch checked={form.is_published} onCheckedChange={(v) => setForm((f) => ({ ...f, is_published: v }))} />
            <span className="flex items-center gap-1.5 text-sm font-semibold">{form.is_published ? <Eye className="h-4 w-4 text-success" /> : <EyeOff className="h-4 w-4 text-muted-foreground" />} منشور للجمهور</span>
          </label>
          <label className="flex items-center gap-3">
            <Switch checked={form.is_featured} onCheckedChange={(v) => setForm((f) => ({ ...f, is_featured: v }))} />
            <span className="flex items-center gap-1.5 text-sm font-semibold"><Star className="h-4 w-4 text-accent" /> مميز في الرئيسية</span>
          </label>
        </section>

        <div className="flex flex-wrap gap-3">
          <Button size="lg" onClick={save} disabled={busy}>{busy && <Loader2 className="h-4 w-4 animate-spin" />} حفظ المشروع</Button>
          {!isNew && (
            <AlertDialog>
              <AlertDialogTrigger asChild><Button variant="destructive" size="lg"><Trash2 className="h-4 w-4" /> حذف</Button></AlertDialogTrigger>
              <AlertDialogContent dir="rtl">
                <AlertDialogHeader><AlertDialogTitle>حذف المشروع نهائياً؟</AlertDialogTitle><AlertDialogDescription>سيُحذف المشروع وكل وسائطه. يمكنك بدلاً من ذلك إلغاء نشره.</AlertDialogDescription></AlertDialogHeader>
                <AlertDialogFooter><AlertDialogCancel>إلغاء</AlertDialogCancel><AlertDialogAction onClick={remove} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">حذف</AlertDialogAction></AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>
    </div>
  );
}
