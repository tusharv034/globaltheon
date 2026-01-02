import { useEffect, useRef, useState } from "react";
import { Navigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { OverviewCards } from "@/components/dashboard/overview-cards";
import { SalesMetrics } from "@/components/dashboard/sales-metrics";
import { AffiliateAnalytics } from "@/components/dashboard/affiliate-analytics";
import { CustomerInsights } from "@/components/dashboard/customer-insights";
import { UserMenu } from "@/components/user-menu";
import { SocialMediaLinks } from "@/components/social-media-links";
import { AnnouncementPopup } from "@/components/announcements/announcement-popup";
import { useUserRole } from "@/hooks/use-user-role";
import { useModulePermissions } from "@/hooks/use-module-permissions";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Building2, Construction } from "lucide-react";
import logoImage from "@/assets/theon-logo.avif";
import { useAuthStore } from "@/store/useAuthStore";
import { readCompany } from "@/api/company";

const Index = () => {

  // fetch token and user(permissions, role, data)
  const { user, announcementMounted } = useAuthStore();

  const [mountedState, setMountedState] = useState(false);
  
  const updateAuthAnnouncement = useAuthStore((state) => state.updateAuthAnnouncement);

  useEffect(() => {

    if (!announcementMounted) {
      updateAuthAnnouncement(true);
     
      setMountedState(true);
    }
  }, [mountedState])

  // get company details
  // <CompanySettings>
  const { data: companySettings, isLoading, isError, error } = useQuery({
    queryKey: ["company-settings"] as const,
    queryFn: async () => {
      const data = await readCompany();
      console.log("data in company settings is ", data.data.data);
      return data.data.data;
    }
  });

  // If user.role === "affiliate", check there KYC and redirect them accordingly
  useEffect(() => {

    if (user && user.role === "affiliate") {
    
      // check KYC details and redirect to respective page
    }

  }, [user]);

  // Redirect Non Admins
  if (user && user.role !== "admin" && user.role !== "super_admin" && user.role !== "affiliate") {
    return <Navigate to="/auth" replace />;
  }

  //* debug based on given User permissions
  // Check permissions for each section - Super Admins and regular Admins have full access by default 
  const canViewAnalytics = user.role === "super_admin" || user.role === "admin" || true;
  const canViewAffiliateAnalytics = user.role === "super_admin" || user.role === "admin" || user.role === "affiliate" || true;
  const canViewCustomerInsights = user.role === "super_admin" || user.role === "admin" || user.role === "affiliate" || true;

  /* 
  
  // if (isLoading) {
  //   return (
  //     <div className="min-h-screen flex items-center justify-center bg-dashboard-bg">
  //       <Loader2 className="h-8 w-8 animate-spin" />
  //     </div>
  //   );
  // }
      
  */
  if (isError) {
    return (
      <>
        Error is {error}
      </>
    )
  }

  return (
    <>

      <SidebarProvider defaultOpen={true}>
        <div className="min-h-screen flex w-full bg-dashboard-bg">

          <AppSidebar />
          {mountedState && (
            <AnnouncementPopup />
          )}

          <div className="flex-1 flex flex-col w-full">

            {/* Mobile Header */}
            <header className="md:hidden h-14 flex items-center justify-between gap-3 px-4 border-b border-white/10 sticky top-0 z-10" style={{ backgroundColor: "#1a1f2e" }}>
              <div className="flex items-center gap-3">
                <SidebarTrigger className="text-white hover:bg-white/10" />
                <img src={logoImage} alt="Theon Global" className="h-8 w-auto" />
              </div>
              <UserMenu />
            </header>

            {/* Desktop Header */}
            <header className="hidden md:flex h-16 bg-white border-b border-border items-center justify-between gap-4 px-6 shadow-sm sticky top-0 z-10">
              <DashboardHeader />
              <UserMenu />
            </header>

            <main className="flex-1 p-4 md:p-6 max-w-7xl mx-auto w-full space-y-6 md:space-y-8">
              {canViewAnalytics && (
                <>
                  <div className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 md:h-6 md:w-6 text-primary" />
                    <h2 className="text-xl md:text-2xl font-bold text-foreground">
                      {companySettings?.companyName || 'Company'} Analytics Overview
                    </h2>
                  </div>
                  <OverviewCards />
                  <SalesMetrics />
                </>
              )}

              {canViewAffiliateAnalytics && (
                <AffiliateAnalytics />
              )}

              {canViewCustomerInsights && (
                <CustomerInsights />
              )}
            </main>

            <footer className="px-4 md:px-6 py-4 border-t border-border flex flex-col sm:flex-row items-center justify-center sm:justify-between gap-3">
              <p className="text-sm text-muted-foreground">© {new Date().getFullYear()}, Theon Global</p>
              <SocialMediaLinks />
            </footer>

          </div>

        </div>
      </SidebarProvider>
    </>
  );
};

export default Index;
