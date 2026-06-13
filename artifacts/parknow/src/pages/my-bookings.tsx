import { useQueryClient } from "@tanstack/react-query";
import { useGetReservations, useCancelReservation, getGetReservationsQueryKey } from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { useTranslation } from "@/hooks/use-i18n";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, MapPin, AlertCircle, ExternalLink, X } from "lucide-react";
import { format } from "date-fns";
import { ar, enUS } from "date-fns/locale";

export default function MyBookings() {
  const { lang, dir } = useTranslation();
  const dateLocale = lang === "ar" ? ar : enUS;
  const queryClient = useQueryClient();

  const { data: reservations, isLoading } = useGetReservations();

  const cancelMutation = useCancelReservation({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetReservationsQueryKey() });
      },
    },
  });

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  const reservationsArray = Array.isArray(reservations) ? reservations : [];

  const openInGoogleMaps = (lat: number, lng: number) => {
    window.open(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`, "_blank");
  };

  const getStatusLabel = (status: string) => {
    if (status === "active") return lang === "ar" ? "نشط" : "Active";
    if (status === "confirmed") return lang === "ar" ? "مؤكد" : "Confirmed";
    if (status === "cancelled") return lang === "ar" ? "ملغي" : "Cancelled";
    return status;
  };

  const getStatusVariant = (status: string): "default" | "destructive" | "secondary" => {
    if (status === "active" || status === "confirmed") return "default";
    if (status === "cancelled") return "destructive";
    return "secondary";
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8" dir={dir}>
        <h1 className="text-3xl font-bold mb-8">
          {lang === "ar" ? "حجوزاتي" : "My Bookings"}
        </h1>

        {reservationsArray.length === 0 ? (
          <Card className="bg-muted/50 border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-xl font-medium text-muted-foreground">
                {lang === "ar" ? "لا توجد حجوزات حالية" : "No active bookings found"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {reservationsArray.map((res) => (
              <Card
                key={res.id}
                className={`overflow-hidden ${res.status === "cancelled" ? "opacity-60" : "border-primary/20 shadow-md"}`}
              >
                <CardHeader className="pb-3 flex flex-row items-start justify-between space-y-0 gap-2 bg-primary/5">
                  <div className="space-y-1">
                    <CardTitle className="text-xl font-bold text-primary">
                      {res.lotName || (lang === "ar" ? "موقف غير معروف" : "Unknown Lot")}
                    </CardTitle>
                    <div className="flex items-center text-sm text-muted-foreground gap-1">
                      <MapPin className="h-3 w-3" />
                      {res.lotLocation}
                    </div>
                  </div>
                  <Badge variant={getStatusVariant(res.status)}>
                    {getStatusLabel(res.status)}
                  </Badge>
                </CardHeader>

                <CardContent className="py-4 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex items-center text-sm gap-2">
                      <Calendar className="h-4 w-4 text-primary" />
                      <span className="font-medium">
                        {format(new Date(res.startTime), "PPP", { locale: dateLocale })}
                      </span>
                    </div>
                    <div className="flex items-center text-sm gap-2">
                      <Clock className="h-4 w-4 text-primary" />
                      <span className="font-medium">
                        {format(new Date(res.startTime), "p")} - {format(new Date(res.endTime), "p")}
                      </span>
                    </div>
                  </div>

                  <div className="p-3 bg-muted rounded-md flex justify-between items-center">
                    <div className="space-y-1">
                      <p className="text-sm font-semibold">
                        {lang === "ar" ? "رقم الموقف:" : "Spot:"} {res.spotNumber}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {lang === "ar" ? "السعر:" : "Price:"}{" "}
                        <span className="font-bold text-primary">{res.totalPrice} ₪</span>
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1"
                        onClick={() => openInGoogleMaps(res.lotLat, res.lotLng)}
                      >
                        <ExternalLink className="h-4 w-4" />
                        {lang === "ar" ? "الموقع" : "Map"}
                      </Button>

                      {res.status !== "cancelled" && (
                        <Button
                          size="sm"
                          variant="destructive"
                          className="gap-1"
                          onClick={() => cancelMutation.mutate({ id: res.id })}
                          disabled={cancelMutation.isPending}
                        >
                          <X className="h-4 w-4" />
                          {lang === "ar" ? "إلغاء" : "Cancel"}
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}