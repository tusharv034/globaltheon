import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { UserMenu } from "@/components/user-menu";
import { SocialMediaLinks } from "@/components/social-media-links";
import { AffiliateGenealogyTree } from "@/components/affiliates/affiliate-genealogy-tree";
import logoImage from "@/assets/theon-logo.avif";

const Genealogy = () => {
  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen flex w-full bg-dashboard-bg">
        <AppSidebar />

        {/* <div className="flex-1 flex flex-col w-full overflow-x-hidden relative"> */}
        <div className="flex-1 flex flex-col w-full overflow-x-hidden">

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
            <h1 className="text-xl font-semibold text-foreground">Genealogy</h1>
            <UserMenu />
          </header>

          <main className="flex-1 p-4 md:p-6">
            <div className="overflow-auto">
              <AffiliateGenealogyTree />
            </div>
          </main>

          <footer className="px-4 md:px-6 py-4 border-t border-border flex flex-col sm:flex-row items-center justify-center sm:justify-between gap-3">
            <p className="text-sm text-muted-foreground">© {new Date().getFullYear()}, Theon Global</p>
            <SocialMediaLinks />
          </footer>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Genealogy;
