import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { LogOut, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/store/useAuthStore";
import { returnToAdmin } from "@/api/affiliate";
import config from "@/config/env";

export function ImpersonationBanner() {
  const [impersonationData, setImpersonationData] = useState<{
    adminId: string;
    adminEmail: string;
    affiliateName: string;
  } | null>(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { user, token, impersonating } = useAuthStore();

  const handleReturnToAdmin2 = async () => {
    if (!impersonationData) return;

    try {
      // Sign out current affiliate session
      await supabase.auth.signOut();

      // Clear impersonation data
      localStorage.removeItem('impersonation_data');

      // Use the stored admin session to sign back in
      const adminSession = localStorage.getItem('admin_session_backup');
      if (adminSession) {
        const session = JSON.parse(adminSession);

        // Set the session
        await supabase.auth.setSession({
          access_token: session.access_token,
          refresh_token: session.refresh_token
        });

        localStorage.removeItem('admin_session_backup');

        // Force refetch user role and all queries
        await queryClient.invalidateQueries({ queryKey: ["user-role"] });
        await queryClient.invalidateQueries();

        toast.success("Returned to admin account");

        // Use window.location to force a full page refresh
        window.location.href = '/';
      } else {
        // If no backup session, redirect to login
        toast.info("Please log in with your admin account");
        navigate('/auth');
      }
    } catch (error: any) {
      console.error('Error returning to admin:', error);
      toast.error("Failed to return to admin account");
      navigate('/auth');
    }
  };

  const setAuth = useAuthStore((state) => state.setAuth);

  const updateAuthUser = useAuthStore((state) => state.updateAuthUser);

  const returnToAdminMutation = useMutation({
    
    mutationFn: async (payload: any) => await returnToAdmin(payload),

    onSuccess: (response: any) => {


      setAuth(response.data.data.token, response.data.data.user, false);

      let stateUrl = null;
      if (response?.data?.data?.user?.profilePictureUrl) {
        stateUrl = `${config.cloudFrontUrl}profile-pictures${response?.data?.data?.user?.profilePictureUrl?.split("/profile-pictures")[1]}`;
      }

      updateAuthUser({ profilePictureUrl: stateUrl });

      queryClient.invalidateQueries();

      navigate("/affiliates");

      return;

    },

    onError: (error: any) => {
      // console.log("error is ", error);
    }
  })

  const handleReturnToAdmin = async () => {
    if (!impersonating) return;

    try {
     
      // Make an API call similar impersonating
      const payload = {};
      await returnToAdminMutation.mutateAsync(payload);
      // set new token, user, impersonating: false
      // invalidate all the queries
      // navigate to previous URL
    } catch (error: any) {
      console.error('Error returning to admin:', error);
      toast.error("Failed to return to admin account");
      // navigate('/auth');
    }
  };

  if (!impersonating) return null;

  return (
    <div className="flex items-center gap-3 mr-4 px-3 py-1.5 bg-orange-50 dark:bg-orange-950/20 border border-orange-500 rounded-md">
      <div className="flex items-center gap-2">
        <User className="h-4 w-4 text-orange-600 flex-shrink-0" />
        <div className="text-orange-900 dark:text-orange-100 text-sm whitespace-nowrap">
          <strong className="font-semibold">Impersonating:</strong>{" "}
          <span className="font-medium">{user.firstName}{" "}{user.lastName}</span>
        </div>
      </div>
      <Button
        onClick={handleReturnToAdmin}
        variant="ghost"
        size="sm"
        className="h-7 px-2 text-orange-600 hover:bg-orange-100 dark:hover:bg-orange-900 flex-shrink-0"
      >
        <LogOut className="h-3.5 w-3.5 mr-1.5" />
        <span className="text-xs">Return</span>
      </Button>
    </div>
  );
}