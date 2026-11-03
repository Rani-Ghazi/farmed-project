import type { Database } from "@/integrations/supabase/types";

export type ProjectType = Database["public"]["Enums"]["project_type"];
export type RequestStatus = Database["public"]["Enums"]["request_status"];
export type DonorStatus = Database["public"]["Enums"]["donor_status"];

export const PROJECT_TYPES: { value: ProjectType; label: string }[] = [
  { value: "cooler", label: "المبردات الحرارية" },
  { value: "solar", label: "الطاقة الشمسية" },
  { value: "water_station", label: "المحطات المائية الكاملة" },
  { value: "well_maintenance", label: "صيانة الآبار" },
  { value: "water_network", label: "شبكات المياه" },
  { value: "school_maintenance", label: "صيانة المدارس" },
  { value: "well_drilling", label: "حفر بئر" },
  { value: "other", label: "أخرى" },
];
export const projectTypeLabel = (v?: string | null) =>
  PROJECT_TYPES.find((t) => t.value === v)?.label ?? "—";

export const REQUEST_STATUSES: { value: RequestStatus; label: string }[] = [
  { value: "new", label: "جديد" },
  { value: "reviewing", label: "قيد المراجعة" },
  { value: "approved", label: "مقبول" },
  { value: "rejected", label: "مرفوض" },
  { value: "published", label: "منشور" },
  { value: "funded", label: "ممول" },
  { value: "in_progress", label: "قيد التنفيذ" },
  { value: "completed", label: "مكتمل" },
];
export const requestStatusLabel = (v?: string | null) =>
  REQUEST_STATUSES.find((t) => t.value === v)?.label ?? "—";

export const PROJECT_STATUSES = REQUEST_STATUSES.filter((s) =>
  ["published", "funded", "in_progress", "completed"].includes(s.value),
);

export const DONOR_STATUSES: { value: DonorStatus; label: string }[] = [
  { value: "new", label: "جديد" },
  { value: "contacted", label: "تم التواصل" },
  { value: "following", label: "قيد المتابعة" },
  { value: "completed", label: "مكتمل" },
];
export const donorStatusLabel = (v?: string | null) =>
  DONOR_STATUSES.find((t) => t.value === v)?.label ?? "—";

export const CONTACT_METHODS = [
  { value: "phone", label: "اتصال هاتفي" },
  { value: "whatsapp", label: "واتساب" },
  { value: "email", label: "البريد الإلكتروني" },
];

export const ORG_TYPES = ["مدرسة", "مركز صحي", "مجتمع محلي / قرية", "مسجد / خلوة", "منظمة", "جهة حكومية", "أخرى"];

export const SUDAN_STATES = [
  "الخرطوم", "الجزيرة", "نهر النيل", "الشمالية", "البحر الأحمر", "كسلا", "القضارف", "سنار",
  "النيل الأبيض", "النيل الأزرق", "شمال كردفان", "جنوب كردفان", "غرب كردفان", "شمال دارفور",
  "جنوب دارفور", "شرق دارفور", "غرب دارفور", "وسط دارفور",
];

export const formatMoney = (v?: number | null, currency = "USD") =>
  v == null ? "—" : `${new Intl.NumberFormat("ar-SD").format(Number(v))} ${currency === "USD" ? "دولار" : currency}`;
export const formatNumber = (v?: number | null) => (v == null ? "—" : new Intl.NumberFormat("ar-SD").format(v));
export const formatDate = (v?: string | null) =>
  v ? new Intl.DateTimeFormat("ar-SD", { dateStyle: "medium" }).format(new Date(v)) : "—";

export function slugify(input: string) {
  const base = input
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return `${base || "item"}-${Date.now().toString(36).slice(-4)}`;
}
