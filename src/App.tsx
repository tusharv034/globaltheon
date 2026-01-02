import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { AffiliateProtectedRoute } from "@/components/auth/affiliate-protected-route";
import { AffiliateRoute } from "@/components/auth/affiliate-route";
import { AdminProtectedRoute } from "@/components/auth/admin-protected-route";
import { ModuleProtectedRoute } from "@/components/auth/module-protected-route";
import Index from "./pages/Index";
import AffiliateIndex from "./pages/AffiliateIndex";
import Affiliates from "./pages/Affiliates";
import Customers from "./pages/Customers";
import Orders from "./pages/Orders";
import Commissions from "./pages/Commissions";
import CompanySettings from "./pages/CompanySettings";
import Communications from "./pages/Communications";
import AccountProfile from "./pages/AccountProfile";
import Genealogy from "./pages/Genealogy";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import KYCCompletion from "./pages/KYCCompletion";
import KYCReview from "./pages/KYCReview";
import AddAdmins from "./pages/AddAdmins";
import SOW from "./pages/SOW";
import PaymentMethod from "./pages/PaymentMethod";
import MyTeam from "./pages/MyTeam";
import NotFound from "./pages/NotFound";
import { CompletedKYCRoute } from "./components/auth/completed-kyc-route";
import Test from "./pages/Test";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>

          <Route path="/auth" element={<Auth />} />

          <Route path="/reset-password" element={<ResetPassword />} />

          <Route path="/kyc-completion" element={<AffiliateProtectedRoute><KYCCompletion /></AffiliateProtectedRoute>} />

          <Route path="/" element={<AdminProtectedRoute><Index /></AdminProtectedRoute>} />

          <Route path="/kyc-review" element={
            <AdminProtectedRoute>
              <KYCReview />
            </AdminProtectedRoute>
          } />
          <Route path="/add-admins" element={

            <AdminProtectedRoute>
              <AddAdmins />
            </AdminProtectedRoute>

          } />

          {/* Make the below protected route and then Modul protected route */}
          <Route path="/affiliate-dashboard" element={
            <AffiliateProtectedRoute>
              <AffiliateIndex />
            </AffiliateProtectedRoute>
          } />

          {/* Make the below protected route */}
          <Route path="/my-team" element={
            <AffiliateProtectedRoute>
              <MyTeam />
            </AffiliateProtectedRoute>} />

          <Route path="/affiliates" element={
            <ProtectedRoute>
              <ModuleProtectedRoute moduleName="module_permissions" sectionName="affiliates">
                <Affiliates />
              </ModuleProtectedRoute>
            </ProtectedRoute>
          } />

          <Route path="/customers" element={
            <ProtectedRoute>
              <ModuleProtectedRoute moduleName="module_permissions" sectionName="customers" >
                <Customers />
              </ModuleProtectedRoute>
            </ProtectedRoute>
          } />

          <Route path="/orders" element={
            <ProtectedRoute>
              <ModuleProtectedRoute moduleName="module_permissions" sectionName="orders">
                <Orders />
              </ModuleProtectedRoute>
            </ProtectedRoute>
          } />

          <Route path="/commissions" element={
            <ProtectedRoute>
              <ModuleProtectedRoute moduleName="module_permissions" sectionName="commissions">
                <Commissions />
              </ModuleProtectedRoute>
            </ProtectedRoute>
          } />

          <Route path="/payment-method" element={<AffiliateProtectedRoute><PaymentMethod /></AffiliateProtectedRoute>} />

          <Route path="/genealogy" element={
            <ProtectedRoute>
              <ModuleProtectedRoute moduleName="module_permissions" sectionName="genealogy">
                <Genealogy />
              </ModuleProtectedRoute>
            </ProtectedRoute>
          } />

          <Route path="/account-profile" element={<ProtectedRoute><AccountProfile /></ProtectedRoute>} />

          <Route path="/company-settings" element={
            <ProtectedRoute>
              <AdminProtectedRoute>
                <CompanySettings />
              </AdminProtectedRoute>
            </ProtectedRoute>
          } />

          <Route path="/communications" element={
            <ProtectedRoute>
              <AdminProtectedRoute>
                <Communications />
              </AdminProtectedRoute>
            </ProtectedRoute>
          } />

          <Route path="/sow" element={
            <ProtectedRoute><SOW /></ProtectedRoute>
          } />

          <Route path="/test" element={
            <ProtectedRoute><Test /></ProtectedRoute>
          } />

          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
