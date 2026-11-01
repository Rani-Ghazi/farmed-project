import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { EmptyState, ErrorState, StatusBadge } from "@/components/site/common";
import { MediaImage } from "@/components/site/media";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatMoney, formatNumber, projectTypeLabel, requestStatusLabel } from "@/lib/constants";

export const Route = createFileRoute("/_authenticated/admin/projects/")({ component: Projects });

function Projects() {
  const [q, setQ] = useState("");
  const query = useQuery({
    queryKey: ["adminProjects"],
    queryFn: async () => {
      const { data, error } = await supabase.from("projects").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
  const rows = (query.data ?? []).filter((p) => !q || `${p.title} ${p.state ?? ""} ${p.locality ?? ""}`.includes(q));

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">المشاريع</h1>
        <Button asChild><Link to="/admin/projects/$id" params={{ id: "new" }}><Plus className="h-4 w-4" /> مشروع جديد</Link></Button>
      </div>
      <Input placeholder="بحث..." value={q} onChange={(e) => setQ(e.target.value)} className="mt-6 sm:max-w-xs" />
      <div className="mt-6">
        {query.isLoading ? <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          : query.isError ? <ErrorState />
          : rows.length === 0 ? <EmptyState title="لا توجد مشاريع" description="أنشئ مشروعاً جديداً أو حوّل طلباً مقبولاً إلى مشروع." />
          : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {rows.map((p) => (
                <Link key={p.id} to="/admin/projects/$id" params={{ id: p.id }} className="overflow-hidden rounded-lg border bg-card shadow-card transition-colors hover:border-primary">
                  <MediaImage path={p.cover_image} alt={p.title} className="aspect-[16/9] w-full" />
                  <div className="p-4">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-primary">{projectTypeLabel(p.project_type)}</span>
                      <div className="flex gap-1.5">
                        {!p.is_published && <span className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">غير منشور</span>}
                        {p.is_archived && <span className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">مؤرشف</span>}
                        <StatusBadge status={p.status} label={requestStatusLabel(p.status)} />
                      </div>
                    </div>
                    <h3 className="mt-2 font-bold leading-snug">{p.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{[p.village, p.locality, p.state].filter(Boolean).join("، ") || "—"}</p>
                    <p className="mt-2 text-sm"><b>{formatMoney(p.estimated_cost, p.currency)}</b> · {formatNumber(p.beneficiaries)} مستفيد</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
      </div>
    </div>
  );
}
