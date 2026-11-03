// Per-service extra questions for the project request form.
// To add a question, append to the service's array — form and admin view render from this config.

export type QuestionType = "yesno" | "number" | "choice" | "multi" | "images";

export interface ServiceQuestion {
  key: string;
  label: string;
  type: QuestionType;
  required?: boolean;
  options?: { value: string; label: string }[];
  hint?: string;
}

const yn = (key: string, label: string): ServiceQuestion => ({ key, label, type: "yesno", required: true });

export const SERVICE_QUESTIONS: Record<string, ServiceQuestion[]> = {
  cooler: [
    yn("stable_water_line", "هل يوجد خط مياه مستقر في المدرسة أو المركز أو الموقع؟"),
    yn("has_tank", "هل يوجد خزان مياه؟"),
    yn("has_motor", "هل يوجد موتور مياه؟"),
  ],
  solar: [
    { key: "pump_hp", label: "ما قدرة الطلمبة الغاطسة المطلوبة بالحصان (HP)؟", type: "number", required: true },
    yn("has_submersible_pump", "هل توجد طلمبة غاطسة حالياً؟"),
  ],
  water_station: [
    yn("has_geo_study", "هل توجد دراسة جيولوجية للمنطقة؟"),
    { key: "expected_depth_m", label: "ما أعماق الحفر المتوقعة بالمتر؟", type: "number", hint: "اتركه فارغاً إذا لم تكن المعلومة معروفة" },
  ],
  water_network: [
    yn("has_network", "هل توجد شبكة مياه حالية؟"),
    { key: "work_type", label: "نوع العمل المطلوب", type: "choice", required: true, options: [
      { value: "new", label: "إنشاء شبكة جديدة" },
      { value: "rehab", label: "تأهيل أو صيانة شبكة قائمة" },
    ] },
    { key: "network_length_m", label: "طول الشبكة المتوقع بالمتر", type: "number", hint: "إن كان معروفاً" },
    yn("has_map", "هل توجد خريطة أو مخطط للموقع؟"),
  ],
  school_maintenance: [
    { key: "facilities", label: "المرافق المطلوب صيانتها", type: "multi", required: true, options: [
      { value: "classrooms", label: "الفصول" }, { value: "toilets", label: "دورات المياه" },
      { value: "fences", label: "الأسوار" }, { value: "roofs", label: "الأسقف" },
      { value: "electricity", label: "الكهرباء" }, { value: "plumbing", label: "السباكة" },
      { value: "other", label: "أخرى" },
    ] },
    { key: "maintenance_kind", label: "طبيعة الصيانة", type: "choice", required: true, options: [
      { value: "urgent", label: "صيانة عاجلة" }, { value: "periodic", label: "صيانة دورية" },
      { value: "full", label: "تأهيل شامل" },
    ] },
    { key: "classrooms_count", label: "عدد الفصول الدراسية", type: "number", required: true },
    { key: "condition_images", label: "صور توضح حالة المدرسة", type: "images" },
  ],
};

export type AnswerValue = string | number | boolean | string[] | null;
export type Answers = Record<string, AnswerValue>;

/** Returns error messages keyed by question key. */
export function validateAnswers(service: string, answers: Answers): Record<string, string> {
  const errs: Record<string, string> = {};
  for (const q of SERVICE_QUESTIONS[service] ?? []) {
    const v = answers[q.key];
    const empty = v == null || v === "" || (Array.isArray(v) && v.length === 0);
    if (q.type === "number" && !empty && (isNaN(Number(v)) || Number(v) < 0)) errs[q.key] = "أدخل رقماً صحيحاً";
    else if (q.required && q.type !== "images" && empty) errs[q.key] = "هذا الحقل مطلوب";
  }
  return errs;
}

/** Keep only answers belonging to the selected service, normalized. */
export function pickAnswers(service: string, answers: Answers): Answers {
  const out: Answers = {};
  for (const q of SERVICE_QUESTIONS[service] ?? []) {
    const v = answers[q.key];
    if (v == null || v === "" || (Array.isArray(v) && !v.length)) continue;
    out[q.key] = q.type === "number" ? Number(v) : v;
  }
  return out;
}

export function formatAnswer(q: ServiceQuestion, v: AnswerValue): string {
  if (v == null || v === "") return "—";
  if (q.type === "yesno") return v === true || v === "yes" ? "نعم" : "لا";
  if (q.type === "choice") return q.options?.find((o) => o.value === v)?.label ?? String(v);
  if (q.type === "multi" && Array.isArray(v)) return v.map((x) => q.options?.find((o) => o.value === x)?.label ?? x).join("، ");
  return String(v);
}
