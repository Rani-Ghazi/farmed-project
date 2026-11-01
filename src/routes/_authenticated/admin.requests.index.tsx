import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { EmptyState, ErrorState, StatusBadge } from "@/components/site/common";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate, projectTypeLabel, REQUEST_STATUSES, requestStatusLabel } from "@/lib/constants";

export const Route = createFileRoute("/_authenticated/admin/requests/")({ component: Requests });

function Requests() {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const navigate = useNavigate();
  const query = useQuery({
    queryKey: ["adminRequests"],
    queryFn: async () => {
      const { data, error } = await supabase.from("project_requests").select("id,org_name,contact_name,phone,project_type,state,locality,status,created_at").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const rows = (query.data ?? []).filter((r) => {
    if (status !== "all" && r.status !== status) return false;
    if (q && !`${r.org_name} ${r.contact_name} ${r.phone} ${r.locality}`.includes(q)) return false;
    return true;
  });

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="text-2xl font-bold">طلبات المشاريع</h1>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <Input placeholder="بحث بالاسم أو الهاتف أو المحلية..." value={q} onChange={(e) => setQ(e.target.value)} className="sm:max-w-xs" />
        <Select value={status} onValueChange={setStatus} dir="rtl">
          <SelectTrigger className="sm:w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">كل الحالات</SelectItem>
            {REQUEST_STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="mt-6">
        {query.isLoading ? <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          : query.isError ? <ErrorState />
          : rows.length === 0 ? <EmptyState title="لا توجد طلبات" description="ستظهر طلبات المشاريع هنا فور تقديمها من الموقع." />
          : (
            <div className="overflow-x-auto rounded-lg border bg-card shadow-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>الجهة</TableHead>
                    <TableHead>نوع المشروع</TableHead>
                    <TableHead>الموقع</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>التاريخ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r) => (
                    <TableRow
                      key={r.id}
                      className="cursor-pointer transition-colors hover:bg-muted/60"
                      onClick={() => navigate({ to: "/admin/requests/$id", params: { id: r.id } })}
                    >
                      <TableCell>
                        <span className="font-semibold">{r.org_name}</span>
                        <span className="block text-xs text-muted-foreground">{r.contact_name} · <span dir="ltr">{r.phone}</span></span>
                      </TableCell>
                      <TableCell>{projectTypeLabel(r.project_type)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{r.state} — {r.locality}</TableCell>
                      <TableCell><StatusBadge status={r.status} label={requestStatusLabel(r.status)} /></TableCell>
                      <TableCell className="text-sm text-muted-foreground">{formatDate(r.created_at)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
      </div>
    </div>
  );
}
