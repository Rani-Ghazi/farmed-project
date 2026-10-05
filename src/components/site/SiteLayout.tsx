import { useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Droplets, Facebook, Instagram, Linkedin, Mail, MapPin, Menu, MessageCircle, Phone, Twitter, X, Youtube } from "lucide-react";
import { Button } from "@/components/ui/button";
import { settingsQuery } from "@/lib/queries";

const NAV = [
  { to: "/", label: "الرئيسية" },
  { to: "/about", label: "من نحن" },
  { to: "/services", label: "خدماتنا" },
  { to: "/projects", label: "المشاريع" },
  { to: "/portfolio", label: "معرض الأعمال" },
  { to: "/request", label: "تقديم طلب" },
  { to: "/contact", label: "تواصل معنا" },
] as const;

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <Link to="/" className="flex items-center gap-2.5">
      <span className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
        <Droplets className="h-5 w-5" />
      </span>
      <span className="leading-tight">
        <span className={`block font-display text-lg font-bold ${light ? "text-ink-foreground" : "text-foreground"}`}>فارمد للهندسة</span>
        <span className={`block text-[11px] tracking-wider ${light ? "text-ink-foreground/60" : "text-muted-foreground"}`} dir="ltr">
          FARMED ENGINEERING
        </span>
      </span>
    </Link>
  );
}

function Header() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur">
      <div className="container mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <Logo />
        <nav className="hidden items-center gap-1 lg:flex" aria-label="التنقل الرئيسي">
          {NAV.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              activeOptions={{ exact: n.to === "/" }}
              className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              activeProps={{ className: "text-primary" }}
            >
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Button asChild className="hidden sm:inline-flex">
            <Link to="/projects">استعرض المشاريع</Link>
          </Button>
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setOpen((o) => !o)} aria-label="القائمة">
            {open ? <X /> : <Menu />}
          </Button>
        </div>
      </div>
      {open && (
        <nav className="border-t bg-background px-4 py-3 lg:hidden">
          {NAV.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              onClick={() => setOpen(false)}
              activeOptions={{ exact: n.to === "/" }}
              className="block rounded-md px-3 py-2.5 font-medium"
              activeProps={{ className: "bg-primary-soft text-primary" }}
            >
              {n.label}
            </Link>
          ))}
          <Button asChild className="mt-2 w-full">
            <Link to="/projects" onClick={() => setOpen(false)}>استعرض المشاريع</Link>
          </Button>
        </nav>
      )}
    </header>
  );
}

export function SocialLinks({ className = "" }: { className?: string }) {
  const { data: s } = useQuery(settingsQuery);
  const items = [
    { href: s?.facebook, icon: Facebook, label: "فيسبوك" },
    { href: s?.twitter, icon: Twitter, label: "إكس" },
    { href: s?.instagram, icon: Instagram, label: "إنستغرام" },
    { href: s?.linkedin, icon: Linkedin, label: "لينكدإن" },
    { href: s?.youtube, icon: Youtube, label: "يوتيوب" },
  ].filter((i) => i.href);
  if (!items.length) return null;
  return (
    <div className={`flex gap-2 ${className}`}>
      {items.map((i) => (
        <a key={i.label} href={i.href!} target="_blank" rel="noreferrer" aria-label={i.label} className="flex h-9 w-9 items-center justify-center rounded-md border border-current/20 opacity-80 hover:opacity-100">
          <i.icon className="h-4 w-4" />
        </a>
      ))}
    </div>
  );
}

function Footer() {
  const { data: s } = useQuery(settingsQuery);
  return (
    <footer className="bg-ink text-ink-foreground">
      <div className="container mx-auto grid max-w-6xl gap-10 px-4 py-14 md:grid-cols-3">
        <div>
          <Logo light />
          <p className="mt-4 max-w-xs text-sm leading-7 text-ink-foreground/70">
            شركة هندسية سودانية تنفّذ مشاريع المياه والطاقة لخدمة المجتمعات، وتربط الجهات المحتاجة بالداعمين بشفافية.
          </p>
          <SocialLinks className="mt-5" />
        </div>
        <div>
          <h3 className="font-bold">روابط</h3>
          <ul className="mt-4 grid grid-cols-2 gap-2 text-sm text-ink-foreground/70">
            {NAV.map((n) => (
              <li key={n.to}><Link to={n.to} className="hover:text-ink-foreground">{n.label}</Link></li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="font-bold">تواصل</h3>
          <ul className="mt-4 space-y-3 text-sm text-ink-foreground/70">
            {s?.phone && <li className="flex gap-2"><Phone className="h-4 w-4" /><span dir="ltr">{s.phone}</span></li>}
            {s?.whatsapp && <li className="flex gap-2"><MessageCircle className="h-4 w-4" /><span dir="ltr">{s.whatsapp}</span></li>}
            {s?.email && <li className="flex gap-2"><Mail className="h-4 w-4" />{s.email}</li>}
            {s?.address && <li className="flex gap-2"><MapPin className="h-4 w-4" />{s.address}</li>}
            {!s?.phone && !s?.email && !s?.address && <li>تُضاف بيانات التواصل من لوحة التحكم.</li>}
          </ul>
        </div>
      </div>
      <div className="border-t border-ink-foreground/10 py-5 text-center text-xs text-ink-foreground/50">
        © {new Date().getFullYear()} Farmed Engineering — جميع الحقوق محفوظة
      </div>
    </footer>
  );
}

export function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
