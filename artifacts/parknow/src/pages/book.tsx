import { useState, useMemo } from "react";
import { useRoute, useLocation } from "wouter";
import {
  useGetLot,
  getGetLotQueryKey,
  useGetLotSpots,
  useCreateReservation,
  getGetLotSpotsQueryKey,
  useGetLotRatings,
  getGetLotRatingsQueryKey,
} from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Loader2, MapPin, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { addHours } from "date-fns";
import { StarRating } from "@/components/star-rating";

export default function Book() {
  const [, params] = useRoute("/book/:id");
  const lotId = params?.id ? parseInt(params.id, 10) : 0;
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [selectedSpotId, setSelectedSpotId] = useState<number | null>(null);
  const [durationHours, setDurationHours] = useState<string>("1");

  const { data: lot, isLoading: lotLoading } = useGetLot(lotId, {
    query: { enabled: !!lotId, queryKey: getGetLotQueryKey(lotId) },
  });

  const { data: spots, isLoading: spotsLoading } = useGetLotSpots(lotId, {
    query: { enabled: !!lotId, queryKey: getGetLotSpotsQueryKey(lotId) },
  });

  const { data: ratings } = useGetLotRatings(lotId, {
    query: { enabled: !!lotId, queryKey: getGetLotRatingsQueryKey(lotId) },
  });

  const createReservation = useCreateReservation({
    mutation: {
      onSuccess: () => {
        toast({ title: "تم الحجز بنجاح", description: "Reservation created successfully" });
        setLocation("/my-bookings");
      },
      onError: (err: any) => {
        toast({ title: "خطأ في الحجز", description: err.error || "Failed to create reservation", variant: "destructive" });
      },
    },
  });

  const totalPrice = useMemo(() => {
    if (!lot) return 0;
    return Math.round(parseInt(durationHours, 10) * lot.pricePerHour * 100) / 100;
  }, [durationHours, lot]);

  const handleBook = () => {
    if (!selectedSpotId) return;
    const now = new Date();
    const startTime = now.toISOString();
    const endTime = addHours(now, parseInt(durationHours, 10)).toISOString();
    createReservation.mutate({ data: { spotId: selectedSpotId, startTime, endTime } });
  };

  if (lotLoading || spotsLoading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!lot) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h2 className="text-2xl font-bold">الموقف غير موجود</h2>
        <Button className="mt-4" onClick={() => setLocation("/")}>العودة للرئيسية</Button>
      </div>
    );
  }

  if (!lot.isActive) {
    return (
      <div className="container mx-auto px-4 py-8 text-center max-w-md">
        <h2 className="text-2xl font-bold">هذا الموقف غير متاح حالياً</h2>
        <p className="text-muted-foreground my-4">This lot is currently inactive.</p>
        <Button onClick={() => setLocation("/")}>العودة للرئيسية</Button>
      </div>
    );
  }

  const selectedSpot = spots?.find((s) => s.id === selectedSpotId);

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-primary mb-2">{lot.name}</h1>
        <div className="flex flex-wrap items-center gap-3 text-muted-foreground">
          <div className="flex items-center text-sm">
            <MapPin className="h-4 w-4 ml-1" />
            {lot.location}
          </div>
          <div className="text-sm font-bold text-primary">{lot.pricePerHour} ₪/ساعة</div>
          <StarRating value={lot.avgRating} count={lot.ratingCount} showValue size="sm" />
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>اختر الموقف (Select a Spot)</CardTitle>
              <CardDescription>المواقف الخضراء متاحة للحجز</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
                {spots?.map((spot) => (
                  <button
                    key={spot.id}
                    disabled={spot.status !== "available"}
                    onClick={() => setSelectedSpotId(spot.id)}
                    className={`relative flex items-center justify-center h-16 rounded-md border-2 font-mono text-lg font-bold transition-all ${
                      spot.status === "available"
                        ? selectedSpotId === spot.id
                          ? "border-primary bg-primary text-primary-foreground shadow-md scale-105"
                          : "border-secondary/50 bg-secondary/10 text-secondary hover:border-secondary hover:bg-secondary/20 cursor-pointer"
                        : "border-destructive/30 bg-destructive/10 text-destructive/50 cursor-not-allowed"
                    }`}
                  >
                    {spot.spotNumber}
                    {selectedSpotId === spot.id && (
                      <CheckCircle2 className="absolute -top-2 -right-2 h-5 w-5 text-primary bg-background rounded-full" />
                    )}
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap items-center justify-center gap-4 mt-8 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-secondary/20 border-2 border-secondary/50"></div>
                  <span>متاح</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-primary border-2 border-primary"></div>
                  <span>محدد</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-destructive/10 border-2 border-destructive/30"></div>
                  <span>محجوز</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {ratings && ratings.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>التقييمات (Reviews)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {ratings.slice(0, 5).map((r) => (
                  <div key={r.id} className="border-b last:border-0 pb-3 last:pb-0">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-medium text-sm">{r.userName}</span>
                      <StarRating value={r.stars} size="sm" />
                    </div>
                    {r.comment && <p className="text-sm text-muted-foreground">{r.comment}</p>}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-4">
          <Card className="md:sticky md:top-20">
            <CardHeader>
              <CardTitle>تفاصيل الحجز</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>الموقف المحدد</Label>
                <div className="text-2xl font-mono font-bold text-primary bg-muted p-3 rounded-md text-center">
                  {selectedSpot ? selectedSpot.spotNumber : "---"}
                </div>
              </div>

              <div className="space-y-2">
                <Label>المدة (Duration)</Label>
                <Select value={durationHours} onValueChange={setDurationHours}>
                  <SelectTrigger dir="rtl">
                    <SelectValue placeholder="اختر المدة" />
                  </SelectTrigger>
                  <SelectContent dir="rtl">
                    <SelectItem value="1">ساعة واحدة</SelectItem>
                    <SelectItem value="2">ساعتان</SelectItem>
                    <SelectItem value="3">3 ساعات</SelectItem>
                    <SelectItem value="4">4 ساعات</SelectItem>
                    <SelectItem value="6">6 ساعات</SelectItem>
                    <SelectItem value="12">نصف يوم</SelectItem>
                    <SelectItem value="24">يوم كامل</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="border-t pt-4 space-y-1">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>السعر بالساعة</span>
                  <span>{lot.pricePerHour} ₪</span>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>المدة</span>
                  <span>{durationHours} ساعة</span>
                </div>
                <div className="flex justify-between text-lg font-bold text-primary pt-2">
                  <span>الإجمالي</span>
                  <span>{totalPrice} ₪</span>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full" size="lg" disabled={!selectedSpotId || createReservation.isPending} onClick={handleBook}>
                {createReservation.isPending && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                تأكيد الحجز
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
