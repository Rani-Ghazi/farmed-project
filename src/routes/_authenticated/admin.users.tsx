import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, ShieldCheck, UserMinus, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { EmptyState } from "@/components/site/common";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { formatDate } from "@/lib/constants";

export const Route = createFileRoute("/_authenticated/admin/users")({ component: Users });

function Users() {
  const qc = useQueryClient();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);

  const q = useQuery({
    queryKey: ["admins"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("list_admins");
      if (error) throw error;
      return data;
    },
  });

  async function grant(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setBusy(true);
    const { data, error } = await supabase.rpc("grant_admin_by_email", { _email: email.trim() });
    setBusy(false);
    if (error) { toast.error("تعذّر منح الصلاحية"); return; }
    if (!data) { toast.error("لا يوجد حساب مسجل بهذا البريد. يجب أن يسجل المستخدم أولاً."); return; }
    toast.success("تم منح صلاحية الإدارة");
    setEmail("");
    qc.invalidateQueries({ queryKey: ["admins"] });
  }

  async function revoke(userId: string) {
    const { error } = await supabase.rpc("revoke_admin", { _user_id: userId });
    if (error) { toast.error(error.message.includes("self") ? "لا يمكنك سحب صلاحيتك بنفسك" : "تعذّر السحب"); return; }
    toast.success("تم سحب الصلاحية");
    qc.invalidateQueries({ queryKey: ["admins"] });
  }

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-bold">المستخدمون</h1>
      <p className="mt-1 text-sm text-muted-foreground">إدارة حسابات الإدارة. لإضافة مدير جديد، يجب أن يكون لديه حساب مسجل في النظام أولاً.</p>

      <form onSubmit={grant} className="mt-8 flex flex-col gap-3 rounded-lg border bg-card p-5 shadow-card sm:flex-row sm:items-end">
        <div className="flex-1 space-y-1.5">
          <Label>بريد المستخدم</Label>
          <Input type="email" dir="ltr" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="user@example.com" />
        </div>
        <Button type="submit" disabled={busy}>{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />} منح صلاحية الإدارة</Button>
      </form>

      <div className="mt-8">
        {q.isLoading ? <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          : !q.data?.length ? <EmptyState title="لا يوجد مديرون" />
          : (
            <ul className="divide-y rounded-lg border bg-card shadow-card">
              {q.data.map((a) => (
                <li key={a.user_id} className="flex items-center justify-between gap-3 p-4">
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-semibold" dir="ltr">{a.email}</p>
                      <p className="text-xs text-muted-foreground">منذ {formatDate(a.created_at)}</p>
                    </div>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild><Button variant="ghost" size="sm" className="text-destructive"><UserMinus className="h-4 w-4" /> سحب الصلاحية</Button></AlertDialogTrigger>
                    <AlertDialogContent dir="rtl">
                      <AlertDialogHeader><AlertDialogTitle>سحب صلاحية الإدارة؟</AlertDialogTitle><AlertDialogDescription>لن يتمكن هذا المستخدم من الوصول للوحة التحكم.</AlertDialogDescription></AlertDialogHeader>
                      <AlertDialogFooter><AlertDialogCancel>إلغاء</AlertDialogCancel><AlertDialogAction onClick={() => revoke(a.user_id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">سحب</AlertDialogAction></AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </li>
              ))}
            </ul>
          )}
      </div>
    </div>
  );
}
