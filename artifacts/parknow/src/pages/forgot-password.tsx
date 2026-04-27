import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useForgotPassword, useVerifyResetCode, useResetPassword } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ArrowRight, KeyRound, Mail, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type Step = "email" | "code" | "password" | "done";

export default function ForgotPassword() {
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
    forgot.mutate({ data: { email } }, {
      onSuccess: (res) => {
        setDevCode(res.devCode ?? null);
        setStep("code");
        toast({ title: "تم إرسال الرمز", description: res.devCode ? `Dev code: ${res.devCode}` : "Check your email" });
      },
      onError: (e: any) => toast({ title: "خطأ", description: e.error || "Failed", variant: "destructive" }),
    });
  };

  const checkCode = (e: React.FormEvent) => {
    e.preventDefault();
    verify.mutate({ data: { email, code } }, {
      onSuccess: () => setStep("password"),
      onError: (e: any) => toast({ title: "رمز غير صحيح", description: e.error || "Invalid code", variant: "destructive" }),
    });
  };

  const submitPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast({ title: "خطأ", description: "Password must be at least 6 characters", variant: "destructive" });
      return;
    }
    reset.mutate({ data: { email, code, newPassword } }, {
      onSuccess: () => setStep("done"),
      onError: (e: any) => toast({ title: "خطأ", description: e.error || "Failed", variant: "destructive" }),
    });
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
            {step === "email" && "نسيت كلمة المرور"}
            {step === "code" && "أدخل رمز التحقق"}
            {step === "password" && "كلمة المرور الجديدة"}
            {step === "done" && "تم بنجاح!"}
          </CardTitle>
          <CardDescription>
            {step === "email" && "Enter your email to receive a verification code"}
            {step === "code" && `Code sent to ${email}`}
            {step === "password" && "Enter your new password"}
            {step === "done" && "Password reset successfully"}
          </CardDescription>
        </CardHeader>

        {step === "email" && (
          <form onSubmit={sendCode}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">البريد الإلكتروني (Email)</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required dir="ltr" className="text-left" />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button type="submit" className="w-full" disabled={forgot.isPending}>
                {forgot.isPending && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                إرسال الرمز (Send Code)
              </Button>
              <Link href="/login" className="text-sm text-muted-foreground hover:text-primary">
                <ArrowRight className="inline h-3 w-3 mr-1" /> العودة لتسجيل الدخول
              </Link>
            </CardFooter>
          </form>
        )}

        {step === "code" && (
          <form onSubmit={checkCode}>
            <CardContent className="space-y-4">
              {devCode && (
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded p-3 text-sm">
                  <strong>Dev mode:</strong> Code is <code className="font-mono text-lg">{devCode}</code>
                  <div className="text-xs text-muted-foreground mt-1">
                    Configure SMTP_HOST/SMTP_USER/SMTP_PASS to actually send email.
                  </div>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="code">رمز التحقق (6 أرقام - صالح لمدة 10 دقائق)</Label>
                <Input id="code" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))} required dir="ltr" className="text-center text-2xl font-mono tracking-widest" maxLength={6} />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button type="submit" className="w-full" disabled={verify.isPending || code.length !== 6}>
                {verify.isPending && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                تحقق من الرمز (Verify)
              </Button>
              <button type="button" className="text-sm text-muted-foreground hover:text-primary" onClick={() => setStep("email")}>
                Resend or change email
              </button>
            </CardFooter>
          </form>
        )}

        {step === "password" && (
          <form onSubmit={submitPassword}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword">كلمة المرور الجديدة (6+ أحرف)</Label>
                <Input id="newPassword" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required dir="ltr" className="text-left" />
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full" disabled={reset.isPending}>
                {reset.isPending && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                تعيين كلمة المرور (Set Password)
              </Button>
            </CardFooter>
          </form>
        )}

        {step === "done" && (
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">يمكنك الآن تسجيل الدخول بكلمة المرور الجديدة.</p>
            <Button className="w-full" onClick={() => setLocation("/login")}>
              تسجيل الدخول (Sign In)
            </Button>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
