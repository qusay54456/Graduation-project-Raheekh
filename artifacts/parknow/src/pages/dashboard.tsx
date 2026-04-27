import { useState } from "react";
import {
  useGetDashboardStats,
  useGetLots,
  useGetLotSpots,
  useUpdateSpot,
  getGetLotSpotsQueryKey,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Car, CalendarCheck, Map as MapIcon, ShieldCheck, DollarSign, Users as UsersIcon } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import type { SpotStatus } from "@workspace/api-client-react/src/generated/api.schemas";
import { ChartsTab } from "@/components/dashboard/charts-tab";
import { BookingsTab } from "@/components/dashboard/bookings-tab";
import { LotsTab } from "@/components/dashboard/lots-tab";
import { UsersTab } from "@/components/dashboard/users-tab";
import { NotificationsPanel } from "@/components/dashboard/notifications-panel";

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useGetDashboardStats();
  const { data: lots } = useGetLots();
  const [selectedLotId, setSelectedLotId] = useState<string>("");

  const { data: spots, isLoading: spotsLoading } = useGetLotSpots(parseInt(selectedLotId, 10), {
    query: { enabled: !!selectedLotId, queryKey: getGetLotSpotsQueryKey(parseInt(selectedLotId, 10)) },
  });

  const updateSpot = useUpdateSpot();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleSpotStatusToggle = (spotId: number, currentStatus: SpotStatus) => {
    let newStatus: SpotStatus = "available";
    if (currentStatus === "available") newStatus = "occupied";
    else if (currentStatus === "occupied") newStatus = "reserved";
    else if (currentStatus === "reserved") newStatus = "available";

    updateSpot.mutate(
      { id: spotId, data: { status: newStatus } },
      {
        onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetLotSpotsQueryKey(parseInt(selectedLotId, 10)) }),
        onError: () => toast({ title: "خطأ", description: "Failed to update spot", variant: "destructive" }),
      },
    );
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-primary mb-2">لوحة المشرف</h1>
        <p className="text-muted-foreground text-sm">Manage parking lots, bookings, users, and view analytics.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard label="إجمالي المواقف" value={stats?.totalSpots ?? 0} icon={MapIcon} loading={statsLoading} highlight />
        <StatCard label="المتاحة" value={stats?.availableSpots ?? 0} icon={ShieldCheck} loading={statsLoading} secondary />
        <StatCard label="المشغولة" value={stats?.occupiedSpots ?? 0} icon={Car} loading={statsLoading} />
        <StatCard label="الحجوزات النشطة" value={stats?.activeReservations ?? 0} icon={CalendarCheck} loading={statsLoading} />
        <StatCard label="المستخدمين" value={stats?.totalUsers ?? 0} icon={UsersIcon} loading={statsLoading} />
        <StatCard label="الإيرادات (₪)" value={stats?.totalRevenue ?? 0} icon={DollarSign} loading={statsLoading} />
      </div>

      <div className="grid lg:grid-cols-[1fr,320px] gap-6 items-start">
        <div className="min-w-0">
          <Tabs defaultValue="bookings" className="w-full">
            <TabsList className="grid w-full grid-cols-5" dir="rtl">
              <TabsTrigger value="bookings">الحجوزات</TabsTrigger>
              <TabsTrigger value="lots">المواقف</TabsTrigger>
              <TabsTrigger value="users">المستخدمين</TabsTrigger>
              <TabsTrigger value="charts">التحليلات</TabsTrigger>
              <TabsTrigger value="spots">المقاعد</TabsTrigger>
            </TabsList>

            <TabsContent value="bookings" className="mt-4">
              <BookingsTab />
            </TabsContent>

            <TabsContent value="lots" className="mt-4">
              <LotsTab />
            </TabsContent>

            <TabsContent value="users" className="mt-4">
              <UsersTab />
            </TabsContent>

            <TabsContent value="charts" className="mt-4">
              <ChartsTab />
            </TabsContent>

            <TabsContent value="spots" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>إدارة المقاعد (Spot Management)</CardTitle>
                  <CardDescription>اختر موقفاً وانقر على المقعد لتغيير حالته</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="max-w-xs">
                    <Select value={selectedLotId} onValueChange={setSelectedLotId}>
                      <SelectTrigger dir="rtl"><SelectValue placeholder="اختر الموقف" /></SelectTrigger>
                      <SelectContent dir="rtl">
                        {lots?.map((lot) => (
                          <SelectItem key={lot.id} value={lot.id.toString()}>{lot.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedLotId && spotsLoading && <Loader2 className="h-6 w-6 animate-spin text-primary" />}

                  {selectedLotId && spots && (
                    <div>
                      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-10 gap-2 mb-4">
                        {spots.map((spot) => (
                          <button
                            key={spot.id}
                            onClick={() => handleSpotStatusToggle(spot.id, spot.status)}
                            disabled={updateSpot.isPending}
                            className={`relative flex items-center justify-center h-12 rounded border font-mono text-sm font-bold transition-all ${
                              spot.status === "available"
                                ? "border-secondary/50 bg-secondary/10 text-secondary hover:bg-secondary/20"
                                : spot.status === "occupied"
                                ? "border-destructive bg-destructive/10 text-destructive hover:bg-destructive/20"
                                : "border-orange-500 bg-orange-500/10 text-orange-500 hover:bg-orange-500/20"
                            }`}
                          >
                            {spot.spotNumber}
                          </button>
                        ))}
                      </div>
                      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><div className="w-3 h-3 bg-secondary/20 border border-secondary/50"></div> متاح</span>
                        <span className="flex items-center gap-1"><div className="w-3 h-3 bg-destructive/10 border border-destructive"></div> مشغول</span>
                        <span className="flex items-center gap-1"><div className="w-3 h-3 bg-orange-500/10 border border-orange-500"></div> محجوز</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <aside className="lg:sticky lg:top-20">
          <NotificationsPanel />
        </aside>
      </div>
    </div>
  );
}

function StatCard({
  label, value, icon: Icon, loading, highlight, secondary,
}: {
  label: string; value: number; icon: any; loading?: boolean; highlight?: boolean; secondary?: boolean;
}) {
  return (
    <Card className={highlight ? "bg-primary text-primary-foreground" : secondary ? "bg-secondary text-secondary-foreground" : ""}>
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className={`text-xs font-medium ${highlight || secondary ? "text-current/80" : "text-muted-foreground"}`}>{label}</CardTitle>
        <Icon className={`h-3 w-3 ${highlight || secondary ? "text-current/60" : "text-muted-foreground"}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{loading ? "—" : typeof value === "number" ? value.toLocaleString() : value}</div>
      </CardContent>
    </Card>
  );
}
