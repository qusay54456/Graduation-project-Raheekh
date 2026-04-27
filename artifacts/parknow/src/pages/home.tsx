import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { useGetLots, getGetLotsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Search, MapPin, Filter, X } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { StarRating } from "@/components/star-rating";

export default function Home() {
  const [search, setSearch] = useState("");
  const [maxPrice, setMaxPrice] = useState<number>(20);
  const [minAvailable, setMinAvailable] = useState<number>(0);
  const [showFilters, setShowFilters] = useState(false);
  const [, setLocation] = useLocation();
  const { data: lots, isLoading } = useGetLots();

  const filteredLots = useMemo(() => {
    if (!lots) return [];
    return lots
      .filter((l) => l.isActive !== false)
      .filter(
        (l) =>
          !search.trim() ||
          l.name.toLowerCase().includes(search.toLowerCase()) ||
          l.location.toLowerCase().includes(search.toLowerCase()),
      )
      .filter((l) => l.pricePerHour <= maxPrice)
      .filter((l) => l.availableSpots >= minAvailable);
  }, [lots, search, maxPrice, minAvailable]);

  const filtersActive = maxPrice < 20 || minAvailable > 0;

  return (
    <div className="flex-1 flex flex-col md:flex-row min-h-[calc(100vh-4rem)] md:h-[calc(100vh-4rem)]">
      <div className="w-full md:w-[420px] flex flex-col border-l bg-card shadow-sm z-10">
        <div className="p-4 border-b space-y-3">
          <div className="relative">
            <Search className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="ابحث عن موقف أو منطقة..."
              className="pr-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={() => setShowFilters((v) => !v)}>
              <Filter className="ml-2 h-3 w-3" />
              فلاتر {filtersActive && <Badge className="mr-2 h-4 px-1 text-[10px]">نشط</Badge>}
            </Button>
            {filtersActive && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setMaxPrice(20);
                  setMinAvailable(0);
                }}
              >
                <X className="ml-1 h-3 w-3" /> مسح
              </Button>
            )}
          </div>
          {showFilters && (
            <div className="space-y-4 pt-2 border-t">
              <div className="space-y-2">
                <Label className="text-xs flex justify-between">
                  <span>السعر بالساعة (Max ₪)</span>
                  <span className="font-bold text-primary">{maxPrice} ₪</span>
                </Label>
                <Slider value={[maxPrice]} onValueChange={(v) => setMaxPrice(v[0])} min={1} max={20} step={1} />
              </div>
              <div className="space-y-2">
                <Label className="text-xs flex justify-between">
                  <span>الأماكن المتاحة (Min)</span>
                  <span className="font-bold text-primary">{minAvailable}+</span>
                </Label>
                <Slider value={[minAvailable]} onValueChange={(v) => setMinAvailable(v[0])} min={0} max={10} step={1} />
              </div>
            </div>
          )}
        </div>

        <ScrollArea className="flex-1">
          <div className="p-4 space-y-4">
            {isLoading ? (
              [1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="h-32 bg-muted rounded-md" />
                </Card>
              ))
            ) : filteredLots.length === 0 ? (
              <div className="text-center text-muted-foreground p-8">
                لا توجد مواقف مطابقة
                <br />
                <span className="text-sm">No parking lots found</span>
              </div>
            ) : (
              filteredLots.map((lot) => (
                <Card
                  key={lot.id}
                  className="cursor-pointer hover:border-primary transition-colors hover:shadow-md group"
                  onClick={() => setLocation(`/book/${lot.id}`)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start gap-2">
                      <CardTitle className="text-lg group-hover:text-primary transition-colors flex-1">{lot.name}</CardTitle>
                      <Badge variant={lot.availableSpots > 0 ? "secondary" : "destructive"}>
                        {lot.availableSpots} متاح
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center text-muted-foreground text-sm mb-2">
                      <MapPin className="h-4 w-4 ml-1 flex-shrink-0" />
                      <span className="truncate">{lot.location}</span>
                    </div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-sm font-bold text-primary">
                        {lot.pricePerHour} ₪/ساعة
                      </div>
                      <StarRating value={lot.avgRating} count={lot.ratingCount} showValue size="sm" />
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">
                        الإجمالي: {lot.totalSpots}
                      </span>
                      <Button size="sm" variant="secondary">
                        حجز (Book)
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      <div className="flex-1 bg-[#e8f0e4] relative h-[40vh] md:h-auto overflow-hidden">
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-blue-50/80 to-emerald-50/80">
          <div className="text-center space-y-4 px-4">
            <div className="text-4xl md:text-6xl font-black text-primary/10">رام الله</div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6">
              {filteredLots.map((lot) => (
                <button
                  key={lot.id}
                  onClick={() => setLocation(`/book/${lot.id}`)}
                  className="group flex flex-col items-center gap-2 cursor-pointer"
                >
                  <div
                    className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg transition-transform group-hover:scale-110 ${
                      lot.availableSpots > 0 ? "bg-secondary" : "bg-destructive"
                    }`}
                  >
                    🅿
                  </div>
                  <div className="text-xs font-semibold text-foreground bg-background/90 px-2 py-1 rounded shadow text-center max-w-[110px]">
                    {lot.name.split(" ").slice(1).join(" ")}
                  </div>
                  <div className="text-xs text-muted-foreground">{lot.availableSpots} متاح</div>
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="absolute top-4 left-4 right-4 md:right-auto md:left-4 pointer-events-none">
          <Card className="pointer-events-auto bg-background/90 backdrop-blur-sm border-primary/20 shadow-lg">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold">
                🅿
              </div>
              <div>
                <h3 className="font-bold text-sm">رام الله (Ramallah)</h3>
                <p className="text-xs text-muted-foreground">اختر موقفاً للحجز</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
