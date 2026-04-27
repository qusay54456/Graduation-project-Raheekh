import { useState } from "react";
import { 
  useGetDashboardStats, 
  useGetDashboardReservations,
  useGetLots,
  useGetLotSpots,
  useUpdateSpot,
  getGetLotSpotsQueryKey
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Car, CalendarCheck, Map as MapIcon, ShieldCheck } from "lucide-react";
import { format, parseISO } from "date-fns";
import { arSA } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import type { SpotStatus } from "@workspace/api-client-react/src/generated/api.schemas";

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useGetDashboardStats();
  const { data: reservations, isLoading: resLoading } = useGetDashboardReservations();
  const { data: lots, isLoading: lotsLoading } = useGetLots();
  
  const [selectedLotId, setSelectedLotId] = useState<string>("");

  const { data: spots, isLoading: spotsLoading } = useGetLotSpots(
    parseInt(selectedLotId, 10), 
    { query: { enabled: !!selectedLotId, queryKey: getGetLotSpotsQueryKey(parseInt(selectedLotId, 10)) } }
  );

  const updateSpot = useUpdateSpot();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleSpotStatusToggle = (spotId: number, currentStatus: SpotStatus) => {
    // Cycle: available -> occupied -> reserved -> available
    let newStatus: SpotStatus = "available";
    if (currentStatus === "available") newStatus = "occupied";
    else if (currentStatus === "occupied") newStatus = "reserved";
    else if (currentStatus === "reserved") newStatus = "available";

    updateSpot.mutate(
      { id: spotId, data: { status: newStatus } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetLotSpotsQueryKey(parseInt(selectedLotId, 10)) });
        },
        onError: () => {
          toast({
            title: "خطأ",
            description: "Failed to update spot status",
            variant: "destructive"
          });
        }
      }
    );
  };

  if (statsLoading || resLoading || lotsLoading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-primary mb-2">لوحة المشرف (Supervisor Dashboard)</h1>
        <p className="text-muted-foreground">Manage parking lots and view statistics.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-primary text-primary-foreground">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-primary-foreground/80">إجمالي المواقف</CardTitle>
            <MapIcon className="h-4 w-4 text-primary-foreground/60" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.totalSpots || 0}</div>
            <p className="text-xs text-primary-foreground/60 mt-1">Total Spots in {stats?.totalLots || 0} Lots</p>
          </CardContent>
        </Card>
        <Card className="bg-secondary text-secondary-foreground">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-secondary-foreground/80">المتاحة</CardTitle>
            <ShieldCheck className="h-4 w-4 text-secondary-foreground/60" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.availableSpots || 0}</div>
            <p className="text-xs text-secondary-foreground/60 mt-1">Available Spots</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">المشغولة</CardTitle>
            <Car className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-destructive">{stats?.occupiedSpots || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Occupied Spots</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">الحجوزات النشطة</CardTitle>
            <CalendarCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{stats?.activeReservations || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Active / {stats?.totalReservations || 0} Total</p>
          </CardContent>
        </Card>
      </div>

      {/* Spot Management */}
      <Card>
        <CardHeader>
          <CardTitle>إدارة المواقف (Spot Management)</CardTitle>
          <CardDescription>Select a lot to manage individual spots. Click a spot to change its status.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="max-w-xs">
            <Select value={selectedLotId} onValueChange={setSelectedLotId}>
              <SelectTrigger dir="rtl">
                <SelectValue placeholder="اختر الساحة (Select Lot)" />
              </SelectTrigger>
              <SelectContent dir="rtl">
                {lots?.map(lot => (
                  <SelectItem key={lot.id} value={lot.id.toString()}>{lot.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedLotId && spotsLoading && <Loader2 className="h-6 w-6 animate-spin text-primary" />}
          
          {selectedLotId && spots && (
            <div>
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-10 gap-2 mb-4">
                {spots.map(spot => (
                  <button
                    key={spot.id}
                    onClick={() => handleSpotStatusToggle(spot.id, spot.status)}
                    disabled={updateSpot.isPending}
                    className={`
                      relative flex items-center justify-center h-12 rounded border font-mono text-sm font-bold transition-all
                      ${spot.status === 'available' ? 'border-secondary/50 bg-secondary/10 text-secondary hover:bg-secondary/20' : 
                        spot.status === 'occupied' ? 'border-destructive bg-destructive/10 text-destructive hover:bg-destructive/20' : 
                        'border-orange-500 bg-orange-500/10 text-orange-500 hover:bg-orange-500/20'}
                    `}
                    title={`Click to change status (Current: ${spot.status})`}
                  >
                    {spot.spotNumber}
                  </button>
                ))}
              </div>
              <div className="flex gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><div className="w-3 h-3 bg-secondary/20 border border-secondary/50"></div> متاح</span>
                <span className="flex items-center gap-1"><div className="w-3 h-3 bg-destructive/10 border border-destructive"></div> مشغول</span>
                <span className="flex items-center gap-1"><div className="w-3 h-3 bg-orange-500/10 border border-orange-500"></div> محجوز</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Reservations */}
      <Card>
        <CardHeader>
          <CardTitle>كل الحجوزات (All Reservations)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">المستخدم</TableHead>
                  <TableHead className="text-right">الساحة</TableHead>
                  <TableHead className="text-right">الموقف</TableHead>
                  <TableHead className="text-right">البداية</TableHead>
                  <TableHead className="text-right">النهاية</TableHead>
                  <TableHead className="text-right">الحالة</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reservations?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground h-24">
                      لا توجد حجوزات (No reservations)
                    </TableCell>
                  </TableRow>
                ) : (
                  reservations?.map((res) => (
                    <TableRow key={res.id}>
                      <TableCell className="font-medium">{res.userName}</TableCell>
                      <TableCell>{res.lotName}</TableCell>
                      <TableCell className="font-mono">{res.spotNumber}</TableCell>
                      <TableCell dir="ltr" className="text-left">{format(parseISO(res.startTime), "MMM d, HH:mm")}</TableCell>
                      <TableCell dir="ltr" className="text-left">{format(parseISO(res.endTime), "MMM d, HH:mm")}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={res.status === 'active' ? "default" : res.status === 'cancelled' ? "destructive" : "outline"}
                          className={res.status === 'active' ? "bg-secondary text-secondary-foreground" : ""}
                        >
                          {res.status}
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
    </div>
  );
}
