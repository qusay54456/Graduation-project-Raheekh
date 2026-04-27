import { useState } from "react";
import {
  useGetReservations,
  useCancelReservation,
  getGetReservationsQueryKey,
  useRateReservation,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, MapPin, Calendar, Clock, Navigation, QrCode, Star } from "lucide-react";
import { format, parseISO } from "date-fns";
import { arSA, enUS } from "date-fns/locale";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/hooks/use-i18n";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { StarRating } from "@/components/star-rating";
import QRCode from "qrcode";

export default function MyBookings() {
  const { t, dir, lang } = useTranslation();
  const dateLocale = lang === "en" ? enUS : arSA;
  const { data: reservations, isLoading } = useGetReservations();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [qrFor, setQrFor] = useState<{ id: number; code: string } | null>(null);
  const [rateFor, setRateFor] = useState<number | null>(null);
  const [stars, setStars] = useState(5);
  const [comment, setComment] = useState("");

  const cancelMutation = useCancelReservation({
    mutation: {
      onSuccess: () => {
        toast({ title: t("toast.cancelSuccess"), description: t("toast.cancelSuccess") });
        queryClient.invalidateQueries({ queryKey: getGetReservationsQueryKey() });
      },
      onError: (err: any) =>
        toast({ title: t("common.error"), description: err?.error || t("toast.genericFail"), variant: "destructive" }),
    },
  });

  const rateMutation = useRateReservation({
    mutation: {
      onSuccess: () => {
        toast({ title: t("rating.thanks"), description: t("rating.thanksDesc") });
        setRateFor(null);
        setStars(5);
        setComment("");
        queryClient.invalidateQueries({ queryKey: getGetReservationsQueryKey() });
      },
      onError: (err: any) =>
        toast({ title: t("common.error"), description: err?.error || t("toast.genericFail"), variant: "destructive" }),
    },
  });

  const showQr = async (res: any) => {
    const payload = JSON.stringify({ id: res.id, lot: res.lotName, spot: res.spotNumber, start: res.startTime });
    const code = await QRCode.toDataURL(payload, { width: 280, margin: 2 });
    setQrFor({ id: res.id, code });
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-secondary">{t("bookings.statusActive")}</Badge>;
      case "completed":
        return (
          <Badge variant="outline" className="text-muted-foreground">
            {t("bookings.statusCompleted")}
          </Badge>
        );
      case "cancelled":
        return <Badge variant="destructive">{t("bookings.statusCancelled")}</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <h1 className="text-2xl md:text-3xl font-bold text-primary mb-6 border-b pb-3">{t("bookings.title")}</h1>

      {reservations?.length === 0 ? (
        <div className="text-center py-16 bg-muted/30 rounded-lg border border-dashed" data-testid="empty-bookings">
          <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h3 className="text-xl font-semibold mb-2">{t("bookings.empty")}</h3>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {reservations?.map((res) => (
            <Card key={res.id} className={res.status === "cancelled" ? "opacity-70" : ""} data-testid={`card-reservation-${res.id}`}>
              <CardHeader className="pb-3 flex flex-row items-start justify-between space-y-0 gap-2">
                <div className="min-w-0 flex-1">
                  <CardTitle className="text-lg md:text-xl mb-1 truncate">{res.lotName}</CardTitle>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <MapPin className="h-3 w-3 me-1 flex-shrink-0" />
                    <span className="truncate">{res.lotLocation}</span>
                  </div>
                </div>
                {getStatusBadge(res.status)}
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-muted rounded-md">
                  <div className="text-sm font-medium">{t("bookings.spot")}</div>
                  <div className="text-xl font-mono font-bold text-primary">{res.spotNumber}</div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="space-y-1">
                    <div className="flex items-center text-muted-foreground">
                      <Clock className="h-3 w-3 me-1" /> {t("bookings.start")}
                    </div>
                    <div className="font-medium" dir="ltr">
                      {format(parseISO(res.startTime), "PP p", { locale: dateLocale })}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center text-muted-foreground">
                      <Clock className="h-3 w-3 me-1" /> {t("bookings.end")}
                    </div>
                    <div className="font-medium" dir="ltr">
                      {format(parseISO(res.endTime), "PP p", { locale: dateLocale })}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm border-t pt-3">
                  <span className="text-muted-foreground">{t("bookings.paid")}</span>
                  <span className="font-bold text-lg text-primary">
                    {res.totalPrice ?? 0} {t("common.currency")}
                  </span>
                </div>
              </CardContent>
              <CardFooter className="flex flex-wrap gap-2 pt-4 border-t bg-muted/10">
                <Button variant="outline" size="sm" className="flex-1 min-w-[100px]" onClick={() => showQr(res)} data-testid={`button-qr-${res.id}`}>
                  <QrCode className="me-2 h-4 w-4" /> {t("bookings.qr")}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 min-w-[100px]"
                  onClick={() =>
                    window.open(`https://www.google.com/maps/dir/?api=1&destination=${res.lotLat},${res.lotLng}`, "_blank")
                  }
                  data-testid={`button-directions-${res.id}`}
                >
                  <Navigation className="me-2 h-4 w-4" /> {t("bookings.directions")}
                </Button>
                {res.status === "active" && (
                  <Button
                    variant="destructive"
                    size="sm"
                    className="flex-1 min-w-[100px]"
                    disabled={cancelMutation.isPending}
                    onClick={() => cancelMutation.mutate({ id: res.id })}
                    data-testid={`button-cancel-${res.id}`}
                  >
                    {cancelMutation.isPending && <Loader2 className="me-2 h-3 w-3 animate-spin" />}
                    {t("bookings.cancel")}
                  </Button>
                )}
                {(res.status === "completed" || res.status === "active") && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex-1 min-w-[100px] text-yellow-600"
                    onClick={() => setRateFor(res.id)}
                    data-testid={`button-rate-${res.id}`}
                  >
                    <Star className="me-2 h-4 w-4" /> {t("bookings.rate")}
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!qrFor} onOpenChange={(o) => !o && setQrFor(null)}>
        <DialogContent dir={dir}>
          <DialogHeader>
            <DialogTitle>
              {t("bookings.qrTitle")}
              {qrFor?.id}
            </DialogTitle>
          </DialogHeader>
          {qrFor && (
            <div className="flex justify-center p-4">
              <img src={qrFor.code} alt="QR Code" className="rounded border" />
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setQrFor(null)}>{t("common.close")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={rateFor != null} onOpenChange={(o) => !o && setRateFor(null)}>
        <DialogContent dir={dir}>
          <DialogHeader>
            <DialogTitle>{t("rating.title")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="flex justify-center">
              <StarRating value={stars} onChange={setStars} size="lg" />
            </div>
            <Textarea
              placeholder={t("rating.commentPlaceholder")}
              value={comment}
              onChange={(e) => setComment(e.target.value.slice(0, 200))}
              rows={3}
              maxLength={200}
              data-testid="textarea-rating-comment"
            />
            <div className="text-xs text-muted-foreground text-right">{comment.length} / 200</div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRateFor(null)}>
              {t("common.cancel")}
            </Button>
            <Button
              onClick={() => rateFor && rateMutation.mutate({ id: rateFor, data: { stars, comment: comment || null } })}
              disabled={rateMutation.isPending}
              data-testid="button-submit-rating"
            >
              {rateMutation.isPending && <Loader2 className="me-2 h-3 w-3 animate-spin" />}
              {t("rating.submit")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
