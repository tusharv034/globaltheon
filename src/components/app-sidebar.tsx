import { LayoutDashboard, Users, UserCheck, ShoppingCart, CreditCard, User, Settings, MessageSquare, LogOut, GitBranch, FileText, Store, Wallet, HelpCircle } from "lucide-react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useUserRole } from "@/hooks/use-user-role";
import { useModulePermissions } from "@/hooks/use-module-permissions";
import { useState, useEffect } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import logoImage from "@/assets/theon-logo.avif";
import { useAuthStore, useShopifyStore } from "@/store/useAuthStore";
import { useQueryClient } from "@tanstack/react-query";

const adminMenuItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard, sectionName: null },
  { title: "Affiliates", url: "/affiliates", icon: Users, sectionName: "affiliates" },
  { title: "Customers", url: "/customers", icon: UserCheck, sectionName: "customers" },
  { title: "Orders", url: "/orders", icon: ShoppingCart, sectionName: "orders" },
  { title: "Commissions", url: "/commissions", icon: CreditCard, sectionName: "commissions" },
  { title: "Genealogy", url: "/genealogy", icon: GitBranch, sectionName: "genealogy" },
];

const affiliateMenuItems = [
  { title: "Dashboard", url: "/affiliate-dashboard", icon: LayoutDashboard },
  { title: "My Team", url: "/my-team", icon: Users },
  { title: "My Affiliates", url: "/affiliates", icon: Users },
  { title: "My Customers", url: "/customers", icon: UserCheck },
  { title: "Orders", url: "/orders", icon: ShoppingCart },
  { title: "Commissions", url: "/commissions", icon: CreditCard },
];

const adminBottomMenuItems = [
  { title: "Account Profile", url: "/account-profile", icon: User },
  { title: "Support", url: "https://support.theonglobal.com/support", icon: HelpCircle, external: true },
  { title: "Company Settings", url: "/company-settings", icon: Settings },
  { title: "Communications", url: "/communications", icon: MessageSquare },
  { title: "KYC Review", url: "/kyc-review", icon: FileText },
  // { title: "SOW", url: "/sow", icon: FileText, moduleName: null },
];

const affiliateBottomMenuItems = [
  { title: "Account Profile", url: "/account-profile", icon: User },
  { title: "Support", url: "https://support.theonglobal.com/support", icon: HelpCircle, external: true },
];

