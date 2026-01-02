import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { useUserRole } from "@/hooks/use-user-role";
import { useAuthStore } from "@/store/useAuthStore";

interface AffiliateProtectedRouteProps {
  children: React.ReactNode;
}

export const AffiliateProtectedRoute = ({ children }: AffiliateProtectedRouteProps) => {
  const [kycStatus, setKycStatus] = useState<{ pass: boolean; submitted: boolean; status: string } | null>(null);
  const location = useLocation();

  /* 
  useEffect(() => {
    const checkAuthAndKyc = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setAuthenticated(false);
        setLoading(false);
        return;
      }

      setAuthenticated(true);

      // Only check KYC for affiliates
      if (role === "affiliate") {
        const { data: affiliate } = await supabase
          .from("affiliates")
          .select("kyc_pass, kyc_submitted_at, status")
          .eq("auth_user_id", session.user.id)
          .single();

        if (affiliate) {
          // If affiliate is inactive (failed KYC), sign them out
          if (affiliate.status === 'inactive' && !affiliate.kyc_pass) {
            await supabase.auth.signOut();
            setAuthenticated(false);
            setLoading(false);
            return;
          }

          setKycStatus({
            pass: affiliate.kyc_pass,
            submitted: !!affiliate.kyc_submitted_at,
            status: affiliate.status
          });
        }
      }

      setLoading(false);
    };

    if (!roleLoading) {
      checkAuthAndKyc();
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthenticated(!!session);
    });

    return () => subscription.unsubscribe();
  }, [role, roleLoading]);

  if (loading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dashboard-bg">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!authenticated) {
    return <Navigate to="/auth" replace />;
  }
  */

  const { user, token, impersonating } = useAuthStore();

  if(!token){
    return <Navigate to="/auth" replace />;
  }

  // If user is affiliate and KYC is not passed, redirect to KYC completion
  // unless they're already on the KYC completion page
 
  if (
    !impersonating &&
    user.role === "affiliate" && 
    user.status?.toString() !== "1" && 
    !user.kycPass && 
    location.pathname !== "/kyc-completion"
  ) {
    return <Navigate to="/kyc-completion" replace />;
  }

  return <>{children}</>;
};
