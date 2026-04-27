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
import { format, parseISO } from "date-fns";

export function UsersTab() {
  const { data: users, isLoading } = useListUsers();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user: me } = useAuth();

  const update = useUpdateUser({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListUsersQueryKey() });
        toast({ title: "تم", description: "User updated" });
      },
      onError: (e: any) => toast({ title: "خطأ", description: e?.error || "Failed", variant: "destructive" }),
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>إدارة المستخدمين (Users Management)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">الاسم</TableHead>
                <TableHead className="text-right">الإيميل</TableHead>
                <TableHead className="text-right">الهاتف</TableHead>
                <TableHead className="text-right">الدور</TableHead>
                <TableHead className="text-right">الحالة</TableHead>
                <TableHead className="text-right">انضم</TableHead>
                <TableHead className="text-right">إجراءات</TableHead>
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
                  return (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">
                        {u.name} {isMe && <Badge variant="outline" className="text-[10px] ml-1">أنت</Badge>}
                      </TableCell>
                      <TableCell dir="ltr" className="text-left text-xs">{u.email}</TableCell>
                      <TableCell dir="ltr" className="text-left text-xs">{u.phone ?? "—"}</TableCell>
                      <TableCell>
                        <Select
                          value={u.role}
                          disabled={isMe || update.isPending}
                          onValueChange={(v) => update.mutate({ id: u.id, data: { role: v } })}
                        >
                          <SelectTrigger dir="rtl" className="w-32"><SelectValue /></SelectTrigger>
                          <SelectContent dir="rtl">
                            <SelectItem value="user">مستخدم</SelectItem>
                            <SelectItem value="supervisor">مشرف</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        {u.isBlocked ? (
                          <Badge variant="destructive">محظور</Badge>
                        ) : (
                          <Badge className="bg-secondary">نشط</Badge>
                        )}
                      </TableCell>
                      <TableCell dir="ltr" className="text-left text-xs">{format(parseISO(u.createdAt), "MMM d, yyyy")}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">حظر</span>
                          <Switch
                            checked={u.isBlocked}
                            disabled={isMe || update.isPending}
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
