import { useState, useMemo, useEffect } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { UserMenu } from "@/components/user-menu";
import { SocialMediaLinks } from "@/components/social-media-links";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Clock, Loader2, MoreVertical, Trash2, Search } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import logoImage from "@/assets/theon-logo.avif";
import { deleteAffiliate, readKYCs, revertToPendingKYC, updateAffiliateStatus } from "@/api/affiliate";
import { useDateFormatStore } from "@/store/useDateFormat";
import { getDateFormatString } from "@/utils/resolveDateFormat";
import { format, isValid } from "date-fns";
const KYCReview = () => {

  /* 

    // state to store the selected affiliate
    const [selectedAffiliate, setSelectedAffiliate] = useState<any>(null);
    // state to store the action
    const [actionType, setActionType] = useState<'reject' | 'cancel' | 'terminate' | 'delete' | 'revert' | null>(null);
    // state to store the action reason
    const [actionReason, setActionReason] = useState("");
    // state to store the search keyword
    const [searchTerm, setSearchTerm] = useState("");
    // state to store the filter option
    const [statusFilter, setStatusFilter] = useState("pending_kyc");

    // queryKey for invalidating queries
    const queryClient = useQueryClient();

    // toast to display messages
    const { toast } = useToast();

    // queryMutation to fetch all the KYC
    const { data: pendingKYC = [], isLoading } = useQuery({
      queryKey: ["pending-kyc", statusFilter],
      queryFn: async () => {
        let query = supabase
          .from("affiliates")
          .select(`
            *,
            enroller:enrolled_by(
              id,
              affiliate_id,
              first_name,
              last_name
            )
          `)
          .not("kyc_submitted_at", "is", null)
          .is("deleted_at", null);

        // Filter by status
        if (statusFilter === "pending_kyc") {
          query = query.eq("status", "pending_kyc");
        } else if (statusFilter === "rejected") {
          query = query.eq("status", "rejected");
        } else if (statusFilter === "cancelled") {
          query = query.eq("status", "cancelled");
        } else if (statusFilter === "terminated") {
          query = query.eq("status", "terminated");
        }

        query = query.order("kyc_submitted_at", { ascending: true });

        const { data, error } = await query;

        if (error) throw error;

        // Fetch profile data for status_changed_by users
        if (data && data.length > 0) {
          const userIds = data
            .map(a => a.status_changed_by)
            .filter(Boolean);

          console.log('Fetching profiles for user IDs:', userIds);

          if (userIds.length > 0) {
            const { data: profiles, error: profileError } = await supabase
              .from("profiles")
              .select("id, first_name, last_name")
              .in("id", userIds);

            console.log('Fetched profiles:', profiles);

            if (profileError) {
              console.error('Error fetching profiles:', profileError);
            }

            // Map profiles to affiliates
            const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
            return data.map(affiliate => ({
              ...affiliate,
              status_changer: affiliate.status_changed_by 
                ? profileMap.get(affiliate.status_changed_by) 
                : null
            }));
          }
        }

        return data || [];
      },
    });

    // Filter affiliates based on search term
    const filteredKYC = useMemo(() => {
      if (!searchTerm.trim()) return pendingKYC;

      const search = searchTerm.toLowerCase();
      return pendingKYC.filter((affiliate) => {
        const enroller = (affiliate as any).enroller;
        const fullName = `${affiliate.first_name} ${affiliate.last_name}`.toLowerCase();
        const email = affiliate.email?.toLowerCase() || '';
        const phone = affiliate.phone?.toLowerCase() || '';
        const enrollerName = enroller ? `${enroller.first_name} ${enroller.last_name}`.toLowerCase() : '';
        const enrollerAffiliateId = enroller?.affiliate_id?.toLowerCase() || '';

        return (
          fullName.includes(search) ||
          email.includes(search) ||
          phone.includes(search) ||
          enrollerName.includes(search) ||
          enrollerAffiliateId.includes(search)
        );
      });
    }, [pendingKYC, searchTerm]);

    // state to update the KYC status
    const actionMutation = useMutation({
      mutationFn: async ({ affiliateId, action, reason }: { affiliateId: string; action: 'reject' | 'cancel' | 'terminate' | 'delete' | 'revert'; reason?: string }) => {
        const { data: userData } = await supabase.auth.getUser();
        const currentUserId = userData.user?.id;

        if (action === 'delete') {
          // Soft delete
          const { error } = await supabase
            .from("affiliates")
            .update({ 
              deleted_at: new Date().toISOString(),
              deleted_by: currentUserId
            })
            .eq("id", affiliateId);
          if (error) throw error;
        } else if (action === 'revert') {
          // Revert to pending_kyc and clear status change tracking
          const updates: any = {
            status: 'pending_kyc',
            status_changed_by: null,
            status_change_reason: null,
            status_changed_at: null,
            kyc_rejection_reason: null,
          };

          const { error } = await supabase
            .from("affiliates")
            .update(updates)
            .eq("id", affiliateId);

          if (error) throw error;
        } else {
          // Update status and track who made the change
          const statusMap = {
            reject: 'rejected',
            cancel: 'cancelled',
            terminate: 'terminated'
          };

          const updates: any = {
            status: statusMap[action],
            status_changed_by: currentUserId,
            status_change_reason: reason,
            status_changed_at: new Date().toISOString(),
            kyc_rejection_reason: action === 'reject' ? reason : null,
          };

          const { error } = await supabase
            .from("affiliates")
            .update(updates)
            .eq("id", affiliateId);

          if (error) throw error;
        }
      },
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries({ queryKey: ["pending-kyc"] });
        const actionLabels = {
          reject: 'Rejected',
          cancel: 'Cancelled',
          terminate: 'Terminated',
          delete: 'Deleted',
          revert: 'Reverted to Pending KYC'
        };
        toast({
          title: `Affiliate ${actionLabels[variables.action]}`,
          description: `The affiliate status has been updated to ${variables.action === 'delete' ? 'deleted' : variables.action === 'revert' ? 'pending KYC' : actionLabels[variables.action].toLowerCase()}`,
        });
        setSelectedAffiliate(null);
        setActionType(null);
        setActionReason("");

        // Log for debugging
        console.log('Action completed:', {
          action: variables.action,
          affiliateId: variables.affiliateId,
          reason: variables.reason
        });
      },
      onError: (error: any) => {
        toast({
          title: "Error",
          description: error.message || "Failed to process action",
          variant: "destructive",
        });
      },
    });

    // function to call the actionMutation
    const handleAction = () => {
      if (!selectedAffiliate || !actionType) return;

      // Require reason for reject, cancel, and terminate actions (not for revert or delete)
      if (actionType !== 'delete' && actionType !== 'revert' && !actionReason.trim()) {
        const actionLabels = {
          reject: 'rejecting',
          cancel: 'cancelling',
          terminate: 'terminating'
        };
        toast({
          title: "Reason Required",
          description: `Please provide a reason for ${actionLabels[actionType]} this affiliate`,
          variant: "destructive",
        });
        return;
      }

      actionMutation.mutate({
        affiliateId: selectedAffiliate.id,
        action: actionType,
        reason: actionType !== 'delete' && actionType !== 'revert' ? actionReason : undefined,
      });
    };

    // function to open the dialog to add reason before updatin KYC status
    const openActionDialog = (affiliate: any, action: 'reject' | 'cancel' | 'terminate' | 'delete' | 'revert') => {
      setSelectedAffiliate(affiliate);
      setActionType(action);
    };

    // function to close the Dialog effectively undoing current operation
    const closeDialog = () => {
      setSelectedAffiliate(null);
      setActionType(null);
      setActionReason("");
    };

  */

  // state to store affiliates
  const [affiliates, setAffiliates] = useState<any>([]);

  // state to store the selected affiliate
  const [selectedAffiliate, setSelectedAffiliate] = useState<any>(null);
  // state to store the action
  const [actionType, setActionType] = useState<'reject' | 'cancel' | 'terminate' | 'delete' | 'revert' | null>(null);
  // state to store the action reason
  const [actionReason, setActionReason] = useState("");
  // state to store the search keyword
  const [searchTerm, setSearchTerm] = useState("");
  // state to store the debouncedSearch keyword
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  // state to store the filter option
  const [statusFilter, setStatusFilter] = useState(3);
  // state to store the current page
  const [page, setPage] = useState(1);
  // state to store the cuurent limit
  const [limit, setLimit] = useState(25);
  // state to store totalPages
  const [totalPages, setTotalPages] = useState(0);

  // queryKey for invalidating queries
  const queryClient = useQueryClient();
  
const { dateFormatRegion, dateFormatVariant} = useDateFormatStore();


  // toast to display messages
  const { toast } = useToast();

  // queryMutation to fetch all the KYC
  const { data: pendingKYC = [], isLoading } = useQuery({

    queryKey: ["pending-kyc", searchTerm, statusFilter, limit],

    queryFn: async () => {

      try {

        const payload: any = {
          page: page > 1 || limit !== 10 ? page : undefined,
          limit: page > 1 || limit !== 10 ? limit : undefined,
          searchTerm: searchTerm.trim() || undefined,
        }


        payload.statusFilter = statusFilter

       

        const response = await readKYCs(payload);


        setTotalPages(response.data.data.pagination.totalPages);

        setAffiliates(response.data.data.affiliates);

        return response ? response.data.data : [];
      } catch (error) {
        console.error("Error is ", error);
        return [];
      }

    },
  });

  // Reset page when filters change
  // Debounce logic for searchTerm
  useEffect(() => {
    
    const handler = setTimeout(() => {
      // console.log("handler hit")
      // Reset page when filters change
      setSearchTerm(debouncedSearchTerm);
      // queryClient.invalidateQueries({ queryKey: ["pending-kyc"] });
    }, 400);

    // Cleanup previous timeout when the value or effect changes
    return () => {
      clearTimeout(handler);
    };
  }, [debouncedSearchTerm]);


  // state to update the KYC status
  const actionMutation = useMutation({
    mutationFn: async ({ affiliateId, action, reason }: { affiliateId: string; action: 'reject' | 'cancel' | 'terminate' | 'delete' | 'revert'; reason?: string }) => {

      if (action === 'delete') {
        // Soft delete
        // await

        const response =  await deleteAffiliate(affiliateId);
        return { response, action }

      } else if (action === 'revert') {
        // Revert to pending_kyc and clear status change tracking
        const response = await revertToPendingKYC(affiliateId, {});
        return { response, action }

      } else {
        // Update status and track who made the change
        const statusMap = {
          reject: 4,
          cancel: 5,
          terminate: 6
        };

        const updates: any = {
          status: statusMap[action],
          affiliateId,
          statusChangeReason: reason,
          statusChangedAt: new Date().toISOString(),
          kycRejectionReason: action === 'reject' ? reason : null,
        };

        const response = await updateAffiliateStatus(updates);
        return { response, action };
      }
    },
    onSuccess: ({response, action}) => {
    
      queryClient.invalidateQueries({ queryKey: ["pending-kyc"] });
      const actionLabels = {
        reject: 'Rejected',
        cancel: 'Cancelled',
        terminate: 'Terminated',
        delete: 'Deleted',
        revert: 'Reverted to Pending KYC'
      };
      toast({
        title: `Affiliate ${actionLabels[action]}`,
        description: `The affiliate status has been updated to ${action === 'delete' ? 'deleted' : action === 'revert' ? 'pending KYC' : actionLabels[action].toLowerCase()}`,
      });
      setSelectedAffiliate(null);
      setActionType(null);
      setActionReason("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to process action",
        variant: "destructive",
      });
    },
  });

  // function to call the actionMutation
  const handleAction = async () => {
    if (!selectedAffiliate || !actionType) return;


    // if(selectedAffiliate) return;

    // Require reason for reject, cancel, and terminate actions (not for revert or delete)
    if (actionType !== 'delete' && actionType !== 'revert' && !actionReason.trim()) {
      const actionLabels = {
        reject: 'rejecting',
        cancel: 'cancelling',
        terminate: 'terminating'
      };
      toast({
        title: "Reason Required",
        description: `Please provide a reason for ${actionLabels[actionType]} this affiliate`,
        variant: "destructive",
      });
      return;
    }

    await actionMutation.mutateAsync({
      affiliateId: selectedAffiliate._id,
      action: actionType,
      reason: actionType !== 'delete' && actionType !== 'revert' ? actionReason : undefined,
    });
  };

  // function to open the dialog to add reason before updatin KYC status
  const openActionDialog = (affiliate: any, action: 'reject' | 'cancel' | 'terminate' | 'delete' | 'revert') => {
    setSelectedAffiliate(affiliate);
    setActionType(action);
  };

  // function to close the Dialog effectively undoing current operation
  const closeDialog = () => {
    setSelectedAffiliate(null);
    setActionType(null);
    setActionReason("");
  };

  const formatString = getDateFormatString(dateFormatRegion, dateFormatVariant);

  // Safe date formatter to prevent "Invalid time value" errors
    const safeFormatDate = (dateString: string | null | undefined, formatStr: string = "MMM d, yyyy"): string => {
      console.log('date string before check is ', dateString);
      if (!dateString) return "-";
  
      console.log('date string after check is ', dateString);
    
      const date = new Date(dateString);
      if (!isValid(date)) return "-";
    
      try {
        return format(date, formatStr);
      } catch (error) {
        console.error("Error formatting date:", error);
        return "-";
      }
    };

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen flex w-full bg-dashboard-bg">
        <AppSidebar />

        <div className="flex-1 flex flex-col w-full">
          {/* Mobile Header */}
          <header className="md:hidden h-14 flex items-center justify-between gap-3 px-4 border-b border-white/10 sticky top-0 z-10" style={{ backgroundColor: "#1a1f2e" }}>
            <div className="flex items-center gap-3">
              <SidebarTrigger className="text-white hover:bg-white/10" />
              <img src={logoImage} alt="Theon Global" className="h-8 w-auto" />
            </div>
            <UserMenu />
          </header>

          {/* Desktop Header */}
          <header className="hidden md:flex h-16 bg-white border-b border-border items-center justify-between px-6 shadow-sm sticky top-0 z-10">
            <h1 className="text-xl font-semibold text-foreground">KYC Review</h1>
            <UserMenu />
          </header>

          <main className="flex-1 p-4 md:p-6">
            <Card>
              <CardHeader>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <CardTitle>Pending KYC Submissions</CardTitle>
                  <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-full sm:w-48">
                        <SelectValue placeholder="Filter by status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={3}>Pending KYC</SelectItem>
                        <SelectItem value={4}>Rejected</SelectItem>
                        {/* <SelectItem value="cancelled">Cancelled</SelectItem> */}
                        {/* <SelectItem value="terminated">Terminated</SelectItem> */}
                      </SelectContent>
                    </Select>
                    <div className="relative w-full sm:w-80">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                      <Input
                        placeholder="Search by name, phone, email, or enrolling affiliate..."
                        value={debouncedSearchTerm}
                        onChange={(e) => setDebouncedSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : pendingKYC && pendingKYC?.affiliates?.length === 0 && affiliates?.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                    <p>{searchTerm ? "No matching KYC submissions found" : "No pending KYC submissions"}</p>
                  </div>
                ) : (
                  <>
                    {/* Desktop Table View */}
                    <div className="hidden md:block overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Affiliate ID</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Phone</TableHead>
                            <TableHead>Enrolling Affiliate</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Submitted</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {pendingKYC && affiliates?.map((affiliate) => {
                            const enroller = (affiliate as any).enroller;
                            const statusChanger = (affiliate as any).statusChanger;
                            const hasStatusInfo = affiliate.statusChangedBy && affiliate.statusChangeReason;

                            return (
                              <TableRow key={affiliate._id}>
                                <TableCell className="font-medium">
                                  {affiliate.firstName} {affiliate.lastName}
                                </TableCell>
                                <TableCell>{affiliate.selfAffiliateId}</TableCell>
                                <TableCell>{affiliate.email}</TableCell>
                                <TableCell>{affiliate.phone || 'N/A'}</TableCell>
                                <TableCell>
                                  {affiliate?.enrolledBy || 'N/A'} {enroller && `(${enroller.firstName} ${enroller.lastName})`}
                                </TableCell>
                                <TableCell>
                                  {hasStatusInfo && affiliate.status !== 1 ? (
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Badge
                                            variant="outline"
                                            className={`cursor-help ${affiliate.status === 4 ? 'bg-red-50 text-red-700' :
                                              affiliate.status === 5 ? 'bg-gray-50 text-gray-700' :
                                                affiliate.status === 6 ? 'bg-orange-50 text-orange-700' :
                                                  'bg-yellow-50 text-yellow-700'
                                              }`}
                                          >
                                            {parseInt(affiliate.status) == 4 ? 'Rejected' :
                                              parseInt(affiliate.status) === 5 ? 'Cancelled' :
                                                parseInt(affiliate.status) === 6 ? 'Terminated' :
                                                  `Pending KYC`}{affiliate.status}
                                          </Badge>
                                        </TooltipTrigger>
                                        <TooltipContent className="max-w-xs">
                                          <div className="space-y-1">
                                            {statusChanger ? (
                                              <p className="font-semibold">
                                                Changed by: {statusChanger.firstName} {statusChanger.lastName}
                                              </p>
                                            ) : (
                                              <p className="font-semibold text-muted-foreground">
                                                Changed by: Unknown
                                              </p>
                                            )}
                                            {affiliate.status_change_reason && (
                                              <p className="text-sm">
                                                Reason: {affiliate.statusChangeReason}
                                              </p>
                                            )}
                                            {affiliate.statusChangedAt && (
                                              <p className="text-xs text-muted-foreground">
                                                {format(new Date(affiliate.statusChangedAt), `${formatString} h:mm a`)}
                                              </p>
                                            )}
                                          </div>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  ) : (
                                    <Badge
                                      variant="outline"
                                      className={
                                        affiliate.status === 3 ? 'bg-yellow-50 text-yellow-700' :
                                          affiliate.status === 4 ? 'bg-red-50 text-red-700' :
                                            affiliate.status === 5 ? 'bg-gray-50 text-gray-700' :
                                              affiliate.status === 6 ? 'bg-orange-50 text-orange-700' :
                                                'bg-yellow-50 text-yellow-700'
                                      }
                                    >
                                      {affiliate.status === 3 ? 'Pending KYC' :
                                        affiliate.status === 4 ? 'Rejected' :
                                          affiliate.status === 5 ? 'Cancelled' :
                                            affiliate.status === 6 ? 'Terminated' :
                                              'Pending KYC'}
                                    </Badge>
                                  )}
                                </TableCell>
                                <TableCell className="whitespace-nowrap">
                                  {affiliate.kycSubittedAt && format(new Date(affiliate.kycSubmittedAt),`${formatString} h:mm a`)}
                                  {safeFormatDate(affiliate?.kycSubmittedAt, formatString)}
                                </TableCell>
                                <TableCell className="text-right">
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="icon">
                                        <MoreVertical className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                      <DropdownMenuSeparator />
                                      {(affiliate.status === 4 || affiliate.status === 5 || affiliate.status === 6) && (
                                        <>
                                          <DropdownMenuItem onClick={() => openActionDialog(affiliate, 'revert')}>
                                            Revert to Pending KYC
                                          </DropdownMenuItem>
                                          <DropdownMenuSeparator />
                                        </>
                                      )}
                                      <DropdownMenuItem onClick={() => openActionDialog(affiliate, 'reject')}>
                                        Reject
                                      </DropdownMenuItem>
                                      {/*  
                                      <DropdownMenuItem onClick={() => openActionDialog(affiliate, 'cancel')}>
                                        Cancel
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => openActionDialog(affiliate, 'terminate')}>
                                        Terminate
                                      </DropdownMenuItem>
                                      */}
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem
                                        onClick={() => openActionDialog(affiliate, 'delete')}
                                        className="text-destructive"
                                      >
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Delete Affiliate
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>

                    {/* Mobile Card View */}
                    <div className="md:hidden space-y-4">
                      {!isLoading && pendingKYC && pendingKYC?.affiliates?.length !== 0 && affiliates.map((affiliate) => {
                        const enroller = (affiliate as any).enroller;
                        const statusChanger = (affiliate as any).statusChanger;
                        const hasStatusInfo = affiliate.statusChangedBy && affiliate.statusChangeReason;

                        return (
                          <div key={affiliate._id} className="border rounded-lg p-4 space-y-3">
                            <div className="flex items-start justify-between">
                              <div>
                                <p className="font-medium">{affiliate.firstName} {affiliate.lastName}</p>
                                <p className="text-sm text-muted-foreground">{affiliate.selfAffiliateId}</p>
                              </div>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                  <DropdownMenuSeparator />
                                  {(affiliate.status === 4 || affiliate.status === 5 || affiliate.status === 6) && (
                                    <>
                                      <DropdownMenuItem onClick={() => openActionDialog(affiliate, 'revert')}>
                                        Revert to Pending KYC
                                      </DropdownMenuItem>
                                      <DropdownMenuSeparator />
                                    </>
                                  )}
                                  <DropdownMenuItem onClick={() => openActionDialog(affiliate, 'reject')}>
                                    Reject
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => openActionDialog(affiliate, 'cancel')}>
                                    Cancel
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => openActionDialog(affiliate, 'terminate')}>
                                    Terminate
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => openActionDialog(affiliate, 'delete')}
                                    className="text-destructive focus:text-destructive"
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete Affiliate
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>

                            <div className="space-y-2 text-sm">
                              <div>
                                <span className="text-muted-foreground">Email: </span>
                                <span className="break-all">{affiliate.email}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Phone: </span>
                                <span>{affiliate.phone || 'N/A'}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Enrolling Affiliate: </span>
                                <span>{enroller?.selfAffiliateId || 'N/A'} {enroller && `(${enroller.firstName} ${enroller.lastName})`}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Submitted: </span>
                                <span>{affiliate.kycSubmittedAt && format(new Date(affiliate.kycSubmittedAt), `${formatString} h:mm a`)}</span>
                              </div>
                            </div>

                            <div className="pt-2 border-t">
                              {hasStatusInfo && affiliate.status !== 'pending_kyc' ? (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Badge
                                        variant="outline"
                                        className={`cursor-help ${affiliate.status === 4 ? 'bg-red-50 text-red-700' :
                                          affiliate.status === 5 ? 'bg-gray-50 text-gray-700' :
                                            affiliate.status === 6 ? 'bg-orange-50 text-orange-700' :
                                              'bg-yellow-50 text-yellow-700'
                                          }`}
                                      >
                                        {affiliate.status === 4 ? 'Rejected' :
                                          affiliate.status === 5 ? 'Cancelled' :
                                            affiliate.status === 6 ? 'Terminated' :
                                              'Pending KYC'}
                                      </Badge>
                                    </TooltipTrigger>
                                    <TooltipContent className="max-w-xs">
                                      <div className="space-y-1">
                                        {statusChanger ? (
                                          <p className="font-semibold">
                                            Changed by: {statusChanger.firstName} {statusChanger.lastName}
                                          </p>
                                        ) : (
                                          <p className="font-semibold text-muted-foreground">
                                            Changed by: Unknown
                                          </p>
                                        )}
                                        {affiliate.statusChangeReason && (
                                          <p className="text-sm">
                                            Reason: {affiliate.statusChangeReason}
                                          </p>
                                        )}
                                        {affiliate.statusChangedAt && (
                                          <p className="text-xs text-muted-foreground">
                                            {format(new Date(affiliate.statusChangedAt), `${formatString} h:mm a`)}
                                          </p>
                                        )}
                                      </div>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              ) : (
                                <Badge
                                  variant="outline"
                                  className={
                                    affiliate.status === 3 ? 'bg-yellow-50 text-yellow-700' :
                                      affiliate.status === 4 ? 'bg-red-50 text-red-700' :
                                        affiliate.status === 5 ? 'bg-gray-50 text-gray-700' :
                                          affiliate.status === 6 ? 'bg-orange-50 text-orange-700' :
                                            'bg-yellow-50 text-yellow-700'
                                  }
                                >
                                  {affiliate.status === 3 ? 'Pending KYC' :
                                    affiliate.status === 4 ? 'Rejected' :
                                      affiliate.status === 5 ? 'Cancelled' :
                                        affiliate.status === 6 ? 'Terminated' :
                                          'Pending KYC'}
                                </Badge>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
            {/* Pagination */}
            {(affiliates?.length || 0) > 0 && (
              <div className="flex items-center justify-between mt-4">
                <div className="flex items-center gap-4">
                  <div className="text-sm text-muted-foreground">
                    Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, affiliates?.length || 0)} of {affiliates?.length || 0} affiliates
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Per page:</span>
                    <Select
                      value={limit.toString()}
                      onValueChange={(value) => {
                        setLimit(Number(value));
                        setPage(1);
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
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    Previous
                  </Button>
                  {totalPages > 1 && (
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1).map((page) => (
                        <Button
                          key={page}
                          variant={page === page ? "default" : "outline"}
                          size="sm"
                          onClick={() => setPage(page)}
                          className="min-w-[2.5rem]"
                        >
                          {page}
                        </Button>
                      ))}
                    </div>
                  )}
                  <span className="text-sm text-muted-foreground">
                    Page {page} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </main>

          <footer className="px-4 md:px-6 py-4 border-t border-border flex flex-col sm:flex-row items-center justify-center sm:justify-between gap-3">
            <p className="text-sm text-muted-foreground">© {new Date().getFullYear()}, Theon Global</p>
            <SocialMediaLinks />
          </footer>
        </div>
      </div>

      <Dialog open={!!selectedAffiliate && !!actionType} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === 'reject' && 'Reject Affiliate'}
              {actionType === 'cancel' && 'Cancel Affiliate'}
              {actionType === 'terminate' && 'Terminate Affiliate'}
              {actionType === 'delete' && 'Delete Affiliate'}
              {actionType === 'revert' && 'Revert to Pending KYC'}
            </DialogTitle>
            <DialogDescription>
              {actionType === 'reject' && 'Please provide a reason for rejecting this affiliate. They will need to resubmit KYC.'}
              {actionType === 'cancel' && `Please provide a reason for cancelling ${selectedAffiliate?.firstName} ${selectedAffiliate?.lastName}.`}
              {actionType === 'terminate' && `Please provide a reason for terminating ${selectedAffiliate?.firstName} ${selectedAffiliate?.lastName}.`}
              {actionType === 'delete' && `Are you sure you want to delete ${selectedAffiliate?.firstName} ${selectedAffiliate?.lastName}? This action will soft delete the affiliate record.`}
              {actionType === 'revert' && `Are you sure you want to revert ${selectedAffiliate?.firstName} ${selectedAffiliate?.lastName} back to Pending KYC status? This will clear their current status information.`}
            </DialogDescription>
          </DialogHeader>

          {actionType !== 'delete' && actionType !== 'revert' && (
            <div className="space-y-2">
              <Label htmlFor="action-reason">
                {actionType === 'reject' && 'Rejection Reason'}
                {actionType === 'cancel' && 'Cancellation Reason'}
                {actionType === 'terminate' && 'Termination Reason'}
              </Label>
              <Textarea
                id="action-reason"
                placeholder={`Explain why this affiliate is being ${actionType === 'reject' ? 'rejected' : actionType === 'cancel' ? 'cancelled' : 'terminated'}...`}
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                rows={4}
              />
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={closeDialog} disabled={actionMutation.isPending}>
              Cancel
            </Button>
            <Button
              onClick={handleAction}
              disabled={actionMutation.isPending}
              variant={actionType === 'delete' || actionType === 'terminate' ? 'destructive' : 'default'}
            >
              {actionMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {actionType === 'reject' && 'Reject'}
              {actionType === 'cancel' && 'Cancel'}
              {actionType === 'terminate' && 'Terminate'}
              {actionType === 'delete' && 'Delete'}
              {actionType === 'revert' && 'Revert to Pending KYC'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
};

export default KYCReview;
