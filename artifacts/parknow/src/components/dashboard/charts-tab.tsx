import { useState } from "react";
import { useGetRevenue, useGetPopularLots, useGetPeakHours, getGetRevenueQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Loader2 } from "lucide-react";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";

const COLORS = ["#1a2b4a", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];

export function ChartsTab() {
  const [period, setPeriod] = useState<"daily" | "weekly" | "monthly">("daily");

  const { data: revenue, isLoading: revLoading } = useGetRevenue(
    { period },
    { query: { queryKey: getGetRevenueQueryKey({ period }) } },
  );
  const { data: popular, isLoading: popLoading } = useGetPopularLots();
  const { data: peakHours, isLoading: peakLoading } = useGetPeakHours();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>الإيرادات (Revenue)</CardTitle>
            <CardDescription>
              الإجمالي: <span className="font-bold text-primary">{revenue?.total ?? 0} ₪</span>
            </CardDescription>
          </div>
          <ToggleGroup type="single" value={period} onValueChange={(v) => v && setPeriod(v as any)} dir="rtl">
            <ToggleGroupItem value="daily" size="sm">يومي</ToggleGroupItem>
            <ToggleGroupItem value="weekly" size="sm">أسبوعي</ToggleGroupItem>
            <ToggleGroupItem value="monthly" size="sm">شهري</ToggleGroupItem>
          </ToggleGroup>
        </CardHeader>
        <CardContent>
          {revLoading ? (
            <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto my-12" />
          ) : !revenue?.series?.length ? (
            <p className="text-center text-muted-foreground py-12">لا توجد بيانات إيرادات بعد</p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={revenue.series}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="revenue" stroke="#1a2b4a" strokeWidth={2} name="الإيراد (₪)" />
                <Line type="monotone" dataKey="bookings" stroke="#10b981" strokeWidth={2} name="الحجوزات" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>الأكثر حجزاً (Most Booked Lots)</CardTitle>
          </CardHeader>
          <CardContent>
            {popLoading ? (
              <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto my-12" />
            ) : !popular?.length ? (
              <p className="text-center text-muted-foreground py-12">لا توجد بيانات</p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={popular.filter((p) => p.bookings > 0)}
                    dataKey="bookings"
                    nameKey="lotName"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    label={(e: any) => `${e.bookings}`}
                  >
                    {popular.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>أوقات الذروة (Peak Hours)</CardTitle>
          </CardHeader>
          <CardContent>
            {peakLoading ? (
              <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto my-12" />
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={peakHours ?? []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="hour" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="bookings" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
