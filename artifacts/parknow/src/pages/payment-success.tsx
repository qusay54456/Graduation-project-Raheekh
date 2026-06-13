import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Wallet, ListChecks, Loader2, MapPin } from "lucide-react"; // أضفنا MapPin
import QRCode from "qrcode";
import { useTranslation } from "@/hooks/use-i18n";
import { useToast } from "@/hooks/use-toast";
import { completedBooking, type CompletedBooking } from "@/lib/payment-storage";

export default function PaymentSuccess() {
  const { t, lang } = useTranslation(); // أضفنا lang لمعرفة اللغة
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [booking, setBooking] = useState<CompletedBooking | null>(null);
  const [qrSrc, setQrSrc] = useState<string | null>(null);
  const [showCheck, setShowCheck] = useState(false);

  useEffect(() => {
    const data = completedBooking.get();
    if (!data) {
      setLocation("/");
      return;
    }
    setBooking(data);
    requestAnimationFrame(() => setShowCheck(true));
    QRCode.toDataURL(
      JSON.stringify({ id: data.reservationId, lot: data.lotName, spot: data.spotNumber, start: data.startTime }),
      { width: 280, margin: 2, color: { dark: "#1a2b4a", light: "#ffffff" } },
    ).then(setQrSrc).catch(() => undefined);
  }, [setLocation]);

  // دالة فتح الموقع الجغرافي
  const handleNavigate = () => {
    if (booking?.lat && booking?.lng) {
      window.open(`https://www.google.com/maps/search/?api=1&query=${booking.lat},${booking.lng}`, "_blank");
    } else {
      // إذا لم تتوفر الإحداثيات نفتح بحثاً باسم الموقف
      window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(booking?.lotName || "")}`, "_blank");
    }
  };

  if (!booking) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const handleAddToWallet = () => {
    toast({ title: t("payment.addToWallet"), description: t("payment.walletNotice") });
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-2xl">
      <Card className="border-secondary/30 shadow-2xl">
        <CardContent className="pt-10 pb-8 px-6 text-center space-y-6">
          {/*Animated checkmark */}
          <div className="flex justify-center">
            <div className={`relative h-24 w-24 rounded-full flex items-center justify-center transition-all duration-700 ${
                showCheck ? "bg-secondary/15 scale-100" : "bg-secondary/5 scale-50"
              }`}>
              <span className={`absolute inset-0 rounded-full bg-secondary/20 ${showCheck ? "animate-ping" : ""}`}
                style={{ animationIterationCount: 1, animationDuration: "1s" }} />
              <CheckCircle2 className={`h-16 w-16 text-secondary transition-all duration-500 ${
                  showCheck ? "opacity-100 scale-100 rotate-0" : "opacity-0 scale-50 -rotate-45"
                }`} strokeWidth={2.5} />
            </div>
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl md:text-3xl font-bold text-primary">
              {t("payment.successTitle")}
            </h1>
            <p className="text-muted-foreground text-sm">{t("payment.successDesc")}</p>
          </div>

          <div className="inline-block bg-muted rounded-lg px-6 py-3">
            <div className="text-xs text-muted-foreground uppercase tracking-wider">
              {t("payment.confirmation")}
            </div>
            <div className="text-3xl font-mono font-bold text-primary mt-1">
              #{String(booking.reservationId).padStart(6, "0")}
            </div>
          </div>

          {qrSrc && (
            <div className="flex flex-col items-center gap-2">
              <img src={qrSrc} alt="QR" className="rounded-lg border-4 border-card shadow-md" width={220} height={220} />
              <p className="text-xs text-muted-foreground">{t("payment.qrCaption")}</p>
            </div>
          )}

          <div className="rounded-lg bg-muted/40 px-4 py-3 text-sm space-y-1 max-w-sm mx-auto text-left rtl:text-right">
            <SummaryLine label={t("payment.lotName")} value={booking.lotName} />
            <SummaryLine label={t("payment.spotLabel")} value={booking.spotNumber} mono />
            <SummaryLine label={t("payment.duration")} value={`${booking.durationHours} ${t("book.durationSuffix")}`} />
            <SummaryLine label={t("payment.total")} value={`${booking.totalPrice} ${t("common.currency")}`} bold />
          </div>

          {/* Action buttons المحدثة بالزر الجديد */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            {/* زر الذهاب للموقف الجديد */}
            <Button onClick={handleNavigate} className="w-full bg-primary hover:bg-primary/90 text-white gap-2">
              <MapPin className="h-4 w-4" />
              {lang === "ar" ? "انقر للذهاب للموقف" : "Navigate to Spot"}
            </Button>
            
            <Button onClick={() => setLocation("/my-bookings")} variant="secondary" className="w-full gap-2">
              <ListChecks className="h-4 w-4" /> {t("payment.viewBookings")}
            </Button>

            <Button onClick={handleAddToWallet} variant="outline" className="w-full sm:col-span-2 gap-2">
              <Wallet className="h-4 w-4" /> {t("payment.addToWallet")}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function SummaryLine({ label, value, mono, bold }: { label: string; value: string; mono?: boolean; bold?: boolean; }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className={`${mono ? "font-mono" : ""} ${bold ? "font-bold text-primary" : ""}`}>{value}</span>
    </div>
  );
}