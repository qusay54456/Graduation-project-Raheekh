import { useGetReservations, useCancelReservation, getGetReservationsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, MapPin, Calendar, Clock, Navigation } from "lucide-react";
import { format, parseISO } from "date-fns";
import { arSA } from "date-fns/locale";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export default function MyBookings() {
  const { data: reservations, isLoading } = useGetReservations();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const cancelMutation = useCancelReservation({
    mutation: {
      onSuccess: () => {
        toast({
          title: "تم الإلغاء",
          description: "Reservation cancelled successfully",
        });
        queryClient.invalidateQueries({ queryKey: getGetReservationsQueryKey() });
      },
      onError: (err: any) => {
        toast({
          title: "خطأ",
          description: err.error || "Failed to cancel reservation",
          variant: "destructive",
        });
      }
    }
  });

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-secondary">نشط (Active)</Badge>;
      case 'completed':
        return <Badge variant="outline" className="text-muted-foreground">مكتمل (Completed)</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">ملغي (Cancelled)</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <h1 className="text-3xl font-bold text-primary mb-8 border-b pb-4">حجوزاتي (My Bookings)</h1>

      {reservations?.length === 0 ? (
        <div className="text-center py-16 bg-muted/30 rounded-lg border border-dashed">
          <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h3 className="text-xl font-semibold mb-2">لا توجد حجوزات</h3>
          <p className="text-muted-foreground">You don't have any bookings yet.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {reservations?.map((res) => (
            <Card key={res.id} className={res.status === 'cancelled' ? 'opacity-70' : ''}>
              <CardHeader className="pb-3 flex flex-row items-start justify-between space-y-0">
                <div>
                  <CardTitle className="text-xl mb-1">{res.lotName}</CardTitle>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <MapPin className="h-3 w-3 ml-1" />
                    {res.lotLocation}
                  </div>
                </div>
                {getStatusBadge(res.status)}
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-muted rounded-md">
                  <div className="text-sm font-medium">الموقف (Spot)</div>
                  <div className="text-xl font-mono font-bold text-primary">{res.spotNumber}</div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="space-y-1">
                    <div className="flex items-center text-muted-foreground">
                      <Clock className="h-3 w-3 ml-1" /> البداية (Start)
                    </div>
                    <div className="font-medium" dir="ltr">
                      {format(parseISO(res.startTime), "PP p", { locale: arSA })}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center text-muted-foreground">
                      <Clock className="h-3 w-3 ml-1" /> النهاية (End)
                    </div>
                    <div className="font-medium" dir="ltr">
                      {format(parseISO(res.endTime), "PP p", { locale: arSA })}
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex gap-3 pt-4 border-t bg-muted/10">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${res.lotLat},${res.lotLng}`, '_blank')}
                >
                  <Navigation className="ml-2 h-4 w-4" />
                  الاتجاهات (Navigate)
                </Button>
                {res.status === 'active' && (
                  <Button 
                    variant="destructive" 
                    className="flex-1"
                    disabled={cancelMutation.isPending}
                    onClick={() => cancelMutation.mutate({ id: res.id })}
                  >
                    {cancelMutation.isPending && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                    إلغاء (Cancel)
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
