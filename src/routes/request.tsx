import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, Loader2 } from "lucide-react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { SiteLayout } from "@/components/site/SiteLayout";
import { PageHeader } from "@/components/site/common";
import { Field } from "@/components/site/SupportDialog";
import { FileInput } from "@/components/site/FileInput";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DOC_TYPES, IMAGE_TYPES, MAX_DOC_MB, MAX_IMAGE_MB, MAX_VIDEO_MB, VIDEO_TYPES, uploadFile } from "@/lib/media";
import { ORG_TYPES, PROJECT_TYPES, SUDAN_STATES } from "@/lib/constants";

export const Route = createFileRoute("/request")({
  head: () => ({
    meta: [
      { title: "تقديم طلب مشروع — فارمد للهندسة" },
      { name: "description", content: "قدّم طلب مشروع مياه أو طاقة لمدرستك أو مجتمعك أو منظمتك وسيراجعه فريق فارمد للهندسة." },
      { property: "og:title", content: "تقديم طلب مشروع — فارمد للهندسة" },
      { property: "og:description", content: "قدّم طلبك وسيتواصل معك فريقنا بعد المراجعة." },
    ],
  }),
  component: RequestPage,
});

const schema = z.object({
  org_name: z.string().trim().min(2, "اسم الجهة مطلوب").max(200),
  contact_name: z.string().trim().min(2, "اسم المسؤول مطلوب").max(150),
  phone: z.string().trim().regex(/^[0-9+ ()-]{7,20}$/, "رقم هاتف غير صالح"),
  email: z.union([z.literal(""), z.string().trim().email("بريد إلكتروني غير صالح").max(200)]),
  org_type: z.string().min(1, "نوع الجهة مطلوب"),
  state: z.string().min(1, "الولاية مطلوبة"),
  locality: z.string().trim().min(1, "المحلية مطلوبة").max(100),
  village: z.string().trim().min(1, "المنطقة / القرية مطلوبة").max(150),
  geo_location: z.string().trim().max(300),
  project_type: z.string().min(1, "نوع المشروع مطلوب"),
  need_description: z.string().trim().min(10, "اشرح الاحتياج ببعض التفصيل (10 أحرف على الأقل)").max(5000),
  need_reason: z.string().trim().min(10, "اشرح سبب الحاجة ببعض التفصيل").max(5000),
  expected_beneficiaries: z.coerce.number({ error: "أدخل رقماً" }).int("أدخل عدداً صحيحاً").min(1, "عدد المستفيدين مطلوب").max(10000000),
  extra_notes: z.string().trim().max(5000),
});

const empty = {
  org_name: "", contact_name: "", phone: "", email: "", org_type: "", state: "", locality: "", village: "",
  geo_location: "", project_type: "", need_description: "", need_reason: "", expected_beneficiaries: "", extra_notes: "",
};

