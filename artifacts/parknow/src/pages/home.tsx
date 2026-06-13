import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { useGetLots } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, MapPin, Filter, X, Building2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTranslation } from "@/hooks/use-i18n";

// استيراد مكتبة الخرائط
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// إصلاح مشكلة أيقونات الخريطة الافتراضية
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const CITY_FILTER_ALL = "all";

const CITIES = [
  { value: "ramallah", labelAr: "رام الله", labelEn: "Ramallah", matchTokens: ["رام الله", "البيرة"], coords: [31.9029, 35.2062] },
  { value: "nablus", labelAr: "نابلس", labelEn: "Nablus", matchTokens: ["نابلس"], coords: [32.2211, 35.2544] },
  { value: "hebron", labelAr: "الخليل", labelEn: "Hebron", matchTokens: ["الخليل"], coords: [31.5297, 35.0903] },
  { value: "bethlehem", labelAr: "بيت لحم", labelEn: "Bethlehem", matchTokens: ["بيت لحم"], coords: [31.7054, 35.2024] },
  { value: "jenin", labelAr: "جنين", labelEn: "Jenin", matchTokens: ["جنين"], coords: [32.4646, 35.2938] },
];

function locationMatchesCity(location: string, cityValue: string): boolean {
  if (cityValue === CITY_FILTER_ALL) return true;
  const city = CITIES.find((c) => c.value === cityValue);
  return city ? city.matchTokens.some((token) => (location || "").includes(token)) : true;
}

export default function Home() {
  const { t, lang, dir } = useTranslation();
  const [search, setSearch] = useState("");
  const [maxPrice, setMaxPrice] = useState<number>(20);
  const [minAvailable, setMinAvailable] = useState<number>(0);
  const [showFilters, setShowFilters] = useState(false);
  const [cityFilter, setCityFilter] = useState<string>(CITY_FILTER_ALL);
  const [, setLocation] = useLocation();
  
  const { data: lotsData, isLoading } = useGetLots();
  const lots = Array.isArray(lotsData) ? lotsData : (lotsData as any)?.data ?? [];

  const filteredLots = useMemo(() => {
    if (!lots || !Array.isArray(lots)) return [];
    return lots
      .filter((l) => l.isActive !== false)
      .filter((l) => locationMatchesCity(l.location, cityFilter))
      .filter((l) => !search.trim() || l.name.toLowerCase().includes(search.toLowerCase()) || l.location.toLowerCase().includes(search.toLowerCase()))
      .filter((l) => l.pricePerHour <= maxPrice)
      .filter((l) => l.availableSpots >= minAvailable);
  }, [lots, search, maxPrice, minAvailable, cityFilter]);

  const activeCity = CITIES.find(c => c.value === cityFilter);
  const mapCenter: [number, number] = activeCity ? (activeCity.coords as [number, number]) : [32.0, 35.2];

  return (
    <div className="flex-1 flex flex-col md:flex-row min-h-[calc(100vh-4rem)] md:h-[calc(100vh-4rem)]">
      {/* القائمة الجانبية */}
      <div className="w-full md:w-[420px] flex flex-col border-e bg-card shadow-sm z-10">
        <div className="p-4 border-b space-y-3">
          <div className="relative">
            <Search className="absolute end-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t("home.searchPlaceholder")}
              className="pe-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs flex items-center gap-1.5 text-muted-foreground">
              <Building2 className="h-3 w-3" /> {t("home.cityLabel")}
            </Label>
            <Select value={cityFilter} onValueChange={setCityFilter}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t("home.cityPlaceholder")} />
              </SelectTrigger>
              <SelectContent dir={dir}>
                <SelectItem value={CITY_FILTER_ALL}>{t("home.cityAll")}</SelectItem>
                {CITIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>{lang === "ar" ? c.labelAr : c.labelEn}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setShowFilters(!showFilters)}>
            <Filter className="me-2 h-3 w-3" /> {t("home.filters")}
          </Button>
          {showFilters && (
            <div className="space-y-4 pt-2 border-t">
              <Label className="text-xs">السعر الأقصى: {maxPrice}</Label>
              <Slider value={[maxPrice]} onValueChange={(v) => setMaxPrice(v[0])} min={1} max={20} />
            </div>
          )}
        </div>

        <ScrollArea className="flex-1">
          <div className="p-4 space-y-4">
            {filteredLots.map((lot) => (
              <Card key={lot.id} className="cursor-pointer hover:border-primary" onClick={() => setLocation(`/book/${lot.id}`)}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">{lot.name}</CardTitle>
                  <Badge variant={lot.availableSpots > 0 ? "secondary" : "destructive"}>
                    {lot.availableSpots} متاح
                  </Badge>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <MapPin className="h-3 w-3 me-1" /> {lot.location}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* الخريطة التفاعلية */}
      <div className="flex-1 relative bg-muted/30">
        <MapContainer center={mapCenter} zoom={10} style={{ height: "100%", width: "100%" }} key={cityFilter}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          
          {/* الفلتر الآمن لمنع خطأ NaN */}
          {filteredLots
            .filter(lot => 
                lot.latitude !== null && 
                lot.longitude !== null && 
                !isNaN(Number(lot.latitude)) && 
                !isNaN(Number(lot.longitude))
            )
            .map((lot) => (
              <Marker key={lot.id} position={[Number(lot.latitude), Number(lot.longitude)]}>
                <Popup>
                  <div className="text-center" dir={dir}>
                    <h3 className="font-bold text-primary">{lot.name}</h3>
                    <p className="text-xs mb-2">{lot.location}</p>
                    <Button size="sm" onClick={() => setLocation(`/book/${lot.id}`)}>
                      {lang === "ar" ? "حجز الآن" : "Book Now"}
                    </Button>
                  </div>
                </Popup>
              </Marker>
            ))}
        </MapContainer>
      </div>
    </div>
  );
}