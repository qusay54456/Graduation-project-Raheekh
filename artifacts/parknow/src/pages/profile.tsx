import { useEffect, useRef, useState } from "react";
import { useUpdateProfile, getGetMeQueryKey } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { useTranslation } from "@/hooks/use-i18n";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Camera, User as UserIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

export default function Profile() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setPhone(user.phone ?? "");
      setPhotoUrl(user.profilePhotoUrl ?? null);
    }
  }, [user]);

  const update = useUpdateProfile({
    mutation: {
      onSuccess: () => {
        toast({ title: t("profile.saved"), description: t("profile.saved") });
        queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
      },
      onError: (e: any) =>
        toast({ title: t("common.error"), description: e?.error || t("toast.genericFail"), variant: "destructive" }),
    },
  });

  const handlePhotoSelect = (file: File) => {
    if (file.size > 1024 * 1024) {
      toast({ title: t("common.error"), description: t("profile.fileTooLarge"), variant: "destructive" });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setPhotoUrl(reader.result as string);
    reader.readAsDataURL(file);
  };

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    update.mutate({
      data: {
        name: name || null,
        phone: phone || null,
        profilePhotoUrl: photoUrl,
      },
    });
  };

  if (!user) return null;

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-3xl font-bold text-primary mb-6 border-b pb-3">{t("profile.title")}</h1>

      <form onSubmit={save}>
        <Card>
          <CardHeader>
            <CardTitle>{t("profile.info")}</CardTitle>
            <CardDescription>{t("profile.infoDesc")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20">
                {photoUrl ? <AvatarImage src={photoUrl} alt={name} /> : null}
                <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                  {/* تم الإصلاح هنا: استخدام حماية للتأكد من وجود الاسم */}
                  {name ? name.charAt(0).toUpperCase() : <UserIcon />}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-2">
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handlePhotoSelect(f);
                  }}
                />
                <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()} data-testid="button-change-photo">
                  <Camera className="me-2 h-4 w-4" />
                  {t("profile.changePhoto")}
                </Button>
                {photoUrl && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-destructive"
                    onClick={() => setPhotoUrl(null)}
                    data-testid="button-remove-photo"
                  >
                    {t("profile.remove")}
                  </Button>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">{t("common.name")}</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required data-testid="input-profile-name" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">{t("common.email")}</Label>
              <Input id="email" value={user.email} disabled dir="ltr" className="text-left bg-muted" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">{t("common.phone")}</Label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                dir="ltr"
                className="text-left"
                placeholder="+972 …"
                data-testid="input-profile-phone"
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={update.isPending} data-testid="button-save-profile">
              {update.isPending && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
              {t("profile.saveChanges")}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}