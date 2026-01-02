import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { cn, formatCurrency } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { Trash2, Plus, Search, Edit, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { readAdjustmentAffiliate, readAffiliatesDynamic } from "@/api/affiliate";
import { createCommissionAdjustmment, deleteCommissionAdjustment, readCommissionAdjustments, updateCommissionAdjustmment } from "@/api/commission";

interface CommissionPeriod {
  _id: string;
  periodNumber: number;
  displayInBackoffice: boolean;
  status: string;
  startDate: string;
  endDate: string;
  totalAffiliateCommissions: number;
  totalAdjustments: number;
  totalCommissions: number;
  notes: string | null;
}

interface AdjustmentsDialogProps {
  period: CommissionPeriod;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  affiliateId?: string;
}

export function AdjustmentsDialog({ period, open, onOpenChange, affiliateId }: AdjustmentsDialogProps) {

  // state to store searchType
  const [searchType, setSearchType] = useState("name");

  // state to store search Term
  const [searchTerm, setSearchTerm] = useState("");

  // state to store debounced search Term
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");

  // state to store the selected affiliate
  const [selectedAffiliate, setSelectedAffiliate] = useState<any>(null);

  // state to store the amount to be adjusted
  const [amount, setAmount] = useState("");

  // state to store the OrderId
  const [orderId, setOrderId] = useState("");

  // state to store the reason
  const [reason, setReason] = useState("");

  // state to store whether adding or editing adjustment
  const [editingAdjustment, setEditingAdjustment] = useState<any>(null);

  // ueryClient to invalidate queries
  const queryClient = useQueryClient();

  // query to fetch searched Affiliates
  const { data: searchResults, isLoading: searchLoading } = useQuery({
    queryKey: ["affiliate-search", debouncedSearchTerm, searchType],
    queryFn: async () => {

      try {
        const payload = {
          periodId: period._id,
          searchBy: searchType || "name",
          searchValue: debouncedSearchTerm
        }

        const response = await readAffiliatesDynamic(payload);

        return response.data.data;

      } catch (error) {
        console.error("error is ", error);
        return [];
      }
    },
    enabled: open && searchTerm.length >= 2,
  });

  // Auto-load affiliate if affiliateId is provided
  const { data: affiliateWithBalance } = useQuery({
    queryKey: ["pre-selected-affiliate", affiliateId, period._id, period.startDate, period.endDate],
    queryFn: async () => {
      if (!affiliateId) return null;

      const payload = {

        affiliateId,
        periodId: period._id
      };

      const response = await readAdjustmentAffiliate(payload); 

      setSelectedAffiliate(response.data.data);

      return response;
    },
    enabled: open && !!affiliateId,
  });

  // mutation to create adjustment
  const createMutation = useMutation({
    mutationFn: async (payload: any) => await createCommissionAdjustmment(payload),
    onSuccess: async () => {
      // await recalculatePeriodTotals();
      queryClient.invalidateQueries({ queryKey: ["commission-adjustments"] });
      queryClient.invalidateQueries({ queryKey: ["commission-adjustments-all"] });
      queryClient.invalidateQueries({ queryKey: ["pre-selected-affiliate"] });
      queryClient.invalidateQueries({ queryKey: ["commission-periods"] });
      queryClient.invalidateQueries({ queryKey: ["period-breakdown", period._id] });
      // toast.success(editingAdjustment ? "Adjustment updated successfully" : "Adjustment created successfully");
      resetForm();
    },
    onError: (error: any) => {
      console.log("error is ", error);
      toast.error(error.message || "Failed to save adjustment");
    },
  });

  // query to fetch existing adjustments
  const { data: adjustments, isLoading } = useQuery({
    queryKey: ["commission-adjustments", period._id, affiliateId],
    queryFn: async () => {

      const response = await readCommissionAdjustments({
        periodId: period._id
      });


      let returnValue = response.data.data || []

   

      if(affiliateId){
        returnValue = returnValue.filter((item ,index) => item.affiliateId._id === affiliateId);
      }

      return returnValue;
    },
    enabled: open,
  });

  const updateMutation = useMutation({
    mutationFn: async (payload: any) => await updateCommissionAdjustmment(payload),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["commission-adjustments"] });
      queryClient.invalidateQueries({ queryKey: ["commission-adjustments-all"] });
      queryClient.invalidateQueries({ queryKey: ["pre-selected-affiliate"] });
      queryClient.invalidateQueries({ queryKey: ["commission-periods"] });
      queryClient.invalidateQueries({ queryKey: ["period-breakdown", period._id] });
      // toast.success(editingAdjustment ? "Adjustment updated successfully" : "Adjustment created successfully");

      // toast({
      //   title: "Adjustment updated successfully",
      //   description: "Adjustment has been updated throughout the commission cycle"
      // });
      resetForm();
    },
    onError: (error) => {

      console.error("Error is ", error);

      toast({
        variant: "destructive",
        title: "error",
        description: error.message
      });
      
    }

  });

  // mutation to delete the existing adjustment
  const deleteMutation = useMutation({
    mutationFn: async (payload: any) => await deleteCommissionAdjustment(payload),
    onSuccess: async () => {
      // await recalculatePeriodTotals();
      queryClient.invalidateQueries({ queryKey: ["commission-adjustments"] });
      queryClient.invalidateQueries({ queryKey: ["commission-adjustments-all"] });
      queryClient.invalidateQueries({ queryKey: ["pre-selected-affiliate"] });
      queryClient.invalidateQueries({ queryKey: ["commission-periods"] });
      queryClient.invalidateQueries({ queryKey: ["period-breakdown", period.id] });
      toast.success("Adjustment deleted successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete adjustment");
    },
  });

  // function to reset the form
  const resetForm = () => {
    setSelectedAffiliate(null);
    setAmount("");
    setOrderId("");
    setReason("");
    setSearchTerm("");
    setEditingAdjustment(null);
  };

  // function to recalculate the period totals
  const recalculatePeriodTotals = async () => {
    // Get all adjustments for this period
    const { data: allAdjustments, error: adjustmentsError } = await supabase
      .from("commission_period_adjustments")
      .select("adjustment_amount")
      .eq("period_id", period.id);

    if (adjustmentsError) throw adjustmentsError;

    const totalAdjustments = allAdjustments?.reduce(
      (sum, adj) => sum + parseFloat(adj.adjustment_amount.toString()),
      0
    ) || 0;

    // Update period totals
    const { error: updateError } = await supabase
      .from("commission_periods")
      .update({
        total_adjustments: totalAdjustments,
        total_commissions: period.total_affiliate_commissions + totalAdjustments,
      })
      .eq("id", period.id);

    if (updateError) throw updateError;
  };

  // function to handle the selection of an affiliate
  const handleSelectAffiliate = (affiliate: any) => {
    setSelectedAffiliate(affiliate);
    setSearchTerm("");
  };

  // function to handle the initialization of editing and adjustment
  const handleEditAdjustment = (adjustment: any) => {
    setEditingAdjustment(adjustment);
    setSelectedAffiliate({
      _id: adjustment.affiliateId,
      selfAffiliateId: adjustment.affiliateId.selfAffiliateId,
      firstName: adjustment.affiliateId.firstName,
      lastName: adjustment.affiliateId.lastName,
    });
    setAmount(adjustment.adjustmentAmount.toString());
    setReason(adjustment.reason);
  };

  const handleDeleteAdjustment = async (adjustment: any) => {

    const payload = {
      adjustmentId: adjustment._id
    }

    await deleteMutation.mutateAsync(payload);


  }

  // function to handle the onSubmit event
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAffiliate || !amount || !reason) {
      toast.error("Please select an affiliate and fill in all required fields");
      return;
    }

    if (!editingAdjustment) {


      const payload = {
        reason,
        orderId,
        adjustmentAmount: parseFloat(amount),
        affiliateId: selectedAffiliate?._id,
        periodId: period?._id
      };

      await createMutation.mutateAsync(payload);
    }

    if (editingAdjustment) {

      const payload = {
        adjustmentId: editingAdjustment._id
      }

      let changes = false;

      if(editingAdjustment.orderId !== orderId){
        changes = true;
        payload.orderId = orderId;
      }
      if(editingAdjustment.reason !== reason){
        changes = true;
        payload.reason = reason;
      }
      if(editingAdjustment.adjustmentAmount !== parseFloat(amount)){
        changes = true;
        payload.adjustmentAmount = parseFloat(amount);
      }
      if(editingAdjustment.orderId !== orderId){
        changes = true;
        payload.orderId = orderId;
      }


      if(!changes){
        toast.error("Please make some changes to the adjustment to update");
        return;
      }
      // return;

      
      await updateMutation.mutateAsync(payload);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500); // Delay of 500ms before updating the debounced search term

    return () => clearTimeout(timer); // Clear the timer when searchTerm changes before the timeout is complete
  }, [searchTerm]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>
            {affiliateId && selectedAffiliate
              ? `Adjustments for ${selectedAffiliate.firstName} ${selectedAffiliate.lastName}`
              : "Add Affiliate Adjustment"}
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          <div className="space-y-4 border-b pb-6">
            <h3 className="font-semibold">Search for Affiliate</h3>

            <div className="flex gap-2">
              <Select value={searchType} disabled={!!(editingAdjustment) || !!(selectedAffiliate)} onValueChange={setSearchType}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">By Name</SelectItem>
                  <SelectItem value="selfAffiliateId">By Affiliate ID</SelectItem>
                  <SelectItem value="enroller">By Enroller</SelectItem>
                </SelectContent>
              </Select>

              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Enter search term..."
                  value={searchTerm}
                  disabled={!!(editingAdjustment) || !!(selectedAffiliate)}
                  onChange={(e) => {
                    const value = e.target.value;

                    if (searchType === "selfAffiliateId") {
                      // Allow only digits
                      if (!/^\d*$/.test(value)) return;
                    }

                    setSearchTerm(value);
                  }}
                  className="pl-9"
                />
              </div>
            </div>

            {searchTerm.length >= 1 && searchResults && searchResults.length > 0 && (
              <div className="border rounded-lg max-h-[200px] overflow-auto">
                {searchResults.map((affiliate: any) => (
                  <div
                    key={affiliate.affiliateId}
                    className="p-3 hover:bg-muted cursor-pointer border-b last:border-b-0"
                    onClick={() => handleSelectAffiliate(affiliate)}
                  >
                    <div className="font-medium">
                      {affiliate.affiliateName}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      ID: {affiliate.selfAffiliateId} | Balance: {formatCurrency(affiliate.netCommissions || 0)}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {selectedAffiliate && (
              <Alert className={cn(
                selectedAffiliate.periodBalance !== undefined && selectedAffiliate.periodBalance < 0
                  ? "bg-destructive/10 border-destructive"
                  : "bg-success/10 border-success"
              )}>
                <AlertCircle className={cn(
                  "h-4 w-4",
                  selectedAffiliate.periodBalance !== undefined && selectedAffiliate.periodBalance < 0
                    ? "text-destructive"
                    : "text-success"
                )} />
                <AlertDescription>
                  <div className="space-y-1">
                    <div className="font-semibold">Selected Affiliate:</div>
                    <div><span className="font-medium">Name:</span> {selectedAffiliate.firstName} {selectedAffiliate.lastName}</div>
                    <div><span className="font-medium">ID:</span> {selectedAffiliate.selfAffiliateId}</div>
                    {selectedAffiliate.phone && <div><span className="font-medium">Phone:</span> {selectedAffiliate.phone}</div>}
                    {selectedAffiliate.email && <div><span className="font-medium">Email:</span> {selectedAffiliate.email}</div>}
                    {selectedAffiliate.periodBalance !== undefined ? (
                      <>
                        <div className="pt-2 border-t space-y-1">
                          <div className="font-semibold">Period {period.periodNumber} Balance:</div>
                          <div><span className="font-medium">Commissions:</span> {formatCurrency(selectedAffiliate.periodCommissions || 0)}</div>
                          <div><span className="font-medium">Adjustments:</span> {formatCurrency(selectedAffiliate.periodAdjustments || 0)}</div>
                          <div className={`font-semibold ${selectedAffiliate.periodBalance >= 0 ? 'text-success' : 'text-destructive'}`}>
                            <span className="font-medium">Net Balance:</span> {formatCurrency(selectedAffiliate.periodBalance)}
                          </div>
                        </div>
                      </>
                    ) : selectedAffiliate.totalCommissions !== undefined ? (
                      <div><span className="font-medium">Lifetime balance:</span> {formatCurrency(selectedAffiliate.totalCommissions)}</div>
                    ) : null}
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 border-b pb-6">
            <h3 className="font-semibold">{editingAdjustment ? "Edit Adjustment" : "Add Adjustment"}</h3>

            {!selectedAffiliate && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Please search and select an affiliate first.
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="amount">Adjustment Amount *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount (positive or negative)"
                required
                disabled={!selectedAffiliate}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="orderId">Order ID (optional)</Label>
              <Input
                id="orderId"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                placeholder="Order ID"
                disabled={!selectedAffiliate}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Reason for Adjustment *</Label>
              <Textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Enter reason for adjustment..."
                rows={3}
                required
                disabled={!selectedAffiliate}
              />
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={createMutation.isPending || !selectedAffiliate} className="flex-1">
                {createMutation.isPending ? "Saving..." : editingAdjustment ? "Update Adjustment" : "Add Adjustment"}
              </Button>
              {editingAdjustment && (
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel Edit
                </Button>
              )}
            </div>
          </form>
          <div className="space-y-4">
            <h3 className="font-semibold">Adjustment History</h3>
            <div className="border rounded-lg">
              <div className="max-h-[300px] overflow-y-auto">
                {isLoading && (
                  <>
                    <div className="text-center py-8">Loading adjustments...</div>
                  </>
                )}

                {!isLoading && adjustments?.length === 0 && (
                  <>
                    <div className="text-center py-8 text-muted-foreground">
                      No adjustments for this period yet.
                    </div>
                  </>
                )}

                {!isLoading && (adjustments?.length !== 0) && (
                  <div className="divide-y">
                    {adjustments?.map((adjustment: any) => (
                      <div key={adjustment._id} className="p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                            <span className="text-sm text-muted-foreground whitespace-nowrap">
                              {format(new Date(adjustment.createdAt), "MM/dd/yy")}
                              {/* <br /> */}
                              {"  "}
                              {new Date(adjustment.createdAt).toLocaleTimeString()}
                            </span>
                            <span className="text-sm font-medium">
                              {adjustment.affiliateId.selfAffiliateId} - {adjustment.affiliateId.firstName} {adjustment.affiliateId.lastName}
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className={`text-sm font-semibold whitespace-nowrap ${parseFloat(adjustment.adjustmentAmount) >= 0 ? 'text-success' : 'text-destructive'}`}>
                              {formatCurrency(parseFloat(adjustment.adjustmentAmount))}
                            </span>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditAdjustment(adjustment)}
                                title="Edit Adjustment"
                                className="h-8 w-8 p-0"
                                aria-label="Edit adjustment"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteAdjustment(adjustment)}
                                title="Delete Adjustment"
                                className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                                aria-label="Delete adjustment"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                        <div className="mt-2 text-sm text-foreground/90 break-words">
                          {adjustment.reason}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
