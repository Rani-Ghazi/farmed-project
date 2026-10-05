import { Link } from "@tanstack/react-router";
import { MapPin, Users, Wallet } from "lucide-react";
import { MediaImage } from "./media";
import { StatusBadge } from "./common";
import { formatMoney, formatNumber, projectTypeLabel, requestStatusLabel } from "@/lib/constants";
import type { ProjectCardData } from "@/lib/queries";

export function ProjectCard({ p }: { p: ProjectCardData }) {
  const loc = [p.village, p.locality, p.state].filter(Boolean).join("، ");
  return (
    <Link
      to="/projects/$slug"
      params={{ slug: p.slug }}
      className="group flex flex-col overflow-hidden rounded-lg border bg-card shadow-card transition-transform hover:-translate-y-1"
    >
      <div className="relative">
        <MediaImage path={p.cover_image} alt={p.title} className="aspect-[4/3] w-full" />
        <span className="absolute right-3 top-3 rounded bg-ink/85 px-2 py-1 text-xs font-medium text-ink-foreground">
          {projectTypeLabel(p.project_type)}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-lg font-bold leading-snug group-hover:text-primary">{p.title}</h3>
          <StatusBadge status={p.status} label={requestStatusLabel(p.status)} />
        </div>
        {p.short_description && <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">{p.short_description}</p>}
        <dl className="mt-auto grid grid-cols-1 gap-2 border-t pt-4 text-sm">
          {loc && <div className="flex items-center gap-2 text-muted-foreground"><MapPin className="h-4 w-4 text-primary" />{loc}</div>}
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2"><Wallet className="h-4 w-4 text-primary" /><b>{formatMoney(p.estimated_cost, p.currency)}</b></span>
            <span className="flex items-center gap-1.5 text-muted-foreground"><Users className="h-4 w-4" />{formatNumber(p.beneficiaries)} مستفيد</span>
          </div>
        </dl>
      </div>
    </Link>
  );
}
