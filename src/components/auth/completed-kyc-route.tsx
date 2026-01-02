import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { useUserRole } from "@/hooks/use-user-role";
import { useAuthStore } from "@/store/useAuthStore";

interface CompletedKYCRouteProps {
    children: React.ReactNode;
}

export const CompletedKYCRoute = ({ children }: CompletedKYCRouteProps) => {

    const { user } = useAuthStore();

    const clearAuth = useAuthStore((state) => state.clearAuth);

    if (false) {
        clearAuth();
        return <Navigate to="/auth" replace />;

    }

    return <>{children}</>;
};
