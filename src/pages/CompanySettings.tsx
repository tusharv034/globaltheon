import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CompanyTab } from "@/components/settings/company-tab";
import { UsersTab } from "@/components/settings/users-tab";
import { CompensationTab } from "@/components/settings/compensation-tab";
import { SocialMediaTab } from "@/components/settings/social-media-tab";
import { AnnouncementsTab } from "@/components/settings/announcements-tab";
import { DeletedRecordsTab } from "@/components/settings/deleted-records-tab";
import { IntegrationsTab } from "@/components/settings/integrations-tab";
import { UserMenu } from "@/components/user-menu";
import { SocialMediaLinks } from "@/components/social-media-links";
import { useModulePermissions } from "@/hooks/use-module-permissions";
import logoImage from "@/assets/theon-logo.avif";

export default function CompanySettings() {
  const { hasPermission } = useModulePermissions();

  // // Check permissions for each tab - Super Admins and regular Admins have full access
  const canAccessCompany = hasPermission("company_settings_permissions", "company", "view");
  const canAccessUsers = hasPermission("company_settings_permissions", "users", "view");
  const canAccessCompensation = hasPermission("company_settings_permissions", "compensation", "view");
  const canAccessIntegrations = hasPermission("company_settings_permissions", "integrations", "view");
  const canAccessSocialMedia = hasPermission("company_settings_permissions", "social_media", "view");
  const canAccessAnnouncements = hasPermission("company_settings_permissions", "announcements", "view");
  const canAccessDeleted = hasPermission("company_settings_permissions", "deleted_folder", "view");

  const availableTabs = [
    canAccessCompany && { value: "company", label: "Company" },
    canAccessUsers && { value: "users", label: "Users" },
    canAccessCompensation && { value: "compensation", label: "Compensation" },
    canAccessIntegrations && { value: "integrations", label: "Integrations" },
    canAccessSocialMedia && { value: "social-media", label: "Social Media" },
    canAccessAnnouncements && { value: "announcements", label: "Announcements" },
    canAccessDeleted && { value: "deleted", label: "Deleted Folder" },
  ].filter(Boolean) as Array<{ value: string; label: string }>;

  const defaultTab = availableTabs[0]?.value || "company";
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />

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
          <header className="hidden md:flex h-16 bg-background border-b border-border items-center justify-between px-6 shadow-sm sticky top-0 z-10">
            <h1 className="text-2xl font-bold text-foreground">Company Settings</h1>
            <UserMenu />
          </header>

          <main className="flex-1 p-4 md:p-6">
            <Tabs defaultValue={defaultTab} className="w-full">
              <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0 pb-1">
                <TabsList className="inline-flex md:grid md:w-full gap-1 mb-2" style={{ gridTemplateColumns: `repeat(${availableTabs.length}, minmax(0, 1fr))` }}>
                  {availableTabs.map((tab) => (
                    <TabsTrigger key={tab.value} value={tab.value} className="whitespace-nowrap flex-shrink-0">
                      {tab.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>

              {canAccessCompany && (
                <TabsContent value="company" className="mt-6">
                  <CompanyTab />
                </TabsContent>
              )}

              {canAccessUsers && (
                <TabsContent value="users" className="mt-6">
                  <UsersTab />
                </TabsContent>
              )}

              {canAccessCompensation && (
                <TabsContent value="compensation" className="mt-6">
                  <CompensationTab />
                </TabsContent>
              )}

              {canAccessIntegrations && (
                <TabsContent value="integrations" className="mt-6">
                  <IntegrationsTab />
                </TabsContent>
              )}

              {canAccessSocialMedia && (
                <TabsContent value="social-media" className="mt-6">
                  <SocialMediaTab />
                </TabsContent>
              )}

              {canAccessAnnouncements && (
                <TabsContent value="announcements" className="mt-6">
                  <AnnouncementsTab />
                </TabsContent>
              )}

              {canAccessDeleted && (
                <TabsContent value="deleted" className="mt-6">
                  <DeletedRecordsTab />
                </TabsContent>
              )}
            </Tabs>
          </main>

          <footer className="px-4 md:px-6 py-4 border-t border-border flex flex-col sm:flex-row items-center justify-center sm:justify-between gap-3">
            <p className="text-sm text-muted-foreground">© {new Date().getFullYear()}, Theon Global</p>
            <SocialMediaLinks />
          </footer>
        </div>
      </div>
    </SidebarProvider>
  );
}