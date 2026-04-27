import { useState, useMemo } from "react";
import {
  useGetDashboardReservations,
  useGetLots,
  getGetDashboardReservationsQueryKey,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, Loader2, Search } from "lucide-react";
import { format, parseISO } from "date-fns";

export function BookingsTab() {
  const [status, setStatus] = useState<string>("all");
  const [lotId, setLotId] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [search, setSearch] = useState<string>("");

  const params = useMemo(() => {
    const p: any = {};
    if (status !== "all") p.status = status;
    if (lotId !== "all") p.lotId = parseInt(lotId, 10);
    if (dateFrom) p.dateFrom = new Date(dateFrom).toISOString();
    if (dateTo) p.dateTo = new Date(dateTo).toISOString();
    return p;
  }, [status, lotId, dateFrom, dateTo]);

  const { data: lots } = useGetLots();
  const { data: reservations, isLoading } = useGetDashboardReservations(params, {
    query: { queryKey: getGetDashboardReservationsQueryKey(params) },
  });

  const filtered = useMemo(() => {
    if (!reservations) return [];
    if (!search.trim()) return reservations;
    const q = search.toLowerCase();
    return reservations.filter(
      (r) =>
        r.userName.toLowerCase().includes(q) ||
        r.userEmail.toLowerCase().includes(q) ||
        r.lotName.toLowerCase().includes(q) ||
        (r.userPhone ?? "").toLowerCase().includes(q),
    );
  }, [reservations, search]);

  const exportCsv = () => {
    const baseUrl = import.meta.env.BASE_URL.replace(/\/$/, "");
    window.open(`${baseUrl}/api/dashboard/reservations/export`, "_blank");
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 flex-wrap gap-2">
        <CardTitle>إدارة الحجوزات (Bookings Management)</CardTitle>
        <Button onClick={exportCsv} size="sm">
          <Download className="ml-2 h-4 w-4" /> CSV
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">الحالة</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger dir="rtl"><SelectValue /></SelectTrigger>
              <SelectContent dir="rtl">
                <SelectItem value="all">الكل</SelectItem>
                <SelectItem value="active">نشط</SelectItem>
                <SelectItem value="completed">مكتمل</SelectItem>
                <SelectItem value="cancelled">ملغي</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">الموقف</Label>
            <Select value={lotId} onValueChange={setLotId}>
              <SelectTrigger dir="rtl"><SelectValue /></SelectTrigger>
              <SelectContent dir="rtl">
                <SelectItem value="all">جميع المواقف</SelectItem>
                {lots?.map((l) => (
                  <SelectItem key={l.id} value={l.id.toString()}>{l.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">من تاريخ</Label>
            <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} dir="ltr" className="text-left" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">إلى تاريخ</Label>
            <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} dir="ltr" className="text-left" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">بحث</Label>
            <div className="relative">
              <Search className="absolute right-2 top-2.5 h-3 w-3 text-muted-foreground pointer-events-none" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="اسم/إيميل..." className="pr-7" />
            </div>
          </div>
        </div>

        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">المستخدم</TableHead>
                <TableHead className="text-right">الإيميل</TableHead>
                <TableHead className="text-right">الهاتف</TableHead>
                <TableHead className="text-right">الموقف</TableHead>
                <TableHead className="text-right">المقعد</TableHead>
                <TableHead className="text-right">البداية</TableHead>
                <TableHead className="text-right">النهاية</TableHead>
                <TableHead className="text-right">السعر</TableHead>
                <TableHead className="text-right">الحالة</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center h-24">
                    <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-muted-foreground h-24">
                    لا توجد حجوزات
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.userName}</TableCell>
                    <TableCell dir="ltr" className="text-left text-xs">{r.userEmail}</TableCell>
                    <TableCell dir="ltr" className="text-left text-xs">{r.userPhone ?? "—"}</TableCell>
                    <TableCell>{r.lotName}</TableCell>
                    <TableCell className="font-mono">{r.spotNumber}</TableCell>
                    <TableCell dir="ltr" className="text-left text-xs">{format(parseISO(r.startTime), "MMM d, HH:mm")}</TableCell>
                    <TableCell dir="ltr" className="text-left text-xs">{format(parseISO(r.endTime), "MMM d, HH:mm")}</TableCell>
                    <TableCell className="font-bold">{r.totalPrice} ₪</TableCell>
                    <TableCell>
                      <Badge
                        variant={r.status === "active" ? "default" : r.status === "cancelled" ? "destructive" : "outline"}
                        className={r.status === "active" ? "bg-secondary text-secondary-foreground" : ""}
                      >
                        {r.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
