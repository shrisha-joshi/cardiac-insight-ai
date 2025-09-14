import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import LoginForm from "./components/auth/LoginForm";
import SignupForm from "./components/auth/SignupForm";
import Dashboard from "./components/Dashboard";
import ProfilePage from "./components/profile/ProfilePage";
import ChatBot from "./components/chatbot/ChatBot";
import MedicalHistory from "./components/history/MedicalHistory";
import Header from "./components/layout/Header";
import BasicDashboard from "./components/subscription/BasicDashboard";
import PremiumDashboard from "./components/subscription/PremiumDashboard";
import ProfessionalDashboard from "./components/subscription/ProfessionalDashboard";
import DatabaseStatus from "./components/database/DatabaseStatus";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <div className="min-h-screen bg-background">
          <Header />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<LoginForm />} />
            <Route path="/signup" element={<SignupForm />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/chatbot" element={<ChatBot />} />
            <Route path="/history" element={<MedicalHistory />} />
            <Route path="/basic-dashboard" element={<BasicDashboard />} />
            <Route path="/premium-dashboard" element={<PremiumDashboard />} />
            <Route path="/professional-dashboard" element={<ProfessionalDashboard />} />
            <Route path="/database-status" element={<DatabaseStatus />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
