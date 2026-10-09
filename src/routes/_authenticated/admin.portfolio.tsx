import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { EmptyState, ErrorState } from "@/components/site/common";
import { MediaImage } from "@/components/site/media";
import { Button } from "@/components/ui/button";
import { formatDate, formatNumber, projectTypeLabel } from "@/lib/constants";

export const Route = createFileRoute("/_authenticated/admin/portfolio")({ component: PortfolioAdmin });

function PortfolioAdmin() {
  const q = useQuery({
    queryKey: ["adminPortfolio"],
    queryFn: async () => {
      const { data, error } = await supabase.from("portfolio_items").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">معرض الأعمال</h1>
        <Button asChild><Link to="/admin/portfolio/$id" params={{ id: "new" }}><Plus className="h-4 w-4" /> مشروع مكتمل جديد</Link></Button>
      </div>
      <div className="mt-6">
        {q.isLoading ? <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          : q.isError ? <ErrorState />
          : !q.data?.length ? <EmptyState title="لا توجد مشاريع مكتملة" description="وثّق المشاريع المنفذة هنا بالصور قبل وبعد." />
          : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {q.data.map((i) => (
                <Link key={i.id} to="/admin/portfolio/$id" params={{ id: i.id }} className="overflow-hidden rounded-lg border bg-card shadow-card transition-colors hover:border-primary">
                  <MediaImage path={i.cover_image} alt={i.title} className="aspect-[16/9] w-full" />
                  <div className="p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-primary">{projectTypeLabel(i.project_type)}</span>
                      {!i.is_published && <span className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">مخفي</span>}
                    </div>
                    <h3 className="mt-2 font-bold">{i.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{i.location || "—"} · {formatDate(i.completion_date)} · {formatNumber(i.beneficiaries)} مستفيد</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
      </div>
    </div>
  );
}
