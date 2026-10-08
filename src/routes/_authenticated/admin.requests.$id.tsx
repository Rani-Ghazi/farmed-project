import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, Check, Loader2, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { EmptyState, StatusBadge } from "@/components/site/common";
import { MediaImage, MediaVideo, MediaLink } from "@/components/site/media";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { formatDate, formatNumber, projectTypeLabel, REQUEST_STATUSES, requestStatusLabel, slugify } from "@/lib/constants";
import type { RequestStatus } from "@/lib/constants";

export const Route = createFileRoute("/_authenticated/admin/requests/$id")({ component: RequestDetail });

function RequestDetail() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [status, setStatus] = useState<RequestStatus>("new");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);

  const q = useQuery({
    queryKey: ["adminRequest", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("project_requests").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (q.data) { setStatus(q.data.status); setNotes(q.data.admin_notes ?? ""); }
  }, [q.data]);

  if (q.isLoading) return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  const r = q.data;
  if (!r) return <EmptyState title="الطلب غير موجود"><Button asChild variant="outline"><Link to="/admin/requests">كل الطلبات</Link></Button></EmptyState>;

  async function save(patch: Record<string, unknown>, msg: string) {
    setBusy(true);
    const { error } = await supabase.from("project_requests").update(patch).eq("id", r!.id);
    setBusy(false);
    if (error) { toast.error("تعذّر الحفظ"); return; }
    toast.success(msg);
    qc.invalidateQueries({ queryKey: ["adminRequest", id] });
    qc.invalidateQueries({ queryKey: ["adminRequests"] });
    qc.invalidateQueries({ queryKey: ["adminOverview"] });
  }

  async function convert() {
    setBusy(true);
    const { data, error } = await supabase.from("projects").insert({
      slug: slugify(r!.org_name),
      title: `${projectTypeLabel(r!.project_type)} — ${r!.village}, ${r!.locality}`,
      project_type: r!.project_type,
      request_id: r!.id,
      state: r!.state, locality: r!.locality, village: r!.village,
      description: r!.need_description,
      need_reason: r!.need_reason,
      beneficiaries: r!.expected_beneficiaries,
      status: "published",
      is_published: false,
    }).select("id").single();
    setBusy(false);
    if (error) { toast.error("تعذّر إنشاء المشروع"); return; }
    await supabase.from("project_requests").update({ status: "published" }).eq("id", r!.id);
    toast.success("تم إنشاء المشروع. أكمل بياناته ثم انشره.");
    navigate({ to: "/admin/projects/$id", params: { id: data.id } });
  }

  async function remove() {
    const { error } = await supabase.from("project_requests").delete().eq("id", r!.id);
    if (error) { toast.error("تعذّر الحذف"); return; }
    toast.success("تم حذف الطلب");
    navigate({ to: "/admin/requests" });
  }

  return (
    <div className="mx-auto max-w-5xl">
      <Button asChild variant="ghost" size="sm"><Link to="/admin/requests"><ArrowRight className="h-4 w-4" /> كل الطلبات</Link></Button>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{r.org_name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{r.contact_name} · <span dir="ltr">{r.phone}</span>{r.email ? ` · ${r.email}` : ""} · {formatDate(r.created_at)}</p>
        </div>
        <StatusBadge status={r.status} label={requestStatusLabel(r.status)} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section className="rounded-lg border bg-card p-6 shadow-card">
            <h2 className="font-bold">تفاصيل الطلب</h2>
            <dl className="mt-4 grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
              <Item k="نوع الجهة" v={r.org_type} />
              <Item k="نوع المشروع" v={projectTypeLabel(r.project_type)} />
              <Item k="الموقع" v={`${r.state} — ${r.locality} — ${r.village}`} />
              <Item k="الموقع الجغرافي" v={r.geo_location ?? "—"} />
              <Item k="المستفيدون المتوقعون" v={formatNumber(r.expected_beneficiaries)} />
            </dl>
            <h3 className="mt-6 font-semibold">وصف الاحتياج</h3>
            <p className="mt-2 whitespace-pre-line text-sm leading-7 text-muted-foreground">{r.need_description}</p>
            <h3 className="mt-6 font-semibold">سبب الحاجة</h3>
            <p className="mt-2 whitespace-pre-line text-sm leading-7 text-muted-foreground">{r.need_reason}</p>
            {r.extra_notes && <><h3 className="mt-6 font-semibold">ملاحظات إضافية</h3><p className="mt-2 whitespace-pre-line text-sm leading-7 text-muted-foreground">{r.extra_notes}</p></>}
          </section>

          {(r.site_images.length > 0 || r.video_path || r.documents.length > 0) && (
            <section className="rounded-lg border bg-card p-6 shadow-card">
              <h2 className="font-bold">المرفقات</h2>
              {r.site_images.length > 0 && (
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {r.site_images.map((p) => <MediaImage key={p} path={p} bucket="request-attachments" alt="صورة الموقع" className="aspect-[4/3] w-full rounded-md" />)}
                </div>
              )}
              {r.video_path && <div className="mt-4"><MediaVideo path={r.video_path} bucket="request-attachments" className="aspect-video w-full rounded-md" /></div>}
              {r.documents.length > 0 && (
                <ul className="mt-4 space-y-2 text-sm">
                  {r.documents.map((p, i) => <li key={p}><MediaLink path={p} label={`مستند ${i + 1}`} /></li>)}
                </ul>
              )}
            </section>
          )}
        </div>

        <aside className="space-y-4 lg:self-start">
          <section className="rounded-lg border bg-card p-5 shadow-card">
            <h2 className="font-bold">إجراءات</h2>
            <div className="mt-4 flex gap-2">
              <Button className="flex-1" disabled={busy || r.status === "approved"} onClick={() => save({ status: "approved" }, "تم قبول الطلب")}><Check className="h-4 w-4" /> قبول</Button>
              <Button variant="destructive" className="flex-1" disabled={busy || r.status === "rejected"} onClick={() => save({ status: "rejected" }, "تم رفض الطلب")}><X className="h-4 w-4" /> رفض</Button>
            </div>
            <div className="mt-4 space-y-1.5">
              <Label>تغيير الحالة</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as RequestStatus)} dir="rtl">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{REQUEST_STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
              </Select>
              <Button variant="outline" className="w-full" disabled={busy || status === r.status} onClick={() => save({ status }, "تم تحديث الحالة")}>حفظ الحالة</Button>
            </div>
            <Button className="mt-4 w-full" variant="accent" disabled={busy} onClick={convert}>تحويل إلى مشروع منشور</Button>
            <AlertDialog>
              <AlertDialogTrigger asChild><Button variant="ghost" className="mt-2 w-full text-destructive"><Trash2 className="h-4 w-4" /> حذف الطلب</Button></AlertDialogTrigger>
              <AlertDialogContent dir="rtl">
                <AlertDialogHeader><AlertDialogTitle>حذف الطلب نهائياً؟</AlertDialogTitle><AlertDialogDescription>لا يمكن التراجع عن هذا الإجراء.</AlertDialogDescription></AlertDialogHeader>
                <AlertDialogFooter><AlertDialogCancel>إلغاء</AlertDialogCancel><AlertDialogAction onClick={remove} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">حذف</AlertDialogAction></AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </section>
          <section className="rounded-lg border bg-card p-5 shadow-card">
            <Label>ملاحظات داخلية</Label>
            <Textarea className="mt-2" rows={5} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="ملاحظات لا تظهر للجمهور..." />
            <Button variant="outline" className="mt-3 w-full" disabled={busy} onClick={() => save({ admin_notes: notes }, "تم حفظ الملاحظات")}>حفظ الملاحظات</Button>
          </section>
        </aside>
      </div>
    </div>
  );
}

function Item({ k, v }: { k: string; v: string }) {
  return <div><dt className="text-muted-foreground">{k}</dt><dd className="mt-0.5 font-semibold">{v}</dd></div>;
}
