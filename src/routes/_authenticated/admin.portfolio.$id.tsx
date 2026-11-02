import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, Eye, Loader2, Trash2 } from "lucide-react";
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
import { PROJECT_TYPES, slugify } from "@/lib/constants";

export const Route = createFileRoute("/_authenticated/admin/portfolio/$id")({ component: PortfolioEditor });

type Kind = "before" | "after" | "video";
const KIND_LABEL: Record<Kind, string> = { before: "صور قبل التنفيذ", after: "صور بعد التنفيذ", video: "فيديوهات" };

const empty = { title: "", project_type: "cooler", location: "", completion_date: "", description: "", beneficiaries: "", cost: "", is_published: true };

function PortfolioEditor() {
  const { id } = Route.useParams();
  const isNew = id === "new";
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [form, setForm] = useState(empty);
  const [cover, setCover] = useState<string | null>(null);
  const [media, setMedia] = useState<Record<Kind, string[]>>({ before: [], after: [], video: [] });
  const [newCover, setNewCover] = useState<File[]>([]);
  const [newFiles, setNewFiles] = useState<Record<Kind, File[]>>({ before: [], after: [], video: [] });
  const [busy, setBusy] = useState(false);

  const q = useQuery({
    queryKey: ["adminPortfolioItem", id],
    enabled: !isNew,
    queryFn: async () => {
      const { data, error } = await supabase.from("portfolio_items").select("*, portfolio_media(*)").eq("id", id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    const i = q.data;
    if (!i) return;
    setForm({
      title: i.title, project_type: i.project_type, location: i.location ?? "", completion_date: i.completion_date ?? "",
      description: i.description ?? "", beneficiaries: i.beneficiaries?.toString() ?? "", cost: i.cost?.toString() ?? "", is_published: i.is_published,
    });
    setCover(i.cover_image);
    const m = i.portfolio_media ?? [];
    setMedia({
      before: m.filter((x) => x.kind === "before").map((x) => x.url),
      after: m.filter((x) => x.kind === "after").map((x) => x.url),
      video: m.filter((x) => x.kind === "video").map((x) => x.url),
    });
  }, [q.data]);

  const set = (k: keyof typeof empty) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function save() {
    if (form.title.trim().length < 2) { toast.error("اسم المشروع مطلوب"); return; }
    setBusy(true);
    try {
      let coverPath = cover;
      if (newCover[0]) {
        await removeFile("media", cover);
        coverPath = await uploadFile("media", "portfolio", newCover[0]);
      }
      const payload = {
        title: form.title.trim(), project_type: form.project_type as never, location: form.location || null,
        completion_date: form.completion_date || null, description: form.description || null,
        beneficiaries: form.beneficiaries ? Number(form.beneficiaries) : null,
        cost: form.cost ? Number(form.cost) : null, is_published: form.is_published, cover_image: coverPath,
      };
      let itemId = id;
      if (isNew) {
        const { data, error } = await supabase.from("portfolio_items").insert({ ...payload, slug: slugify(form.title) }).select("id").single();
        if (error) throw error;
        itemId = data.id;
      } else {
        const { error } = await supabase.from("portfolio_items").update(payload).eq("id", id);
        if (error) throw error;
      }
      const rows: { item_id: string; kind: string; url: string }[] = [];
      for (const kind of ["before", "after", "video"] as Kind[]) {
        for (const f of newFiles[kind]) rows.push({ item_id: itemId, kind, url: await uploadFile("media", "portfolio", f) });
      }
      if (rows.length) {
        const { error } = await supabase.from("portfolio_media").insert(rows);
        if (error) throw error;
      }
      toast.success("تم الحفظ");
      qc.invalidateQueries({ queryKey: ["adminPortfolio"] });
      qc.invalidateQueries({ queryKey: ["portfolio"] });
      if (isNew) navigate({ to: "/admin/portfolio/$id", params: { id: itemId }, replace: true });
      else { setNewCover([]); setNewFiles({ before: [], after: [], video: [] }); qc.invalidateQueries({ queryKey: ["adminPortfolioItem", id] }); }
    } catch {
      toast.error("تعذّر الحفظ");
    } finally {
      setBusy(false);
    }
  }

  async function deleteMedia(kind: Kind, url: string) {
    const { error } = await supabase.from("portfolio_media").delete().eq("item_id", id).eq("url", url);
    if (!error) {
      await removeFile("media", url);
      setMedia((m) => ({ ...m, [kind]: m[kind].filter((u) => u !== url) }));
      toast.success("تم حذف الملف");
    }
  }

  async function remove() {
    const { error } = await supabase.from("portfolio_items").delete().eq("id", id);
    if (error) { toast.error("تعذّر الحذف"); return; }
    // Clean up storage files (media rows are removed by the DB cascade)
    const files = [cover, ...media.before, ...media.after, ...media.video];
    await Promise.all(files.map((u) => removeFile("media", u)));
    toast.success("تم الحذف");
    navigate({ to: "/admin/portfolio" });
  }

  if (!isNew && q.isLoading) return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  if (!isNew && !q.data) return <p className="text-muted-foreground">العنصر غير موجود.</p>;

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex items-center justify-between gap-3">
        <Button asChild variant="ghost" size="sm"><Link to="/admin/portfolio"><ArrowRight className="h-4 w-4" /> معرض الأعمال</Link></Button>
        {!isNew && q.data?.is_published && (
          <Button asChild variant="outline" size="sm"><Link to="/portfolio/$slug" params={{ slug: q.data.slug }}><Eye className="h-4 w-4" /> عرض في الموقع</Link></Button>
        )}
      </div>
      <h1 className="mt-4 text-2xl font-bold">{isNew ? "مشروع مكتمل جديد" : "تعديل المشروع المكتمل"}</h1>

      <div className="mt-8 space-y-6">
        <section className="space-y-4 rounded-lg border bg-card p-6 shadow-card">
          <Field label="اسم المشروع *"><Input value={form.title} onChange={set("title")} /></Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="نوع المشروع">
              <Select value={form.project_type} onValueChange={(v) => setForm((f) => ({ ...f, project_type: v }))} dir="rtl">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{PROJECT_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="الموقع"><Input value={form.location} onChange={set("location")} placeholder="مثال: قرية ...، محلية ...، ولاية ..." /></Field>
            <Field label="تاريخ الإكمال"><Input type="date" dir="ltr" value={form.completion_date} onChange={set("completion_date")} /></Field>
            <Field label="عدد المستفيدين"><Input type="number" min={0} dir="ltr" value={form.beneficiaries} onChange={set("beneficiaries")} /></Field>
            <Field label="تكلفة المشروع ($) — اختياري"><Input type="number" min={0} dir="ltr" value={form.cost} onChange={set("cost")} /></Field>
          </div>
          <Field label="الوصف"><Textarea rows={4} value={form.description} onChange={set("description")} /></Field>
        </section>

        <section className="space-y-5 rounded-lg border bg-card p-6 shadow-card">
          <h2 className="font-bold">الوسائط</h2>
          <div>
            <p className="mb-2 text-sm font-semibold">الصورة الرئيسية</p>
            {cover && !newCover.length && (
              <div className="relative mb-2 w-48">
                <MediaImage path={cover} alt="" className="aspect-[4/3] w-full rounded-md" />
                <Button type="button" variant="destructive" size="icon" className="absolute -top-2 -left-2 h-6 w-6" aria-label="حذف" onClick={async () => { await removeFile("media", cover); setCover(null); }}><Trash2 className="h-3 w-3" /></Button>
              </div>
            )}
            <FileInput accept={IMAGE_TYPES.join(",")} files={newCover} onChange={setNewCover} maxMb={MAX_IMAGE_MB} multiple={false} label={cover ? "استبدال الصورة" : "اختر الصورة الرئيسية"} />
          </div>
          {(["before", "after", "video"] as Kind[]).map((kind) => (
            <div key={kind}>
              <p className="mb-2 text-sm font-semibold">{KIND_LABEL[kind]}</p>
              {media[kind].length > 0 && kind !== "video" && (
                <div className="mb-2 grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {media[kind].map((u) => (
                    <div key={u} className="relative">
                      <MediaImage path={u} alt="" className="aspect-[4/3] w-full rounded-md" />
                      <Button type="button" variant="destructive" size="icon" className="absolute -top-2 -left-2 h-6 w-6" aria-label="حذف" onClick={() => deleteMedia(kind, u)}><Trash2 className="h-3 w-3" /></Button>
                    </div>
                  ))}
                </div>
              )}
              {media[kind].length > 0 && kind === "video" && (
                <ul className="mb-2 space-y-1 text-sm">
                  {media[kind].map((u) => (
                    <li key={u} className="flex items-center justify-between rounded border p-2">
                      <span className="truncate" dir="ltr">{u.split("/").pop()}</span>
                      <Button type="button" variant="ghost" size="icon" aria-label="حذف" onClick={() => deleteMedia(kind, u)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </li>
                  ))}
                </ul>
              )}
              <FileInput
                accept={(kind === "video" ? VIDEO_TYPES : IMAGE_TYPES).join(",")}
                files={newFiles[kind]}
                onChange={(f) => setNewFiles((m) => ({ ...m, [kind]: f }))}
                maxMb={kind === "video" ? MAX_VIDEO_MB : MAX_IMAGE_MB}
                label={`أضف ${KIND_LABEL[kind]}`}
              />
            </div>
          ))}
        </section>

        <label className="flex items-center gap-3 rounded-lg border bg-card p-6 shadow-card">
          <Switch checked={form.is_published} onCheckedChange={(v) => setForm((f) => ({ ...f, is_published: v }))} />
          <span className="text-sm font-semibold">ظاهر في الموقع</span>
        </label>

        <div className="flex flex-wrap gap-3">
          <Button size="lg" onClick={save} disabled={busy}>{busy && <Loader2 className="h-4 w-4 animate-spin" />} حفظ</Button>
          {!isNew && (
            <AlertDialog>
              <AlertDialogTrigger asChild><Button variant="destructive" size="lg"><Trash2 className="h-4 w-4" /> حذف</Button></AlertDialogTrigger>
              <AlertDialogContent dir="rtl">
                <AlertDialogHeader><AlertDialogTitle>حذف هذا العنصر نهائياً؟</AlertDialogTitle><AlertDialogDescription>لا يمكن التراجع عن هذا الإجراء.</AlertDialogDescription></AlertDialogHeader>
                <AlertDialogFooter><AlertDialogCancel>إلغاء</AlertDialogCancel><AlertDialogAction onClick={remove} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">حذف</AlertDialogAction></AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>
    </div>
  );
}
