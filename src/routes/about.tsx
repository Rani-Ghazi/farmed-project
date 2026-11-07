import { createFileRoute, Link } from "@tanstack/react-router";
import { Compass, Eye, ShieldCheck, Target, Users, Wrench } from "lucide-react";
import aboutImg from "@/assets/about.webp";
import { SiteLayout } from "@/components/site/SiteLayout";
import { PageHeader, SectionHeading } from "@/components/site/common";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "من نحن — فارمد الهندسية" },
      { name: "description", content: "تعرّف على فارمد الهندسية: رسالتنا ورؤيتنا وما نقوم به في مشاريع المياه والطاقة في السودان." },
      { property: "og:title", content: "من نحن — فارمد الهندسية" },
      { property: "og:description", content: "رسالة ورؤية فارمد الهندسية ولماذا تعمل معنا الجهات والداعمون." },
    ],
  }),
  component: About,
});

const WHY = [
  { icon: ShieldCheck, t: "الشفافية", d: "توثيق كل مشروع بالصور والبيانات من الطلب حتى التسليم." },
  { icon: Wrench, t: "خبرة فنية", d: "فريق هندسي متخصص في المياه والطاقة يعمل وفق معايير واضحة." },
  { icon: Users, t: "قرب من المجتمع", d: "نشرك المستفيدين في تحديد الاحتياج وضمان استدامة المشروع." },
  { icon: Compass, t: "عمل ميداني", d: "دراسة ميدانية لكل موقع قبل الاعتماد لضمان الجدوى." },
];

function About() {
  return (
    <SiteLayout>
      <PageHeader eyebrow="من نحن" title="فارمد الهندسية" description="شركة هندسية سودانية تعمل في تنفيذ مشاريع المياه والطاقة والمشاريع التنموية والإنسانية." />
      <section className="container mx-auto grid max-w-6xl items-start gap-12 px-4 py-16 md:grid-cols-2">
        <div>
          <SectionHeading title="نبذة عن الشركة" />
          <p className="mt-4 leading-8 text-muted-foreground">
            تأسست فارمد الهندسية لتكون حلقة وصل بين المجتمعات التي تحتاج إلى خدمات أساسية كالمياه والطاقة، والداعمين الراغبين في إحداث أثر حقيقي. نتولى دراسة الطلبات وتصميم الحلول وتنفيذها ومتابعتها بعد التسليم.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border bg-card p-5 shadow-card">
              <Target className="h-6 w-6 text-accent" />
              <h3 className="mt-3 font-bold">رسالتنا</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">توفير حلول هندسية مستدامة للمياه والطاقة تحسّن حياة المجتمعات وتحفظ كرامتها.</p>
            </div>
            <div className="rounded-lg border bg-card p-5 shadow-card">
              <Eye className="h-6 w-6 text-accent" />
              <h3 className="mt-3 font-bold">رؤيتنا</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">أن يصل الماء النظيف والطاقة إلى كل مجتمع في السودان عبر شراكات موثوقة.</p>
            </div>
          </div>
        </div>
        <img src={aboutImg} alt="فريق فارمد في موقع العمل" width={1280} height={960} loading="lazy" className="aspect-[4/3] w-full rounded-lg object-cover shadow-card" />
      </section>
      <section className="border-y bg-secondary blueprint">
        <div className="container mx-auto max-w-6xl px-4 py-16">
          <SectionHeading eyebrow="ما نقوم به" title="من الاحتياج إلى الأثر" description="نستقبل طلبات المشاريع، ندرسها فنياً، ننشر المعتمد منها للداعمين، ننفذها، ثم نوثّقها في معرض الأعمال." />
          <h3 className="mt-12 text-xl font-bold">لماذا تعمل مع فارمد؟</h3>
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {WHY.map((w) => (
              <div key={w.t} className="rounded-lg border bg-card p-6 shadow-card">
                <w.icon className="h-6 w-6 text-primary" />
                <h4 className="mt-4 font-bold">{w.t}</h4>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{w.d}</p>
              </div>
            ))}
          </div>
          <div className="mt-10 flex flex-wrap gap-3">
            <Button asChild><Link to="/request">اطلب مشروعاً</Link></Button>
            <Button asChild variant="outline"><Link to="/projects">استعرض المشاريع</Link></Button>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
