import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ErrorLoggerProvider } from "@/components/ErrorLoggerProvider";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Onboarding from "./pages/Onboarding";
import Paywall from "./pages/Paywall";
import Settings from "./pages/Settings";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import DeleteAccount from "./pages/DeleteAccount";
import CancelSubscription from "./pages/CancelSubscription";
import FAQ from "./pages/FAQ";
import NotFound from "./pages/NotFound";
import Install from "./pages/Install";
import EmailConfirmed from "./pages/EmailConfirmed";
import ErrorLogs from "./pages/ErrorLogs";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      refetchOnWindowFocus: false,
      throwOnError: false,
    },
    mutations: {
      retry: 1,
      throwOnError: false,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <ErrorLoggerProvider>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/onboarding" element={<Onboarding />} />
              <Route path="/paywall" element={<Paywall />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/install" element={<Install />} />
              <Route path="/email-confirmed" element={<EmailConfirmed />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/delete-account" element={<DeleteAccount />} />
              <Route path="/cancel-subscription" element={<CancelSubscription />} />
              <Route path="/faq" element={<FAQ />} />
              <Route path="/error-logs" element={<ErrorLogs />} />
              <Route path="/feedback-preview" element={<FeedbackPreview />} />
              <Route path="/404" element={<NotFound />} />
              <Route path="*" element={<Navigate to="/404" replace />} />
            </Routes>
          </ErrorLoggerProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
