import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { UserProvider, useUser } from "@/context/UserContext";
import Index from "./pages/Index";
import Onboarding from "./pages/Onboarding";
import Dashboard from "./pages/Dashboard";
import Workouts from "./pages/Workouts";
import Nutrition from "./pages/Nutrition";
import Progress from "./pages/Progress";
import SOS from "./pages/SOS";
import Gamification from "./pages/Gamification";
import Protocols from "./pages/Protocols";
import Profile from "./pages/Profile";
import FAQ from "./pages/FAQ";
import AskAI from "./pages/AskAI";
import Admin from "./pages/Admin";
import Showcase from "./pages/Showcase";
import Challenges from "./pages/Challenges";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import { Loader2 } from "lucide-react";
import { useIsAdmin } from "@/hooks/useIsAdmin";

const queryClient = new QueryClient();

const AuthGate = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Loader2 className="w-6 h-6 animate-spin text-primary" />
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isOnboarded, profileLoading } = useUser();
  if (profileLoading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Loader2 className="w-6 h-6 animate-spin text-primary" />
    </div>
  );
  if (!isOnboarded) return <Navigate to="/onboarding" replace />;
  return <>{children}</>;
};

const OnboardingGate = ({ children }: { children: React.ReactNode }) => {
  const { isOnboarded, profileLoading } = useUser();
  if (profileLoading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Loader2 className="w-6 h-6 animate-spin text-primary" />
    </div>
  );
  if (isOnboarded) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
};

const AdminGate = ({ children }: { children: React.ReactNode }) => {
  const { isAdmin, loading } = useIsAdmin();
  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Loader2 className="w-6 h-6 animate-spin text-primary" />
    </div>
  );
  if (!isAdmin) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
};

const AppRoutes = () => {
  const { isOnboarded, profileLoading } = useUser();
  return (
    <Routes>
      {/* Public auth routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Protected routes */}
      <Route path="/" element={<RootRedirect />} />
      <Route path="/onboarding" element={<AuthGate><OnboardingGate><Onboarding /></OnboardingGate></AuthGate>} />
      <Route path="/dashboard" element={<AuthGate><ProtectedRoute><Dashboard /></ProtectedRoute></AuthGate>} />
      <Route path="/workouts" element={<AuthGate><ProtectedRoute><Workouts /></ProtectedRoute></AuthGate>} />
      <Route path="/nutrition" element={<AuthGate><ProtectedRoute><Nutrition /></ProtectedRoute></AuthGate>} />
      <Route path="/progress" element={<AuthGate><ProtectedRoute><Progress /></ProtectedRoute></AuthGate>} />
      <Route path="/sos" element={<AuthGate><ProtectedRoute><SOS /></ProtectedRoute></AuthGate>} />
      <Route path="/gamification" element={<AuthGate><ProtectedRoute><Gamification /></ProtectedRoute></AuthGate>} />
      <Route path="/protocols" element={<AuthGate><ProtectedRoute><Protocols /></ProtectedRoute></AuthGate>} />
      <Route path="/showcase" element={<AuthGate><ProtectedRoute><Showcase /></ProtectedRoute></AuthGate>} />
      <Route path="/challenges" element={<AuthGate><ProtectedRoute><Challenges /></ProtectedRoute></AuthGate>} />
      <Route path="/profile" element={<AuthGate><ProtectedRoute><Profile /></ProtectedRoute></AuthGate>} />
      <Route path="/faq" element={<AuthGate><ProtectedRoute><FAQ /></ProtectedRoute></AuthGate>} />
      <Route path="/ask-ai" element={<AuthGate><ProtectedRoute><AskAI /></ProtectedRoute></AuthGate>} />
      <Route path="/admin" element={<AuthGate><AdminGate><Admin /></AdminGate></AuthGate>} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BrowserRouter>
        <AuthProvider>
          <UserProvider>
            <Toaster />
            <Sonner />
            <AppRoutes />
          </UserProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
