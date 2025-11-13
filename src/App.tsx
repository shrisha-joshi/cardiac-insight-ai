import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/contexts/ThemeContext";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import LoginForm from "./components/auth/LoginForm";
import SignupForm from "./components/auth/SignupForm";
import ForgotPasswordForm from "./components/auth/ForgotPasswordForm";
import ResetPasswordForm from "./components/auth/ResetPasswordForm";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import Dashboard from "./components/Dashboard";
import ProfilePage from "./components/profile/ProfilePage";
import ChatBot from "./components/chatbot/ChatBot";
import MedicalHistory from "./components/history/MedicalHistory";
import Header from "./components/layout/Header";
import BasicDashboard from "./components/subscription/BasicDashboard";
import PremiumDashboard from "./components/subscription/PremiumDashboard";
import ProfessionalDashboard from "./components/subscription/ProfessionalDashboard";
import DatabaseStatus from "./components/database/DatabaseStatus";
import HealthSimulationPage from "./pages/HealthSimulationPage";
import SettingsPage from "./pages/SettingsPage";
import { DataLoadingDashboard } from "./components/DataLoadingDashboard";
import { MonitoringDashboard } from "./components/monitoring/MonitoringDashboard";

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
        </div>
      </BrowserRouter>
    </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
