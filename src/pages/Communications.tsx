import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmailsTab } from "@/components/communications/emails-tab";
import { SmsTab } from "@/components/communications/sms-tab";
import { UserMenu } from "@/components/user-menu";
import { SocialMediaLinks } from "@/components/social-media-links";
import logoImage from "@/assets/theon-logo.avif";

export default function Communications() {
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
          <header className="hidden md:flex h-16 bg-white border-b border-border items-center justify-between px-6 shadow-sm sticky top-0 z-10">
            <h1 className="text-2xl font-bold text-foreground">Communications</h1>
            <UserMenu />
          </header>
          
          <main className="flex-1 p-4 md:p-6">
            <Tabs defaultValue="emails" className="w-full">
              <TabsList className="grid w-full max-w-md grid-cols-2 mb-2">
                <TabsTrigger value="emails">Emails</TabsTrigger>
                <TabsTrigger value="sms">SMS</TabsTrigger>
              </TabsList>
              
              <TabsContent value="emails" className="mt-6">
                <EmailsTab />
              </TabsContent>
              
              <TabsContent value="sms" className="mt-6">
                <SmsTab />
              </TabsContent>
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