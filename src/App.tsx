import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ErrorLoggerProvider } from "@/components/ErrorLoggerProvider";
import PageLoader from "@/components/home/PageLoader";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";

// Rotas secundárias carregadas sob demanda (code splitting)
const Jornada = lazy(() => import("./pages/Jornada"));
const Chat = lazy(() => import("./pages/Chat"));
const Controle = lazy(() => import("./pages/Controle"));
const Progresso = lazy(() => import("./pages/Progresso"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const Paywall = lazy(() => import("./pages/Paywall"));
const Settings = lazy(() => import("./pages/Settings"));
const Terms = lazy(() => import("./pages/Terms"));
const Privacy = lazy(() => import("./pages/Privacy"));
const DeleteAccount = lazy(() => import("./pages/DeleteAccount"));
const CancelSubscription = lazy(() => import("./pages/CancelSubscription"));
const FAQ = lazy(() => import("./pages/FAQ"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Install = lazy(() => import("./pages/Install"));
const FeedbackPreview = lazy(() => import("./pages/FeedbackPreview"));
const EmailConfirmed = lazy(() => import("./pages/EmailConfirmed"));
const ErrorLogs = lazy(() => import("./pages/ErrorLogs"));
const Mural = lazy(() => import("./pages/Mural"));


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
              <Route path="/jornada" element={<Jornada />} />
              <Route path="/chat" element={<Chat />} />
              <Route path="/controle" element={<Controle />} />
              <Route path="/progresso" element={<Progresso />} />
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
              <Route path="/mural" element={<Mural />} />
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