export function AppSidebar() {
  const { user, token } = useAuthStore();

  // state to store the current status of sidebar, that is, being collapsed or not
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
  // variable to store the query, BaseURL , state of the URL
  const location = useLocation();
  const currentPath = location.pathname;
  // function to navigate to different URL's
  const navigate = useNavigate();
  // toast to show PopUp messages
  const { toast } = useToast();
  // variable to store the actual role along with state's such as isAdmin, isAffiliate, etc.
  const { isAdmin, isAffiliate } = useUserRole();
  // returns: hasPermission: Boolean, permissions: Object
  const { hasPermission } = useModulePermissions();

  // state to store if the user has completed their KYC or not
  const [kycPass, setKycPass] = useState<boolean>(true);
  const [isLoadingKyc, setIsLoadingKyc] = useState<boolean>(true);

  // state to store the site link of the affiliate
  const [affiliateSiteName, setAffiliateSiteName] = useState<string | null>(null);

  // Check KYC status and site name for affiliates
  useEffect(() => {

    // if(isAffiliate){
    if(!isAdmin){
      setAffiliateSiteName(user.siteName);
    }
    return;
    const checkAffiliateData = async () => {
      if (isAffiliate) {
        setIsLoadingKyc(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: affiliate } = await supabase
            .from("affiliates")
            .select("kyc_pass, site_name")
            .eq("auth_user_id", user.id)
            .single();

          if (affiliate) {
            // setKycPass(affiliate.kyc_pass);
            setAffiliateSiteName(affiliate.site_name);
          }
        }
        setIsLoadingKyc(false);
      } else {
        setIsLoadingKyc(false);
      }
    };

    checkAffiliateData();
  }, [isAdmin]);

  // Determine which menu items to show based on role and KYC status
  const getMenuItems = () => {
    // if (isAffiliate) {
    if (!isAdmin) {
      // If KYC not passed, only show Dashboard (which redirects to KYC)
      if (!kycPass) {
        return [{ title: "Dashboard", url: "/affiliate-dashboard", icon: LayoutDashboard }];
      }

      const filteredMenuItems = affiliateMenuItems.filter((item) => {
        const { title } = item;

        switch (title) {
          case "Dashboard":
            return hasPermission("module_permissions", "dashboard", "view"); // or "edit" if needed

          case "My Team":
            return hasPermission("module_permissions", "team", "view");

          case "My Affiliates":
            return hasPermission("module_permissions", "affiliates", "view");

          case "My Customers":
            return hasPermission("module_permissions", "customers", "view");

          case "Orders":
            return hasPermission("module_permissions", "orders", "view");

          case "Commissions":
            return hasPermission("module_permissions", "commissions", "view");

          default:
            return true; // Keep unknown items (or set to false to hide)
        }
      });
      return affiliateMenuItems;
    }
    // Filter admin menu items based on module permissions
    return adminMenuItems.filter(item => {
      // Items without moduleName (like Dashboard, Genealogy) are always shown to admins
      if (!item.sectionName) return true;
      // ## Handle Sidebar permissions
      // Check if user has at least view permission for this module
      return hasPermission("module_permissions", item.sectionName, "view");
    });
  };

  const menuItems = getMenuItems();

  // bottom menu items, available only for admin or for affiliates with completed KYC, that is, Account Profile and Support
  // const bottomMenuItems = isAffiliate
  const bottomMenuItems = !isAdmin
    ? (kycPass ? affiliateBottomMenuItems : [])
    : adminBottomMenuItems;

  // used to implement conditional styling in sidebar 
  const isActive = (path: string) => currentPath === path;

  // used in classes to implement conditional styling
  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive
      ? "bg-white/20 text-white font-medium border-r-2 border-white"
      : "text-white hover:bg-white/10 hover:text-white";

  const clearAuth = useAuthStore((state) => state.clearAuth);
 const clearShopify=useShopifyStore((state)=> state.clearShopifyUrl);

  const queryClient = useQueryClient();
  // queryClient.invalidateQueries()

  // clears the token and user global state
  const handleLogout = async () => {
    try {
      // const { error } = await supabase.auth.signOut();
      // if (error) throw error;
      clearAuth();
      clearShopify();

      toast({
        title: "Logged out",
        description: "You've been successfully logged out",
      });

      queryClient.invalidateQueries()
      queryClient.clear();

      navigate("/auth");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to log out",
        variant: "destructive",
      });
    }
  };

  // Opens the affiliates site in another window
  const handleShopClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (affiliateSiteName) {
      window.open(`https://www.theonglobal.com/?ref=${affiliateSiteName}`, '_blank', 'noopener,noreferrer');
    } else {
      toast({
        title: "No Site Available",
        description: "Your affiliate site has not been set up yet.",
        variant: "destructive",
      });
    }
  };

  return (
    <Sidebar
      className={`${isCollapsed ? "w-16" : "w-64"} transition-all duration-300`}
      style={{ backgroundColor: "#1a1f2e" }}
      collapsible="icon"
    >
      <SidebarContent className="bg-[#1a1f2e] border-r-0 flex flex-col">
        {/* Logo Section */}
        <div className="p-4 border-b border-white/10 bg-[#1a1f2e] flex items-center gap-3">
          <SidebarTrigger className="text-white hover:bg-white/10 h-8 w-8 hidden md:block flex-shrink-0" />
          {!isCollapsed && (
            <NavLink to="/" className="cursor-pointer">
              <img
                src={logoImage}
                alt="Theon Global"
                className="h-10 w-auto hover:opacity-80 transition-opacity"
              />
            </NavLink>
          )}
        </div>

        {/* Main Menu */}
        <SidebarGroup className="mt-1 bg-[#1a1f2e] flex-1">
          <SidebarGroupContent className="bg-[#1a1f2e]">
            <SidebarMenu className="space-y-0 bg-[#1a1f2e]">
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title} className="bg-[#1a1f2e]">
                  <SidebarMenuButton asChild className={`${isCollapsed ? "h-14" : "h-10"} bg-[#1a1f2e] hover:bg-white/10 data-[state=open]:bg-white/20 text-white`}>
                    <NavLink
                      to={item.url}
                      end
                      className={({ isActive }) =>
                        `flex items-center ${isCollapsed ? "justify-center px-2 py-3" : "px-4 py-2"} rounded-none transition-colors bg-[#1a1f2e] text-white ${getNavCls({ isActive })}`
                      }
                    >
                      <item.icon className={`text-white ${isCollapsed ? "h-8 w-8" : "h-5 w-5 mr-3"}`} />
                      {!isCollapsed && <span className="font-medium text-white">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}

              {/* Payment Method menu item for affiliates only */}
              {!isAdmin && true && (
              // {isAffiliate && true && (
                // {isAffiliate && kycPass && (
                <SidebarMenuItem className="bg-[#1a1f2e]">
                  <SidebarMenuButton asChild className={`${isCollapsed ? "h-14" : "h-10"} bg-[#1a1f2e] hover:bg-white/10 data-[state=open]:bg-white/20 text-white`}>
                    <NavLink
                      to="/payment-method"
                      end
                      className={({ isActive }) =>
                        `flex items-center ${isCollapsed ? "justify-center px-2 py-3" : "px-4 py-2"} rounded-none transition-colors bg-[#1a1f2e] text-white ${getNavCls({ isActive })}`
                      }
                    >
                      <Wallet className={`text-white ${isCollapsed ? "h-8 w-8" : "h-5 w-5 mr-3"}`} />
                      {!isCollapsed && <span className="font-medium text-white">Payment Method</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}

              {/* Shop menu item for affiliates only */}
              {!isAdmin && true && (
              // {isAffiliate && true && (
                // {isAffiliate && kycPass && (
                <SidebarMenuItem className="bg-[#1a1f2e]">
                  <SidebarMenuButton asChild className={`${isCollapsed ? "h-14" : "h-10"} bg-[#1a1f2e] hover:bg-white/10 data-[state=open]:bg-white/20 text-white`}>
                    <NavLink
                      to={affiliateSiteName}
                      end
                      onClick={(e) => { e.preventDefault(); handleShopClick(e as any); }}
                      className={({ isActive }) =>
                        `flex items-center ${isCollapsed ? "justify-center px-2 py-3" : "px-4 py-2"} rounded-none transition-colors bg-[#1a1f2e] text-white ${getNavCls({ isActive })}`
                      }
                    >
                      <Store className={`text-white ${isCollapsed ? "h-8 w-8" : "h-5 w-5 mr-3"}`} />
                      {!isCollapsed && <span className="font-medium text-white">Shop</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Bottom Menu */}
        <SidebarGroup className="mt-auto border-t border-white/10 bg-[#1a1f2e] pt-1">
          <SidebarGroupContent className="bg-[#1a1f2e]">
            <SidebarMenu className="space-y-0 bg-[#1a1f2e]">
              {bottomMenuItems.map((item) => (
                <SidebarMenuItem key={item.title} className="bg-[#1a1f2e]">
                  <SidebarMenuButton asChild className={`${isCollapsed ? "h-14" : "h-10"} bg-[#1a1f2e] hover:bg-white/10 data-[state=open]:bg-white/20 text-white`}>
                    {(item as any).external ? (
                      <NavLink
                        to="#"
                        end
                        onClick={(e) => { e.preventDefault(); window.open(item.url, '_blank', 'noopener,noreferrer'); }}
                        className={({ isActive }) =>
                          `flex items-center ${isCollapsed ? "justify-center px-2 py-3" : "px-4 py-2"} rounded-none transition-colors bg-[#1a1f2e] text-white ${getNavCls({ isActive })}`
                        }
                      >
                        <item.icon className={`text-white ${isCollapsed ? "h-8 w-8" : "h-5 w-5 mr-3"}`} />
                        {!isCollapsed && <span className="font-medium text-white">{item.title}</span>}
                      </NavLink>
                    ) : (
                      <NavLink
                        to={item.url}
                        end
                        className={({ isActive }) =>
                          `flex items-center ${isCollapsed ? "justify-center px-2 py-3" : "px-4 py-2"} rounded-none transition-colors bg-[#1a1f2e] text-white ${getNavCls({ isActive })}`
                        }
                      >
                        <item.icon className={`text-white ${isCollapsed ? "h-8 w-8" : "h-5 w-5 mr-3"}`} />
                        {!isCollapsed && <span className="font-medium text-white">{item.title}</span>}
                      </NavLink>
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}

              {/* Logout */}
              <SidebarMenuItem className="bg-[#1a1f2e]">
                <SidebarMenuButton asChild className={`${isCollapsed ? "h-14" : "h-10"} bg-[#1a1f2e] hover:bg-white/10 data-[state=open]:bg-white/20 text-white`}>
                  <NavLink
                    to="#"
                    end
                    onClick={(e) => { e.preventDefault(); handleLogout(); }}
                    className={({ isActive }) =>
                      `flex items-center ${isCollapsed ? "justify-center px-2 py-3" : "px-4 py-2"} rounded-none transition-colors bg-[#1a1f2e] text-white ${getNavCls({ isActive })}`
                    }
                  >
                    <LogOut className={`text-white ${isCollapsed ? "h-8 w-8" : "h-5 w-5 mr-3"}`} />
                    {!isCollapsed && <span className="font-medium text-white">Logout</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

      </SidebarContent>
    </Sidebar>
  );
}