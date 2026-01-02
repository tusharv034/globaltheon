import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { format } from "date-fns";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { readAllAdjustments } from "@/api/commission";

interface AdjustmentHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  affiliateId?: string; // Optional filter for a specific affiliate
}

export function AdjustmentHistoryDialog({ open, onOpenChange, affiliateId }: AdjustmentHistoryDialogProps) {

  // queryClient to invalidaet existing queries
  const queryClient = useQueryClient();
  
  // state to toggle the delete Dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // state to store the adjustment to be deleted
  const [adjustmentToDelete, setAdjustmentToDelete] = useState<any>(null);

  // useQuery to fetch all the adjustments
  const { data: adjustments, isLoading } = useQuery({
    queryKey: ["commission-adjustments", affiliateId || "all"],
    queryFn: async () => {

      const payload = {
        affiliateId
      }
      const response = await readAllAdjustments(payload);

      return response?.data?.data;
    },
    enabled: open,
  });

  // mutation to delete the adjustment
  const deleteMutation = useMutation({
    mutationFn: async (adjustmentId: string) => {
      const { error } = await supabase
        .from("commission_period_adjustments")
        .delete()
        .eq("id", adjustmentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["commission-adjustments"] });
      queryClient.invalidateQueries({ queryKey: ["period-breakdown"] });
      queryClient.invalidateQueries({ queryKey: ["commission-periods"] });
      toast.success("Adjustment deleted successfully");
      setDeleteDialogOpen(false);
      setAdjustmentToDelete(null);
    },
    onError: (error) => {
      console.error("Error deleting adjustment:", error);
      toast.error("Failed to delete adjustment");
    },
  });

  // function to handle the delete click event
  const handleDeleteClick = (adjustment: any) => {
    setAdjustmentToDelete(adjustment);
    setDeleteDialogOpen(true);
  };

  // function to confirm the deletion of the adjustment
  const confirmDelete = () => {
    if (adjustmentToDelete) {
      deleteMutation.mutate(adjustmentToDelete.id);
    }
  };

  // function to return the Badge component conditionally
  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "success" | "destructive"> = {
      open: "default",
      closed: "secondary",
      paid: "success",
      not_funded: "destructive",
    };

    return (
      <Badge variant={variants[status] || "default"}>
        {status.replace("_", " ").toUpperCase()}
      </Badge>
    );
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[1200px] max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>
              {affiliateId ? "Affiliate Commission Adjustment History" : "All Commission Adjustments"}
            </DialogTitle>
            {affiliateId && adjustments?.[0]?.affiliateId && (
              <p className="text-sm text-muted-foreground">
                {adjustments[0].affiliateId.selfAffiliateId} - {adjustments[0].affiliateId.firstName} {adjustments[0].affiliateId.lastName}
              </p>
            )}
          </DialogHeader>

          <ScrollArea className="h-[600px] border rounded-lg">
            {isLoading ? (
              <div className="text-center py-8">Loading adjustment history...</div>
            ) : adjustments?.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No adjustments found.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[120px]">Date</TableHead>
                    <TableHead className="w-[100px]">Period</TableHead>
                    <TableHead className="w-[100px]">Status</TableHead>
                    {!affiliateId && <TableHead className="w-[200px]">Affiliate</TableHead>}
                    <TableHead className="text-right w-[120px]">Amount</TableHead>
                    <TableHead className="min-w-[300px]">Reason</TableHead>
                    <TableHead className="w-[100px] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {adjustments?.map((adjustment: any) => (
                    <TableRow key={adjustment._id}>
                      <TableCell className="whitespace-nowrap">
                        {format(new Date(adjustment.createdAt), "MM/dd/yy HH:mm")}
                      </TableCell>
                      <TableCell className="font-medium">
                        Period {adjustment.periodId.periodNumber}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(adjustment.periodId.status)}
                      </TableCell>
                      {!affiliateId && (
                        <TableCell>
                          {adjustment.affiliateId.selfAffiliateId} - {adjustment.affiliateId.firstName} {adjustment.affiliateId.lastName}
                        </TableCell>
                      )}
                      <TableCell className={`text-right font-semibold whitespace-nowrap ${parseFloat(adjustment.adjustmentAmount) >= 0 ? 'text-success' : 'text-destructive'}`}>
                        {formatCurrency(parseFloat(adjustment.adjustmentAmount))}
                      </TableCell>
                      <TableCell>
                        <div className="max-w-[400px] break-words">
                          {adjustment.reason}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteClick(adjustment)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Adjustment?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this adjustment? This action cannot be undone.
              {adjustmentToDelete && (
                <div className="mt-4 p-3 bg-muted rounded-md">
                  <p className="font-semibold">
                    Amount: <span className={parseFloat(adjustmentToDelete.adjustmentAmount) >= 0 ? 'text-success' : 'text-destructive'}>
                      {formatCurrency(parseFloat(adjustmentToDelete.adjustmentAmount))}
                    </span>
                  </p>
                  <p className="text-sm mt-1">Reason: {adjustmentToDelete.reason}</p>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
