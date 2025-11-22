import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ScrollToTop from "./components/ScrollToTop";
import Index from "./pages/Index";
import Services from "./pages/Services";
import VibeToApp from "./pages/VibeToApp";
import VirtualAssistants from "./pages/VirtualAssistants";
import WorkflowAutomation from "./pages/WorkflowAutomation";
import Mission from "./pages/Mission";
import Pricing from "./pages/Pricing";
import ContactPage from "./pages/ContactPage";
import Auth from "./pages/Auth";
import AdminDashboard from "./pages/AdminDashboard";
import AdminContent from "./pages/AdminContent";
import AdminUsers from "./pages/AdminUsers";
import Learn from "./pages/Learn";
import NotFound from "./pages/NotFound";
import ErrorBoundary from "./components/ErrorBoundary";

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ScrollToTop />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/services" element={<Services />} />
            <Route path="/services/vibe-to-app" element={<VibeToApp />} />
            <Route path="/services/virtual-assistants" element={<VirtualAssistants />} />
            <Route path="/services/workflow-automation" element={<WorkflowAutomation />} />
            <Route path="/mission" element={<Mission />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/learn" element={<Learn />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/content" element={<AdminContent />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
