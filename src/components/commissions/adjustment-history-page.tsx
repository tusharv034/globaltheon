import { useState } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Search, Edit, Trash2, CalendarIcon, Eye } from "lucide-react";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, subWeeks, subMonths, subYears } from "date-fns";
import { AdjustmentsDialog } from "./adjustments-dialog";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useUserRole } from "@/hooks/use-user-role";
import { readAllAdminUsers } from "@/api/auth";
import { deleteCommissionAdjustment, readCommissionAdjustmentsAllPopulate } from "@/api/commission";
import { useDateFormatStore } from "@/store/useDateFormat";
import { getDateFormatString } from "@/utils/resolveDateFormat";

interface AdjustmentHistoryPageProps {
  onBack: () => void;
}

export function AdjustmentHistoryPage({ onBack }: AdjustmentHistoryPageProps) {

  // queryClient to invalidate the existing queries
  const queryClient = useQueryClient();

  // variable to check if the user is affiliate
  const { isAffiliate } = useUserRole();

  // state to store the search term
  const [searchTerm, setSearchTerm] = useState("");

  // state to store the search by value
  const [searchBy, setSearchBy] = useState("name");

  // state to store the selected note
  const [selectedNote, setSelectedNote] = useState<string | null>(null);

  // state to store the adjustment being editted
  const [editingAdjustment, setEditingAdjustment] = useState<any>(null);

  // state to store the period of the adjustment being editted
  const [adjustmentsPeriod, setAdjustmentsPeriod] = useState<any>(null);

  // state to store the date range
  const [dateRange, setDateRange] = useState("all");

  // state to store the custom start date
  const [customStartDate, setCustomStartDate] = useState<Date | undefined>();

  // state to store the custm end date
  const [customEndDate, setCustomEndDate] = useState<Date | undefined>();

  // state to store the selected Admin
  const [selectedAdmin, setSelectedAdmin] = useState<string>("all");

  // state to toggle the delete dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // state to store the adjustment to be deleted
  const [adjustmentToDelete, setAdjustmentToDelete] = useState<any>(null);

  // state to store the adjustment being viewed
  const [viewingAdjustment, setViewingAdjustment] = useState<any>(null);

  const { dateFormatRegion, dateFormatVariant } = useDateFormatStore();
  
  const formatString = getDateFormatString(dateFormatRegion, dateFormatVariant);

  // Fetch all admin users
  const { data: adminUsers, isError: adminUsersError } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {

      const response = await readAllAdminUsers();


      return response.data.data;
    },
  });

  // Fetch all the commission adjustments
  const { data: adjustments, isLoading } = useQuery({
    queryKey: ["commission-adjustments-all"],
    queryFn: async () => {

      const response = await readCommissionAdjustmentsAllPopulate();


      return response.data.data;
    },
  });

  // function to condittionally render Badge UI component
  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "success" | "destructive"> = {
      "0": "default",
      "1": "secondary",
      "2": "success",
    };

    return (
      <Badge variant={variants[status] || "default"}>
        {status === "0" && "OPEN"}
        {status === "1" && "CLOSE"}
        {status === "2" && "PAID"}
      </Badge>
    );
  };

  // mutation to delete the existing adjustment
  const deleteMutation = useMutation({
    mutationFn: async (payload: any) => await deleteCommissionAdjustment(payload),
    onSuccess: async () => {
      // await recalculatePeriodTotals();
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

  // function to handle the delete event
  const handleDeleteClick = (adjustment: any) => {
    setAdjustmentToDelete(adjustment);
    setDeleteDialogOpen(true);
  };

  // function to handle the confirm delete event
  const confirmDelete = async () => {
    if (adjustmentToDelete) {
      const payload = {
        adjustmentId: adjustmentToDelete._id
      }
      await deleteMutation.mutateAsync(payload);
    }
  };

  // function to get date range bounds
  const getDateRangeBounds = () => {
    const now = new Date();

    switch (dateRange) {
      case "this_week":
        return { start: startOfWeek(now), end: endOfWeek(now) };
      case "last_week":
        const lastWeek = subWeeks(now, 1);
        return { start: startOfWeek(lastWeek), end: endOfWeek(lastWeek) };
      case "this_month":
        return { start: startOfMonth(now), end: endOfMonth(now) };
      case "last_month":
        const lastMonth = subMonths(now, 1);
        return { start: startOfMonth(lastMonth), end: endOfMonth(lastMonth) };
      case "this_year":
        return { start: startOfYear(now), end: endOfYear(now) };
      case "last_year":
        const lastYear = subYears(now, 1);
        return { start: startOfYear(lastYear), end: endOfYear(lastYear) };
      case "custom":
        return { start: customStartDate, end: customEndDate };
      default:
        return { start: null, end: null };
    }
  };

  // function to Filter adjustments based on search, date range, and admin
  const filteredAdjustments = adjustments?.filter((adj: any) => {
    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      if (searchBy === "name") {
        const fullName = `${adj.affiliateId.firstName} ${adj.affiliateId.lastName}`.toLowerCase();
        if (!fullName.includes(term)) return false;
      } else if (searchBy === "selfAffiliateId") {
        if (!adj.affiliateId.selfAffiliateId.toString().includes(term)) return false;
      } else if (searchBy === "period") {
        if (!adj.periodId.periodNumber.toString().includes(term)) return false;
      }
    }

    // Date range filter
    if (dateRange !== "all") {
      const { start, end } = getDateRangeBounds();
      const adjDate = new Date(adj.created_at);

      if (start && adjDate < start) return false;
      if (end && adjDate > end) return false;
    }

    // Admin filter
    if (selectedAdmin !== "all") {
      if (adj.created_by !== selectedAdmin) return false;
    }

    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Adjustment History</h1>
          {!isAffiliate && (
            <p className="text-muted-foreground mt-1">
              Search and view commission adjustment history for affiliates
            </p>
          )}
        </div>
        <Button onClick={onBack} variant="outline">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Commission Dashboard
        </Button>
      </div>

      {/* Search Section - Hidden for Affiliates */}
      {!isAffiliate && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Search for Affiliate Adjustments</h2>
          <div className="flex gap-2 items-start flex-wrap">
            <Select value={searchBy} onValueChange={setSearchBy}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Search by..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">By Name</SelectItem>
                <SelectItem value="selfAffiliateId">By Affiliate ID</SelectItem>
                <SelectItem value="period">By Period</SelectItem>
              </SelectContent>
            </Select>

            <Input
              placeholder="Enter search term..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-[200px]"
            />

            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Date Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="this_week">This Week</SelectItem>
                <SelectItem value="last_week">Last Week</SelectItem>
                <SelectItem value="this_month">This Month</SelectItem>
                <SelectItem value="last_month">Last Month</SelectItem>
                <SelectItem value="this_year">This Year</SelectItem>
                <SelectItem value="last_year">Last Year</SelectItem>
                <SelectItem value="custom">Custom Range</SelectItem>
              </SelectContent>
            </Select>

            {dateRange === "custom" && (
              <>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-[140px] justify-start text-left font-normal",
                        !customStartDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {customStartDate ? format(customStartDate, formatString) : <span>Start</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={customStartDate}
                      onSelect={setCustomStartDate}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-[140px] justify-start text-left font-normal",
                        !customEndDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {customEndDate ? format(customEndDate,formatString) : <span>End</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={customEndDate}
                      onSelect={setCustomEndDate}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </>
            )}

            <Select value={selectedAdmin} onValueChange={setSelectedAdmin}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="By Admin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Admins</SelectItem>
                {adminUsersError && (
                  <div className="px-2 py-1 text-xs text-destructive">Error loading admins</div>
                )}
                {!adminUsersError && adminUsers?.length === 0 && (
                  <div className="px-2 py-1 text-xs text-muted-foreground">No admins found</div>
                )}
                {adminUsers?.map((admin: any) => {
                  const firstName = admin?.firstName || '';
                  const lastName = admin?.lastName || '';
                  const fullName = `${firstName} ${lastName}`.trim() || 'Unknown Admin';

                  return (
                    <SelectItem key={admin._id} value={admin._id}>
                      {fullName}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>

            <Button>
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
          </div>

          <p className="text-sm text-muted-foreground mt-4">
            Showing {filteredAdjustments?.length || 0} adjustments
          </p>
        </Card>
      )}

      {/* Adjustments Table */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">All Adjustments</h2>

        {isLoading && (
          <div className="text-center py-8">Loading adjustment history...</div>
        )}

        {!isLoading && !filteredAdjustments.length && (
          <div className="text-center py-8 text-muted-foreground">
            No adjustments found.
          </div>
        )}

        {!isLoading && !!filteredAdjustments.length && (
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Period ID</TableHead>
                  <TableHead className="w-[110px]">Start Date</TableHead>
                  <TableHead className="w-[110px]">End Date</TableHead>
                  <TableHead className="w-[160px]">Affiliate Name</TableHead>
                  <TableHead className="w-[120px]">Affiliate ID</TableHead>
                  <TableHead className="text-right w-[120px]">Amount</TableHead>
                  <TableHead className="w-[140px]">Admin</TableHead>
                  <TableHead className="w-[180px]">Date</TableHead>
                  <TableHead className="min-w-[200px]">Notes</TableHead>
                  <TableHead className="w-[100px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAdjustments?.map((adjustment: any) => (
                  <TableRow key={adjustment._id}>
                    <TableCell className="font-medium">
                      #{adjustment.periodId.periodNumber}
                    </TableCell>
                    <TableCell>
                      {adjustment.periodId.startDate ?
                        format(new Date(adjustment.periodId.startDate), "MM/dd/yy") :
                        "N/A"
                      }
                    </TableCell>
                    <TableCell>
                      {adjustment.periodId.endDate ?
                        format(new Date(adjustment.periodId.endDate), "MM/dd/yy") :
                        "N/A"
                      }
                    </TableCell>
                    <TableCell>
                      {adjustment.affiliateId.firstName} {adjustment.affiliateId.lastName}
                    </TableCell>
                    <TableCell>{adjustment.affiliateId.selfAffiliateId}</TableCell>
                    <TableCell className={`text-right font-semibold ${parseFloat(adjustment.adjustmentAmount) >= 0 ? 'text-success' : 'text-destructive'}`}>
                      {parseFloat(adjustment.adjustmentAmount) >= 0 ? '+' : ''}
                      {formatCurrency(parseFloat(adjustment.adjustmentAmount))}
                    </TableCell>
                    <TableCell>
                      {adjustment.createdBy?.firstName && adjustment.createdBy?.lastName
                        ? `${adjustment.createdBy.firstName} ${adjustment.createdBy.lastName}`
                        : "Admin Manager"}
                    </TableCell>
                    <TableCell>
                      {format(new Date(adjustment.createdAt), `${formatString}, hh:mm a`)}
                    </TableCell>
                    <TableCell className="max-w-[250px]">
                      <div className="break-words" title={adjustment.reason}>
                        {adjustment.reason}
                      </div>
                      {adjustment.reason && adjustment.reason.length > 50 && (
                        <span
                          className="text-blue-600 hover:underline cursor-pointer text-sm"
                          onClick={() => setSelectedNote(adjustment.reason)}
                        >
                          more...
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        {isAffiliate ? (
                          <Button
                            variant="ghost"
                            size="icon"
                            title="View Details"
                            onClick={() => setViewingAdjustment(adjustment)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        ) : (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Edit"
                              onClick={() => {
                                setAdjustmentsPeriod(adjustment.periodId);
                                setEditingAdjustment(adjustment);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Delete"
                              onClick={() => handleDeleteClick(adjustment)}
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      {/* Notes Dialog */}
      <Dialog open={!!selectedNote} onOpenChange={(open) => { if (!open) setSelectedNote(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adjustment Notes</DialogTitle>
            <DialogDescription>Full note text for the selected adjustment.</DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            <p className="text-sm whitespace-pre-wrap">{selectedNote}</p>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Adjustment Dialog (Read-Only for Affiliates) */}
      <Dialog open={!!viewingAdjustment} onOpenChange={(open) => { if (!open) setViewingAdjustment(null); }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Adjustment Details</DialogTitle>
            <DialogDescription>View adjustment information</DialogDescription>
          </DialogHeader>
          {viewingAdjustment && (
            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Period</label>
                  <p className="text-base">#{viewingAdjustment.periodId.periodNumber}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                  <div className="mt-1">
                    {getStatusBadge(viewingAdjustment.periodId.status)}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Start Date</label>
                  <p className="text-base">
                    {viewingAdjustment.periodId.startDate ?
                      format(new Date(viewingAdjustment.periodId.startDate), formatString) :
                      "N/A"
                    }
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">End Date</label>
                  <p className="text-base">
                    {viewingAdjustment.periodId.endDate ?
                      format(new Date(viewingAdjustment.periodId.endDate),formatString) :
                      "N/A"
                    }
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Affiliate</label>
                  <p className="text-base">
                    {viewingAdjustment.affiliateId.firstName} {viewingAdjustment.affiliateId.lastName}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Affiliate ID</label>
                  <p className="text-base">{viewingAdjustment.affiliateId.selfAffiliateId}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Amount</label>
                  <p className={`text-base font-semibold ${parseFloat(viewingAdjustment.adjustmentAmount) >= 0 ? 'text-success' : 'text-destructive'}`}>
                    {parseFloat(viewingAdjustment.adjustmentAmount) >= 0 ? '+' : ''}
                    {formatCurrency(parseFloat(viewingAdjustment.adjustmentAmount))}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Created By</label>
                  <p className="text-base">
                    {viewingAdjustment.createdBy?.firstName && viewingAdjustment.createdBy?.lastName
                      ? `${viewingAdjustment.createdBy.firstName} ${viewingAdjustment.createdBy.lastName}`
                      : "Admin Manager"}
                  </p>
                </div>
                <div className="col-span-2">
                  <label className="text-sm font-medium text-muted-foreground">Created Date</label>
                  <p className="text-base">
                    {format(new Date(viewingAdjustment.createdAt), `${formatString}, hh:mm a`)}
                  </p>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Notes</label>
                <p className="text-base mt-1 whitespace-pre-wrap bg-muted p-3 rounded-md">
                  {viewingAdjustment.reason}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Adjustments Dialog */}
      {adjustmentsPeriod && editingAdjustment && (
        <AdjustmentsDialog
          open={!!editingAdjustment}
          onOpenChange={(open) => {
            if (!open) {
              setEditingAdjustment(null);
              setAdjustmentsPeriod(null);
            }
          }}
          period={adjustmentsPeriod}
          affiliateId={editingAdjustment.affiliateId._id}//uuid
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Adjustment?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this adjustment? This action cannot be undone.
              {adjustmentToDelete && (
                <div className="mt-4 p-3 bg-muted rounded-md">
                  <p className="font-semibold">
                    Affiliate: {adjustmentToDelete.affiliateId?.firstName} {adjustmentToDelete.affiliateId?.lastName}
                  </p>
                  <p className="font-semibold mt-1">
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
    </div>
  );
}
