import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useTranslation } from "@/hooks/use-i18n";
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
  const { t } = useTranslation();
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
      setErrorMsg(t("register.passwordTooShort"));
      return;
    }
    setIsLoading(true);
    register(
      {
        data: {
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
          phone: phone.trim() || undefined,
        },
      },
      {
        onSuccess: () => setLocation("/"),
        onError: (err) => setErrorMsg(extractApiError(err, t("register.errorFallback"))),
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
          <CardTitle className="text-2xl font-bold">{t("register.title")}</CardTitle>
          <CardDescription>{t("register.subtitle")}</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t("common.name")}</Label>
              <Input
                id="name"
                placeholder="Ahmad…"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                data-testid="input-register-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">{t("common.email")}</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                dir="ltr"
                className="text-left"
                data-testid="input-register-email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">{t("register.phoneOptional")}</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="0599…"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                dir="ltr"
                className="text-left"
                autoComplete="tel"
                data-testid="input-register-phone"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t("common.password")}</Label>
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
                data-testid="input-register-password"
              />
              <p className="text-xs text-muted-foreground">{t("register.passwordHint")}</p>
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
              {isLoading && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
              {t("register.create")}
            </Button>
            <div className="text-sm text-center text-muted-foreground">
              {t("register.haveAccount")}{" "}
              <Link href="/login" className="text-primary hover:underline font-medium" data-testid="link-go-login">
                {t("register.login")}
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
