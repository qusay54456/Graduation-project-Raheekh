import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/hooks/use-theme";
import { useTranslation } from "@/hooks/use-i18n";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User as UserIcon, LogOut, LayoutDashboard, Calendar, Sun, Moon, Languages } from "lucide-react";

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { t, lang, dir, toggleLang } = useTranslation();
  const [, setLocation] = useLocation();

  return (
    <div
      className="min-h-screen flex flex-col bg-background text-foreground transition-colors duration-300"
      dir={dir}
    >
      <header className="border-b bg-card sticky top-0 z-50 transition-colors duration-300">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-2">
          <Link
            href="/"
            className="flex items-center gap-2 text-2xl font-bold text-primary"
            data-testid="link-home-logo"
          >
            <span className="text-3xl">🅿</span>
            {t("nav.logo")}
          </Link>

          <nav className="flex items-center gap-1 sm:gap-2">
            {/* Language toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleLang}
              data-testid="button-lang-toggle"
              className="text-xs font-bold gap-1"
              aria-label="Toggle language"
              title={lang === "ar" ? "Switch to English" : "التبديل إلى العربية"}
            >
              <Languages className="h-4 w-4" />
              <span>{t("nav.switchLang")}</span>
            </Button>

            {/* Theme toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              data-testid="button-theme-toggle"
              className="rounded-full"
              aria-label="Toggle theme"
              title={theme === "dark" ? t("nav.themeLight") : t("nav.themeDark")}
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>

            {user ? (
              <>
                <Link
                  href="/my-bookings"
                  className="hidden sm:inline text-sm font-medium hover:text-primary transition-colors mx-2"
                  data-testid="link-my-bookings"
                >
                  {t("nav.bookings")}
                </Link>
                {(user.role === "supervisor" || user.role === "admin") && (
                  <Link
                    href="/dashboard"
                    className="hidden sm:inline text-sm font-medium hover:text-primary transition-colors text-secondary mx-2"
                    data-testid="link-dashboard"
                  >
                    {t("nav.dashboard")}
                  </Link>
                )}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full" data-testid="button-user-menu">
                      <Avatar className="h-8 w-8">
                        {user.profilePhotoUrl ? <AvatarImage src={user.profilePhotoUrl} alt={user.name} /> : null}
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {user.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56" dir={dir}>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{user.name}</p>
                        <p className="text-xs leading-none text-muted-foreground" dir="ltr">{user.email}</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setLocation("/profile")} className="cursor-pointer">
                      <UserIcon className="me-2 h-4 w-4" /> {t("nav.profile")}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setLocation("/my-bookings")} className="cursor-pointer sm:hidden">
                      <Calendar className="me-2 h-4 w-4" /> {t("nav.bookings")}
                    </DropdownMenuItem>
                    {(user.role === "supervisor" || user.role === "admin") && (
                      <DropdownMenuItem onClick={() => setLocation("/dashboard")} className="cursor-pointer sm:hidden">
                        <LayoutDashboard className="me-2 h-4 w-4" /> {t("nav.dashboard")}
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => {
                        logout();
                        setLocation("/login");
                      }}
                      className="text-destructive focus:bg-destructive/10 cursor-pointer"
                      data-testid="menuitem-logout"
                    >
                      <LogOut className="me-2 h-4 w-4" /> {t("nav.logout")}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => setLocation("/login")} data-testid="button-header-login">
                  {t("common.login")}
                </Button>
                <Button onClick={() => setLocation("/register")} data-testid="button-header-register">
                  {t("common.register")}
                </Button>
              </div>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-1 flex flex-col">{children}</main>
    </div>
  );
}
