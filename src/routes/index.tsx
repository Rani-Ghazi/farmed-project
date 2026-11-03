import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ClipboardList, Hammer, HeartHandshake, SearchCheck, Camera } from "lucide-react";
import { serviceIcon } from "@/lib/icons";
import heroImg from "@/assets/hero.jpg";
import aboutImg from "@/assets/about.jpg";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorState, LoadingState, SectionHeading } from "@/components/site/common";
import { ProjectCard } from "@/components/site/ProjectCard";
import { MediaImage } from "@/components/site/media";
import { ContactBlock } from "@/components/site/ContactBlock";
import { portfolioQuery, publicProjectsQuery, servicesQuery } from "@/lib/queries";
import { formatDate, projectTypeLabel } from "@/lib/constants";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "فارمد الهندسية — مشاريع المياه والطاقة في السودان" },
      { name: "description", content: "فارمد الهندسية تنفّذ مشاريع المبردات الحرارية وحفر الآبار والطاقة الشمسية، وتربط المجتمعات المحتاجة بالداعمين." },
      { property: "og:title", content: "فارمد الهندسية — مشاريع المياه والطاقة في السودان" },
      { property: "og:description", content: "اطلب مشروعاً لمجتمعك أو ادعم مشروعاً قائماً مع فارمد الهندسية." },
    ],
  }),
  component: Home,
});


const STEPS = [
  { icon: ClipboardList, t: "تقديم الطلب", d: "تقدّم الجهة المستفيدة طلب مشروع مع تفاصيل الاحتياج والموقع." },
  { icon: SearchCheck, t: "المراجعة والاعتماد", d: "يدرس فريق فارمد الطلب فنياً وميدانياً ويعتمده ويحدد تكلفته." },
  { icon: HeartHandshake, t: "نشر المشروع ودعمه", d: "يُنشر المشروع على المنصة ليطّلع عليه الداعمون ويبدوا رغبتهم في دعمه." },
  { icon: Hammer, t: "التنفيذ والتوثيق", d: "ينفّذ فريقنا المشروع ويوثّقه بالصور قبل وبعد في معرض الأعمال." },
];

