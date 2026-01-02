import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuthStore } from "@/store/useAuthStore";

export type UserRole = "admin" | "affiliate" | "user" | "moderator" | "super_admin" | null;

export function useUserRole() {
  /* 
  const { data: role, isLoading } = useQuery({
    queryKey: ["user-role"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      // Fetch all roles for the user (super_admin has highest priority)
      const { data: rows, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);

      if (error || !rows || rows.length === 0) return null;

      const roles = rows.map((r) => r.role as UserRole);
      if (roles.includes("super_admin")) return "super_admin" as UserRole;
      if (roles.includes("admin")) return "admin" as UserRole;
      if (roles.includes("affiliate")) return "affiliate" as UserRole;
      if (roles.includes("moderator")) return "moderator" as UserRole;
      return "user" as UserRole;
    },
    staleTime: 0, // Always fetch fresh data
    retry: false,
    refetchOnWindowFocus: true,
  });
  */

  const { token, user } = useAuthStore();

  return {
    role: user.role,
    isSuperAdmin: user.role === "super_admin",
    isAdmin: user.role === "admin" || user.role === "super_admin",
    isAffiliate: user.role === "affiliate",
    isModerator: user.role === "moderator",
  };
}
