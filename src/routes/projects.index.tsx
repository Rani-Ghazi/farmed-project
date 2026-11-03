import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { EmptyState, ErrorState, LoadingState, PageHeader } from "@/components/site/common";
import { ProjectCard } from "@/components/site/ProjectCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PROJECT_STATUSES, PROJECT_TYPES } from "@/lib/constants";
import { publicProjectsQuery } from "@/lib/queries";

export const Route = createFileRoute("/projects/")({
  head: () => ({
    meta: [
      { title: "المشاريع — فارمد الهندسية" },
      { name: "description", content: "تصفّح مشاريع المياه والطاقة المعتمدة من فارمد الهندسية واختر مشروعاً لدعمه." },
      { property: "og:title", content: "المشاريع — فارمد الهندسية" },
      { property: "og:description", content: "مشاريع معتمدة تنتظر الدعم في مختلف ولايات السودان." },
    ],
  }),
  component: Projects,
});

const COST_RANGES = [
  { v: "all", l: "كل التكاليف", min: 0, max: Infinity },
  { v: "lt5", l: "أقل من 5,000 $", min: 0, max: 5000 },
  { v: "5to20", l: "5,000 – 20,000 $", min: 5000, max: 20000 },
  { v: "gt20", l: "أكثر من 20,000 $", min: 20000, max: Infinity },
];

function Projects() {
  const { data, isLoading, isError } = useQuery(publicProjectsQuery);
  const [q, setQ] = useState("");
  const [type, setType] = useState("all");
  const [status, setStatus] = useState("all");
  const [state, setState] = useState("all");
  const [cost, setCost] = useState("all");

  const states = useMemo(() => Array.from(new Set((data ?? []).map((p) => p.state).filter(Boolean))) as string[], [data]);
  const filtered = useMemo(() => {
    const r = COST_RANGES.find((c) => c.v === cost)!;
    return (data ?? []).filter((p) => {
      if (type !== "all" && p.project_type !== type) return false;
      if (status !== "all" && p.status !== status) return false;
      if (state !== "all" && p.state !== state) return false;
      if (cost !== "all") {
        const c = Number(p.estimated_cost ?? -1);
        if (c < r.min || c >= r.max) return false;
      }
      if (q && !`${p.title} ${p.short_description ?? ""} ${p.village ?? ""} ${p.locality ?? ""}`.includes(q)) return false;
      return true;
    });
  }, [data, q, type, status, state, cost]);

  const reset = () => { setQ(""); setType("all"); setStatus("all"); setState("all"); setCost("all"); };

  return (
    <SiteLayout>
      <PageHeader eyebrow="المشاريع" title="مشاريع تنتظر دعمك" description="كل مشروع هنا تمت دراسته واعتماده من فريق فارمد. اختر مشروعاً وأبدِ رغبتك في دعمه." />
      <section className="container mx-auto max-w-6xl px-4 py-10">
        <div className="grid gap-3 rounded-lg border bg-card p-4 shadow-card sm:grid-cols-2 lg:grid-cols-5">
          <div className="relative lg:col-span-1">
            <Search className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="بحث..." value={q} onChange={(e) => setQ(e.target.value)} className="pr-9" />
          </div>
          <FilterSelect value={type} onChange={setType} all="كل الأنواع" options={PROJECT_TYPES.map((t) => ({ v: t.value, l: t.label }))} />
          <FilterSelect value={state} onChange={setState} all="كل الولايات" options={states.map((s) => ({ v: s, l: s }))} />
          <FilterSelect value={status} onChange={setStatus} all="كل الحالات" options={PROJECT_STATUSES.map((t) => ({ v: t.value, l: t.label }))} />
          <FilterSelect value={cost} onChange={setCost} all={null} options={COST_RANGES.map((c) => ({ v: c.v, l: c.l }))} />
        </div>
        <div className="mt-8">
          {isLoading ? <LoadingState /> : isError ? <ErrorState /> : filtered.length === 0 ? (
            <EmptyState title="لا توجد مشاريع مطابقة" description="جرّب تغيير معايير البحث."><Button variant="outline" onClick={reset}>مسح الفلاتر</Button></EmptyState>
          ) : (
            <>
              <p className="mb-4 text-sm text-muted-foreground">{filtered.length} مشروع</p>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{filtered.map((p) => <ProjectCard key={p.id} p={p} />)}</div>
            </>
          )}
        </div>
      </section>
    </SiteLayout>
  );
}

function FilterSelect({ value, onChange, all, options }: { value: string; onChange: (v: string) => void; all: string | null; options: { v: string; l: string }[] }) {
  return (
    <Select value={value} onValueChange={onChange} dir="rtl">
      <SelectTrigger><SelectValue /></SelectTrigger>
      <SelectContent>
        {all && <SelectItem value="all">{all}</SelectItem>}
        {options.map((o) => <SelectItem key={o.v} value={o.v}>{o.l}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}
