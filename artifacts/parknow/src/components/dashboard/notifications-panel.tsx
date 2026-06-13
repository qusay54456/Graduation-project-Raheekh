import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bell } from "lucide-react";
import { format } from "date-fns";
import { useTranslation } from "@/hooks/use-i18n";

interface Notification {
  id: string;
  reservationId: number;
  lotName: string;
  spotNumber: string;
  userName: string;
  totalPrice: number;
  receivedAt: Date;
}

export function NotificationsPanel() {
  const { t } = useTranslation();
  const [items, setItems] = useState<Notification[]>([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const baseUrl = import.meta.env.BASE_URL.replace(/\/$/, "");
    const url = `${baseUrl}/api/notifications/stream`;
    const es = new EventSource(url, { withCredentials: true });

    es.onopen = () => setConnected(true);
    es.onerror = () => setConnected(false);

    es.addEventListener("new-reservation", (ev: MessageEvent) => {
      try {
        const data = JSON.parse(ev.data);
        setItems((prev) =>
          [
            {
              id: `${data.id}-${Date.now()}`,
              reservationId: data.id,
              lotName: data.lotName,
              spotNumber: data.spotNumber,
              userName: data.userName,
              totalPrice: data.totalPrice,
              receivedAt: new Date(),
            },
            ...prev,
          ].slice(0, 30),
        );
      } catch {}
    });

    return () => es.close();
  }, []);

  return (
    <Card>
      <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2 text-base">
          <Bell className="h-4 w-4" />
          {t("notifications.title")}
        </CardTitle>
        <span
          className={`h-2 w-2 rounded-full ${connected ? "bg-secondary animate-pulse" : "bg-muted-foreground/40"}`}
          title={connected ? t("notifications.live") : t("notifications.offline")}
        />
      </CardHeader>
      <CardContent className="px-0 pb-0">
        <ScrollArea className="h-64">
          {items.length === 0 ? (
            <div className="text-center text-sm text-muted-foreground p-6">{t("notifications.empty")}</div>
          ) : (
            <div className="space-y-1 px-3 pb-3">
              {items.map((it) => (
                <div key={it.id} className="text-xs p-2 rounded bg-muted/40 border">
                  <div className="font-semibold text-primary">{it.userName}</div>
                  <div className="text-muted-foreground">
                    {it.lotName} · {it.spotNumber} · {it.totalPrice} {t("common.currency")}
                  </div>
                  <div className="text-muted-foreground/70 text-[10px]" dir="ltr">
                    {format(it.receivedAt, "HH:mm:ss")}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
