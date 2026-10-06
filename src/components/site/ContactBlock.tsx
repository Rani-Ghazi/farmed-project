import { useQuery } from "@tanstack/react-query";
import { Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { settingsQuery } from "@/lib/queries";
import { SocialLinks } from "./SiteLayout";

export function ContactBlock() {
  const { data: s, isLoading } = useQuery(settingsQuery);
  const wa = s?.whatsapp?.replace(/[^0-9]/g, "");
  const items = [
    { icon: Phone, label: "الهاتف", value: s?.phone, href: s?.phone ? `tel:${s.phone}` : undefined, ltr: true },
    { icon: MessageCircle, label: "واتساب", value: s?.whatsapp, href: wa ? `https://wa.me/${wa}` : undefined, ltr: true },
    { icon: Mail, label: "البريد الإلكتروني", value: s?.email, href: s?.email ? `mailto:${s.email}` : undefined, ltr: true },
    { icon: MapPin, label: "العنوان", value: s?.address },
  ];
  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((i) => (
          <div key={i.label} className="rounded-lg border bg-card p-5 shadow-card">
            <i.icon className="h-6 w-6 text-primary" />
            <p className="mt-3 text-sm text-muted-foreground">{i.label}</p>
            {isLoading ? (
              <div className="mt-1 h-5 w-32 animate-pulse rounded bg-muted" />
            ) : i.value ? (
              <a href={i.href} className="mt-1 block font-semibold hover:text-primary" dir={i.ltr ? "ltr" : undefined} style={i.ltr ? { textAlign: "right" } : undefined}>
                {i.value}
              </a>
            ) : (
              <p className="mt-1 text-sm text-muted-foreground">لم يُضف بعد</p>
            )}
          </div>
        ))}
      </div>
      <SocialLinks className="mt-6 text-foreground" />
    </div>
  );
}
