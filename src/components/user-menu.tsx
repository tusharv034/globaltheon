import { Settings, LogOut, UserCircle, ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useUserRole } from "@/hooks/use-user-role";
import { useQueryClient } from "@tanstack/react-query";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ImpersonationBanner } from "@/components/shared/impersonation-banner";
import { useAuthStore, useShopifyStore } from "@/store/useAuthStore";
import { useDateFormatStore } from "@/store/useDateFormat";

const formatRole = (role: string | null): string => {
  if (!role) return "User";
  switch (role) {
    case "super_admin": return "Super Admin";
    case "admin": return "Admin";
    case "manager": return "Manager";
    case "affiliate": return "Affiliate";
    default: return "User";
  }
};

export function UserMenu() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { role } = useUserRole();
  const queryClient = useQueryClient();

  // READ DIRECTLY FROM ZUSTAND — fresh on every render
  const { user, _version, clearAuth } = useAuthStore();
  const clearShopify = useShopifyStore((state) => state.clearShopifyUrl);
  const clearDateFormat = useDateFormatStore((state) => state.clearDateFormat);


  const handleLogout = async () => {
    clearAuth();
    clearShopify();
    clearDateFormat();
    toast({
      title: "Logged out successfully",
      description: "You have been logged out of your account.",
    });
    queryClient.invalidateQueries();
    queryClient.clear();
    navigate("/auth");
  };

  // If no user (shouldn't happen in protected routes), render nothing
  if (!user) return null;

  const displayName = user.firstName && user.lastName
    ? `${user.firstName} ${user.lastName}`
    : user.firstName || "User";

  const displayRole = formatRole(role);

  return (
    <div className="flex items-center gap-4">
      <ImpersonationBanner />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="flex items-center gap-2 h-auto py-2 px-3 hover:bg-accent">
            {user.profilePictureUrl ? (
              <img
                src={`${user.profilePictureUrl}?v=${_version}`}
                alt={displayName}
                className="h-8 w-8 rounded-full object-cover"
                key={user.profilePictureUrl + _version} // forces re-mount
              />
            ) : (
              <UserCircle className="h-5 w-5" />
            )}
            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium">{displayName}</span>
              <span className="text-muted-foreground">|</span>
              <span className="text-muted-foreground">{displayRole}</span>
            </div>
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48 z-50 bg-popover">
          <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
            <LogOut className="mr-2 h-4 w-4" />
            <span>Logout</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}