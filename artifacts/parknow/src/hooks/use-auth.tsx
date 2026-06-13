import { createContext, useContext, useEffect, useState } from "react";
import { useGetMe, getGetMeQueryKey, useLogin, useLogout, useRegister } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import type { User, LoginBody, RegisterBody } from "@workspace/api-client-react/src/generated/api.schemas";
import { useToast } from "@/hooks/use-toast";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: ReturnType<typeof useLogin>["mutate"];
  register: ReturnType<typeof useRegister>["mutate"];
  logout: ReturnType<typeof useLogout>["mutate"];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data: user, isLoading: isUserLoading } = useGetMe({
    query: {
      retry: false,
    }
  });

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const extractApiError = (error: any, fallback: string): string => {
    // ApiError from the generated client puts the parsed JSON body on `.data`.
    const fromBody =
      error?.data?.error ??
      error?.data?.message ??
      error?.response?.data?.error;
    if (typeof fromBody === "string" && fromBody.length > 0) return fromBody;
    if (typeof error?.message === "string" && error.message.length > 0 && !error.message.startsWith("HTTP")) {
      return error.message;
    }
    return fallback;
  };

  const loginMutation = useLogin({
    mutation: {
      onSuccess: (data) => {
        queryClient.setQueryData(getGetMeQueryKey(), data.user);
        toast({
          title: "تم تسجيل الدخول",
          description: "Login successful",
        });
      },
      onError: (error: any) => {
        toast({
          title: "خطأ في تسجيل الدخول",
          description: extractApiError(error, "Login failed"),
          variant: "destructive",
        });
      }
    }
  });

  const registerMutation = useRegister({
    mutation: {
      onSuccess: (data) => {
        queryClient.setQueryData(getGetMeQueryKey(), data.user);
        toast({
          title: "تم إنشاء الحساب",
          description: "Registration successful",
        });
      },
      onError: (error: any) => {
        toast({
          title: "خطأ في إنشاء الحساب",
          description: extractApiError(error, "Registration failed"),
          variant: "destructive",
        });
      }
    }
  });

  const logoutMutation = useLogout({
    mutation: {
      onSuccess: () => {
        queryClient.setQueryData(getGetMeQueryKey(), null);
        toast({
          title: "تم تسجيل الخروج",
          description: "Logged out successfully",
        });
      }
    }
  });

  return (
    <AuthContext.Provider value={{
      user: user || null,
      isLoading: isUserLoading,
      login: loginMutation.mutate,
      register: registerMutation.mutate,
      logout: logoutMutation.mutate
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
