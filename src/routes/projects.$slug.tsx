import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Building2, Calendar, MapPin, Users, Wallet } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SiteLayout } from "@/components/site/SiteLayout";
import { EmptyState, ErrorState, LoadingState, StatusBadge } from "@/components/site/common";
import { MediaImage, MediaVideo } from "@/components/site/media";
import { SupportDialog } from "@/components/site/SupportDialog";
import { Button } from "@/components/ui/button";
import { formatDate, formatMoney, formatNumber, projectTypeLabel, requestStatusLabel } from "@/lib/constants";

export const Route = createFileRoute("/projects/$slug")({
  head: () => ({
    meta: [
      { title: "تفاصيل المشروع — فارمد الهندسية" },
      { name: "description", content: "تفاصيل المشروع وتكلفته وعدد المستفيدين وكيفية دعمه مع فارمد الهندسية." },
      { property: "og:title", content: "تفاصيل المشروع — فارمد الهندسية" },
      { property: "og:description", content: "ادعم هذا المشروع مع فارمد الهندسية." },
    ],
  }),
  component: ProjectDetail,
});

function ProjectDetail() {
  const { slug } = Route.useParams();
  const q = useQuery({
    queryKey: ["project", slug],
    queryFn: async () => {
      const { data, error } = await supabase.from("projects").select("*, project_media(*)").eq("slug", slug).maybeSingle();
      if (error) throw error;
      return data;
    },
  });
  const [active, setActive] = useState<string | null>(null);

  if (q.isLoading) return <SiteLayout><LoadingState /></SiteLayout>;
  if (q.isError) return <SiteLayout><div className="container mx-auto max-w-6xl p-8"><ErrorState /></div></SiteLayout>;
  const p = q.data;
  if (!p)
    return (
      <SiteLayout>
        <div className="container mx-auto max-w-6xl p-8">
          <EmptyState title="المشروع غير موجود أو غير منشور"><Button asChild><Link to="/projects">كل المشاريع</Link></Button></EmptyState>
        </div>
      </SiteLayout>
    );
  const media = [...(p.project_media ?? [])].sort((a, b) => a.sort_order - b.sort_order);
  const images = [p.cover_image, ...media.filter((m) => m.kind === "image").map((m) => m.url)].filter(Boolean) as string[];
  const videos = media.filter((m) => m.kind === "video");
  const loc = [p.village, p.locality, p.state].filter(Boolean).join("، ");
  const main = active ?? images[0] ?? null;

  return (
    <SiteLayout>
      <section className="container mx-auto max-w-6xl px-4 py-8 md:py-12">
        <nav className="mb-4 text-sm text-muted-foreground"><Link to="/projects" className="hover:text-primary">المشاريع</Link> / {p.title}</nav>
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded bg-primary-soft px-2 py-1 text-xs font-semibold text-primary">{projectTypeLabel(p.project_type)}</span>
          <StatusBadge status={p.status} label={requestStatusLabel(p.status)} />
        </div>
        <h1 className="mt-3 text-3xl font-bold md:text-4xl">{p.title}</h1>
        {loc && <p className="mt-2 flex items-center gap-2 text-muted-foreground"><MapPin className="h-4 w-4" /> {loc}</p>}

        <div className="mt-8 grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <MediaImage path={main} alt={p.title} className="aspect-video w-full rounded-lg" />
            {images.length > 1 && (
              <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                {images.map((img) => (
                  <button key={img} onClick={() => setActive(img)} className={`shrink-0 overflow-hidden rounded-md border-2 ${main === img ? "border-primary" : "border-transparent"}`}>
                    <MediaImage path={img} alt="" className="h-16 w-24" />
                  </button>
                ))}
              </div>
            )}
            <div className="mt-10 space-y-8">
              <div>
                <h2 className="text-xl font-bold">وصف المشروع</h2>
                <p className="mt-3 whitespace-pre-line leading-8 text-muted-foreground">{p.description || p.short_description || "—"}</p>
              </div>
              {p.need_reason && (
                <div className="rounded-lg border-r-4 border-accent bg-sand/50 p-5">
                  <h2 className="text-xl font-bold">لماذا يحتاج المجتمع هذا المشروع؟</h2>
                  <p className="mt-3 whitespace-pre-line leading-8">{p.need_reason}</p>
                </div>
              )}
              {videos.length > 0 && (
                <div>
                  <h2 className="text-xl font-bold">فيديوهات</h2>
                  <div className="mt-3 grid gap-4 sm:grid-cols-2">{videos.map((v) => <MediaVideo key={v.id} path={v.url} className="aspect-video w-full rounded-lg" />)}</div>
                </div>
              )}
            </div>
          </div>
          <aside className="lg:sticky lg:top-20 lg:self-start">
            <div className="rounded-lg border bg-card p-6 shadow-card">
              <p className="text-sm text-muted-foreground">التكلفة التقديرية</p>
              <p className="mt-1 font-display text-3xl font-bold text-primary">{formatMoney(p.estimated_cost, p.currency)}</p>
              <dl className="mt-6 space-y-3 border-t pt-5 text-sm">
                <Row icon={Users} k="عدد المستفيدين" v={formatNumber(p.beneficiaries)} />
                <Row icon={MapPin} k="الموقع" v={loc || "—"} />
                <Row icon={Calendar} k="التاريخ" v={formatDate(p.project_date ?? p.created_at)} />
                <Row icon={Wallet} k="الحالة" v={requestStatusLabel(p.status)} />
              </dl>
              <div className="mt-6">
                {p.status === "completed" ? (
                  <p className="rounded-md bg-success/10 p-3 text-center text-sm font-semibold text-success">تم تنفيذ هذا المشروع بنجاح</p>
                ) : (
                  <SupportDialog projectId={p.id} projectTitle={p.title} />
                )}
              </div>
            </div>
            <div className="mt-4 flex gap-3 rounded-lg border bg-secondary p-5 text-sm">
              <Building2 className="h-5 w-5 shrink-0 text-primary" />
              <p className="leading-6 text-muted-foreground">
                يُدار هذا المشروع ويُنفّذ بواسطة <b className="text-foreground">فارمد الهندسية</b>، مع توثيق كامل للمراحل. <Link to="/contact" className="text-primary underline">تواصل معنا</Link>
              </p>
            </div>
          </aside>
        </div>
      </section>
    </SiteLayout>
  );
}

function Row({ icon: Icon, k, v }: { icon: typeof Users; k: string; v: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="flex items-center gap-2 text-muted-foreground"><Icon className="h-4 w-4" />{k}</dt>
      <dd className="text-left font-semibold">{v}</dd>
    </div>
  );
}
