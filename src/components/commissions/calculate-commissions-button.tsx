import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calculator, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useMutation } from "@tanstack/react-query";
import { calculateCommissionByPeriod } from "@/api/commission";
import { useAuthStore } from "@/store/useAuthStore";

interface CalculateCommissionsButtonProps {
  onSuccess?: () => void;
}

export function CalculateCommissionsButton({ onSuccess }: CalculateCommissionsButtonProps) {

  // state to store if calculatnig commission
  const [isCalculating, setIsCalculating] = useState(false);

  const calculateCommissionByPeriodMutation = useMutation({

    mutationFn: async (payload: any) => await calculateCommissionByPeriod(payload),

    onSuccess: (response) => {

      // toast({
      //   title: "Created Commissions",
      //   description: "Created Commissions"
      // })

      setIsCalculating(false);


    },

    onError: (error) => {

      setIsCalculating(false)
      console.log("Error is ", error);
    }

  });

  const { user } = useAuthStore();

  // function to handle the calculate commission click event
  const handleCalculate = async () => {
    setIsCalculating(true);

    try {

      const payload = {
        affiliateId: user?.affiliateId
      }

      await calculateCommissionByPeriodMutation.mutateAsync(payload);


      onSuccess?.();
    } catch (error: any) {
      console.error('Error calculating commissions:', error);
      toast.error(error.message || 'Failed to calculate commissions');
    } 
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" disabled={isCalculating}>
          {isCalculating ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Calculating...
            </>
          ) : (
            <>
              <Calculator className="h-4 w-4 mr-2" />
              Calculate All Commissions
            </>
          )}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Calculate All Commissions?</AlertDialogTitle>
          <AlertDialogDescription>
            This will:
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Clear and rebuild all order commission records</li>
              <li>Use the existing commission periods in your database (no new periods created)</li>
              <li>Recalculate Level 1 (personal) and Level 2 (team) commissions for every order</li>
              <li>Preserve existing adjustments and period statuses</li>
              <li>Recompute each period's totals</li>
            </ul>
            <p className="mt-4 font-semibold">This action cannot be undone.</p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleCalculate}>
            Calculate Commissions
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
