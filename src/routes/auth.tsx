import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Loader2, Lock, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "دخول الإدارة — فارمد للهندسة" },
      { name: "robots", content: "noindex" },
      { name: "description", content: "تسجيل دخول إدارة فارمد للهندسة." },
    ],
  }),
  component: Auth,
});

function Auth() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) {
      setError("بيانات الدخول غير صحيحة. تأكد من البريد وكلمة المرور.");
      return;
    }
    navigate({ to: "/admin" });
  }

  return (
    <SiteLayout>
      <div className="container mx-auto flex max-w-md flex-col items-center px-4 py-20">
        <div className="w-full rounded-lg border bg-card p-8 shadow-card">
          <h1 className="text-center text-2xl font-bold">دخول الإدارة</h1>
          <p className="mt-2 text-center text-sm text-muted-foreground">هذه الصفحة مخصصة لفريق فارمد للهندسة.</p>
          <form onSubmit={submit} className="mt-8 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">البريد الإلكتروني</Label>
              <div className="relative">
                <Mail className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input id="email" type="email" dir="ltr" required value={email} onChange={(e) => setEmail(e.target.value)} className="pr-9" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">كلمة المرور</Label>
              <div className="relative">
                <Lock className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input id="password" type="password" dir="ltr" required value={password} onChange={(e) => setPassword(e.target.value)} className="pr-9" />
              </div>
            </div>
            {error && <p className="rounded-md bg-destructive/10 p-3 text-sm font-medium text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={busy}>
              {busy && <Loader2 className="h-4 w-4 animate-spin" />} دخول
            </Button>
          </form>
        </div>
        <Button asChild variant="link" className="mt-4"><Link to="/">العودة للموقع</Link></Button>
      </div>
    </SiteLayout>
  );
}
