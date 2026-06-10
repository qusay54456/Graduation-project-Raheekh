import { Link, useLocation } from "wouter";
import { useTranslation } from "@/hooks/use-i18n";
import { useTheme } from "@/hooks/use-theme";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Moon, Sun, LogOut, User, LayoutDashboard, Car, Map as MapIcon } from "lucide-react";

export function Layout({ children }: { children: React.ReactNode }) {
  const { t, lang, setLang, dir } = useTranslation();
  const { theme, setTheme } = useTheme();
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();

  const handleLogout = async () => {
    try {
      await logout();
      setLocation("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <div className="min-h-screen flex flex-col" dir={dir}>
      <header className="h-16 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 h-full flex items-center justify-between">
          <Link href="/" className="font-bold text-xl text-primary flex items-center gap-2">
            <Car className="h-5 w-5" />
            ParkNow
          </Link>
          
          <nav className="flex items-center gap-2">
            {/* زر تبديل اللغة */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLang(lang === "ar" ? "en" : "ar")}
              className="font-bold"
            >
              {lang === "ar" ? "EN" : "ع"}
            </Button>

            {/* زر تبديل الثيم */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>

            {user ? (
              <>
                {/* رابط حجوزاتي */}
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/my-bookings">
                    {t("nav.bookings")}
                  </Link>
                </Button>

                {/* لوحة التحكم للمشرفين */}
                {(user.role === "supervisor" || user.role === "admin") && (
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/dashboard">
                      <LayoutDashboard className="h-4 w-4 me-1" />
                      {t("nav.dashboard")}
                    </Link>
                  </Button>
                )}

                {/* رابط البروفايل باسم المستخدم */}
                <Button variant="outline" size="sm" asChild className="border-primary/50">
                  <Link href="/profile">
                    <User className="h-4 w-4 me-1" />
                    {user.name}
                  </Link>
                </Button>

                {/* ✅ زر تسجيل الخروج المحسّن */}
                <button
                  onClick={handleLogout}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "6px 12px",
                    borderRadius: "6px",
                    fontSize: "14px",
                    fontWeight: "600",
                    backgroundColor: "#ef4444",
                    color: "#ffffff",
                    border: "none",
                    cursor: "pointer",
                    boxShadow: "0 2px 8px rgba(239,68,68,0.4)",
                    transition: "all 0.15s ease",
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#dc2626";
                    (e.currentTarget as HTMLButtonElement).style.transform = "scale(1.05)";
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#ef4444";
                    (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)";
                  }}
                  onMouseDown={e => {
                    (e.currentTarget as HTMLButtonElement).style.transform = "scale(0.95)";
                  }}
                  onMouseUp={e => {
                    (e.currentTarget as HTMLButtonElement).style.transform = "scale(1.05)";
                  }}
                >
                  <LogOut style={{ width: "16px", height: "16px" }} />
                  {t("nav.logout")}
                </button>
              </>
            ) : (
              <Button variant="default" size="sm" onClick={() => setLocation("/login")}>
                {t("common.login")}
              </Button>
            )}
          </nav>
        </div>
      </header>
      <main className="flex-1 flex flex-col">{children}</main>
    </div>
  );
}