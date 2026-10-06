import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SiteLayout } from "@/components/site/SiteLayout";
import { EmptyState, ErrorState, LoadingState, PageHeader } from "@/components/site/common";
import { MediaImage } from "@/components/site/media";
import { ProjectCard } from "@/components/site/ProjectCard";
import { Button } from "@/components/ui/button";
import { PROJECT_CARD_FIELDS, type ProjectCardData } from "@/lib/queries";

export const Route = createFileRoute("/services/$slug")({
  head: () => ({
    meta: [
      { title: "تفاصيل الخدمة — فارمد للهندسة" },
      { name: "description", content: "تفاصيل الخدمة والمشاريع المرتبطة بها لدى فارمد للهندسة." },
      { property: "og:title", content: "تفاصيل الخدمة — فارمد للهندسة" },
      { property: "og:description", content: "تعرّف على الخدمة والمشاريع المرتبطة بها." },
    ],
  }),
  component: ServiceDetail,
});

function ServiceDetail() {
  const { slug } = Route.useParams();
  const q = useQuery({
    queryKey: ["service", slug],
    queryFn: async () => {
      const { data, error } = await supabase.from("services").select("*").eq("slug", slug).maybeSingle();
      if (error) throw error;
      if (!data) return null;
      let projects: ProjectCardData[] = [];
      if (data.project_type) {
        const r = await supabase.from("projects").select(PROJECT_CARD_FIELDS).eq("project_type", data.project_type).eq("is_published", true).eq("is_archived", false).limit(6);
        projects = (r.data ?? []) as ProjectCardData[];
      }
      return { service: data, projects };
    },
  });

  return (
    <SiteLayout>
      {q.isLoading ? <LoadingState /> : q.isError ? <div className="container mx-auto max-w-6xl p-8"><ErrorState /></div> : !q.data ? (
        <div className="container mx-auto max-w-6xl p-8"><EmptyState title="الخدمة غير موجودة"><Button asChild><Link to="/services">كل الخدمات</Link></Button></EmptyState></div>
      ) : (
        <>
          <PageHeader eyebrow="خدماتنا" title={q.data.service.name} description={q.data.service.short_description ?? undefined} />
          <section className="container mx-auto grid max-w-6xl gap-10 px-4 py-14 md:grid-cols-5">
            <div className="md:col-span-3">
              <p className="whitespace-pre-line text-lg leading-9 text-muted-foreground">{q.data.service.description}</p>
              <Button asChild className="mt-8"><Link to="/request">اطلب هذه الخدمة</Link></Button>
            </div>
            <MediaImage path={q.data.service.image_url} alt={q.data.service.name} className="aspect-[4/3] w-full rounded-lg md:col-span-2" />
          </section>
          {q.data.projects.length > 0 && (
            <section className="container mx-auto max-w-6xl px-4 pb-16">
              <h2 className="text-2xl font-bold">مشاريع مرتبطة</h2>
              <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{q.data.projects.map((p) => <ProjectCard key={p.id} p={p} />)}</div>
            </section>
          )}
        </>
      )}
    </SiteLayout>
  );
}
