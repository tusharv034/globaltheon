import { useEffect, useRef, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  
  const [authenticated, setAuthenticated] = useState(false);

  const { token, user } = useAuthStore();

  if (!token) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
};
