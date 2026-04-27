import { useEffect, useState } from "react";
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
import { arSA } from "date-fns/locale";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { StarRating } from "@/components/star-rating";
import QRCode from "qrcode";

export default function MyBookings() {
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
        toast({ title: "تم الإلغاء", description: "Reservation cancelled" });
        queryClient.invalidateQueries({ queryKey: getGetReservationsQueryKey() });
      },
      onError: (err: any) => toast({ title: "خطأ", description: err.error || "Failed", variant: "destructive" }),
    },
  });

  const rateMutation = useRateReservation({
    mutation: {
      onSuccess: () => {
        toast({ title: "شكراً!", description: "تم حفظ تقييمك" });
        setRateFor(null);
        setStars(5);
        setComment("");
        queryClient.invalidateQueries({ queryKey: getGetReservationsQueryKey() });
      },
      onError: (err: any) => toast({ title: "خطأ", description: err.error || "Failed", variant: "destructive" }),
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
        return <Badge className="bg-secondary">نشط</Badge>;
      case "completed":
        return <Badge variant="outline" className="text-muted-foreground">مكتمل</Badge>;
      case "cancelled":
        return <Badge variant="destructive">ملغي</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <h1 className="text-2xl md:text-3xl font-bold text-primary mb-6 border-b pb-3">حجوزاتي (My Bookings)</h1>

      {reservations?.length === 0 ? (
        <div className="text-center py-16 bg-muted/30 rounded-lg border border-dashed">
          <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h3 className="text-xl font-semibold mb-2">لا توجد حجوزات</h3>
          <p className="text-muted-foreground">You don't have any bookings yet.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {reservations?.map((res) => (
            <Card key={res.id} className={res.status === "cancelled" ? "opacity-70" : ""}>
              <CardHeader className="pb-3 flex flex-row items-start justify-between space-y-0 gap-2">
                <div className="min-w-0 flex-1">
                  <CardTitle className="text-lg md:text-xl mb-1 truncate">{res.lotName}</CardTitle>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <MapPin className="h-3 w-3 ml-1 flex-shrink-0" />
                    <span className="truncate">{res.lotLocation}</span>
                  </div>
                </div>
                {getStatusBadge(res.status)}
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-muted rounded-md">
                  <div className="text-sm font-medium">الموقف</div>
                  <div className="text-xl font-mono font-bold text-primary">{res.spotNumber}</div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="space-y-1">
                    <div className="flex items-center text-muted-foreground">
                      <Clock className="h-3 w-3 ml-1" /> البداية
                    </div>
                    <div className="font-medium" dir="ltr">
                      {format(parseISO(res.startTime), "PP p", { locale: arSA })}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center text-muted-foreground">
                      <Clock className="h-3 w-3 ml-1" /> النهاية
                    </div>
                    <div className="font-medium" dir="ltr">
                      {format(parseISO(res.endTime), "PP p", { locale: arSA })}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm border-t pt-3">
                  <span className="text-muted-foreground">الإجمالي المدفوع</span>
                  <span className="font-bold text-lg text-primary">{res.totalPrice ?? 0} ₪</span>
                </div>
              </CardContent>
              <CardFooter className="flex flex-wrap gap-2 pt-4 border-t bg-muted/10">
                <Button variant="outline" size="sm" className="flex-1 min-w-[100px]" onClick={() => showQr(res)}>
                  <QrCode className="ml-2 h-4 w-4" /> QR
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 min-w-[100px]"
                  onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${res.lotLat},${res.lotLng}`, "_blank")}
                >
                  <Navigation className="ml-2 h-4 w-4" /> الاتجاهات
                </Button>
                {res.status === "active" && (
                  <Button
                    variant="destructive"
                    size="sm"
                    className="flex-1 min-w-[100px]"
                    disabled={cancelMutation.isPending}
                    onClick={() => cancelMutation.mutate({ id: res.id })}
                  >
                    {cancelMutation.isPending && <Loader2 className="ml-2 h-3 w-3 animate-spin" />}
                    إلغاء
                  </Button>
                )}
                {(res.status === "completed" || res.status === "active") && (
                  <Button variant="ghost" size="sm" className="flex-1 min-w-[100px] text-yellow-600" onClick={() => setRateFor(res.id)}>
                    <Star className="ml-2 h-4 w-4" /> قيّم
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!qrFor} onOpenChange={(o) => !o && setQrFor(null)}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>رمز الحجز #{qrFor?.id}</DialogTitle>
          </DialogHeader>
          {qrFor && (
            <div className="flex justify-center p-4">
              <img src={qrFor.code} alt="QR Code" className="rounded border" />
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setQrFor(null)}>إغلاق</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={rateFor != null} onOpenChange={(o) => !o && setRateFor(null)}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>قيّم تجربتك</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="flex justify-center">
              <StarRating value={stars} onChange={setStars} size="lg" />
            </div>
            <Textarea
              placeholder="تعليقك (اختياري)..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRateFor(null)}>
              إلغاء
            </Button>
            <Button
              onClick={() => rateFor && rateMutation.mutate({ id: rateFor, data: { stars, comment: comment || null } })}
              disabled={rateMutation.isPending}
            >
              {rateMutation.isPending && <Loader2 className="ml-2 h-3 w-3 animate-spin" />}
              إرسال التقييم
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