function RequestPage() {
  const [form, setForm] = useState<Record<string, string>>(empty);
  const [images, setImages] = useState<File[]>([]);
  const [video, setVideo] = useState<File[]>([]);
  const [docs, setDocs] = useState<File[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      parsed.error.issues.forEach((i) => (errs[String(i.path[0])] = i.message));
      setErrors(errs);
      document.querySelector("[data-error]")?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    setErrors({});
    setBusy(true);
    try {
      const d = parsed.data;
      const site_images = await Promise.all(images.map((f) => uploadFile("request-attachments", "requests", f)));
      const video_path = video[0] ? await uploadFile("request-attachments", "requests", video[0]) : null;
      const documents = await Promise.all(docs.map((f) => uploadFile("request-attachments", "requests", f)));
      const { error } = await supabase.from("project_requests").insert({
        org_name: d.org_name, contact_name: d.contact_name, phone: d.phone, email: d.email || null,
        org_type: d.org_type, state: d.state, locality: d.locality, village: d.village,
        geo_location: d.geo_location || null, project_type: d.project_type as never,
        need_description: d.need_description, need_reason: d.need_reason,
        expected_beneficiaries: d.expected_beneficiaries, extra_notes: d.extra_notes || null,
        site_images, video_path, documents,
      });
      if (error) throw error;
      setDone(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setErrors({ form: "تعذّر إرسال الطلب. يرجى التحقق من اتصالك والمحاولة مرة أخرى." });
    } finally {
      setBusy(false);
    }
  }

  if (done)
    return (
      <SiteLayout>
        <div className="container mx-auto flex max-w-2xl flex-col items-center px-4 py-24 text-center">
          <CheckCircle2 className="h-16 w-16 text-success" />
          <h1 className="mt-6 text-2xl font-bold md:text-3xl">تم استلام طلبكم بنجاح</h1>
          <p className="mt-3 leading-8 text-muted-foreground">سيتم مراجعته من قبل فريق Farmed Engineering وسنتواصل معكم على بياناتكم المسجلة.</p>
          <div className="mt-8 flex gap-3">
            <Button asChild><Link to="/">العودة للرئيسية</Link></Button>
            <Button asChild variant="outline"><Link to="/projects">استعرض المشاريع</Link></Button>
          </div>
        </div>
      </SiteLayout>
    );

  const err = (k: string) => (errors[k] ? <span data-error /> : null);

  return (
    <SiteLayout>
      <PageHeader eyebrow="تقديم طلب" title="طلب مشروع جديد" description="هذا النموذج مخصص للمدارس والمجتمعات والمنظمات والمراكز الصحية. الحقول المعلّمة بـ * إلزامية، وسيراجع فريقنا طلبكم ويتواصل معكم." />
      <section className="container mx-auto max-w-3xl px-4 py-14">
        <form onSubmit={submit} noValidate className="space-y-8">
          <div className="space-y-4 rounded-lg border bg-card p-6 shadow-card">
            <h2 className="text-lg font-bold">بيانات الجهة</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="اسم الجهة *" error={errors.org_name}><Input value={form.org_name} onChange={set("org_name")} />{err("org_name")}</Field>
              <Field label="اسم المسؤول *" error={errors.contact_name}><Input value={form.contact_name} onChange={set("contact_name")} />{err("contact_name")}</Field>
              <Field label="رقم الهاتف *" error={errors.phone}><Input dir="ltr" inputMode="tel" value={form.phone} onChange={set("phone")} />{err("phone")}</Field>
              <Field label="البريد الإلكتروني (اختياري)" error={errors.email}><Input dir="ltr" type="email" value={form.email} onChange={set("email")} /></Field>
              <Field label="نوع الجهة *" error={errors.org_type}>
                <Select value={form.org_type} onValueChange={(v) => setForm((f) => ({ ...f, org_type: v }))} dir="rtl">
                  <SelectTrigger><SelectValue placeholder="اختر نوع الجهة" /></SelectTrigger>
                  <SelectContent>{ORG_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
                {err("org_type")}
              </Field>
            </div>
          </div>

          <div className="space-y-4 rounded-lg border bg-card p-6 shadow-card">
            <h2 className="text-lg font-bold">الموقع</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="الولاية *" error={errors.state}>
                <Select value={form.state} onValueChange={(v) => setForm((f) => ({ ...f, state: v }))} dir="rtl">
                  <SelectTrigger><SelectValue placeholder="اختر الولاية" /></SelectTrigger>
                  <SelectContent>{SUDAN_STATES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
                {err("state")}
              </Field>
              <Field label="المحلية *" error={errors.locality}><Input value={form.locality} onChange={set("locality")} />{err("locality")}</Field>
              <Field label="المنطقة / القرية *" error={errors.village}><Input value={form.village} onChange={set("village")} />{err("village")}</Field>
              <Field label="الموقع الجغرافي (اختياري)" hint="رابط خرائط جوجل أو الإحداثيات" error={errors.geo_location}><Input dir="ltr" value={form.geo_location} onChange={set("geo_location")} /></Field>
            </div>
          </div>

          <div className="space-y-4 rounded-lg border bg-card p-6 shadow-card">
            <h2 className="text-lg font-bold">تفاصيل الاحتياج</h2>
            <Field label="نوع المشروع المطلوب *" error={errors.project_type}>
              <Select value={form.project_type} onValueChange={(v) => setForm((f) => ({ ...f, project_type: v }))} dir="rtl">
                <SelectTrigger><SelectValue placeholder="اختر نوع المشروع" /></SelectTrigger>
                <SelectContent>{PROJECT_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
              </Select>
              {err("project_type")}
            </Field>
            <Field label="وصف الاحتياج *" error={errors.need_description}><Textarea rows={4} value={form.need_description} onChange={set("need_description")} />{err("need_description")}</Field>
            <Field label="سبب الحاجة للمشروع *" error={errors.need_reason}><Textarea rows={4} value={form.need_reason} onChange={set("need_reason")} />{err("need_reason")}</Field>
            <Field label="عدد المستفيدين المتوقع *" error={errors.expected_beneficiaries}><Input type="number" min={1} dir="ltr" value={form.expected_beneficiaries} onChange={set("expected_beneficiaries")} />{err("expected_beneficiaries")}</Field>
          </div>

          <div className="space-y-5 rounded-lg border bg-card p-6 shadow-card">
            <h2 className="text-lg font-bold">المرفقات</h2>
            <Field label="صور الموقع (اختياري)">
              <FileInput accept={IMAGE_TYPES.join(",")} files={images} onChange={setImages} maxMb={MAX_IMAGE_MB} label="أضف صوراً للموقع" />
            </Field>
            <Field label="فيديو (اختياري)">
              <FileInput accept={VIDEO_TYPES.join(",")} files={video} onChange={setVideo} maxMb={MAX_VIDEO_MB} multiple={false} label="أضف فيديو واحداً" />
            </Field>
            <Field label="مستندات داعمة (اختياري)">
              <FileInput accept={DOC_TYPES.join(",")} files={docs} onChange={setDocs} maxMb={MAX_DOC_MB} label="أضف صوراً أو ملفات PDF" />
            </Field>
            <Field label="ملاحظات إضافية"><Textarea rows={3} value={form.extra_notes} onChange={set("extra_notes")} /></Field>
          </div>

          {errors.form && <p className="rounded-md bg-destructive/10 p-3 text-sm font-medium text-destructive">{errors.form}</p>}
          <Button type="submit" size="lg" className="w-full text-base" disabled={busy}>
            {busy && <Loader2 className="h-4 w-4 animate-spin" />} إرسال الطلب
          </Button>
        </form>
      </section>
    </SiteLayout>
  );
}
