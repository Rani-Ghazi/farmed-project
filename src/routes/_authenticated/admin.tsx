import { useEffect, useState } from "react";
import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  FolderKanban, HandHeart, Images, LayoutDashboard, Loader2, LogOut, Menu, Settings, ClipboardList, Users, X, ExternalLink,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "لوحة التحكم — فارمد الهندسية" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminLayout,
});

const NAV = [
  { to: "/admin", label: "لوحة التحكم", icon: LayoutDashboard, exact: true },
  { to: "/admin/requests", label: "طلبات المشاريع", icon: ClipboardList },
  { to: "/admin/projects", label: "المشاريع", icon: FolderKanban },
  { to: "/admin/services", label: "الخدمات", icon: Settings },
  { to: "/admin/portfolio", label: "معرض الأعمال", icon: Images },
  { to: "/admin/donors", label: "طلبات المتبرعين", icon: HandHeart },
  { to: "/admin/users", label: "المستخدمون", icon: Users },
  { to: "/admin/settings", label: "الإعدادات", icon: Settings },
] as const;

function AdminLayout() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [claiming, setClaiming] = useState(false);

  // Resolve admin status: am I admin? does any admin exist?
  const q = useQuery({
    queryKey: ["adminStatus"],
    queryFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      const [mine, anyAdmin] = await Promise.all([
        supabase.from("user_roles").select("id").eq("user_id", uid!).eq("role", "admin"),
        supabase.rpc("admin_exists"),
      ]);
      return { isAdmin: (mine.data?.length ?? 0) > 0, anyAdmin: !!anyAdmin.data };
    },
  });

  useEffect(() => {
    if (q.data && !q.data.isAdmin && q.data.anyAdmin) {
      toast.error("هذا الحساب ليس لديه صلاحيات الإدارة.");
    }
  }, [q.data]);

  async function claim() {
    setClaiming(true);
    const { data, error } = await supabase.rpc("claim_first_admin");
    setClaiming(false);
    if (error || !data) {
      toast.error("تعذّر منح صلاحية الإدارة.");
      return;
    }
    toast.success("تم منحك صلاحية الإدارة.");
    q.refetch();
  }

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  }

  if (q.isLoading)
    return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  if (q.data && !q.data.isAdmin)
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
        {q.data.anyAdmin ? (
          <>
            <h1 className="text-xl font-bold">لا تملك صلاحية الوصول</h1>
            <p className="max-w-md text-sm text-muted-foreground">حسابك غير مصرّح له بإدارة المنصة. تواصل مع مدير المنصة لإضافتك.</p>
          </>
        ) : (
          <>
            <h1 className="text-xl font-bold">إعداد أول حساب إدارة</h1>
            <p className="max-w-md text-sm text-muted-foreground">لم يتم تعيين أي مدير بعد. اضغط الزر أدناه لمنح حسابك الحالي صلاحية الإدارة.</p>
            <Button onClick={claim} disabled={claiming}>{claiming && <Loader2 className="h-4 w-4 animate-spin" />} منح حسابي صلاحية الإدارة</Button>
          </>
        )}
        <Button variant="outline" onClick={signOut}>تسجيل الخروج</Button>
      </div>
    );

  const nav = (
    <nav className="flex flex-col gap-1" aria-label="قائمة الإدارة">
      {NAV.map((n) => (
        <Link
          key={n.to}
          to={n.to}
          activeOptions={{ exact: "exact" in n && n.exact }}
          onClick={() => setOpen(false)}
          className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          activeProps={{ className: "bg-sidebar-accent text-sidebar-accent-foreground" }}
        >
          <n.icon className="h-4 w-4" /> {n.label}
        </Link>
      ))}
    </nav>
  );

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col bg-sidebar lg:flex">
        <div className="border-b border-sidebar-border p-4"><Logo light /></div>
        <div className="flex-1 overflow-y-auto p-3">{nav}</div>
        <div className="space-y-1 border-t border-sidebar-border p-3">
          <Button asChild variant="ghost" className="w-full justify-start text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
            <Link to="/"><ExternalLink className="h-4 w-4" /> عرض الموقع</Link>
          </Button>
          <Button variant="ghost" onClick={signOut} className="w-full justify-start text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
            <LogOut className="h-4 w-4" /> تسجيل الخروج
          </Button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b bg-background px-4 lg:hidden">
          <Logo />
          <div className="flex gap-1">
            <Button asChild variant="ghost" size="icon" aria-label="عرض الموقع"><Link to="/"><ExternalLink className="h-5 w-5" /></Link></Button>
            <Button variant="ghost" size="icon" onClick={signOut} aria-label="تسجيل الخروج"><LogOut className="h-5 w-5" /></Button>
            <Button variant="ghost" size="icon" onClick={() => setOpen(true)} aria-label="القائمة"><Menu /></Button>
          </div>
        </header>
        {open && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="absolute inset-0 bg-ink/50" onClick={() => setOpen(false)} />
            <div className="absolute inset-y-0 right-0 w-72 bg-sidebar p-3">
              <div className="mb-3 flex items-center justify-between">
                <Logo light />
                <Button variant="ghost" size="icon" onClick={() => setOpen(false)} className="text-sidebar-foreground" aria-label="إغلاق"><X /></Button>
              </div>
              {nav}
            </div>
          </div>
        )}
        <main className="flex-1 p-4 md:p-8"><Outlet /></main>
      </div>
    </div>
  );
}
