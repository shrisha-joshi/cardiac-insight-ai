import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import Header from "./components/layout/Header";
import { LoadingSpinner } from "./components/ui/loading-spinner";

// Phase 8: Code Splitting - Lazy load components for better performance
// Critical routes (loaded immediately)
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

// Authentication pages (lazy loaded)
const LoginForm = lazy(() => import("./components/auth/LoginForm"));
const SignupForm = lazy(() => import("./components/auth/SignupForm"));
const ForgotPasswordForm = lazy(() => import("./components/auth/ForgotPasswordForm"));
const ResetPasswordForm = lazy(() => import("./components/auth/ResetPasswordForm"));

// Protected pages (lazy loaded)
const Dashboard = lazy(() => import("./components/Dashboard"));
const ProfilePage = lazy(() => import("./components/profile/ProfilePage"));
const ChatBot = lazy(() => import("./components/chatbot/ChatBot"));
const MedicalHistory = lazy(() => import("./components/history/MedicalHistory"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));

// Subscription pages (lazy loaded)
const BasicDashboard = lazy(() => import("./components/subscription/BasicDashboard"));
const PremiumDashboard = lazy(() => import("./components/subscription/PremiumDashboard"));
const ProfessionalDashboard = lazy(() => import("./components/subscription/ProfessionalDashboard"));

// Admin/Technical pages (lazy loaded)
const DatabaseStatus = lazy(() => import("./components/database/DatabaseStatus"));
const HealthSimulationPage = lazy(() => import("./pages/HealthSimulationPage"));
const DataLoadingDashboard = lazy(() => import("./components/DataLoadingDashboard").then(m => ({ default: m.DataLoadingDashboard })));
const MonitoringDashboard = lazy(() => import("./components/monitoring/MonitoringDashboard").then(m => ({ default: m.MonitoringDashboard })));

// Phase 9: User Feedback Widget (lazy loaded)
const FeedbackWidget = lazy(() => import("./components/feedback/FeedbackWidget").then(m => ({ default: m.FeedbackWidget })));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <div className="min-h-screen bg-background">
            <Header />
            <Suspense fallback={<LoadingSpinner />}>
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Index />} />
                <Route path="/login" element={<LoginForm />} />
                <Route path="/signup" element={<SignupForm />} />
                <Route path="/forgot-password" element={<ForgotPasswordForm />} />
                <Route path="/reset-password" element={<ResetPasswordForm />} />
            
            {/* Protected Routes - Require Authentication */}
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/profile" 
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/chatbot" 
              element={
                <ProtectedRoute>
                  <ChatBot />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/history" 
              element={
                <ProtectedRoute>
                  <MedicalHistory />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/settings" 
              element={
                <ProtectedRoute>
                  <SettingsPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/basic-dashboard" 
              element={
                <ProtectedRoute>
                  <BasicDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/premium-dashboard" 
              element={
                <ProtectedRoute>
                  <PremiumDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/professional-dashboard" 
              element={
                <ProtectedRoute>
                  <ProfessionalDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/database-status" 
              element={
                <ProtectedRoute>
                  <DatabaseStatus />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/health-simulation" 
              element={<HealthSimulationPage />} 
            />
            <Route 
              path="/data-loading" 
              element={
                <ProtectedRoute>
                  <DataLoadingDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/monitoring" 
              element={
                <ProtectedRoute>
                  <MonitoringDashboard />
                </ProtectedRoute>
              } 
            />
            
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
            
            {/* Phase 9: Feedback Widget - Available on all pages */}
            <Suspense fallback={null}>
              <FeedbackWidget />
            </Suspense>
          </div>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