function Home() {
  const services = useQuery(servicesQuery);
  const projects = useQuery(publicProjectsQuery);
  const portfolio = useQuery(portfolioQuery);
  const featured = (projects.data ?? []).filter((p) => p.status !== "completed").sort((a, b) => Number(b.is_featured) - Number(a.is_featured)).slice(0, 3);

  return (
    <SiteLayout>
      {/* Hero */}
      <section className="relative isolate overflow-hidden bg-ink">
        <img src={heroImg} alt="نظام طاقة شمسية يشغّل بئر مياه في قرية سودانية" width={1920} height={1088} className="absolute inset-0 -z-10 h-full w-full object-cover" />
        <div className="absolute inset-0 -z-10 bg-hero-overlay" />
        <div className="container mx-auto max-w-6xl px-4 py-24 md:py-36">
          <div className="max-w-2xl text-ink-foreground">
            <span className="eyebrow">هندسة في خدمة المجتمع</span>
            <h1 className="mt-4 text-4xl font-bold leading-tight md:text-6xl">
              مياه نظيفة وطاقة مستدامة
              <br />
              <span className="text-accent">لكل مجتمع في السودان</span>
            </h1>
            <p className="mt-6 text-lg leading-8 text-ink-foreground/80">
              فارمد الهندسية تصمّم وتنفّذ مشاريع المبردات الحرارية وحفر الآبار وأنظمة الطاقة الشمسية، وتربط الجهات المحتاجة بالداعمين عبر منصة واضحة وشفافة.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" variant="accent"><Link to="/request">اطلب مشروعاً</Link></Button>
              <Button asChild size="lg" variant="heroOutline"><Link to="/projects">استعرض المشاريع</Link></Button>
            </div>
          </div>
        </div>
      </section>

      {/* About short */}
      <section className="container mx-auto grid max-w-6xl items-center gap-10 px-4 py-20 md:grid-cols-2">
        <img src={aboutImg} alt="مهندسون في موقع حفر بئر" width={1280} height={960} loading="lazy" className="aspect-[4/3] w-full rounded-lg object-cover shadow-card" />
        <div>
          <SectionHeading eyebrow="من نحن" title="شريك هندسي موثوق لمشاريع التنمية" description="نعمل مع المدارس والمراكز الصحية والمجتمعات والمنظمات لتحويل الاحتياج إلى مشروع منفّذ بمعايير هندسية، ونوثّق كل مرحلة ليطمئن الداعم إلى أثر مساهمته." />
          <Button asChild variant="outline" className="mt-6"><Link to="/about">اعرف المزيد عنا</Link></Button>
        </div>
      </section>

      {/* Services */}
      <section className="border-y bg-secondary blueprint">
        <div className="container mx-auto max-w-6xl px-4 py-20">
          <SectionHeading eyebrow="خدماتنا" title="ما نقدّمه" />
          {services.isLoading ? <LoadingState /> : services.isError ? <div className="mt-8"><ErrorState /></div> : (
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {services.data?.map((s) => {
                const Icon = serviceIcon[s.project_type ?? "other"] ?? Hammer;
                return (
                  <Link key={s.id} to="/services/$slug" params={{ slug: s.slug }} className="group rounded-lg border bg-card p-6 shadow-card transition-colors hover:border-primary">
                    <span className="flex h-12 w-12 items-center justify-center rounded-md bg-primary-soft text-primary"><Icon className="h-6 w-6" /></span>
                    <h3 className="mt-5 text-lg font-bold group-hover:text-primary">{s.name}</h3>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{s.short_description}</p>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Featured projects */}
      <section className="container mx-auto max-w-6xl px-4 py-20">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <SectionHeading eyebrow="مشاريع تنتظر الدعم" title="مشاريع مميزة" />
          <Button asChild variant="outline"><Link to="/projects">كل المشاريع</Link></Button>
        </div>
        <div className="mt-10">
          {projects.isLoading ? <LoadingState /> : projects.isError ? <ErrorState /> : featured.length === 0 ? (
            <EmptyState title="لا توجد مشاريع منشورة بعد" description="ستظهر هنا المشاريع المعتمدة فور نشرها من فريق فارمد." />
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{featured.map((p) => <ProjectCard key={p.id} p={p} />)}</div>
          )}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-ink text-ink-foreground">
        <div className="container mx-auto max-w-6xl px-4 py-20">
          <span className="eyebrow">آلية العمل</span>
          <h2 className="mt-3 text-2xl font-bold md:text-4xl">كيف تعمل المنصة</h2>
          <ol className="mt-12 grid gap-8 md:grid-cols-4">
            {STEPS.map((s, i) => (
              <li key={s.t} className="relative border-t border-ink-foreground/20 pt-6">
                <span className="absolute -top-3 right-0 bg-ink pl-3 font-display text-sm text-accent">0{i + 1}</span>
                <s.icon className="h-7 w-7 text-accent" />
                <h3 className="mt-4 text-lg font-bold">{s.t}</h3>
                <p className="mt-2 text-sm leading-6 text-ink-foreground/70">{s.d}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Completed */}
      <section className="container mx-auto max-w-6xl px-4 py-20">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <SectionHeading eyebrow="معرض الأعمال" title="مشاريع مكتملة" />
          <Button asChild variant="outline"><Link to="/portfolio">معرض الأعمال</Link></Button>
        </div>
        <div className="mt-10">
          {portfolio.isLoading ? <LoadingState /> : (portfolio.data ?? []).length === 0 ? (
            <EmptyState title="لم تُضف مشاريع مكتملة بعد" description="سيتم توثيق المشاريع المنفّذة هنا بالصور قبل وبعد." />
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {portfolio.data!.slice(0, 3).map((i) => (
                <Link key={i.id} to="/portfolio/$slug" params={{ slug: i.slug }} className="group overflow-hidden rounded-lg border bg-card shadow-card">
                  {i.cover_image ? <MediaImage path={i.cover_image} alt={i.title} className="aspect-[4/3] w-full" /> : <div className="flex aspect-[4/3] items-center justify-center bg-muted blueprint"><Camera className="h-8 w-8 text-muted-foreground/50" /></div>}
                  <div className="p-5">
                    <p className="text-xs font-semibold text-primary">{projectTypeLabel(i.project_type)} · {formatDate(i.completion_date)}</p>
                    <h3 className="mt-1 font-bold group-hover:text-primary">{i.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{i.location}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto max-w-6xl px-4 pb-20">
        <div className="grid gap-5 md:grid-cols-2">
          <div className="rounded-lg bg-primary p-8 text-primary-foreground md:p-10">
            <h3 className="text-2xl font-bold">مجتمعك يحتاج مشروعاً؟</h3>
            <p className="mt-3 leading-7 opacity-85">قدّم طلبك الآن وسيراجعه فريقنا الهندسي ويتواصل معكم.</p>
            <Button asChild variant="accent" className="mt-6"><Link to="/request">اطلب مشروعاً</Link></Button>
          </div>
          <div className="rounded-lg border-2 border-accent bg-card p-8 md:p-10">
            <h3 className="text-2xl font-bold">تريد أن تدعم مشروعاً؟</h3>
            <p className="mt-3 leading-7 text-muted-foreground">تصفّح المشاريع المعتمدة واختر ما يناسبك، وسنتواصل معك لترتيب الدعم.</p>
            <Button asChild className="mt-6"><Link to="/projects">استعرض المشاريع</Link></Button>
          </div>
        </div>
      </section>

      <section className="border-t bg-secondary">
        <div className="container mx-auto max-w-6xl px-4 py-20">
          <SectionHeading eyebrow="تواصل معنا" title="نسعد بتواصلكم" />
          <div className="mt-8"><ContactBlock /></div>
        </div>
      </section>
    </SiteLayout>
  );
}
