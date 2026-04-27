import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground" dir="rtl">
      <header className="border-b bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-2xl font-bold text-primary">
            <span className="text-3xl">🅿</span>
            ParkNow
          </Link>

          <nav className="flex items-center gap-4">
            {user ? (
              <>
                <Link href="/my-bookings" className="text-sm font-medium hover:text-primary transition-colors">
                  حجوزاتي <span className="text-xs text-muted-foreground ml-1">(My Bookings)</span>
                </Link>
                {user.role === "supervisor" && (
                  <Link href="/dashboard" className="text-sm font-medium hover:text-primary transition-colors text-secondary">
                    لوحة التحكم <span className="text-xs ml-1">(Dashboard)</span>
                  </Link>
                )}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {user.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56" dir="rtl">
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{user.name}</p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {user.email}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => {
                      logout();
                      setLocation("/login");
                    }} className="text-destructive focus:bg-destructive/10 cursor-pointer">
                      تسجيل الخروج (Logout)
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => setLocation("/login")}>
                  دخول (Login)
                </Button>
                <Button onClick={() => setLocation("/register")}>
                  حساب جديد (Register)
                </Button>
              </div>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-1 flex flex-col">
        {children}
      </main>
    </div>
  );
}
