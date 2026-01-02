import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { useUserRole } from "@/hooks/use-user-role";
import { useAuthStore } from "@/store/useAuthStore";

interface AffiliateRouteProps {
    children: React.ReactNode;
}

export const AffiliateRoute = ({ children }: AffiliateRouteProps) => {

    const { user } = useAuthStore();

    const clearAuth = useAuthStore((state) => state.clearAuth);

    if (!(user.role === "affiliate")) {
        //  || user.role === "admin" || user.role === "super_admin"
        clearAuth();
        return <Navigate to="/auth" replace />;

    }

    return <>{children}</>;
};
