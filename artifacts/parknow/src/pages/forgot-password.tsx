import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useForgotPassword, useVerifyResetCode, useResetPassword } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ArrowRight, KeyRound, Mail, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/hooks/use-i18n";

type Step = "email" | "code" | "password" | "done";

export default function ForgotPassword() {
  const { t } = useTranslation();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [devCode, setDevCode] = useState<string | null>(null);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const forgot = useForgotPassword();
  const verify = useVerifyResetCode();
  const reset = useResetPassword();

  const sendCode = (e: React.FormEvent) => {
    e.preventDefault();
    forgot.mutate(
      { data: { email } },
      {
        onSuccess: (res) => {
          setDevCode(res.devCode ?? null);
          setStep("code");
          toast({
            title: t("toast.codeSent"),
            description: res.devCode ? `${t("forgot.devCodeLabel")} ${res.devCode}` : t("forgot.emailSubtitle"),
          });
        },
        onError: (e: any) =>
          toast({ title: t("common.error"), description: e?.error || t("toast.genericFail"), variant: "destructive" }),
      },
    );
  };

  const checkCode = (e: React.FormEvent) => {
    e.preventDefault();
    verify.mutate(
      { data: { email, code } },
      {
        onSuccess: () => setStep("password"),
        onError: (e: any) =>
          toast({ title: t("toast.invalidCode"), description: e?.error || t("toast.invalidCode"), variant: "destructive" }),
      },
    );
  };

  const submitPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast({ title: t("common.error"), description: t("register.passwordTooShort"), variant: "destructive" });
      return;
    }
    reset.mutate(
      { data: { email, code, newPassword } },
      {
        onSuccess: () => setStep("done"),
        onError: (e: any) =>
          toast({ title: t("common.error"), description: e?.error || t("toast.genericFail"), variant: "destructive" }),
      },
    );
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl border-primary/10">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-inner">
              {step === "email" && <Mail className="h-6 w-6" />}
              {step === "code" && <KeyRound className="h-6 w-6" />}
              {step === "password" && <KeyRound className="h-6 w-6" />}
              {step === "done" && <CheckCircle2 className="h-6 w-6" />}
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">
            {step === "email" && t("forgot.emailTitle")}
            {step === "code" && t("forgot.codeTitle")}
            {step === "password" && t("forgot.passwordTitle")}
            {step === "done" && t("forgot.doneTitle")}
          </CardTitle>
          <CardDescription>
            {step === "email" && t("forgot.emailSubtitle")}
            {step === "code" && `${t("forgot.codeSubtitle")} ${email}`}
            {step === "password" && t("forgot.passwordSubtitle")}
            {step === "done" && t("forgot.doneSubtitle")}
          </CardDescription>
        </CardHeader>

        {step === "email" && (
          <form onSubmit={sendCode}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">{t("common.email")}</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  dir="ltr"
                  className="text-left"
                  data-testid="input-forgot-email"
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button type="submit" className="w-full" disabled={forgot.isPending} data-testid="button-send-code">
                {forgot.isPending && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
                {t("forgot.sendCode")}
              </Button>
              <Link href="/login" className="text-sm text-muted-foreground hover:text-primary">
                <ArrowRight className="inline h-3 w-3 mx-1 rtl:rotate-180" /> {t("forgot.backToLogin")}
              </Link>
            </CardFooter>
          </form>
        )}

        {step === "code" && (
          <form onSubmit={checkCode}>
            <CardContent className="space-y-4">
              {devCode && (
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded p-3 text-sm">
                  <strong>{t("forgot.devCodeLabel")}</strong>{" "}
                  <code className="font-mono text-lg">{devCode}</code>
                  <div className="text-xs text-muted-foreground mt-1">{t("forgot.devCodeHint")}</div>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="code">{t("forgot.codeLabel")}</Label>
                <Input
                  id="code"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  required
                  dir="ltr"
                  className="text-center text-2xl font-mono tracking-widest"
                  maxLength={6}
                  data-testid="input-verify-code"
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button type="submit" className="w-full" disabled={verify.isPending || code.length !== 6} data-testid="button-verify-code">
                {verify.isPending && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
                {t("forgot.verify")}
              </Button>
              <button
                type="button"
                className="text-sm text-muted-foreground hover:text-primary"
                onClick={() => setStep("email")}
              >
                {t("forgot.resend")}
              </button>
            </CardFooter>
          </form>
        )}

        {step === "password" && (
          <form onSubmit={submitPassword}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword">{t("forgot.passwordHint")}</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  dir="ltr"
                  className="text-left"
                  data-testid="input-new-password"
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full" disabled={reset.isPending} data-testid="button-reset-password">
                {reset.isPending && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
                {t("forgot.setPassword")}
              </Button>
            </CardFooter>
          </form>
        )}

        {step === "done" && (
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">{t("forgot.doneText")}</p>
            <Button className="w-full" onClick={() => setLocation("/login")} data-testid="button-go-login">
              {t("forgot.signIn")}
            </Button>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
