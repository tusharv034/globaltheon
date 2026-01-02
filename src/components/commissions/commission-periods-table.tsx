import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronDown, ChevronUp, Edit, Trash2, DollarSign, Eye, EyeOff, Download, History, MoreVertical, Loader2, CirclePlus } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { utils as XLSXUtils, write as writeXLSX } from 'xlsx';
import { EditPeriodDialog } from "./edit-period-dialog";
import { AdjustmentsDialog } from "./adjustments-dialog";
import { AdjustmentHistoryDialog } from "./adjustment-history-dialog";
import { PeriodDetailsDialog } from "./period-details-dialog";
import { PeriodBreakdownRow } from "./period-breakdown-row";
import { AffiliateEditDialog } from "@/components/affiliates/affiliate-edit-dialog";
import { useUserRole } from "@/hooks/use-user-role";
import { calculateCommissionByPeriod, checkExportStatus, createCommissionPeriods, downloadCommissionPeriod, readCommissionPeriods, toggleDisplay, updateCommissionPeriodsStatus } from "@/api/commission";
import { useToast } from "@/hooks/use-toast";
import parseDate from "@/utils/formatUTC";
import { useDateFormatStore } from "@/store/useDateFormat";
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
import { Dialog, DialogContent, DialogTitle } from "@radix-ui/react-dialog";
import { DialogHeader } from "../ui/dialog";
import { readAffiliateByEnrolledBy } from "@/api/affiliate";
import { getDateFormatString } from "@/utils/resolveDateFormat";
// import { toast } from "sonner";

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

interface CommissionPeriodsTableProps {
  onViewAdjustments: () => void;
}

