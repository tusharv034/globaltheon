import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "./use-user-role";
import { useAuthStore } from "@/store/useAuthStore";

export type PermissionLevel = "none" | "view" | "edit";

interface ModulePermissions {
  [key: string]: PermissionLevel;
}

export function useModulePermissions() {

  const { token, user } = useAuthStore();

  const hasPermission2 = (
    moduleName: string,
    sectionName: string,
    requiredLevel: PermissionLevel = 'view'
  ): boolean => {
    // If no user or no permissions, deny all unless explicitly "none"
    if (!user || !user.permissions || !Array.isArray(user.permissions)) {
      return requiredLevel === 'none';
    }

    // "none" means no permission required
    if (requiredLevel === 'none') return true;

    const userPerms = user.permissions;

    const hasView = userPerms.some(
      (perm) =>
        perm.moduleName === moduleName &&
        perm.sectionName === sectionName &&
        (perm.permission === 'view' || perm.permission === 'edit')
    );

    const hasEdit = userPerms.some(
      (perm) =>
        perm.moduleName === moduleName &&
        perm.sectionName === sectionName &&
        perm.permission === 'edit'
    );

    if (requiredLevel === 'view') return hasView;
    
    if (requiredLevel === 'edit') return hasEdit;

    return false; // unknown level
  };

  const hasPermission = (
    sectionName: string,
    moduleName: string,
    requiredLevel: PermissionLevel = 'view'
  ): boolean => {

    // find the required object
    // const requiredPerm = user.permissions.find((item, index) => item.moduleName === moduleName && item.sectionName === sectionName);
    // const requiredPerm = user.permissions.find(item => item.moduleName === moduleName && item.sectionName === sectionName);
    const requiredPerm = user.permissions.find((item) => item.module === moduleName && item.section === sectionName);

    if(!requiredPerm) return false;

    if(requiredLevel === "view" && (requiredPerm.permission === "view" || requiredPerm.permission === "edit")) return true;
    
    if(requiredLevel === "edit" && requiredPerm.permission === "edit") return true;
    
    return false;
  };

  return {
    permissions: user.permissions || {},
    // isLoading: permissionsLoading,
    hasPermission,
  };
}