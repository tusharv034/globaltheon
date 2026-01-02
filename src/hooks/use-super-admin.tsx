import { useUserRole } from "./use-user-role";

export function useSuperAdmin() {
  const { role, isLoading } = useUserRole();
  
  return {
    isSuperAdmin: role === "super_admin",
    isLoading,
  };
}
