import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const settingsQuery = queryOptions({
  queryKey: ["site_settings"],
  queryFn: async () => {
    const { data, error } = await supabase.from("site_settings").select("*").eq("id", 1).maybeSingle();
    if (error) throw error;
    return data;
  },
  staleTime: 60_000,
});

export const servicesQuery = queryOptions({
  queryKey: ["services", "public"],
  queryFn: async () => {
    const { data, error } = await supabase.from("services").select("*").eq("is_published", true).order("sort_order");
    if (error) throw error;
    return data;
  },
});

export const PROJECT_CARD_FIELDS =
  "id,slug,title,project_type,state,locality,village,short_description,estimated_cost,currency,beneficiaries,status,cover_image,is_featured,project_date";

export const publicProjectsQuery = queryOptions({
  queryKey: ["projects", "public"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("projects")
      .select(PROJECT_CARD_FIELDS)
      .eq("is_published", true)
      .eq("is_archived", false)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data;
  },
});

export const portfolioQuery = queryOptions({
  queryKey: ["portfolio", "public"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("portfolio_items")
      .select("id,slug,title,project_type,location,completion_date,beneficiaries,cover_image,description")
      .eq("is_published", true)
      .order("completion_date", { ascending: false, nullsFirst: false });
    if (error) throw error;
    return data;
  },
});

export type ProjectCardData = Awaited<ReturnType<typeof publicProjectsQuery.queryFn & {}>>[number];
