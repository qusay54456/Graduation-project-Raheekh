import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import { I18nProvider } from "@/hooks/use-i18n";
import { ThemeProvider } from "@/hooks/use-theme";
import { Layout } from "@/components/layout";
import { ProtectedRoute } from "@/components/protected-route";

import Home from "@/pages/home";
import Login from "@/pages/login";
import Register from "@/pages/register";
import Book from "@/pages/book";
import Payment from "@/pages/payment";
import PaymentSuccess from "@/pages/payment-success";
import MyBookings from "@/pages/my-bookings";
import Dashboard from "@/pages/dashboard";
import Profile from "@/pages/profile";
import ForgotPassword from "@/pages/forgot-password";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/">
          <ProtectedRoute>
            <Home />
          </ProtectedRoute>
        </Route>
        <Route path="/login" component={Login} />
        <Route path="/register" component={Register} />
        <Route path="/forgot-password" component={ForgotPassword} />

        <Route path="/book/:id">
          <ProtectedRoute>
            <Book />
          </ProtectedRoute>
        </Route>

        <Route path="/payment">
          <ProtectedRoute>
            <Payment />
          </ProtectedRoute>
        </Route>

        <Route path="/payment/success">
          <ProtectedRoute>
            <PaymentSuccess />
          </ProtectedRoute>
        </Route>

        <Route path="/my-bookings">
          <ProtectedRoute>
            <MyBookings />
          </ProtectedRoute>
        </Route>

        <Route path="/profile">
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        </Route>

        <Route path="/dashboard">
          <ProtectedRoute requireRole={["supervisor", "admin"]}>
            <Dashboard />
          </ProtectedRoute>
        </Route>

        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

const basePath = (import.meta.env.BASE_URL || "/").replace(/\/$/, "") || "/";

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <I18nProvider>
          <AuthProvider>
            <TooltipProvider>
              <WouterRouter base={basePath === "/" ? "" : basePath}>
                <Router />
              </WouterRouter>
              <Toaster />
            </TooltipProvider>
          </AuthProvider>
        </I18nProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
