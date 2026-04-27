import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, AlertCircle } from "lucide-react";

function extractApiError(error: unknown, fallback: string): string {
  const e = error as { data?: { error?: string; message?: string }; message?: string } | null;
  const fromBody = e?.data?.error ?? e?.data?.message;
  if (typeof fromBody === "string" && fromBody.length > 0) return fromBody;
  if (typeof e?.message === "string" && e.message.length > 0 && !e.message.startsWith("HTTP")) {
    return e.message;
  }
  return fallback;
}

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { register } = useAuth();
  const [, setLocation] = useLocation();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (password.length < 6) {
      setErrorMsg("كلمة المرور يجب أن تكون 6 أحرف على الأقل");
      return;
    }
    setIsLoading(true);
    register(
      { data: { name: name.trim(), email: email.trim().toLowerCase(), password, phone: phone.trim() || undefined } },
      {
        onSuccess: () => {
          setLocation("/");
        },
        onError: (err) => {
          setErrorMsg(extractApiError(err, "تعذّر إنشاء الحساب — حاول مرة أخرى"));
        },
        onSettled: () => setIsLoading(false),
      },
    );
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl border-primary/10">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center text-2xl text-primary-foreground shadow-inner">
              🅿
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">إنشاء حساب جديد</CardTitle>
          <CardDescription>
            Create a new ParkNow account
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">الاسم الكامل (Full Name)</Label>
              <Input 
                id="name" 
                placeholder="Ahmad..." 
                value={name}
                onChange={(e) => setName(e.target.value)}
                required 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">البريد الإلكتروني (Email)</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="name@example.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required 
                dir="ltr"
                className="text-left"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">رقم الهاتف (Phone) — اختياري</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="0599..."
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                dir="ltr"
                className="text-left"
                autoComplete="tel"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">كلمة المرور (Password)</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                dir="ltr"
                className="text-left"
                autoComplete="new-password"
              />
              <p className="text-xs text-muted-foreground">6 أحرف على الأقل (at least 6 characters)</p>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            {errorMsg && (
              <div
                role="alert"
                data-testid="alert-register-error"
                className="w-full flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
              >
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                <span className="flex-1">{errorMsg}</span>
              </div>
            )}
            <Button type="submit" className="w-full" disabled={isLoading} data-testid="button-register-submit">
              {isLoading && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
              إنشاء حساب (Register)
            </Button>
            <div className="text-sm text-center text-muted-foreground">
              لديك حساب بالفعل؟ {" "}
              <Link href="/login" className="text-primary hover:underline font-medium">
                تسجيل الدخول (Login)
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
