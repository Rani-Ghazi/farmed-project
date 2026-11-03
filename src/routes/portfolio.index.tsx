import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Camera, MapPin, Users } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { EmptyState, ErrorState, LoadingState, PageHeader } from "@/components/site/common";
import { MediaImage } from "@/components/site/media";
import { portfolioQuery } from "@/lib/queries";
import { formatDate, formatNumber, projectTypeLabel } from "@/lib/constants";

export const Route = createFileRoute("/portfolio/")({
  head: () => ({
    meta: [
      { title: "معرض الأعمال — فارمد الهندسية" },
      { name: "description", content: "مشاريع فارمد الهندسية المكتملة موثقة بالصور قبل وبعد التنفيذ." },
      { property: "og:title", content: "معرض الأعمال — فارمد الهندسية" },
      { property: "og:description", content: "شاهد أثر المشاريع المنفذة في المجتمعات." },
    ],
  }),
  component: Portfolio,
});

function Portfolio() {
  const { data, isLoading, isError } = useQuery(portfolioQuery);
  return (
    <SiteLayout>
      <PageHeader eyebrow="معرض الأعمال" title="مشاريعنا المكتملة" description="كل مشروع هنا تم تنفيذه وتوثيقه بالصور قبل وبعد التسليم." />
      <section className="container mx-auto max-w-6xl px-4 py-16">
        {isLoading ? <LoadingState /> : isError ? <ErrorState /> : !data?.length ? (
          <EmptyState title="لم تُضف مشاريع مكتملة بعد" description="سيتم توثيق المشاريع المنفّذة هنا فور اكتمالها." />
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {data.map((i) => (
              <Link key={i.id} to="/portfolio/$slug" params={{ slug: i.slug }} className="group overflow-hidden rounded-lg border bg-card shadow-card transition-transform hover:-translate-y-1">
                {i.cover_image ? <MediaImage path={i.cover_image} alt={i.title} className="aspect-[4/3] w-full" /> : (
                  <div className="flex aspect-[4/3] items-center justify-center bg-muted blueprint"><Camera className="h-8 w-8 text-muted-foreground/50" /></div>
                )}
                <div className="p-5">
                  <p className="text-xs font-semibold text-primary">{projectTypeLabel(i.project_type)} · {formatDate(i.completion_date)}</p>
                  <h2 className="mt-1.5 text-lg font-bold group-hover:text-primary">{i.title}</h2>
                  <div className="mt-2 flex items-center justify-between text-sm text-muted-foreground">
                    <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4" />{i.location || "—"}</span>
                    <span className="flex items-center gap-1.5"><Users className="h-4 w-4" />{formatNumber(i.beneficiaries)}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </SiteLayout>
  );
}
