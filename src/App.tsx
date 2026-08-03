import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import ScrollToTop from "./components/ScrollToTop";
import ScrollToTopButton from "./components/ScrollToTopButton";
import PageLoader from "./components/PageLoader";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";

const Index = lazy(() => import("./pages/Index"));
const Services = lazy(() => import("./pages/Services"));
const ServiceDetail = lazy(() => import("./pages/ServiceDetail"));
const VibeToApp = lazy(() => import("./pages/VibeToApp"));
const VirtualAssistants = lazy(() => import("./pages/VirtualAssistants"));
const WorkflowAutomation = lazy(() => import("./pages/WorkflowAutomation"));
const WebDevelopment = lazy(() => import("./pages/WebDevelopment"));
const AppDevelopment = lazy(() => import("./pages/AppDevelopment"));
const SaasDevelopment = lazy(() => import("./pages/SaasDevelopment"));
const Automation = lazy(() => import("./pages/Automation"));
const Mission = lazy(() => import("./pages/Mission"));
const Company = lazy(() => import("./pages/Company"));
const Pricing = lazy(() => import("./pages/Pricing"));
const ContactPage = lazy(() => import("./pages/ContactPage"));
const Auth = lazy(() => import("./pages/Auth"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const AdminOverview = lazy(() => import("./pages/AdminOverview"));
const AdminSubscriptions = lazy(() => import("./pages/AdminSubscriptions"));
const AdminTools = lazy(() => import("./pages/AdminTools"));
const AdminAuditLog = lazy(() => import("./pages/AdminAuditLog"));
const AdminContactSubmissions = lazy(() => import("./pages/AdminContactSubmissions"));
const AdminContent = lazy(() => import("./pages/AdminContent"));
const AdminUsers = lazy(() => import("./pages/AdminUsers"));
const AdminPricing = lazy(() => import("./pages/AdminPricing"));
const AdminServices = lazy(() => import("./pages/AdminServices"));
const AdminLearn = lazy(() => import("./pages/AdminLearn"));
const AdminContact = lazy(() => import("./pages/AdminContact"));
const AdminNewsletter = lazy(() => import("./pages/AdminNewsletter"));
const Learn = lazy(() => import("./pages/Learn"));
const ArticleDetail = lazy(() => import("./pages/ArticleDetail"));
const TermsOfUse = lazy(() => import("./pages/TermsOfUse"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const Tools = lazy(() => import("./pages/Tools"));
const ToolDetail = lazy(() => import("./pages/ToolDetail"));
const Billing = lazy(() => import("./pages/Billing"));
const Account = lazy(() => import("./pages/Account"));
const AccountNotifications = lazy(() => import("./pages/AccountNotifications"));
const NotFound = lazy(() => import("./pages/NotFound"));
import ErrorBoundary from "./components/ErrorBoundary";

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <Analytics />
          <SpeedInsights />
          <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <ScrollToTop />
            <ScrollToTopButton />
            <Suspense fallback={<PageLoader pageName="Loading..." />}>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/company" element={<Company />} />
                <Route path="/services" element={<Services />} />
                <Route path="/services/:slug" element={<ServiceDetail />} />
                <Route path="/services/vibe-to-app" element={<VibeToApp />} />
                <Route path="/services/virtual-assistants" element={<VirtualAssistants />} />
                <Route path="/services/workflow-automation" element={<WorkflowAutomation />} />
                <Route path="/services/web-development" element={<WebDevelopment />} />
                <Route path="/services/app-development" element={<AppDevelopment />} />
                <Route path="/services/saas-development" element={<SaasDevelopment />} />
                <Route path="/services/automation" element={<Automation />} />
                <Route path="/mission" element={<Mission />} />
                <Route path="/pricing" element={<Navigate to="/" replace />} />
                <Route path="/contact" element={<ContactPage />} />
                <Route path="/learn" element={<Navigate to="/" replace />} />
                <Route path="/learn/:slug" element={<ArticleDetail />} />
                <Route path="/terms" element={<TermsOfUse />} />
                <Route path="/privacy" element={<PrivacyPolicy />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/admin" element={<AdminOverview />} />
                <Route path="/admin/subscriptions" element={<AdminSubscriptions />} />
                <Route path="/admin/tools" element={<AdminTools />} />
                <Route path="/admin/audit-log" element={<AdminAuditLog />} />
                <Route path="/admin/contact-submissions" element={<AdminContactSubmissions />} />
                <Route path="/admin/content" element={<AdminContent />} />
                <Route path="/admin/users" element={<AdminUsers />} />
                <Route path="/admin/pricing" element={<AdminPricing />} />
                <Route path="/admin/services" element={<AdminServices />} />
                <Route path="/admin/learn" element={<AdminLearn />} />
                <Route path="/admin/contacts" element={<AdminContact />} />
                <Route path="/admin/newsletter" element={<AdminNewsletter />} />
                <Route path="/tools" element={<Tools />} />
                <Route path="/tools/:slug" element={<ToolDetail />} />
                <Route path="/billing" element={<Billing />} />
                <Route path="/account" element={<Account />} />
                <Route path="/account/notifications" element={<AccountNotifications />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </HelmetProvider>
  </ErrorBoundary>
);

export default App;

