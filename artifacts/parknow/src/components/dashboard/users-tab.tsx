import { useListUsers, useUpdateUser, getListUsersQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useTranslation } from "@/hooks/use-i18n";
import { format, parseISO } from "date-fns";

export function UsersTab() {
  const { t, dir } = useTranslation();
  const { data: users, isLoading } = useListUsers();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user: me } = useAuth();
  const align = dir === "rtl" ? "text-right" : "text-left";

  const update = useUpdateUser({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListUsersQueryKey() });
        toast({ title: t("common.success"), description: t("common.success") });
      },
      onError: (e: any) =>
        toast({ title: t("common.error"), description: e?.error || t("toast.genericFail"), variant: "destructive" }),
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("dashUsers.title")}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className={align}>{t("common.name")}</TableHead>
                <TableHead className={align}>{t("common.email")}</TableHead>
                <TableHead className={align}>{t("common.phone")}</TableHead>
                <TableHead className={align}>{t("dashUsers.role")}</TableHead>
                <TableHead className={align}>{t("dashBookings.status")}</TableHead>
                <TableHead className={align}>{t("dashUsers.joined")}</TableHead>
                <TableHead className={align}>{t("dashUsers.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center h-24">
                    <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                  </TableCell>
                </TableRow>
              ) : (
                users?.map((u) => {
                  const isMe = u.id === me?.id;
                  const isAdminRow = u.role === "admin";
                  const canEditRow = !isMe && (!isAdminRow || me?.role === "admin");
                  return (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">
                        {u.name}{" "}
                        {isMe && (
                          <Badge variant="outline" className="text-[10px] ms-1">
                            {t("dashUsers.meBadge")}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell dir="ltr" className="text-left text-xs">{u.email}</TableCell>
                      <TableCell dir="ltr" className="text-left text-xs">{u.phone ?? "—"}</TableCell>
                      <TableCell>
                        {isAdminRow ? (
                          <Badge variant="outline" className="border-primary/40 text-primary font-bold">
                            {t("dashUsers.adminBadge")}
                          </Badge>
                        ) : (
                          <Select
                            value={u.role}
                            disabled={!canEditRow || update.isPending}
                            onValueChange={(v) => update.mutate({ id: u.id, data: { role: v } })}
                          >
                            <SelectTrigger dir={dir} className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent dir={dir}>
                              <SelectItem value="user">{t("dashUsers.roleUser")}</SelectItem>
                              <SelectItem value="supervisor">{t("dashUsers.roleSupervisor")}</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      </TableCell>
                      <TableCell>
                        {u.isBlocked ? (
                          <Badge variant="destructive">{t("dashUsers.blocked")}</Badge>
                        ) : (
                          <Badge className="bg-secondary">{t("bookings.statusActive")}</Badge>
                        )}
                      </TableCell>
                      <TableCell dir="ltr" className="text-left text-xs">
                        {format(parseISO(u.createdAt), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">{t("dashUsers.block")}</span>
                          <Switch
                            checked={u.isBlocked}
                            disabled={!canEditRow || update.isPending}
                            onCheckedChange={(v) => update.mutate({ id: u.id, data: { isBlocked: v } })}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
