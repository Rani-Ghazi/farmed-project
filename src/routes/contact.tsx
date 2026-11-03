import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { PageHeader } from "@/components/site/common";
import { ContactBlock } from "@/components/site/ContactBlock";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "تواصل معنا — فارمد الهندسية" },
      { name: "description", content: "أرقام الهاتف وواتساب والبريد الإلكتروني وعنوان فارمد الهندسية." },
      { property: "og:title", content: "تواصل معنا — فارمد الهندسية" },
      { property: "og:description", content: "تواصل مع فريق فارمد الهندسية بخصوص طلب أو دعم مشروع." },
    ],
  }),
  component: () => (
    <SiteLayout>
      <PageHeader eyebrow="تواصل معنا" title="نحن هنا للمساعدة" description="للاستفسار عن طلب مشروع أو الرغبة في دعم أحد المشاريع، تواصل معنا عبر أي من القنوات التالية." />
      <section className="container mx-auto max-w-6xl px-4 py-16">
        <ContactBlock />
        <div className="mt-12 flex flex-wrap gap-3">
          <Button asChild><Link to="/request">تقديم طلب مشروع</Link></Button>
          <Button asChild variant="outline"><Link to="/projects">استعرض المشاريع</Link></Button>
        </div>
      </section>
    </SiteLayout>
  ),
});
