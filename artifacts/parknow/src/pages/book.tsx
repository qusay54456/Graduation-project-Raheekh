import { useMemo, useState } from "react";
import { useRoute, useLocation } from "wouter";
import {
  useGetLot,
  getGetLotQueryKey,
  useGetLotSpots,
  getGetLotSpotsQueryKey,
  useGetLotRatings,
  getGetLotRatingsQueryKey,
} from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Loader2, MapPin, CheckCircle2, ArrowRight } from "lucide-react";
import { StarRating } from "@/components/star-rating";
import { useTranslation } from "@/hooks/use-i18n";
import { pendingBooking } from "@/lib/payment-storage";

export default function Book() {
  const [, params] = useRoute("/book/:id");
  const lotId = params?.id ? parseInt(params.id, 10) : 0;
  const [, setLocation] = useLocation();
  const { t, lang, dir } = useTranslation();

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

  const totalPrice = useMemo(() => {
    if (!lot) return 0;
    return Math.round(parseInt(durationHours, 10) * lot.pricePerHour * 100) / 100;
  }, [durationHours, lot]);

  const handleProceedToPayment = () => {
    if (!selectedSpotId || !lot) return;
    const selectedSpot = spots?.find((s) => s.id === selectedSpotId);
    if (!selectedSpot) return;
    pendingBooking.set({
      lotId: lot.id,
      lotName: lot.name,
      lotLocation: lot.location,
      spotId: selectedSpotId,
      spotNumber: selectedSpot.spotNumber,
      durationHours: parseInt(durationHours, 10),
      pricePerHour: lot.pricePerHour,
      totalPrice,
    });
    setLocation("/payment");
  };

  const openInGoogleMaps = () => {
    if (lot?.latitude && lot?.longitude) {
      window.open(`https://www.google.com/maps/search/?api=1&query=${lot.latitude},${lot.longitude}`, "_blank");
    }
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
        <h2 className="text-2xl font-bold">{t("book.notFound")}</h2>
        <Button className="mt-4" onClick={() => setLocation("/")}>{t("book.backHome")}</Button>
      </div>
    );
  }

  if (!lot.isActive) {
    return (
      <div className="container mx-auto px-4 py-8 text-center max-w-md">
        <h2 className="text-2xl font-bold">{t("book.inactive")}</h2>
        <p className="text-muted-foreground my-4">{t("book.inactiveDesc")}</p>
        <Button onClick={() => setLocation("/")}>{t("book.backHome")}</Button>
      </div>
    );
  }

  const selectedSpot = spots?.find((s) => s.id === selectedSpotId);

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl" dir={dir}>
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-primary mb-2">{lot.name}</h1>
        <div className="flex flex-wrap items-center gap-3 text-muted-foreground">
          <div className="flex items-center text-sm">
            <MapPin className="h-4 w-4 me-1" />
            {lot.location}
          </div>
          <div className="text-sm font-bold text-primary">
            {lot.pricePerHour} {t("common.currency")}{t("home.perHour")}
          </div>
          <StarRating value={lot.avgRating} count={lot.ratingCount} showValue size="sm" />
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t("book.spotInfo")}</CardTitle>
              <CardDescription>{t("book.spotInfoDesc")}</CardDescription>
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
            </CardContent>
          </Card>

          {ratings && ratings.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>{t("book.reviews")}</CardTitle>
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
          <Card className="md:sticky md:top-20 shadow-lg border-primary/20">
            <CardHeader>
              <CardTitle>{t("book.summary")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>{t("book.selectedSpot")}</Label>
                <div className="text-2xl font-mono font-bold text-primary bg-muted p-3 rounded-md text-center">
                  {selectedSpot ? selectedSpot.spotNumber : "---"}
                </div>
              </div>

              <div className="space-y-2">
                <Label>{t("book.durationLabel")}</Label>
                <Select value={durationHours} onValueChange={setDurationHours}>
                  <SelectTrigger dir={dir}>
                    <SelectValue placeholder={t("book.durationPlaceholder")} />
                  </SelectTrigger>
                  <SelectContent dir={dir}>
                    <SelectItem value="1">{t("book.duration1")}</SelectItem>
                    <SelectItem value="2">{t("book.duration2")}</SelectItem>
                    <SelectItem value="3">{t("book.duration3")}</SelectItem>
                    <SelectItem value="4">{t("book.duration4")}</SelectItem>
                    <SelectItem value="6">{t("book.duration6")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="border-t pt-4 space-y-1">
                <div className="flex justify-between text-lg font-bold text-primary pt-2">
                  <span>{t("book.total")}</span>
                  <span>{totalPrice} {t("common.currency")}</span>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-3">
              <Button 
                variant="outline" 
                className="w-full gap-2 border-primary text-primary hover:bg-primary/5"
                onClick={openInGoogleMaps}
              >
                <MapPin className="h-4 w-4" />
                {lang === "ar" ? "عرض الموقع الجغرافي" : "View Location on Map"}
              </Button>

              <Button
                className="w-full"
                size="lg"
                disabled={!selectedSpotId}
                onClick={handleProceedToPayment}
              >
                {t("book.bookButton")}
                <ArrowRight className="h-4 w-4 mx-2 rtl:rotate-180" />
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}