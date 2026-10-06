import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Hammer } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { EmptyState, ErrorState, LoadingState, PageHeader } from "@/components/site/common";
import { MediaImage } from "@/components/site/media";
import { servicesQuery } from "@/lib/queries";
import { serviceIcon } from "@/lib/icons";

export const Route = createFileRoute("/services/")({
  head: () => ({
    meta: [
      { title: "خدماتنا — فارمد للهندسة" },
      { name: "description", content: "المبردات الحرارية، حفر الآبار، الطاقة الشمسية، وصيانة الآبار — خدمات فارمد للهندسة." },
      { property: "og:title", content: "خدماتنا — فارمد للهندسة" },
      { property: "og:description", content: "حلول هندسية للمياه والطاقة تخدم المجتمعات في السودان." },
    ],
  }),
  component: Services,
});

function Services() {
  const { data, isLoading, isError } = useQuery(servicesQuery);
  return (
    <SiteLayout>
      <PageHeader eyebrow="خدماتنا" title="حلول هندسية للمياه والطاقة" description="نقدّم خدمات متكاملة من الدراسة والتصميم حتى التنفيذ والصيانة." />
      <section className="container mx-auto max-w-6xl px-4 py-16">
        {isLoading ? <LoadingState /> : isError ? <ErrorState /> : !data?.length ? <EmptyState title="لا توجد خدمات حالياً" /> : (
          <div className="grid gap-6 md:grid-cols-2">
            {data.map((s) => {
              const Icon = serviceIcon[s.project_type ?? "other"] ?? Hammer;
              return (
                <Link key={s.id} to="/services/$slug" params={{ slug: s.slug }} className="group flex flex-col overflow-hidden rounded-lg border bg-card shadow-card sm:flex-row">
                  <MediaImage path={s.image_url} alt={s.name} className="aspect-video w-full sm:aspect-auto sm:w-48" />
                  <div className="flex flex-1 flex-col p-6">
                    <Icon className="h-6 w-6 text-primary" />
                    <h2 className="mt-3 text-xl font-bold group-hover:text-primary">{s.name}</h2>
                    <p className="mt-2 flex-1 text-sm leading-6 text-muted-foreground">{s.short_description}</p>
                    <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary">التفاصيل <ArrowLeft className="h-4 w-4" /></span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </SiteLayout>
  );
}