export function CommissionPeriodsTable({ onViewAdjustments }: CommissionPeriodsTableProps) {

  // state to check if the current user is admin or affiliate
  const { isAffiliate, isAdmin } = useUserRole();

  // state to toggle the opening and closing of update period status dialog
  const [updatePeriodDialog, setUpdatePeriodDialog] = useState<boolean>(false);

  // state to store the period that is being updated
  const [periodToUpdate, setPeriodToUpdate] = useState<any>(null);

  // state to store the operation that is to be done on the period when updating there status
  const [operation, setOperation] = useState();

  // state to store the period being editted
  const [editingPeriod, setEditingPeriod] = useState<CommissionPeriod | null>(null);

  // state to store the Period around which the adjustment is beingn created or being editted
  const [adjustmentsPeriod, setAdjustmentsPeriod] = useState<CommissionPeriod | null>(null);

  // state to toggle the history being open or close
  const [historyOpen, setHistoryOpen] = useState(false);

  // state to store the period beng viewed
  const [viewingPeriod, setViewingPeriod] = useState<CommissionPeriod | null>(null);

  // state to store the expanded period ID
  const [expandedPeriodId, setExpandedPeriodId] = useState<string | null>(null);

  // state to store the selectedAffiliate for viewing affiliate dialog
  const [selectedAffiliate, setSelectedAffiliate] = useState<{ id: string } | null>(null);

  // state to store the selected Commission Week, that is used in Affiliate Dialog
  const [selectedCommissionWeek, setSelectedCommissionWeek] = useState<string | undefined>();

  // state to store the selected commission level used in Affiliate Dialog
  const [selectedCommissionLevel, setSelectedCommissionLevel] = useState<1 | 2 | undefined>();

  // state to toggle, used in refetching of affiliates for commission and in Affiliate Dialog
  const [viewingCommissionAffiliate, setViewingCommissionAffiliate] = useState(false);
  const { dateFormatRegion, dateFormatVariant } = useDateFormatStore();
  const formatString = getDateFormatString(dateFormatRegion, dateFormatVariant);

  // state to store the loading of each period
  const [loadingPeriodId, setLoadingPeriodId] = useState<string | null>(null);

  const [exportId, setExportId] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [exportStatus, setExportStatus] = useState<"idle" | "processing" | "completed" | "failed">("idle");


  // pagination states below
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [totalPages, setTotalPages] = useState(0);
  const [totalPeriods, setTotalPeriods] = useState(0);

  const [selectedPeriodStartDate, setSelectedPeriodStartDate] = useState<string | undefined>();
  const [selectedPeriodEndDate, setSelectedPeriodEndDate] = useState<string | undefined>();

  // queryClient used for invalidating queries
  const queryClient = useQueryClient();

  // state to store the commission Period cretion loading 
  const [createCommissionLoading, setCreateCommissionLoading] = useState(false);

  // toast for application alerts
  const { toast } = useToast();

  // function to handle the eye icon click
  const togglePeriodExpanded = (periodId: string) => {
    setExpandedPeriodId((prev) => prev === periodId ? null : periodId);
  };

  // Fetch selected affiliate data for commission viewing
  const { data: affiliateData } = useQuery({
    queryKey: ["affiliate-for-commission", selectedAffiliate?.id],
    queryFn: async () => {
      return { _id: selectedAffiliate?.id }
    },
    enabled: !!selectedAffiliate?.id && viewingCommissionAffiliate,
  });

  // Query to fetch the Commission Periods
  const { data: periods, isLoading } = useQuery({
    queryKey: ["commission-periods", currentPage, itemsPerPage],
    queryFn: async () => {

      const payload = {};

      payload.page = currentPage;

      payload.limit = itemsPerPage;

      const response = await readCommissionPeriods(payload);

      setCurrentPage(response?.data?.data?.pagination.currentPage);
      setItemsPerPage(response?.data?.data?.pagination.itemsPerPage);
      setTotalPeriods(response?.data?.data?.pagination.totalItems);
      setTotalPages(response?.data?.data?.pagination.totalPages);

      return response?.data?.data?.data || [];
    },
  });

  // Auto-create next period if the last one has ended
  const createNextPeriodMutation = useMutation({
    mutationFn: async () => {
      if (!periods || periods.length === 0) return null;

      const lastPeriod = periods[0]; // Most recent period (descending order)
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const lastEndDate = new Date(lastPeriod.end_date);
      lastEndDate.setHours(0, 0, 0, 0);

      // Only create if last period has ended
      if (lastEndDate >= today) return null;

      // Calculate next period dates (7 days)
      const nextStartDate = new Date(lastEndDate);
      nextStartDate.setDate(nextStartDate.getDate() + 1);

      const nextEndDate = new Date(nextStartDate);
      nextEndDate.setDate(nextEndDate.getDate() + 6); // 7-day period

      const { data, error } = await supabase
        .from("commission_periods")
        .insert({
          period_number: lastPeriod.period_number + 1,
          start_date: nextStartDate.toISOString().split('T')[0],
          end_date: nextEndDate.toISOString().split('T')[0],
          status: 'open',
          display_in_backoffice: false,
          total_affiliate_commissions: 0,
          total_adjustments: 0,
          total_commissions: 0,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (data) {
        queryClient.invalidateQueries({ queryKey: ["commission-periods"] });
        toast({ description: "Next commission period automatically created" });
      }
    },
    onError: (error) => {
      console.error("Error auto-creating period:", error);
    },
  });

  // Mutation to create new periods from a pre defined dates to every 7 days
  const createNewCommissionPeriodsMutation = useMutation({
    mutationFn: async (payload: any) => await createCommissionPeriods(payload),

    onSuccess: (response: any) => {
      queryClient.invalidateQueries(["commission-periods"]);
      queryClient.invalidateQueries(["period-breakdown"]);
      toast({
        title: "Successfull",
        description: "Commission Periods generated Successfully"
      })
    },

    onError: (error) => {

      console.log("Error is ", error);
    }
  })

  // function to handle the create Period click event
  const handleCreateCommissionPeriods = async () => {

    const payload = {
      "fromDate": "2025-12-01T00:00:00Z"
    }

    // return;

    await createNewCommissionPeriodsMutation.mutateAsync(payload);

  }

  // Mutation to handle the updating of status in the commission period
  const updateCommissionPeriodStatusMutation = useMutation({
    mutationFn: async (payload: any) => await updateCommissionPeriodsStatus(payload),

    onSuccess: (response) => {
      setLoadingPeriodId(null)

      queryClient.invalidateQueries({ queryKey: ["commission-periods"] });
    },

    onError: (error) => {
      setLoadingPeriodId(null)

      console.log("error is ", error);
    }
  })

  // function to handle the closig of commission period
  const handleCloseCommissionPeriod = async (period) => {

    if (period.status === "1") return;

    const payload = {
      periodId: period._id,
      status: "1"
    }
    setLoadingPeriodId(period._id)

    await updateCommissionPeriodStatusMutation.mutateAsync(payload);

  }

  // function to handle the funding of commission period
  const handleFundCommissionPeriod = async (period) => {
    if (period.status === "2") return;

    const payload = {
      periodId: period._id,
      status: "2"
    }

    setLoadingPeriodId(period._id)

    await updateCommissionPeriodStatusMutation.mutateAsync(payload);
  }

  // function to handle the opening of a commission period
  const handleOpenCommissionPeriod = async (period) => {
    if (period.status === "0") return;

    const payload = {
      periodId: period._id,
      status: "0"
    }

    setLoadingPeriodId(period._id)

    toast({
      title: "Reopening Period",
      description: "Please wait while the commissions get recalculated"
    })

    await updateCommissionPeriodStatusMutation.mutateAsync(payload);
  }

  // Trigger auto-creation when periods load
  useEffect(() => {
    return;
    if (periods && periods.length > 0 && !createNextPeriodMutation.isPending) {
      const lastPeriod = periods[0];
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const lastEndDate = new Date(lastPeriod.end_date);
      lastEndDate.setHours(0, 0, 0, 0);

      if (lastEndDate < today) {
        createNextPeriodMutation.mutate();
      }
    }
  }, [periods]);

  const toggleDisplayMutation = useMutation({
    mutationFn: async ({ id, display }: { id: string; display: boolean }) => {
      const payload = {
        periodId: id,
        display
      }

      // return;
      const response = await toggleDisplay(payload);


    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["commission-periods"] });
      toast.success("Display setting updated");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update display setting");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("commission_periods")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["commission-periods"] });
      toast.success("Period deleted successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete period");
    },
  });

  // Mutation to download the XLSX or CSV
  const handleDownloadMutation = useMutation({
    mutationFn: async (payload: any) => await downloadCommissionPeriod(payload),

    onSuccess: (response) => {

      console.log("handleDownloadMutation response is ", response);
      setExportId(response.data.data.exportId);
      setExportStatus(response.data.data.status);
      setDownloadUrl(null);
      toast({
        title: "Downloading...",
        description: "Please wait while we fetch the file"
      })
    },

    onError: (error) => {

      console.log("error is ", error);
      setExportStatus("idle");
    }
  });

  // Poll export status only when processing
  const { data: exportStatusData } = useQuery({
    queryKey: ["exportStatus", exportId],
    queryFn: () => checkExportStatus({ exportId }),
    enabled: exportStatus === "processing" && !!exportId,
    refetchInterval: (query) => {
      // Stop polling if we have a final status
      const data = query.state.data as any;
      if ((data?.data?.success && (data?.data?.data?.status === "completed" || data?.data?.data?.status === "failed"))) {
        return false; // Stops refetching
      }
      return 1000; // Poll every 3 seconds otherwise
    },
    staleTime: Infinity, // Prevent unnecessary refetching
  });

  // Handle status updates manually when data changes
  // Auto-trigger download when export completes, then reset state
  useEffect(() => {
    console.log("Condition is ", exportStatusData);
    if (exportStatusData?.data?.success && exportStatusData.data?.data?.status === "completed") {
      const url = exportStatusData.data?.data?.downloadUrl;
      console.log("url is ", url);
      const filename = exportStatusData.data?.data?.filename || `orders_export_${format(new Date(), `${formatString}_HH-mm-ss`)}.csv`;

      // Create invisible link and click it to trigger download
      const a = document.createElement("a");
      a.href = url;
      a.download = filename; // Suggest filename
      a.style.display = "none";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      toast({
        title: "Export completed",
        description: `Downloading ${exportStatusData?.data?.data?.recordCount} records...`
      })

      // Reset state after a short delay to allow download to start
      setTimeout(() => {
        setExportStatus("idle");
        setDownloadUrl(null);
        setExportId(null);
      }, 1000);
    }

    if (exportStatusData?.data?.success && exportStatusData?.data?.data?.status === "failed") {
      // toast.error("Export failed. Please try again.");
      toast({
        title: "Export failed",
        description: "Please Try again",
        variant: "destructive"
      })
      setExportStatus("idle");
      setExportId(null);
    }
  }, [exportStatusData]);

  const handleDownloadPeriod = async (period, downloadFormat = "numbers") => {

    const payload = {
      periodId: period._id,
      downloadFormat
    }

    await handleDownloadMutation.mutateAsync(payload);

  }

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

  const calculateCommissionByPeriodMutation = useMutation({

    mutationFn: async (payload: any) => await calculateCommissionByPeriod(payload),

    onSuccess: (response) => {

      toast({
        title: "Commissions Calculated",
        description: "New Commissions has been calculated"
      })

      setCreateCommissionLoading(false);


    },

    onError: (error) => {

      setCreateCommissionLoading(false)
      console.log("Error is ", error);
      toast({
        title: "Error Creating Commissions",
        description: error?.response?.data?.message || "Error Creating Commissions"
      })
    }

  });

  const handleCalculateCommissionsByPeriod = async (period) => {



    const payload = {
      periodId: period._id
    }

    setCreateCommissionLoading(true)

    toast({
      title: "Recalculating Commissions",
      description: "Please sit tight as we recalculate commissions for this period"
    });

    await calculateCommissionByPeriodMutation.mutateAsync(payload);

    return;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Commission Periods</h2>
        <div className="flex justify-center items-center gap-4">
          {isAdmin && (
            <Button variant="default" onClick={handleCreateCommissionPeriods} disabled={createNewCommissionPeriodsMutation.isLoading || isLoading}>
              <History className="h-4 w-4 mr-2" />
              Create Periods
            </Button>
          )}
          <Button variant="outline" onClick={onViewAdjustments}>
            <History className="h-4 w-4 mr-2" />
            Adjustment History
          </Button>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden space-y-4">
        {isLoading && (
          <>
            <Loader2 />
          </>
        )}

        {!isLoading && periods?.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No commission periods found. Create your first period to get started.
          </div>
        )}

        {(!isLoading && periods?.length !== 0 &&
          periods?.map((period: any) => (
            <div key={period._id} className="bg-card border rounded-lg p-4 space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-lg">Period {period.periodNumber}</span>
                    {getStatusBadge(period.status)}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {format(new Date(`${period.startDate}`), formatString)} - {format(new Date(`${period.endDate}`), formatString)}
                  </p>
                </div>
                {true && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setEditingPeriod(period)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Period
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setViewingPeriod(period)}>
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setAdjustmentsPeriod(period)}>
                        <DollarSign className="h-4 w-4 mr-2" />
                        Adjustments
                      </DropdownMenuItem>
                      {!isAffiliate && (
                        <DropdownMenuItem onClick={() => handleDownloadPeriod(period, 'csv')}>
                          <Download className="h-4 w-4 mr-2" />
                          Download CSV
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem
                        onClick={() => {
                          if (confirm("Are you sure you want to delete this period?")) {
                            deleteMutation.mutate(period._id);
                          }
                        }}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>

              {isAdmin && (
                <div className="flex items-center justify-between border-t pt-2">
                  <span className="text-sm text-muted-foreground">Display in BO:</span>
                  <Switch
                    checked={period.displayInBackoffice}
                    onCheckedChange={(checked) =>
                      toggleDisplayMutation.mutate({ id: period._id, display: checked })
                    }
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 text-sm border-t pt-2">
                <div>
                  <span className="text-muted-foreground">Affiliate Commissions:</span>
                  <p className="font-medium">
                    {formatCurrency(period.totalAffiliateCommissions)}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Adjustments:</span>
                  <p className="font-medium">
                    {formatCurrency(period.totalAdjustments)}
                  </p>
                </div>
              </div>

              <div className="border-t pt-2">
                <span className="text-muted-foreground text-sm">Net Commissions:</span>
                <p className="font-bold text-lg">
                  {formatCurrency(period.totalCommissions)}
                </p>
              </div>

              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => togglePeriodExpanded(period._id)}
              >
                {expandedPeriodId === period._id ? (
                  <>
                    <ChevronUp className="h-4 w-4 mr-2" />
                    Hide Breakdown
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4 mr-2" />
                    View Breakdown
                  </>
                )}
              </Button>

              {expandedPeriodId === period._id && (
                <div className="border-t pt-2">
                  <PeriodBreakdownRow
                    periodId={period._id}
                    startDate={period.startDate}
                    endDate={period.endDate}
                  />
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden lg:block border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Period ID</TableHead>
              {isAdmin && <TableHead>Display in BO</TableHead>}
              <TableHead>Status</TableHead>
              <TableHead>Start Date</TableHead>
              <TableHead>End Date</TableHead>
              <TableHead className="text-right">Affiliate Commissions</TableHead>
              <TableHead className="text-right">Adjustments</TableHead>
              <TableHead className="text-right">Net Commissions</TableHead>
              {isAdmin && <TableHead className="text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <>
                <TableRow>
                  <TableCell colSpan={isAffiliate ? 7 : 9} className="text-center py-8 text-muted-foreground">
                    <div className="flex justify-center items-center">
                      <Loader2 className="animate-spin text-blue-foreground/70" />
                    </div>
                  </TableCell>
                </TableRow>
              </>
            )}

            {!isLoading && periods?.length === 0 && (
              <TableRow>
                <TableCell colSpan={isAffiliate ? 7 : 9} className="text-center py-8 text-muted-foreground">
                  No commission periods found. {!isAffiliate && "Create your first period to get started."}
                </TableCell>
              </TableRow>
            )}

            {(!isLoading && periods?.length !== 0 && periods?.map((period: any) => (
              <>
                <TableRow key={`period-${period._id}-${period.periodNumber}`} className="hover:bg-muted/50">
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => togglePeriodExpanded(period._id)}
                        title={expandedPeriodId === period._id ? "Close view" : "View details"}
                      >
                        {expandedPeriodId === period._id ? (
                          <EyeOff className="h-4 w-4 text-primary" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                      <span className="font-medium">{period.periodNumber}</span>
                    </div>
                  </TableCell>
                  {isAdmin && (
                    <TableCell>
                      <Switch
                        checked={period.displayInBackoffice}
                        loading={toggleDisplayMutation.isPending && (loadingPeriodId === period._id)} // <-- this triggers the loader
                        onCheckedChange={async (checked) => {
                          setLoadingPeriodId(period._id); // Start loading for this row

                          try {
                            await toggleDisplayMutation.mutateAsync({
                              id: period._id,
                              display: checked
                            });
                          } finally {
                            setLoadingPeriodId(null); // Always clear, even if error
                          }
                        }}
                      />
                    </TableCell>
                  )}
                  <TableCell>
                    {(updateCommissionPeriodStatusMutation?.isPending && loadingPeriodId === period._id) ? (
                      <div className="flex justify-start items-center">
                        <Loader2 className="animate-spin text-blue-foreground/70" />
                      </div>) : (
                      getStatusBadge(period.status)
                    )}
                  </TableCell>
                  <TableCell>{format(new Date(`${period.startDate.split("T")[0]}`), formatString)}</TableCell>
                  <TableCell>{format(new Date(`${period.endDate.split("T")[0]}`), formatString)}</TableCell>

                  <TableCell className="text-right">
                    {formatCurrency(period.totalAffiliateCommissions)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(period.totalAdjustments)}
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    <div className="flex items-center justify-end gap-2">
                      <span>{formatCurrency(period.totalCommissions)}</span>
                      {isAdmin && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-6 w-6">
                              <Download className="h-3.5 w-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleDownloadPeriod(period, 'csv')}>
                              Download as CSV
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDownloadPeriod(period, 'xlsx')}>
                              Download as XLSX
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDownloadPeriod(period, 'numbers')}>
                              Download as Numbers
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </TableCell>
                  {isAdmin && (
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {/* View Period - always available */}
                          <DropdownMenuItem onClick={() => setViewingPeriod(period)}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Period
                          </DropdownMenuItem>

                          {/* Close Period - only for open periods */}
                          {period.status === "0" && (
                            <DropdownMenuItem
                              onClick={() => {
                                setOperation("close")
                                setPeriodToUpdate(period);
                                setUpdatePeriodDialog(true);
                                // handleCloseCommissionPeriod(period);
                              }}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Close Period
                            </DropdownMenuItem>
                          )}

                          {period.status !== '2' && (<DropdownMenuItem onClick={() => handleCalculateCommissionsByPeriod(period)}>
                            {!calculateCommissionByPeriodMutation.isPending && (
                              <>
                                <CirclePlus className="h-4 w-4 mr-2" />
                                Calculate
                              </>
                            )}

                          </DropdownMenuItem>)}

                          {/* Fund Period - only for closed periods */}
                          {period.status === "1" && (
                            <DropdownMenuItem
                              onClick={() => {
                                setOperation("paid");
                                setPeriodToUpdate(period);
                                setUpdatePeriodDialog(true);
                              }}
                            >
                              <DollarSign className="h-4 w-4 mr-2" />
                              Fund Period
                            </DropdownMenuItem>
                          )}

                          {/* Re-Open Period - only for closed periods that haven't been paid */}
                          {period.status === "1" && (
                            <DropdownMenuItem
                              onClick={() => {
                                setOperation("open");
                                setPeriodToUpdate(period);
                                setUpdatePeriodDialog(true);
                              }}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Re-Open Period
                            </DropdownMenuItem>
                          )}

                          {/* Add +/- Adjustments - only for open periods */}
                          {period.status === "0" && (
                            <DropdownMenuItem onClick={() => setAdjustmentsPeriod(period)}>
                              <DollarSign className="h-4 w-4 mr-2" />
                              +/- Adjustments
                            </DropdownMenuItem>
                          )}

                          {/* Show disabled message for adjustments on closed/paid periods */}
                          {period.status !== "0" && (
                            <DropdownMenuItem disabled>
                              <DollarSign className="h-4 w-4 mr-2" />
                              +/- Adjustments (Period must be open)
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  )}
                </TableRow>
                {expandedPeriodId === period._id && (
                  <TableRow key={`breakdown-${period._id}`}>
                    <TableCell colSpan={isAffiliate ? 7 : 9} className="p-0 bg-muted/30">
                      <PeriodBreakdownRow
                        periodId={period._id}
                        startDate={period.startDate}
                        endDate={period.endDate}
                        periodNumber={period.periodNumber}
                        status={period.status}
                        onAffiliateCommissionClick={(affiliateId, level, weekStart) => {
                          setSelectedAffiliate({ id: affiliateId });
                          setSelectedCommissionWeek(weekStart);
                          setSelectedCommissionLevel(level);
                          setSelectedPeriodStartDate(period.startDate);
                          setSelectedPeriodEndDate(period.endDate);
                          setViewingCommissionAffiliate(true);
                        }}
                        onAffiliateClick={async (affiliateId) => {

                          let newAffiliateId = affiliateId;
                          if (!isNaN(parseInt(affiliateId)) && /^[0-9]+$/.test(affiliateId)) {
                            // make an API call to get the object affiliate ID
                            const response = await readAffiliateByEnrolledBy({ enrolledBy: affiliateId });

                            newAffiliateId = response.data.data;

                          }
                          setExpandedPeriodId(undefined);
                          setSelectedAffiliate({ id: newAffiliateId });
                          setSelectedCommissionWeek(undefined);
                          setSelectedCommissionLevel(undefined);
                          setSelectedPeriodStartDate(undefined);
                          setSelectedPeriodEndDate(undefined);
                          setViewingCommissionAffiliate(true);
                        }}
                      />
                    </TableCell>
                  </TableRow>
                )}
              </>
            ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {(periods?.length || 0) > 0 && (
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center gap-4">
            <div className="text-sm text-muted-foreground">
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalPeriods || 0)} of {totalPeriods || 0} periods
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Per page:</span>
              <Select
                value={itemsPerPage?.toString()}
                onValueChange={(value) => {
                  setItemsPerPage(Number(value));
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-[80px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                  <SelectItem value="250">250</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            {totalPages > 1 && (
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(page)}
                    className="min-w-[2.5rem]"
                  >
                    {page}
                  </Button>
                ))}
              </div>
            )}
            <span className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {editingPeriod && (
        <EditPeriodDialog
          period={editingPeriod}
          open={!!editingPeriod}
          onOpenChange={(open) => !open && setEditingPeriod(null)}
        />
      )}

      {adjustmentsPeriod && (
        <AdjustmentsDialog
          period={adjustmentsPeriod}
          open={!!adjustmentsPeriod}
          onOpenChange={(open) => !open && setAdjustmentsPeriod(null)}
        />
      )}

      {viewingPeriod && (
        <PeriodDetailsDialog
          period={viewingPeriod}
          open={!!viewingPeriod}
          onOpenChange={(open) => !open && setViewingPeriod(null)}
        />
      )}

      <AlertDialog open={updatePeriodDialog} onOpenChange={setUpdatePeriodDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{operation === "paid" && "Fund"}{operation === "close" && "Close"}{operation === "open" && "Open"} Period?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to {operation === "paid" && "fund"}{operation === "close" && "close"}{operation === "open" && "open"} this period?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {

                if (operation === "close") {

                  handleCloseCommissionPeriod(periodToUpdate)
                }

                if (operation === "paid") {

                  handleFundCommissionPeriod(periodToUpdate)
                }

                if (operation === "open") {

                  handleOpenCommissionPeriod(periodToUpdate)
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={updateCommissionPeriodStatusMutation.isPending}
            >
              {updateCommissionPeriodStatusMutation.isPending && "Please Wait..."}
              {!updateCommissionPeriodStatusMutation.isPending && operation === "paid" && "Fund"}
              {!updateCommissionPeriodStatusMutation.isPending && operation === "close" && "Close"}
              {!updateCommissionPeriodStatusMutation.isPending && operation === "open" && "Open"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AdjustmentHistoryDialog
        open={historyOpen}
        onOpenChange={setHistoryOpen}
      />

      {affiliateData && (
        <AffiliateEditDialog
          // affiliate={affiliateData}
          affiliateMongoId={affiliateData._id}
          open={viewingCommissionAffiliate}
          onOpenChange={(open) => {
            setViewingCommissionAffiliate(open);
            if (!open) {
              setSelectedAffiliate(null);
              setSelectedCommissionWeek(undefined);
              setSelectedCommissionLevel(undefined);
            }
          }}
          defaultTab="commissions"
          initialExpandedCommission={selectedCommissionWeek}
          initialExpandedLevel={selectedCommissionLevel}
          initialExpandedPeriod={expandedPeriodId}
          filterStartDate={selectedPeriodStartDate}
          filterEndDate={selectedPeriodEndDate}
        />
      )}
    </div>
  );
}
