import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2 } from "lucide-react";
import type { RegisterBodyRole } from "@workspace/api-client-react/src/generated/api.schemas";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<RegisterBodyRole>("user");
  const [isLoading, setIsLoading] = useState(false);
  
  const { register } = useAuth();
  const [, setLocation] = useLocation();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    register({ data: { name, email, password, role } }, {
      onSuccess: () => {
        setLocation("/");
      },
      onSettled: () => setIsLoading(false)
    });
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
              <Label htmlFor="password">كلمة المرور (Password)</Label>
              <Input 
                id="password" 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required 
                dir="ltr"
                className="text-left"
              />
            </div>
            <div className="space-y-3 pt-2">
              <Label>نوع الحساب (Account Type)</Label>
              <RadioGroup value={role} onValueChange={(val) => setRole(val as RegisterBodyRole)} className="flex gap-4">
                <div className="flex items-center space-x-2 space-x-reverse border rounded-md p-3 flex-1 cursor-pointer hover:bg-muted/50 transition-colors">
                  <RadioGroupItem value="user" id="r-user" />
                  <Label htmlFor="r-user" className="cursor-pointer flex-1">مستخدم (User)</Label>
                </div>
                <div className="flex items-center space-x-2 space-x-reverse border rounded-md p-3 flex-1 cursor-pointer hover:bg-muted/50 transition-colors">
                  <RadioGroupItem value="supervisor" id="r-supervisor" />
                  <Label htmlFor="r-supervisor" className="cursor-pointer flex-1">مشرف (Supervisor)</Label>
                </div>
              </RadioGroup>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={isLoading}>
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
