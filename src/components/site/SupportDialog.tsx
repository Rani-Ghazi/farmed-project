import { useState } from "react";
import { CheckCircle2, HeartHandshake, Loader2 } from "lucide-react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CONTACT_METHODS } from "@/lib/constants";

const schema = z.object({
  full_name: z.string().trim().min(2, "الاسم مطلوب").max(150),
  phone: z.string().trim().regex(/^[0-9+ ()-]{7,20}$/, "رقم هاتف غير صالح"),
  email: z.union([z.literal(""), z.string().trim().email("بريد غير صالح").max(200)]),
  intended_amount: z.union([z.literal(""), z.coerce.number().min(0, "قيمة غير صالحة")]),
  message: z.string().trim().max(3000),
  contact_method: z.enum(["phone", "whatsapp", "email"]),
});

export function SupportDialog({ projectId, projectTitle }: { projectId: string; projectTitle: string }) {
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({ full_name: "", phone: "", email: "", intended_amount: "", message: "", contact_method: "phone" });
  const set = (k: keyof typeof form) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      parsed.error.issues.forEach((i) => (errs[String(i.path[0])] = i.message));
      setErrors(errs);
      return;
    }
    setErrors({});
    setBusy(true);
    const d = parsed.data;
    const { error } = await supabase.from("donor_requests").insert({
      project_id: projectId,
      full_name: d.full_name,
      phone: d.phone,
      email: d.email || null,
      intended_amount: d.intended_amount === "" ? null : d.intended_amount,
      message: d.message || null,
      contact_method: d.contact_method,
    });
    setBusy(false);
    if (error) {
      setErrors({ form: "تعذّر إرسال الطلب. يرجى المحاولة مرة أخرى." });
      return;
    }
    setDone(true);
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setDone(false); }}>
      <DialogTrigger asChild>
        <Button size="lg" variant="accent" className="w-full text-base">
          <HeartHandshake className="h-5 w-5" /> أرغب في دعم هذا المشروع
        </Button>
      </DialogTrigger>
      <DialogContent dir="rtl" className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        {done ? (
          <div className="py-8 text-center">
            <CheckCircle2 className="mx-auto h-14 w-14 text-success" />
            <p className="mt-4 text-lg font-bold">شكراً لك</p>
            <p className="mt-2 leading-7 text-muted-foreground">
              تم استلام طلبك بنجاح. ستتواصل معك Farmed Engineering لمتابعة دعم المشروع.
            </p>
            <Button className="mt-6" onClick={() => setOpen(false)}>إغلاق</Button>
          </div>
        ) : (
          <>
            <DialogHeader className="text-right">
              <DialogTitle>دعم المشروع</DialogTitle>
              <DialogDescription>المشروع: {projectTitle}. لا يتم أي دفع إلكتروني — سنتواصل معك لترتيب الدعم.</DialogDescription>
            </DialogHeader>
            <form onSubmit={submit} className="space-y-4" noValidate>
              <Field label="الاسم الكامل *" error={errors.full_name}><Input value={form.full_name} onChange={set("full_name")} /></Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="رقم الهاتف *" error={errors.phone}><Input dir="ltr" inputMode="tel" value={form.phone} onChange={set("phone")} /></Field>
                <Field label="البريد الإلكتروني (اختياري)" error={errors.email}><Input dir="ltr" type="email" value={form.email} onChange={set("email")} /></Field>
              </div>
              <Field label="المبلغ الذي تنوي المساهمة به بالدولار (اختياري)" error={errors.intended_amount}>
                <Input type="number" min={0} dir="ltr" value={form.intended_amount} onChange={set("intended_amount")} />
              </Field>
              <Field label="طريقة التواصل المفضلة">
                <div className="flex flex-wrap gap-2">
                  {CONTACT_METHODS.map((m) => (
                    <button type="button" key={m.value} onClick={() => setForm((f) => ({ ...f, contact_method: m.value }))}
                      className={`rounded-md border px-3 py-2 text-sm ${form.contact_method === m.value ? "border-primary bg-primary-soft text-primary" : ""}`}>
                      {m.label}
                    </button>
                  ))}
                </div>
              </Field>
              <Field label="رسالتك"><Textarea rows={3} value={form.message} onChange={set("message")} /></Field>
              {errors.form && <p className="text-sm text-destructive">{errors.form}</p>}
              <Button type="submit" className="w-full" disabled={busy}>
                {busy && <Loader2 className="h-4 w-4 animate-spin" />} إرسال الطلب
              </Button>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function Field({ label, error, hint, children }: { label: string; error?: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-semibold">{label}</Label>
      {children}
      {hint && !error && <p className="text-xs text-muted-foreground">{hint}</p>}
      {error && <p className="text-xs font-medium text-destructive">{error}</p>}
    </div>
  );
}
