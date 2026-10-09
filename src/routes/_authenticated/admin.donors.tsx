import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { EmptyState, ErrorState, StatusBadge } from "@/components/site/common";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { CONTACT_METHODS, DONOR_STATUSES, donorStatusLabel, formatDate, formatMoney } from "@/lib/constants";
import type { Database } from "@/integrations/supabase/types";
import type { DonorStatus } from "@/lib/constants";

export const Route = createFileRoute("/_authenticated/admin/donors")({ component: Donors });

type Donor = Database["public"]["Tables"]["donor_requests"]["Row"] & { projects: { title: string; slug: string } | null };

function Donors() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [selected, setSelected] = useState<Donor | null>(null);
  const [editStatus, setEditStatus] = useState<DonorStatus>("new");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);

  const query = useQuery({
    queryKey: ["adminDonors"],
    queryFn: async () => {
      const { data, error } = await supabase.from("donor_requests").select("*, projects(title, slug)").order("created_at", { ascending: false });
      if (error) throw error;
      return data as Donor[];
    },
  });

  const rows = (query.data ?? []).filter((r) => {
    if (status !== "all" && r.status !== status) return false;
    if (q && !`${r.full_name} ${r.phone} ${r.email ?? ""}`.includes(q)) return false;
    return true;
  });

  function open(d: Donor) {
    setSelected(d);
    setEditStatus(d.status);
    setNotes(d.admin_notes ?? "");
  }

  async function save() {
    if (!selected) return;
    setBusy(true);
    const { error } = await supabase.from("donor_requests").update({ status: editStatus, admin_notes: notes || null }).eq("id", selected.id);
    setBusy(false);
    if (error) { toast.error("تعذّر الحفظ"); return; }
    toast.success("تم الحفظ");
    qc.invalidateQueries({ queryKey: ["adminDonors"] });
    setSelected(null);
  }

  async function remove() {
    if (!selected) return;
    const { error } = await supabase.from("donor_requests").delete().eq("id", selected.id);
    if (error) { toast.error("تعذّر الحذف"); return; }
    toast.success("تم الحذف");
    qc.invalidateQueries({ queryKey: ["adminDonors"] });
    setSelected(null);
  }

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="text-2xl font-bold">طلبات المتبرعين</h1>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <Input placeholder="بحث بالاسم أو الهاتف..." value={q} onChange={(e) => setQ(e.target.value)} className="sm:max-w-xs" />
        <Select value={status} onValueChange={setStatus} dir="rtl">
          <SelectTrigger className="sm:w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">كل الحالات</SelectItem>
            {DONOR_STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="mt-6">
        {query.isLoading ? <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          : query.isError ? <ErrorState />
          : rows.length === 0 ? <EmptyState title="لا توجد طلبات دعم" description="ستظهر هنا طلبات الراغبين في دعم المشاريع." />
          : (
            <div className="grid gap-3">
              {rows.map((r) => (
                <button key={r.id} onClick={() => open(r)} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-card p-4 text-right shadow-card transition-colors hover:border-primary">
                  <div>
                    <p className="font-bold">{r.full_name}</p>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {r.projects?.title ?? "دعم عام"} · <span dir="ltr">{r.phone}</span>
                      {r.intended_amount != null && <> · {formatMoney(r.intended_amount)}</>}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground">{formatDate(r.created_at)}</span>
                    <StatusBadge status={r.status} label={donorStatusLabel(r.status)} />
                  </div>
                </button>
              ))}
            </div>
          )}
      </div>

      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent side="left" dir="rtl" className="w-full overflow-y-auto sm:max-w-md">
          {selected && (
            <>
              <SheetHeader className="text-right"><SheetTitle>{selected.full_name}</SheetTitle></SheetHeader>
              <dl className="mt-6 space-y-3 text-sm">
                <Row k="المشروع" v={selected.projects ? <Link to="/projects/$slug" params={{ slug: selected.projects.slug }} className="text-primary underline">{selected.projects.title}</Link> : "دعم عام"} />
                <Row k="الهاتف" v={<span dir="ltr">{selected.phone}</span>} />
                <Row k="البريد" v={selected.email ?? "—"} />
                <Row k="المبلغ المنوي" v={formatMoney(selected.intended_amount)} />
                <Row k="طريقة التواصل" v={CONTACT_METHODS.find((m) => m.value === selected.contact_method)?.label ?? selected.contact_method} />
                <Row k="التاريخ" v={formatDate(selected.created_at)} />
              </dl>
              {selected.message && (
                <div className="mt-4 rounded-md bg-muted p-3 text-sm leading-6">{selected.message}</div>
              )}
              <div className="mt-6 space-y-1.5">
                <Label>الحالة</Label>
                <Select value={editStatus} onValueChange={(v) => setEditStatus(v as DonorStatus)} dir="rtl">
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{DONOR_STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="mt-4 space-y-1.5">
                <Label>ملاحظات داخلية</Label>
                <Textarea rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} />
              </div>
              <Button className="mt-4 w-full" onClick={save} disabled={busy}>{busy && <Loader2 className="h-4 w-4 animate-spin" />} حفظ</Button>
              <AlertDialog>
                <AlertDialogTrigger asChild><Button variant="ghost" className="mt-2 w-full text-destructive"><Trash2 className="h-4 w-4" /> حذف الطلب</Button></AlertDialogTrigger>
                <AlertDialogContent dir="rtl">
                  <AlertDialogHeader><AlertDialogTitle>حذف طلب الدعم؟</AlertDialogTitle><AlertDialogDescription>لا يمكن التراجع عن هذا الإجراء.</AlertDialogDescription></AlertDialogHeader>
                  <AlertDialogFooter><AlertDialogCancel>إلغاء</AlertDialogCancel><AlertDialogAction onClick={remove} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">حذف</AlertDialogAction></AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return <div className="flex justify-between gap-4"><dt className="text-muted-foreground">{k}</dt><dd className="font-semibold">{v}</dd></div>;
}
