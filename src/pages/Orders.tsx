import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { UserMenu } from "@/components/user-menu";
import { SocialMediaLinks } from "@/components/social-media-links";
import { OrderTable } from "@/components/orders/order-table";
import { useEffect } from "react";
import { toast } from "sonner";
import { backfillOrderNotesFromAffiliateNotes } from "@/lib/order-notes-backfill";
import logoImage from "@/assets/theon-logo.avif";
import { Construction } from "lucide-react";

const Orders = () => {
  useEffect(() => {
    const runBackfill = async () => {
      const flagKey = "orderNotesBackfilled_v3";
      if (localStorage.getItem(flagKey)) return;
      try {
        toast.loading("Preparing Notes & History...");
        const res = await backfillOrderNotesFromAffiliateNotes();
        toast.dismiss();
        if (res.inserted > 0) {
          toast.success(`Added ${res.inserted} order note${res.inserted === 1 ? "" : "s"}`);
        }
        localStorage.setItem(flagKey, "true");
      } catch (e) {
        toast.dismiss();
        // Silent fail to not block Orders page
      }
    };
    runBackfill();
  }, []);

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen flex w-full bg-dashboard-bg">

        <AppSidebar />

        <div className="flex-1 flex flex-col w-full overflow-x-hidden relative">

          {/* Construction div */}
          {/* /30 backdrop-blur-sm */}
          {/* <div className="absolute z-10 min-h-screen min-w-full bg-white cursor-not-allowed flex justify-center items-start pt-36 ">
            <div className="flex items-center justify-center p-12 bg-white rounded-3xl  ">
              <div className="text-center space-y-4">
                <Construction className="h-24 w-24 text-muted-foreground mx-auto" />
                <h3 className="text-2xl font-bold text-foreground">Coming Soon</h3>
                <p className="text-muted-foreground max-w-md">
                  Orders is currently under development. Check back soon for updates.
                </p>
              </div>
            </div>
          </div> */}
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
            <h1 className="text-xl font-semibold text-foreground">Orders</h1>
            <UserMenu />
          </header>

          <main className="flex-1 p-4 md:p-6">
            <div className="overflow-x-auto">
              <OrderTable />
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

export default Orders;
