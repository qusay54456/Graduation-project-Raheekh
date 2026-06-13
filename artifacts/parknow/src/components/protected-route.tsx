import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

type Role = "user" | "supervisor" | "admin";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireRole?: Role | Role[];
}

function isAllowedRole(actual: string, required: Role | Role[] | undefined): boolean {
  if (!required) return true;
  return Array.isArray(required) ? required.includes(actual as Role) : actual === required;
}

export function ProtectedRoute({ children, requireRole }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        setLocation("/login");
      } else if (!isAllowedRole(user.role, requireRole)) {
        setLocation("/");
      }
    }
  }, [user, isLoading, setLocation, requireRole]);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;
  if (!isAllowedRole(user.role, requireRole)) return null;

  return <>{children}</>;
}
