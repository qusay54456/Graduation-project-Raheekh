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
import { useTranslation } from "@/hooks/use-i18n";

export function BookingsTab() {
  const { t, dir } = useTranslation();
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

  const align = dir === "rtl" ? "text-right" : "text-left";
  const iconSidePos = dir === "rtl" ? "right-2" : "left-2";
  const iconPad = dir === "rtl" ? "pr-7" : "pl-7";

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 flex-wrap gap-2">
        <CardTitle>{t("dashBookings.title")}</CardTitle>
        <Button onClick={exportCsv} size="sm" data-testid="button-export-csv">
          <Download className="me-2 h-4 w-4" /> CSV
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">{t("dashBookings.status")}</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger dir={dir}><SelectValue /></SelectTrigger>
              <SelectContent dir={dir}>
                <SelectItem value="all">{t("dashBookings.all")}</SelectItem>
                <SelectItem value="active">{t("bookings.statusActive")}</SelectItem>
                <SelectItem value="completed">{t("bookings.statusCompleted")}</SelectItem>
                <SelectItem value="cancelled">{t("bookings.statusCancelled")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">{t("dashBookings.lot")}</Label>
            <Select value={lotId} onValueChange={setLotId}>
              <SelectTrigger dir={dir}><SelectValue /></SelectTrigger>
              <SelectContent dir={dir}>
                <SelectItem value="all">{t("dashBookings.lotsAll")}</SelectItem>
                {lots?.map((l) => (
                  <SelectItem key={l.id} value={l.id.toString()}>{l.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">{t("dashBookings.dateFrom")}</Label>
            <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} dir="ltr" className="text-left" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">{t("dashBookings.dateTo")}</Label>
            <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} dir="ltr" className="text-left" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">{t("dashBookings.search")}</Label>
            <div className="relative">
              <Search className={`absolute ${iconSidePos} top-2.5 h-3 w-3 text-muted-foreground pointer-events-none`} />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("dashBookings.searchPlaceholder")}
                className={iconPad}
              />
            </div>
          </div>
        </div>

        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className={align}>{t("dashBookings.user")}</TableHead>
                <TableHead className={align}>{t("common.email")}</TableHead>
                <TableHead className={align}>{t("common.phone")}</TableHead>
                <TableHead className={align}>{t("dashBookings.lot")}</TableHead>
                <TableHead className={align}>{t("dashBookings.seat")}</TableHead>
                <TableHead className={align}>{t("dashBookings.start")}</TableHead>
                <TableHead className={align}>{t("dashBookings.end")}</TableHead>
                <TableHead className={align}>{t("dashBookings.price")}</TableHead>
                <TableHead className={align}>{t("dashBookings.status")}</TableHead>
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
                    {t("dashBookings.empty")}
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
                    <TableCell className="font-bold">{r.totalPrice} {t("common.currency")}</TableCell>
                    <TableCell>
                      <Badge
                        variant={r.status === "active" ? "default" : r.status === "cancelled" ? "destructive" : "outline"}
                        className={r.status === "active" ? "bg-secondary text-secondary-foreground" : ""}
                      >
                        {r.status === "active" && t("bookings.statusActive")}
                        {r.status === "completed" && t("bookings.statusCompleted")}
                        {r.status === "cancelled" && t("bookings.statusCancelled")}
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
