import { useState } from "react";
import {
  useGetLots,
  useCreateLot,
  useUpdateLot,
  getGetLotsQueryKey,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Pencil } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface LotForm {
  name: string;
  location: string;
  totalSpots: number;
  lat: number;
  lng: number;
  pricePerHour: number;
}

const emptyForm: LotForm = { name: "", location: "", totalSpots: 10, lat: 31.9038, lng: 35.2034, pricePerHour: 5 };

export function LotsTab() {
  const { data: lots, isLoading } = useGetLots();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [createOpen, setCreateOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<LotForm>(emptyForm);

  const create = useCreateLot({
    mutation: {
      onSuccess: () => {
        toast({ title: "تم", description: "Lot created" });
        queryClient.invalidateQueries({ queryKey: getGetLotsQueryKey() });
        setCreateOpen(false);
        setForm(emptyForm);
      },
      onError: (e: any) => toast({ title: "خطأ", description: e?.error || "Failed", variant: "destructive" }),
    },
  });

  const update = useUpdateLot({
    mutation: {
      onSuccess: () => {
        toast({ title: "تم", description: "Lot updated" });
        queryClient.invalidateQueries({ queryKey: getGetLotsQueryKey() });
        setEditId(null);
      },
      onError: (e: any) => toast({ title: "خطأ", description: e?.error || "Failed", variant: "destructive" }),
    },
  });

  const openEdit = (lot: any) => {
    setEditId(lot.id);
    setForm({
      name: lot.name,
      location: lot.location,
      totalSpots: lot.totalSpots,
      lat: lot.lat,
      lng: lot.lng,
      pricePerHour: lot.pricePerHour,
    });
  };

  const submit = () => {
    if (editId != null) {
      update.mutate({
        id: editId,
        data: { name: form.name, location: form.location, lat: form.lat, lng: form.lng, pricePerHour: form.pricePerHour },
      });
    } else {
      create.mutate({ data: form });
    }
  };

  const toggleActive = (lot: any) => {
    update.mutate({ id: lot.id, data: { isActive: !lot.isActive } });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle>إدارة المواقف (Lots Management)</CardTitle>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button size="sm" onClick={() => setForm(emptyForm)}>
              <Plus className="ml-2 h-4 w-4" /> إضافة موقف
            </Button>
          </DialogTrigger>
          <DialogContent dir="rtl">
            <DialogHeader>
              <DialogTitle>إنشاء موقف جديد</DialogTitle>
            </DialogHeader>
            <LotFormFields form={form} setForm={setForm} isCreate />
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateOpen(false)}>إلغاء</Button>
              <Button onClick={submit} disabled={create.isPending}>
                {create.isPending && <Loader2 className="ml-2 h-3 w-3 animate-spin" />}
                إنشاء
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto my-8" />
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {lots?.map((lot) => (
              <div key={lot.id} className="border rounded-lg p-4 space-y-2">
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold truncate">{lot.name}</h3>
                      <Badge variant={lot.isActive ? "secondary" : "outline"} className="text-[10px]">
                        {lot.isActive ? "نشط" : "غير نشط"}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground truncate">{lot.location}</div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => openEdit(lot)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex items-center justify-between text-sm pt-2 border-t">
                  <span>{lot.totalSpots} موقف · {lot.pricePerHour} ₪/ساعة</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">نشط</span>
                    <Switch checked={lot.isActive} onCheckedChange={() => toggleActive(lot)} disabled={update.isPending} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <Dialog open={editId != null} onOpenChange={(o) => !o && setEditId(null)}>
          <DialogContent dir="rtl">
            <DialogHeader>
              <DialogTitle>تعديل الموقف</DialogTitle>
            </DialogHeader>
            <LotFormFields form={form} setForm={setForm} isCreate={false} />
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditId(null)}>إلغاء</Button>
              <Button onClick={submit} disabled={update.isPending}>
                {update.isPending && <Loader2 className="ml-2 h-3 w-3 animate-spin" />}
                حفظ
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

function LotFormFields({ form, setForm, isCreate }: { form: LotForm; setForm: (f: LotForm) => void; isCreate: boolean }) {
  return (
    <div className="space-y-3 py-2">
      <div className="space-y-1">
        <Label>الاسم</Label>
        <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
      </div>
      <div className="space-y-1">
        <Label>الموقع</Label>
        <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label>السعر/ساعة (₪)</Label>
          <Input type="number" min="1" step="0.5" value={form.pricePerHour} onChange={(e) => setForm({ ...form, pricePerHour: parseFloat(e.target.value) || 0 })} />
        </div>
        {isCreate && (
          <div className="space-y-1">
            <Label>عدد المواقف</Label>
            <Input type="number" min="1" max="100" value={form.totalSpots} onChange={(e) => setForm({ ...form, totalSpots: parseInt(e.target.value, 10) || 1 })} />
          </div>
        )}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label>Latitude</Label>
          <Input type="number" step="0.0001" value={form.lat} onChange={(e) => setForm({ ...form, lat: parseFloat(e.target.value) || 0 })} dir="ltr" />
        </div>
        <div className="space-y-1">
          <Label>Longitude</Label>
          <Input type="number" step="0.0001" value={form.lng} onChange={(e) => setForm({ ...form, lng: parseFloat(e.target.value) || 0 })} dir="ltr" />
        </div>
      </div>
    </div>
  );
}
