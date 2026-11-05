import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Calendar, MapPin, Users, Wallet } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SiteLayout } from "@/components/site/SiteLayout";
import { EmptyState, ErrorState, LoadingState } from "@/components/site/common";
import { MediaImage, MediaVideo } from "@/components/site/media";
import { Button } from "@/components/ui/button";
import { formatDate, formatMoney, formatNumber, projectTypeLabel } from "@/lib/constants";

export const Route = createFileRoute("/portfolio/$slug")({
  head: () => ({
    meta: [
      { title: "مشروع مكتمل — فارمد الهندسية" },
      { name: "description", content: "توثيق مشروع مكتمل من مشاريع فارمد الهندسية بالصور قبل وبعد." },
      { property: "og:title", content: "مشروع مكتمل — فارمد الهندسية" },
      { property: "og:description", content: "شاهد أثر المشروع قبل وبعد التنفيذ." },
    ],
  }),
  component: PortfolioDetail,
});

function PortfolioDetail() {
  const { slug } = Route.useParams();
  const q = useQuery({
    queryKey: ["portfolio", slug],
    queryFn: async () => {
      const { data, error } = await supabase.from("portfolio_items").select("*, portfolio_media(*)").eq("slug", slug).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  if (q.isLoading) return <SiteLayout><LoadingState /></SiteLayout>;
  if (q.isError) return <SiteLayout><div className="container mx-auto max-w-6xl p-8"><ErrorState /></div></SiteLayout>;
  const i = q.data;
  if (!i)
    return (
      <SiteLayout>
        <div className="container mx-auto max-w-6xl p-8"><EmptyState title="المشروع غير موجود"><Button asChild><Link to="/portfolio">معرض الأعمال</Link></Button></EmptyState></div>
      </SiteLayout>
    );
  const media = [...(i.portfolio_media ?? [])].sort((a, b) => a.sort_order - b.sort_order);
  const before = media.filter((m) => m.kind === "before");
  const after = media.filter((m) => m.kind === "after");
  const videos = media.filter((m) => m.kind === "video");

  return (
    <SiteLayout>
      <section className="container mx-auto max-w-6xl px-4 py-8 md:py-12">
        <nav className="mb-4 break-words text-sm text-muted-foreground"><Link to="/portfolio" className="hover:text-primary">معرض الأعمال</Link> / {i.title}</nav>
        <span className="rounded bg-success/10 px-2 py-1 text-xs font-semibold text-success">مشروع مكتمل</span>
        <h1 className="mt-3 break-words text-2xl font-bold sm:text-3xl md:text-4xl">{i.title}</h1>
        <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted-foreground">
          <span>{projectTypeLabel(i.project_type)}</span>
          {i.location && <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4" />{i.location}</span>}
          <span className="flex items-center gap-1.5"><Calendar className="h-4 w-4" />{formatDate(i.completion_date)}</span>
        </div>
        {i.cover_image && <MediaImage path={i.cover_image} alt={i.title} className="mt-8 aspect-video w-full rounded-lg" />}
        <div className="mt-10 grid gap-10 lg:grid-cols-3">
          <div className="min-w-0 space-y-10 lg:col-span-2">
            {i.description && (
              <div>
                <h2 className="text-xl font-bold">عن المشروع</h2>
                <p className="mt-3 whitespace-pre-line leading-8 text-muted-foreground">{i.description}</p>
              </div>
            )}
            {(before.length > 0 || after.length > 0) && (
              <div className="grid gap-6 md:grid-cols-2">
                <MediaGroup title="قبل التنفيذ" items={before} titleCls="text-destructive" />
                <MediaGroup title="بعد التنفيذ" items={after} titleCls="text-success" />
              </div>
            )}
            {videos.length > 0 && (
              <div>
                <h2 className="text-xl font-bold">فيديوهات</h2>
                <div className="mt-3 grid gap-4 sm:grid-cols-2">{videos.map((v) => <MediaVideo key={v.id} path={v.url} className="aspect-video w-full rounded-lg" />)}</div>
              </div>
            )}
          </div>
          <aside className="min-w-0 lg:self-start">
            <div className="rounded-lg border bg-card p-6 shadow-card">
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between"><dt className="text-muted-foreground">المستفيدون</dt><dd className="font-semibold">{formatNumber(i.beneficiaries)}</dd></div>
                <div className="flex justify-between"><dt className="text-muted-foreground">التكلفة</dt><dd className="font-semibold">{formatMoney(i.cost, i.currency)}</dd></div>
                <div className="flex justify-between"><dt className="flex items-center gap-1.5 text-muted-foreground"><Users className="h-4 w-4" />النوع</dt><dd className="font-semibold">{projectTypeLabel(i.project_type)}</dd></div>
              </dl>
              <Button asChild className="mt-6 w-full"><Link to="/projects">ادعم مشروعاً مشابهاً</Link></Button>
            </div>
          </aside>
        </div>
      </section>
    </SiteLayout>
  );
}

function MediaGroup({ title, items, titleCls }: { title: string; items: { id: string; url: string }[]; titleCls: string }) {
  return (
    <div>
      <h3 className={`font-bold ${titleCls}`}>{title}</h3>
      {items.length === 0 ? <p className="mt-3 text-sm text-muted-foreground">لا توجد صور.</p> : (
        <div className="mt-3 grid grid-cols-2 gap-3">{items.map((m) => <MediaImage key={m.id} path={m.url} alt={title} className="aspect-[4/3] w-full rounded-md" />)}</div>
      )}
    </div>
  );
}
