import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useModulePermissions, PermissionLevel } from "@/hooks/use-module-permissions";
import { Loader2 } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";

interface ModuleProtectedRouteProps {
  children: React.ReactNode;
  moduleName: string;
  sectionName: string;
  requiredLevel?: PermissionLevel;
}

export const ModuleProtectedRoute = ({
  children,
  sectionName,
  moduleName,
  requiredLevel = "view"
}: ModuleProtectedRouteProps) => {

  // if affiliate check there KYC too

  const { hasPermission } = useModulePermissions();

  const clearAuth = useAuthStore((state) => state.clearAuth);

  const { impersonating, user, token } = useAuthStore();

  if (user.role === 'affiliate') {

    // check for KYC
    if (!impersonating &&
    user.role === "affiliate" && 
    (user.status?.toString() !== "1" || 
    !user.kycPass ||
    location.pathname !== "/kyc-completion")) {
      return <Navigate to="/kyc-completion" replace />
    }


  }

  // check for module permissions
  if (!impersonating && !hasPermission(moduleName, sectionName, requiredLevel)) {
    clearAuth();
    return <Navigate to="/" replace />;
  }

  /* 
  
  if (!impersonating && !hasPermission(moduleName, sectionName, requiredLevel)) {
    if (user.role === "affiliate") {
      return <Navigate to="/kyc-completion" replace />
    }
    clearAuth();
    return <Navigate to="/" replace />;
  }
  */

  return <>{children}</>;
};