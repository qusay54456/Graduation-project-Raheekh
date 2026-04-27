import { useState } from "react";
import { useLocation } from "wouter";
import { useGetLots, getGetLotsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, MapPin } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

// Ramallah coordinates
const CENTER_LAT = 31.9029;
const CENTER_LNG = 35.2062;

export default function Home() {
  const [search, setSearch] = useState("");
  const [, setLocation] = useLocation();
  const { data: lots, isLoading } = useGetLots();

  const filteredLots = lots?.filter(lot => 
    lot.name.toLowerCase().includes(search.toLowerCase()) || 
    lot.location.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col md:flex-row h-[calc(100vh-4rem)]">
      {/* Left Panel - List */}
      <div className="w-full md:w-[400px] flex flex-col border-l bg-card shadow-sm z-10">
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="ابحث عن موقف... (Search parking...)" 
              className="pr-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-4 space-y-4">
            {isLoading ? (
              <div className="space-y-4">
                {[1,2,3].map(i => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="h-32 bg-muted rounded-md" />
                  </Card>
                ))}
              </div>
            ) : filteredLots?.length === 0 ? (
              <div className="text-center text-muted-foreground p-8">
                لا توجد مواقف مطابقة للبحث
                <br/>
                <span className="text-sm">No parking lots found</span>
              </div>
            ) : (
              filteredLots?.map(lot => (
                <Card 
                  key={lot.id} 
                  className="cursor-pointer hover:border-primary transition-colors hover:shadow-md hover-elevate group"
                  onClick={() => setLocation(`/book/${lot.id}`)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg group-hover:text-primary transition-colors">{lot.name}</CardTitle>
                      <Badge variant={lot.availableSpots > 0 ? "secondary" : "destructive"}>
                        {lot.availableSpots} شاغر (Available)
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center text-muted-foreground text-sm mb-4">
                      <MapPin className="h-4 w-4 ml-1" />
                      {lot.location}
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">
                        الإجمالي: {lot.totalSpots} موقف
                      </span>
                      <Button size="sm" variant="secondary" className="w-full max-w-[120px]">
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

      {/* Right Panel - Map */}
      <div className="flex-1 bg-[#e8f0e4] relative h-[50vh] md:h-auto overflow-hidden">
        {/* Static map background using tile images */}
        <div className="absolute inset-0" style={{
          backgroundImage: `url("https://tile.openstreetmap.org/14/9554/6079.png")`,
          backgroundRepeat: 'repeat',
          backgroundSize: '256px 256px',
          imageRendering: 'crisp-edges'
        }}>
          <img 
            src="https://tile.openstreetmap.org/14/9554/6079.png" 
            alt="" 
            className="absolute top-0 left-0 w-64 h-64" 
            style={{ display: 'none' }}
          />
        </div>
        {/* Map overlay with lot markers */}
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-blue-50/80 to-emerald-50/80">
          <div className="relative w-full max-w-2xl h-full">
            {/* City map visual */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center space-y-4">
                <div className="text-6xl font-black text-primary/10">رام الله</div>
                <div className="grid grid-cols-3 gap-6">
                  {lots?.map((lot, i) => (
                    <button
                      key={lot.id}
                      onClick={() => setLocation(`/book/${lot.id}`)}
                      className="group flex flex-col items-center gap-2 cursor-pointer"
                    >
                      <div className={`w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg transition-transform group-hover:scale-110 ${lot.availableSpots > 0 ? 'bg-secondary' : 'bg-destructive'}`}>
                        🅿
                      </div>
                      <div className="text-xs font-semibold text-foreground bg-background/90 px-2 py-1 rounded shadow text-center max-w-[100px]">
                        {lot.name.split(' ').slice(1).join(' ')}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {lot.availableSpots} متاح
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Info card */}
        <div className="absolute top-4 left-4 right-4 md:right-auto md:left-4 pointer-events-none">
          <Card className="pointer-events-auto bg-background/90 backdrop-blur-sm border-primary/20 shadow-lg">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold">
                🅿
              </div>
              <div>
                <h3 className="font-bold text-sm">رام الله (Ramallah)</h3>
                <p className="text-xs text-muted-foreground">اختر موقفاً للحجز (Select a lot to book)</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
