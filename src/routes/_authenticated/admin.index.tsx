import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, ClipboardList, FolderKanban, HandHeart, Images, Loader2, Wrench } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { requestStatusLabel } from "@/lib/constants";
import { StatusBadge } from "@/components/site/common";

export const Route = createFileRoute("/_authenticated/admin/")({ component: Overview });

async function count(table: "project_requests" | "projects" | "donor_requests" | "portfolio_items", filter?: [string, string]) {
  let q = supabase.from(table).select("id", { count: "exact", head: true });
  if (filter) q = q.eq(filter[0], filter[1]);
  const { count: c, error } = await q;
  if (error) throw error;
  return c ?? 0;
}

function Overview() {
  const q = useQuery({
    queryKey: ["adminOverview"],
    queryFn: async () => {
      const [total, pending, approved, active, completed, donors, portfolio] = await Promise.all([
        count("project_requests"),
        count("project_requests", ["status", "new"]),
        count("project_requests", ["status", "approved"]),
        count("projects", ["status", "in_progress"]),
        count("projects", ["status", "completed"]),
        count("donor_requests"),
        count("portfolio_items"),
      ]);
      const { data: recent } = await supabase.from("project_requests").select("id,org_name,project_type,status,created_at").order("created_at", { ascending: false }).limit(5);
      const { data: recentDonors } = await supabase.from("donor_requests").select("id,full_name,status,created_at").order("created_at", { ascending: false }).limit(5);
      return { total, pending, approved, active, completed, donors, portfolio, recent: recent ?? [], recentDonors: recentDonors ?? [] };
    },
  });

  if (q.isLoading) return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  const d = q.data;
  const cards = [
    { l: "إجمالي طلبات المشاريع", v: d?.total, icon: ClipboardList, to: "/admin/requests" },
    { l: "طلبات بانتظار المراجعة", v: d?.pending, icon: ClipboardList, to: "/admin/requests" },
    { l: "طلبات مقبولة", v: d?.approved, icon: CheckCircle2, to: "/admin/requests" },
    { l: "مشاريع قيد التنفيذ", v: d?.active, icon: FolderKanban, to: "/admin/projects" },
    { l: "مشاريع مكتملة", v: d?.completed, icon: CheckCircle2, to: "/admin/projects" },
    { l: "طلبات المتبرعين", v: d?.donors, icon: HandHeart, to: "/admin/donors" },
    { l: "مشاريع المعرض", v: d?.portfolio, icon: Images, to: "/admin/portfolio" },
  ];

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="text-2xl font-bold">لوحة التحكم</h1>
      <p className="mt-1 text-sm text-muted-foreground">نظرة عامة على نشاط المنصة.</p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <Link key={c.l} to={c.to} className="rounded-lg border bg-card p-5 shadow-card transition-colors hover:border-primary">
            <div className="flex items-center justify-between">
              <c.icon className="h-5 w-5 text-primary" />
              <span className="font-display text-3xl font-bold">{c.v ?? 0}</span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{c.l}</p>
          </Link>
        ))}
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <section className="rounded-lg border bg-card p-5 shadow-card">
          <div className="flex items-center justify-between">
            <h2 className="font-bold">أحدث طلبات المشاريع</h2>
            <Link to="/admin/requests" className="text-sm text-primary hover:underline">الكل</Link>
          </div>
          <ul className="mt-4 divide-y">
            {d?.recent.length === 0 && <li className="py-6 text-center text-sm text-muted-foreground">لا توجد طلبات بعد.</li>}
            {d?.recent.map((r) => (
              <li key={r.id}>
                <Link to="/admin/requests/$id" params={{ id: r.id }} className="flex items-center justify-between gap-3 py-3 hover:text-primary">
                  <span className="flex items-center gap-2 truncate"><Wrench className="h-4 w-4 shrink-0 text-muted-foreground" />{r.org_name}</span>
                  <StatusBadge status={r.status} label={requestStatusLabel(r.status)} />
                </Link>
              </li>
            ))}
          </ul>
        </section>
        <section className="rounded-lg border bg-card p-5 shadow-card">
          <div className="flex items-center justify-between">
            <h2 className="font-bold">أحدث طلبات المتبرعين</h2>
            <Link to="/admin/donors" className="text-sm text-primary hover:underline">الكل</Link>
          </div>
          <ul className="mt-4 divide-y">
            {d?.recentDonors.length === 0 && <li className="py-6 text-center text-sm text-muted-foreground">لا توجد طلبات دعم بعد.</li>}
            {d?.recentDonors.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-3 py-3">
                <span className="flex items-center gap-2 truncate"><HandHeart className="h-4 w-4 shrink-0 text-muted-foreground" />{r.full_name}</span>
                <StatusBadge status={r.status} label={{ new: "جديد", contacted: "تم التواصل", following: "قيد المتابعة", completed: "مكتمل" }[r.status] ?? r.status} />
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
