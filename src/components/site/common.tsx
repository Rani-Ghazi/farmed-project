import type { ReactNode } from "react";
import { AlertTriangle, Inbox, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const statusTone: Record<string, string> = {
  new: "bg-primary-soft text-primary",
  reviewing: "bg-sand text-secondary-foreground",
  approved: "bg-success/15 text-success",
  rejected: "bg-destructive/10 text-destructive",
  published: "bg-primary-soft text-primary",
  funded: "bg-accent/20 text-accent-foreground",
  in_progress: "bg-warning/20 text-accent-foreground",
  completed: "bg-success/15 text-success",
  contacted: "bg-sand text-secondary-foreground",
  following: "bg-warning/20 text-accent-foreground",
};

export function StatusBadge({ status, label }: { status: string; label: string }) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold", statusTone[status] ?? "bg-muted text-muted-foreground")}>
      {label}
    </span>
  );
}

export function PageHeader({ eyebrow, title, description, children }: { eyebrow?: string; title: string; description?: string; children?: ReactNode }) {
  return (
    <section className="relative overflow-hidden bg-ink-gradient text-ink-foreground">
      <div className="pointer-events-none absolute inset-0 opacity-40 blueprint" />
      <div className="container relative mx-auto max-w-6xl px-4 py-16 md:py-24 animate-fade-up">
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h1 className="mt-3 text-3xl font-bold md:text-5xl">{title}</h1>
        {description && <p className="mt-4 max-w-2xl text-lg leading-8 text-ink-foreground/75">{description}</p>}
        {children}
      </div>
    </section>
  );
}

export function SectionHeading({ eyebrow, title, description, className }: { eyebrow?: string; title: string; description?: string; className?: string }) {
  return (
    <div className={cn("max-w-2xl", className)}>
      {eyebrow && <span className="eyebrow">{eyebrow}</span>}
      <h2 className="mt-3 text-3xl font-extrabold md:text-5xl">{title}</h2>
      {description && <p className="mt-3 leading-8 text-muted-foreground">{description}</p>}
    </div>
  );
}

export function LoadingState({ label = "جارٍ التحميل..." }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
      <Loader2 className="h-5 w-5 animate-spin" /> {label}
    </div>
  );
}

export function EmptyState({ title, description, children }: { title: string; description?: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed bg-card px-6 py-14 text-center">
      <Inbox className="h-10 w-10 text-muted-foreground/60" />
      <p className="mt-4 font-semibold">{title}</p>
      {description && <p className="mt-1 max-w-md text-sm text-muted-foreground">{description}</p>}
      {children && <div className="mt-5">{children}</div>}
    </div>
  );
}

export function ErrorState({ message = "تعذّر تحميل البيانات. حاول مرة أخرى." }: { message?: string }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-destructive">
      <AlertTriangle className="h-5 w-5 shrink-0" /> {message}
    </div>
  );
}

export function PlaceholderNote({ children }: { children: ReactNode }) {
  return (
    <p className="mt-3 inline-block rounded border border-dashed border-accent/60 bg-accent/10 px-2 py-1 text-xs text-accent-foreground">
      {children}
    </p>
  );
}
