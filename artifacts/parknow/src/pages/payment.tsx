import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { useCreateReservation } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, CreditCard, Wallet, MapPin, ShieldCheck } from "lucide-react";
import { addHours } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/hooks/use-i18n";
import { pendingBooking, completedBooking, type PendingBooking } from "@/lib/payment-storage";

type Method = "card" | "paypal" | "arrival";

function formatCardNumber(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 16);
  return digits.replace(/(.{4})/g, "$1 ").trim();
}

function formatExpiry(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 4);
  if (digits.length < 3) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

export default function Payment() {
  const { t, dir } = useTranslation();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [booking, setBooking] = useState<PendingBooking | null>(null);
  const [method, setMethod] = useState<Method>("card");
  const [cardNumber, setCardNumber] = useState("");
  const [cardHolder, setCardHolder] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [processing, setProcessing] = useState(false);

  // Pull the pending booking from sessionStorage on mount. If it's missing,
  // route the user back to the homepage to start over.
  useEffect(() => {
    const data = pendingBooking.get();
    if (!data) {
      setLocation("/");
      return;
    }
    setBooking(data);
  }, [setLocation]);

  const createReservation = useCreateReservation();

  const cardLast4 = useMemo(() => {
    const digits = cardNumber.replace(/\D/g, "");
    return digits.slice(-4).padStart(4, "•");
  }, [cardNumber]);

  const canSubmit = useMemo(() => {
    if (processing) return false;
    if (method === "arrival") return true;
    if (method === "paypal") return true;
    // card
    const digits = cardNumber.replace(/\D/g, "");
    return digits.length === 16 && cardHolder.trim().length > 1 && /^\d{2}\/\d{2}$/.test(cardExpiry) && /^\d{3,4}$/.test(cardCvv);
  }, [method, processing, cardNumber, cardHolder, cardExpiry, cardCvv]);

  const handlePay = async () => {
    if (!booking || !canSubmit) return;
    setProcessing(true);
    // Simulate payment latency for the UX (the spec asks for ~2s loading).
    await new Promise((r) => setTimeout(r, 2000));
    const now = new Date();
    const startTime = now.toISOString();
    const endTime = addHours(now, booking.durationHours).toISOString();
    createReservation.mutate(
      { data: { spotId: booking.spotId, startTime, endTime } },
      {
        onSuccess: (res) => {
          completedBooking.set({
            reservationId: res.id,
            lotName: booking.lotName,
            spotNumber: booking.spotNumber,
            durationHours: booking.durationHours,
            totalPrice: booking.totalPrice,
            paymentMethod: method,
            startTime,
            endTime,
          });
          pendingBooking.clear();
          setLocation("/payment/success");
        },
        onError: (err: any) => {
          setProcessing(false);
          toast({
            title: t("common.error"),
            description: err?.error || err?.data?.error || t("toast.genericFail"),
            variant: "destructive",
          });
        },
      },
    );
  };

  if (!booking) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-primary mb-1">{t("payment.title")}</h1>
        <p className="text-muted-foreground text-sm">{t("payment.subtitle")}</p>
      </div>

      <div className="grid lg:grid-cols-[1fr,360px] gap-6 items-start">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-secondary" />
              {t("payment.method")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={method} onValueChange={(v) => setMethod(v as Method)} dir={dir}>
              <TabsList className="grid grid-cols-3 w-full">
                <TabsTrigger value="card" data-testid="tab-method-card">
                  <CreditCard className="h-4 w-4 mx-1" /> {t("payment.methodCard")}
                </TabsTrigger>
                <TabsTrigger value="paypal" data-testid="tab-method-paypal">
                  <Wallet className="h-4 w-4 mx-1" /> {t("payment.methodPaypal")}
                </TabsTrigger>
                <TabsTrigger value="arrival" data-testid="tab-method-arrival">
                  <MapPin className="h-4 w-4 mx-1" /> {t("payment.methodArrival")}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="card" className="mt-6 space-y-6">
                {/* Animated credit card preview */}
                <div
                  className="relative h-52 w-full max-w-sm rounded-2xl text-white shadow-2xl overflow-hidden mx-auto"
                  style={{
                    background:
                      "linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary)) 60%, hsl(var(--secondary)) 140%)",
                  }}
                  data-testid="card-preview"
                  dir="ltr"
                >
                  <div className="absolute inset-0 opacity-20" style={{
                    background: "radial-gradient(circle at 80% 20%, white 0%, transparent 50%)",
                  }} />
                  <div className="relative z-10 p-6 h-full flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <div className="text-xs uppercase opacity-80">ParkNow Bank</div>
                      <div className="h-8 w-12 rounded-md bg-yellow-400/80" aria-hidden />
                    </div>
                    <div className="font-mono text-xl tracking-[0.25em] transition-all duration-300">
                      {(formatCardNumber(cardNumber) || "•••• •••• •••• ••••").padEnd(19, "•")}
                    </div>
                    <div className="flex items-end justify-between">
                      <div>
                        <div className="text-[10px] uppercase opacity-70">{t("payment.cardHolder")}</div>
                        <div className="font-semibold text-sm uppercase tracking-wider transition-all duration-300">
                          {cardHolder || "—"}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] uppercase opacity-70">{t("payment.cardExpiry")}</div>
                        <div className="font-mono text-sm transition-all duration-300">{cardExpiry || "MM/YY"}</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="card-number">{t("payment.cardNumber")}</Label>
                    <Input
                      id="card-number"
                      data-testid="input-card-number"
                      value={formatCardNumber(cardNumber)}
                      onChange={(e) => setCardNumber(e.target.value)}
                      placeholder={t("payment.cardNumberPlaceholder")}
                      dir="ltr"
                      className="text-left font-mono tracking-widest"
                      inputMode="numeric"
                      autoComplete="cc-number"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="card-holder">{t("payment.cardHolder")}</Label>
                    <Input
                      id="card-holder"
                      data-testid="input-card-holder"
                      value={cardHolder}
                      onChange={(e) => setCardHolder(e.target.value.toUpperCase())}
                      placeholder={t("payment.cardHolderPlaceholder")}
                      dir="ltr"
                      className="text-left uppercase"
                      autoComplete="cc-name"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="card-expiry">{t("payment.cardExpiry")}</Label>
                      <Input
                        id="card-expiry"
                        data-testid="input-card-expiry"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                        placeholder={t("payment.cardExpiryPlaceholder")}
                        dir="ltr"
                        className="text-left font-mono"
                        inputMode="numeric"
                        autoComplete="cc-exp"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="card-cvv">{t("payment.cardCvv")}</Label>
                      <Input
                        id="card-cvv"
                        data-testid="input-card-cvv"
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
                        placeholder={t("payment.cardCvvPlaceholder")}
                        dir="ltr"
                        className="text-left font-mono"
                        type="password"
                        autoComplete="cc-csc"
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="paypal" className="mt-6 space-y-6">
                <div className="rounded-lg border-2 border-dashed border-primary/20 bg-primary/5 p-8 text-center space-y-4">
                  <div className="inline-flex items-center gap-2 text-3xl font-extrabold">
                    <span className="text-[#003087]">Pay</span>
                    <span className="text-[#009cde]">Pal</span>
                  </div>
                  <p className="text-sm text-muted-foreground max-w-md mx-auto">{t("payment.methodPaypalDesc")}</p>
                </div>
              </TabsContent>

              <TabsContent value="arrival" className="mt-6 space-y-6">
                <div className="rounded-lg border-2 border-dashed border-secondary/30 bg-secondary/5 p-8 text-center space-y-4">
                  <Wallet className="h-12 w-12 text-secondary mx-auto" />
                  <p className="text-sm text-muted-foreground max-w-md mx-auto">{t("payment.methodArrivalDesc")}</p>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter className="flex flex-col sm:flex-row gap-3 justify-between border-t pt-4">
            <Button variant="ghost" onClick={() => setLocation(`/book/${booking.lotId}`)} disabled={processing} data-testid="button-back-to-booking">
              {t("payment.backToBooking")}
            </Button>
            <Button
              size="lg"
              onClick={handlePay}
              disabled={!canSubmit}
              className="min-w-[180px]"
              data-testid="button-pay-now"
            >
              {processing && <Loader2 className="h-4 w-4 animate-spin mx-2" />}
              {processing ? t("payment.processing") : `${t("payment.payNowAmount")} — ${booking.totalPrice} ${t("common.currency")}`}
            </Button>
          </CardFooter>
        </Card>

        {/* Right column: booking summary */}
        <Card className="lg:sticky lg:top-20">
          <CardHeader>
            <CardTitle>{t("payment.summary")}</CardTitle>
            <CardDescription>{`${t("payment.reservationLabel")}${booking.spotId}`}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <SummaryRow label={t("payment.lotName")} value={booking.lotName} />
            <SummaryRow label={t("payment.spotLabel")} value={booking.spotNumber} mono />
            <SummaryRow label={t("payment.duration")} value={`${booking.durationHours} ${t("book.durationSuffix")}`} />
            <div className="pt-3 border-t flex justify-between items-baseline">
              <span className="text-muted-foreground">{t("payment.total")}</span>
              <span className="text-2xl font-bold text-primary" data-testid="text-total-price">
                {booking.totalPrice} {t("common.currency")}
              </span>
            </div>
          </CardContent>
          <CardFooter className="text-[10px] text-muted-foreground border-t pt-3 leading-relaxed">
            <span>** {cardLast4 ? "" : ""}</span>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

function SummaryRow({ label, value, mono }: { label: string; value: string | number; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-medium text-right ${mono ? "font-mono" : ""}`}>{value}</span>
    </div>
  );
}
