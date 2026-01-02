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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useDateFormatStore } from "@/store/useDateFormat";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { getDateFormatString } from "@/utils/resolveDateFormat";
import { deleteCommissionAdjustment, readAdjustmentsByPeriod, readCommissionDetailsInsights } from "@/api/commission";

interface CommissionPeriod {
  id: string;
  period_number: number;
  display_in_backoffice: boolean;
  status: string;
  start_date: string;
  end_date: string;
  total_affiliate_commissions: number;
  total_adjustments: number;
  total_commissions: number;
  notes: string | null;
}

interface PeriodDetailsDialogProps {
  period: CommissionPeriod;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PeriodDetailsDialog({ period, open, onOpenChange }: PeriodDetailsDialogProps) {

  // queryClient used to invalidate queries to trigger refetching
  const queryClient = useQueryClient();

  // state used to trigger ALertDialog Open and Close
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // state to store the adjsutment to be deleted
  const [adjustmentToDelete, setAdjustmentToDelete] = useState<any>(null);

  // Custom date formatting
  const { dateFormatRegion, dateFormatVariant } = useDateFormatStore();

  const formatString = getDateFormatString(dateFormatRegion, dateFormatVariant);

  // query to fetch adjustments and affiliates
  const { data: adjustmentsByPeriod, isLoading: adjustmentsByPeriodLoading } = useQuery({
    queryKey: ["adjustments-by-period"],
    queryFn: async () => {

      const payload = {
        periodId: period._id
      }

      const response = await readAdjustmentsByPeriod(payload);

      console.log('adjustmentsByPeriod response is ', response.data.data);

      return response.data.data;
    }
  })

  // query to fecth CommissionDetails and insights
  const { data: commissionDetailsData, isLoading: commissionDetailsDataLoading } = useQuery({
    queryKey: ["commission-details-insights"],
    queryFn: async () => {

      const payload = {
        periodId: period._id
      }

      const response = await readCommissionDetailsInsights(payload);

      console.log("readCommissionDetailsInsights response is ", response );

      return response.data.data;
    }
  })

  const deleteMutation = useMutation({
      mutationFn: async (payload: any) => await deleteCommissionAdjustment(payload),
      onSuccess: async () => {
        // await recalculatePeriodTotals();
        queryClient.invalidateQueries({ queryKey: ["commission-details-insights"] });
        queryClient.invalidateQueries({ queryKey: ["adjustments-by-period"] });
        queryClient.invalidateQueries({ queryKey: ["commission-adjustments"] });
        queryClient.invalidateQueries({ queryKey: ["commission-adjustments-all"] });
        queryClient.invalidateQueries({ queryKey: ["pre-selected-affiliate"] });
        queryClient.invalidateQueries({ queryKey: ["commission-periods"] });
        queryClient.invalidateQueries({ queryKey: ["period-breakdown", period._id] });
        toast.success("Adjustment deleted successfully");
      },
      onError: (error: any) => {
        toast.error(error.message || "Failed to delete adjustment");
      },
    });

  const handleDeleteClick = (adjustment: any) => {
    setAdjustmentToDelete(adjustment);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (adjustmentToDelete) {

      const payload = {
        adjustmentId: adjustmentToDelete._id
      }

      await deleteMutation.mutateAsync(payload);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "success" | "destructive"> = {
      "0": "default",
      "1": "secondary",
      "2": "success",
      // not_funded: "destructive",
    };

    return (
      <Badge className="uppercase" variant={variants[status] || "default"}>
        {status === "0" && "Open"}
        {status === "1" && "Closed"}
        {status === "2" && "Paid"}
        {/* {status.replace("_", " ").toUpperCase()} */}
      </Badge>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[95vw] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>View Period #{period.periodNumber}</DialogTitle>
          <p className="text-sm text-muted-foreground">2-Level Affiliate Commission Structure</p>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-120px)]">
          <div className="space-y-6 pr-4">
            {/* Period Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Period Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Total Commissions</p>
                    <p className="text-2xl font-bold">
                      ${period.totalAffiliateCommissions.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Adjustments</p>
                    <p className={`text-2xl font-bold ${period.totalAdjustments >= 0 ? 'text-success' : 'text-destructive'}`}>
                      ${period.totalAdjustments.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Net Commissions</p>
                    <p className="text-2xl font-bold">
                      ${period.totalCommissions.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6 pt-6 border-t">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Period Dates</p>
                    <p className="font-semibold">
                      {format(new Date(period.startDate), formatString)} to {format(new Date(period.endDate), formatString)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1 ">Status</p>
                    {getStatusBadge(period?.status)}
                  </div>
                  {!commissionDetailsDataLoading && commissionDetailsData && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1"># of Affiliates</p>
                      <p className="text-2xl font-bold">
                        {commissionDetailsData?.affiliateCount || 0}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Commission Structure */}
            {!commissionDetailsDataLoading && commissionDetailsData && (
              <Card>
                <CardHeader>
                  <CardTitle>Affiliate Commission Structure</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Level 1 */}
                  <div className="border rounded-lg p-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <h3 className="font-semibold">Level 1 - {commissionDetailsData?.levelOnePercentage}% Commission</h3>
                      <Badge variant="secondary">Direct Enrollments</Badge>
                    </div>
                    <ul className="space-y-2 text-sm text-muted-foreground ml-4">
                      <li className="flex items-start">
                        <span className="mr-2">•</span>
                        <span>Personally enrolled affiliates and their purchases</span>
                      </li>
                      <li className="flex items-start">
                        <span className="mr-2">•</span>
                        <span>Personally enrolled customers and their purchases</span>
                      </li>
                    </ul>
                    <div className="pt-2 border-t">
                      <p className="text-sm text-muted-foreground">Level 1 Total</p>
                      <p className="text-2xl font-bold">
                        ${commissionDetailsData?.levelOneSum.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>

                  {/* Level 2 */}
                  <div className="border rounded-lg p-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <h3 className="font-semibold text-primary">Level 2 - {commissionDetailsData?.levelTwoPercentage}% Commission</h3>
                      <Badge>Second Level</Badge>
                    </div>
                    <ul className="space-y-2 text-sm text-muted-foreground ml-4">
                      <li className="flex items-start">
                        <span className="mr-2">•</span>
                        <span>Personally enrolled affiliates' affiliates and their purchases</span>
                      </li>
                      <li className="flex items-start">
                        <span className="mr-2">•</span>
                        <span>Personally enrolled affiliates' customers and their purchases</span>
                      </li>
                    </ul>
                    <div className="pt-2 border-t">
                      <p className="text-sm text-muted-foreground">Level 2 Total</p>
                      <p className="text-2xl font-bold">
                        ${commissionDetailsData?.levelTwoSum?.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Adjustments */}
            <Card>
              <CardHeader>
                <CardTitle>Adjustments ({adjustmentsByPeriod?.length || 0})</CardTitle>
              </CardHeader>
              <CardContent>
                {adjustmentsByPeriodLoading ? (
                  <div className="text-center py-8">Loading...</div>
                ) : !adjustmentsByPeriod || adjustmentsByPeriod?.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No adjustments for this period.
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[100px]">Date</TableHead>
                        <TableHead className="w-[200px]">Affiliate</TableHead>
                        <TableHead className="text-right w-[120px]">Amount</TableHead>
                        <TableHead className="min-w-[300px]">Reason</TableHead>
                        <TableHead className="w-[80px] text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {adjustmentsByPeriod?.map((adjustment: any) => (
                        <TableRow key={adjustment._id}>
                          <TableCell className="whitespace-nowrap">
                            {format(new Date(adjustment.createdAt), formatString)}
                          </TableCell>
                          <TableCell>
                            {adjustment.affiliateId.selfAffiliateId} - {adjustment.affiliateId.firstName} {adjustment.affiliateId.lastName}
                          </TableCell>
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
              </CardContent>
            </Card>

            {period.notes && (
              <Card>
                <CardHeader>
                  <CardTitle>Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{period.notes}</p>
                </CardContent>
              </Card>
            )}
          </div>
        </ScrollArea>
      </DialogContent>

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
                      ${parseFloat(adjustmentToDelete.adjustmentAmount).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
    </Dialog>
  );
}
