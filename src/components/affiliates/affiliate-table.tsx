// import { useState, useEffect, useMemo } from "react";
// import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
// import { supabase } from "@/integrations/supabase/client"; // Keep for syncAuthEmail function only
// import { useUserRole } from "@/hooks/use-user-role";
// import { useModulePermissions } from "@/hooks/use-module-permissions";
// import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// import { Badge } from "@/components/ui/badge";
// import { Pencil, Trash2, Search, Users, MoreVertical, X, ArrowUpDown, ArrowUp, ArrowDown, ShoppingCart, UserRoundCog, StickyNote, CalendarIcon, Loader2 } from "lucide-react";
// import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
// import { toast } from "sonner";
// import { format, startOfWeek, isValid } from "date-fns"; // Added isValid
// import { DuplicateAffiliatesDialog } from "./duplicate-affiliates-dialog";
// import { AffiliateEditDialog } from "./affiliate-edit-dialog";
// import { AffiliateOrdersDialog } from "./affiliate-orders-dialog";
// import { NotesDialog } from "../shared/notes-dialog";
// import { PhoneDisplay, PhoneNumber as PhoneNumberType } from "../shared/phone-display";
// import { formatCurrency, cn } from "@/lib/utils";
// import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
// import { Calendar } from "@/components/ui/calendar";
// import { useAuthStore } from "@/store/useAuthStore";
// import { listAffiliates, getAffiliatesByEnroller, deleteAffiliate, impersonateAffiliate } from "@/api/affiliate";
// import { ListAffiliatesPayload } from "@/types/api/affiliate";
// import { useNavigate } from "react-router-dom";
// import { getDateFormatString } from "@/utils/resolveDateFormat";
// import config from '@/config/env';
// import { useDateFormatStore } from "@/store/useDateFormat";
// import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

// // Define interface for affiliate from backend
// interface BackendAffiliate {
//   _id: string;
//   selfAffiliateId: number;
//   firstName: string;
//   lastName: string;
//   email: string;
//   phone?: string;
//   phoneNumbers?: PhoneNumberType[];
//   addressLineOne?: string;
//   addressLineTwo?: string;
//   cityTown?: string;
//   stateProvince?: string;
//   zipPostal?: string;
//   country?: string;
//   siteName?: string;
//   tipaltiEnabled: boolean;
//   allowAutomaticChargebacks: boolean;
//   kycPass: boolean;
//   status: string;
//   enrollmentDate: string;
//   enrolledBy: number;
//   enroller?: {
//     selfAffiliateId: number;
//     firstName: string;
//     lastName: string;
//     email: string;
//     status: string;
//   };
//   downlineCount?: number;
//   customerCount?: number;
//   totalSales: number;
//   totalCommissions: number;
//   rank: string;
//   createdAt: string;
//   updatedAt: string;
//   profilePictureUrl: string | null;
//   avatarHexColor: string | null;
//   avatarInitials: string | null;
// }

// // Combine with existing interface for compatibility
// type CombinedAffiliate = BackendAffiliate & {
//   // Keep existing fields for compatibility
//   id: string;
//   affiliate_id: string;
//   address: string | null;
//   city: string | null;
//   state_province: string | null;
//   postal_code: string | null;
//   teqnavi_enabled: boolean;
//   auth_user_id?: string | null;
//   last_commission_date?: string | null;
//   last_commission_amount?: number | null;
//   last_subscription_date?: string | null;
//   customer_count?: number;
//   affiliate_count?: number;
//   _fromNotes?: boolean;
//   tax_id?: string | null;
//   enrolling_affiliate?: {
//     id: string;
//     affiliate_id: string;
//     first_name: string;
//     last_name: string;
//   } | null;
//   // For compatibility with old code
//   first_name: string;
//   last_name: string;
//   created_at: string;
//   site_name: string | null;
//   phone?: string;
//   phoneNumbers?: PhoneNumberType[];
//   // Add these for date safety
//   last_commission_date_safe?: string | null;
//   profilePictureUrl: string | null;
//   avatarHexColor: string | null;
//   avatarInitials: string | null;
// };

// // Helper function to convert backend affiliate to frontend format
// const convertBackendAffiliate = (backendAffiliate: BackendAffiliate): CombinedAffiliate => {
//   return {
//     ...backendAffiliate,
//     // Map fields for compatibility
//     id: backendAffiliate._id,
//     affiliate_id: backendAffiliate.selfAffiliateId.toString(),
//     address: backendAffiliate.addressLineOne || null,
//     city: backendAffiliate.cityTown || null,
//     state_province: backendAffiliate.stateProvince || null,
//     postal_code: backendAffiliate.zipPostal || null,
//     teqnavi_enabled: backendAffiliate.tipaltiEnabled,
//     // Map enroller if exists
//     enrolling_affiliate: backendAffiliate.enroller ? {
//       id: backendAffiliate.enroller.selfAffiliateId.toString(),
//       affiliate_id: backendAffiliate.enroller.selfAffiliateId.toString(),
//       first_name: backendAffiliate.enroller.firstName,
//       last_name: backendAffiliate.enroller.lastName,
//     } : null,
//     affiliate_count: backendAffiliate.downlineCount || 0,
//     customer_count: backendAffiliate.customerCount || 0,
//     // Compatibility fields
//     first_name: backendAffiliate.firstName,
//     last_name: backendAffiliate.lastName,
//     created_at: backendAffiliate.enrollmentDate,
//     site_name: backendAffiliate.siteName || null,
//     phone: backendAffiliate.phone,
//     phoneNumbers: backendAffiliate.phoneNumbers ||
//       (backendAffiliate.phone ? [
//         {
//           number: backendAffiliate.phone,
//           type: "mobile" as const,
//           primary: true
//         }
//       ] : []),
//     // These will be populated from backend data if available
//     last_commission_date: undefined,
//     last_commission_amount: undefined,
//     last_subscription_date: undefined,
//     //`${config.cloudFrontUrl}profile-pictures${url.split("/profile-pictures")[1]}` : null
//     // profilePictureUrl: backendAffiliate.profilePictureUrl || null,
//     profilePictureUrl: backendAffiliate.profilePictureUrl ? `${config.cloudFrontUrl}profile-pictures${backendAffiliate.profilePictureUrl?.split("/profile-pictures")[1]}` : null,
//     avatarHexColor: backendAffiliate.avatarHexColor || null,
//     avatarInitials: backendAffiliate.avatarInitials || null,
//     // affiliate_count: 0,
//     tax_id: undefined,
//     // Safe date field
//     last_commission_date_safe: undefined,
//   };
// };

// // Safe date formatter to prevent "Invalid time value" errors
// const safeFormatDate = (dateString: string | null | undefined, formatStr: string = "MMM d, yyyy"): string => {
//   if (!dateString) return "-";

//   const date = new Date(dateString);
//   if (!isValid(date)) return "-";

//   try {
//     return format(date, formatStr);
//   } catch (error) {
//     console.error("Error formatting date:", error);
//     return "-";
//   }
// };

// export function AffiliateTable() {
//   const queryClient = useQueryClient();
//   const user = useAuthStore((state) => state.user);
//   const token = useAuthStore((state) => state.token);
//   const impersonating = useAuthStore((state) => state.impersonating);
//   const [searchTerm, setSearchTerm] = useState("");
//   const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
//   const [enrollingAffiliateSearch, setEnrollingAffiliateSearch] = useState("");
//   const [debouncedEnrollingAffiliateSearch, setDebouncedEnrollingAffiliateSearch] = useState("");
//   const [categoryFilter, setCategoryFilter] = useState<string>("all");
//   const [status, setStatus] = useState<string | number>("all");
//   const [sortColumn, setSortColumn] = useState<"name" | "enrollmentDate" | "siteName" | "customers" | "affiliates" | "subscription" | "lastCommission" | "status" | "tipalti" | "enrolledBy" | "selfAffiliateId">("selfAffiliateId");
//   const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
//   const [showDuplicates, setShowDuplicates] = useState(false);
//   const [selectedAffiliate, setSelectedAffiliate] = useState<CombinedAffiliate | null>(null);
//   const [showEditDialog, setShowEditDialog] = useState(false);
//   const [showOrdersDialog, setShowOrdersDialog] = useState(false);
//   const [enrollingAffiliateToView, setEnrollingAffiliateToView] = useState<CombinedAffiliate | null>(null);
//   const [defaultTab, setDefaultTab] = useState<string>("details");
//   const [initialExpandedCommission, setInitialExpandedCommission] = useState<string | undefined>(undefined);
//   const [notesAffiliate, setNotesAffiliate] = useState<CombinedAffiliate | null>(null);
//   const [currentPage, setCurrentPage] = useState(1);
//   const [itemsPerPage, setItemsPerPage] = useState(25);
//   const [lastOrderDateFrom, setLastOrderDateFrom] = useState<Date | undefined>();
//   const [lastOrderDateTo, setLastOrderDateTo] = useState<Date | undefined>();
//   const [enrolledDateFrom, setEnrolledDateFrom] = useState<Date | undefined>();
//   const [enrolledDateTo, setEnrolledDateTo] = useState<Date | undefined>();

//   const { dateFormatRegion, dateFormatVariant } = useDateFormatStore();
//   const hasActiveFilters = debouncedSearchTerm || debouncedEnrollingAffiliateSearch || categoryFilter !== "all" || status !== "all" || lastOrderDateFrom || lastOrderDateTo || enrolledDateFrom || enrolledDateTo;

//   const formatString = getDateFormatString(dateFormatRegion, dateFormatVariant);


//   const { isAffiliate, isAdmin, isSuperAdmin } = useUserRole();
//   const { hasPermission } = useModulePermissions();
//   const canEditAffiliates = hasPermission("module_permissions", "affiliates", "edit");

//   // Get companyId from user
//   const companyId = user?.selfClientId?.toString() || "1";

//   // Clear filters function
//   const clearFilters = () => {
//     setSearchTerm("");
//     setEnrollingAffiliateSearch("");
//     setCategoryFilter("all");
//     setStatus("all");
//     setLastOrderDateFrom(undefined);
//     setLastOrderDateTo(undefined);
//     setEnrolledDateFrom(undefined);
//     setEnrolledDateTo(undefined);
//   };


//   // Reset page to 1 when any filter changes (but NOT when only page changes)
//   useEffect(() => {
//     setCurrentPage(1);
//   }, [
//     debouncedSearchTerm,
//     status,
//     sortColumn,
//     sortDirection,
//     itemsPerPage,
//     lastOrderDateFrom,
//     lastOrderDateTo,
//     enrolledDateFrom,
//     enrolledDateTo,
//   ]);


//   // Sync auth email function (only Supabase function we keep)
//   const syncAuthEmail = async (aff: CombinedAffiliate) => {
//     try {
//       const { data: { session } } = await supabase.auth.getSession();
//       if (!session) {
//         toast.error("Please log in first");
//         return;
//       }
//       if (!aff.auth_user_id) {
//         toast.error("No linked auth user for this affiliate");
//         return;
//       }
//       const { error } = await supabase.functions.invoke('sync-affiliate-email', {
//         body: { affiliateAuthUserId: aff.auth_user_id },
//         headers: { Authorization: `Bearer ${session.access_token}` }
//       });
//       if (error) throw error;
//       toast.success(`Synced auth email to ${aff.email}`);
//     } catch (e: any) {
//       toast.error(e.message || "Failed to sync auth email");
//     }
//   };

//   // Delete mutation (using your deleteAffiliate function)
//   const deleteMutation = useMutation({
//     mutationFn: (affiliateId: string) => deleteAffiliate(affiliateId),
//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: ["affiliates"] });
//       toast.success("Affiliate moved to deleted folder");
//     },
//     onError: () => toast.error("Failed to delete affiliate"),
//   });


//   // Handle sort function
//   const handleSort = (column: "name" | "enrollmentDate" | "siteName" | "customers" | "affiliates" | "subscription" | "lastCommission" | "status" | "tipalti" | "enrolledBy") => {
//     if (sortColumn === column) {
//       setSortDirection(sortDirection === "asc" ? "desc" : "asc");
//     } else {
//       setSortColumn(column);
//       setSortDirection("desc");
//     }
//     setCurrentPage(1);
//   };

//   // Get sort icon function
//   const getSortIcon = (column: "name" | "enrollmentDate" | "siteName" | "customers" | "affiliates" | "subscription" | "lastCommission" | "status" | "tipalti" | "enrolledBy") => {
//     if (sortColumn !== column) {
//       return <ArrowUpDown className="h-4 w-4 ml-1" />;
//     }
//     return sortDirection === "asc" ? (
//       <ArrowUp className="h-4 w-4 ml-1" />
//     ) : (
//       <ArrowDown className="h-4 w-4 ml-1" />
//     );
//   };

//   // Get status badge function
//   const getStatusBadge = (status: number) => {
//     // Convert backend status to frontend display format
//     const statusDisplayMap = {
//       1: "Active",
//       2: "Inactive",
//       3: "Pending KYC", // Note the space
//       4: "Rejected"
//     };

//     const displayText = statusDisplayMap[status] || status;

//     const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
//       1: "default",
//       2: "secondary",
//       3: "outline",
//       4: "destructive"
//     };

//     const variant = variants[status] || "default";

//     return <Badge variant={variant}>{displayText}</Badge>;
//   };

//   const handleViewEnrollerAffiliate = async (affiliateId: string) => {
//     try {
//       const payload: ListAffiliatesPayload = {
//         companyId,
//         selfAffiliateId: affiliateId,
//         limit: 1,
//       };

//       const response = await listAffiliates(payload);

//       if (response.data.success && response.data.data.affiliates.length > 0) {
//         const enrollerAffiliate = response.data.data.affiliates[0];
//         const converted = convertBackendAffiliate(enrollerAffiliate);
//         setEnrollingAffiliateToView(converted);
//       } else {
//         toast.error("Enroller affiliate not found");
//       }
//     } catch (error) {
//       console.error("Error fetching enroller:", error);
//       toast.error("Failed to load enroller details");
//     }
//   };

//   useEffect(() => {
//     const timer = setTimeout(() => {
//       setDebouncedSearchTerm(searchTerm);
//     }, 500);
//     return () => clearTimeout(timer);
//   }, [searchTerm]);

//   useEffect(() => {
//     const timer = setTimeout(() => {
//       setDebouncedEnrollingAffiliateSearch(enrollingAffiliateSearch);
//     }, 500);
//     return () => clearTimeout(timer);
//   }, [enrollingAffiliateSearch]);

//   useEffect(() => {
//     setCurrentPage(1);
//   }, [debouncedSearchTerm, status, categoryFilter, debouncedEnrollingAffiliateSearch, enrolledDateFrom, enrolledDateTo, sortColumn, sortDirection]);

//   // Use backend API for listing affiliates - MAIN QUERY
//   const { data: backendAffiliatesData, isLoading } = useQuery({
//     queryKey: ["affiliates", debouncedSearchTerm, categoryFilter, status, currentPage, itemsPerPage, companyId, debouncedEnrollingAffiliateSearch, enrolledDateFrom, enrolledDateTo, sortColumn, sortDirection],
//     queryFn: async () => {
//       const payload: ListAffiliatesPayload = {
//         companyId,
//         page: currentPage,
//         limit: itemsPerPage,
//         search: debouncedSearchTerm || undefined,
//         affiliateSearch: debouncedEnrollingAffiliateSearch || undefined,
//         enrollmentDateFrom: enrolledDateFrom || undefined,
//         enrollmentDateTo: enrolledDateTo || undefined,
//         // Map frontend status to backend format
//         status: status !== "all" ?
//           (status === 3 ? 3 : status)
//           : undefined,
//         sortBy: sortColumn || "enrollmentDate",
//         sortOrder: sortDirection || "desc",
//         categoryFilter: categoryFilter
//       };
//       const response = await listAffiliates(payload);

//       if (!response.data.success) {
//         throw new Error(response.data.message);
//       }

//       return response.data.data;
//     },
//   });



//   // // Use backend API for enroller search
//   // const { data: enrollerAffiliatesData } = useQuery({
//   //   queryKey: ["enroller-affiliates", debouncedEnrollingAffiliateSearch, companyId],
//   //   queryFn: async () => {
//   //     if (!debouncedEnrollingAffiliateSearch) return null;

//   //     // First, find the enroller affiliate by name
//   //     const searchPayload: ListAffiliatesPayload = {
//   //       companyId,
//   //       search: debouncedEnrollingAffiliateSearch,
//   //       limit: 10,
//   //     };

//   //     const response = await listAffiliates(searchPayload);

//   //     if (!response.data.success) {
//   //       throw new Error(response.data.message);
//   //     }

//   //     return response.data.data.affiliates;
//   //   },
//   //   enabled: !!debouncedEnrollingAffiliateSearch,
//   // });

//   // Convert backend data to frontend format WITHOUT Supabase queries
//   const enhancedAffiliates = useMemo(() => {
//     if (!backendAffiliatesData?.affiliates) return [];

//     // Convert to combined format
//     const combinedAffiliates = backendAffiliatesData.affiliates.map(convertBackendAffiliate);

//     // Add any additional data that might come from backend statistics
//     // For now, we're not fetching customer counts, commissions, etc. from Supabase
//     return combinedAffiliates.map((affiliate) => ({
//       ...affiliate,
//       // These fields would come from your backend if needed
//       // For now, set defaults or use data from backend if available
//       // affiliate_count: 0,
//       last_commission_date: null,
//       last_commission_amount: null,
//       last_subscription_date: null,
//     }));
//   }, [backendAffiliatesData?.affiliates]);

//   // Filter affiliates based on enrolling affiliate search
//   const filteredAffiliates = useMemo(() => {
//     if (!enhancedAffiliates) return [];

//     let filtered = [...enhancedAffiliates];

//     // // Filter by enrolling affiliate search
//     // if (debouncedEnrollingAffiliateSearch && enrollerAffiliatesData) {
//     //   const enrollerIds = enrollerAffiliatesData.map(a => a.selfAffiliateId);
//     //   filtered = filtered.filter(affiliate =>
//     //     enrollerIds.includes(affiliate.enrolledBy)
//     //   );
//     // }

//     // Apply date filters - REMOVED because we don't have commission dates from Supabase
//     // if (lastOrderDateFrom || lastOrderDateTo) {
//     //   filtered = filtered.filter((affiliate) => {
//     //     if (!affiliate.last_commission_date) return false;
//     //     const commissionDate = new Date(affiliate.last_commission_date);
//     //     commissionDate.setHours(0, 0, 0, 0);
//     // 
//     //     if (lastOrderDateFrom) {
//     //       const fromDate = new Date(lastOrderDateFrom);
//     //       fromDate.setHours(0, 0, 0, 0);
//     //       if (commissionDate < fromDate) return false;
//     //     }
//     // 
//     //     if (lastOrderDateTo) {
//     //       const toDate = new Date(lastOrderDateTo);
//     //       toDate.setHours(23, 59, 59, 999);
//     //       if (commissionDate > toDate) return false;
//     //     }
//     // 
//     //     return true;
//     //   });
//     // }

//     // Enrolled Date filter
//     if (enrolledDateFrom || enrolledDateTo) {
//       filtered = filtered.filter((affiliate) => {
//         const enrolledDate = new Date(affiliate.enrollmentDate);
//         if (!isValid(enrolledDate)) return true; // Skip invalid dates

//         enrolledDate.setHours(0, 0, 0, 0);

//         if (enrolledDateFrom) {
//           const fromDate = new Date(enrolledDateFrom);
//           fromDate.setHours(0, 0, 0, 0);
//           if (enrolledDate < fromDate) return false;
//         }

//         if (enrolledDateTo) {
//           const toDate = new Date(enrolledDateTo);
//           toDate.setHours(23, 59, 59, 999);
//           if (enrolledDate > toDate) return false;
//         }

//         return true;
//       });
//     }

//     // Apply category filters - simplified since we don't have Supabase data
//     if (categoryFilter === "top_enrollers") {
//       // Can't filter by affiliate_count since we don't have this data
//       filtered = filtered;
//     } else if (categoryFilter === "top_sellers") {
//       // Can't filter by commission amount since we don't have this data
//       filtered = filtered;
//     } else if (categoryFilter === "no_teqnavi") {
//       filtered = filtered.filter(a => !a.tipaltiEnabled);
//     } else if (categoryFilter === "no_affiliates") {
//       // All affiliates have 0 affiliate_count (default)
//       filtered = filtered;
//     } else if (categoryFilter === "no_customers") {
//       // All affiliates have 0 customer_count (default)
//       filtered = filtered;
//     }

//     // Apply sorting
//     // filtered.sort((a, b) => {
//     //   let aValue: any;
//     //   let bValue: any;

//     //   switch (sortColumn) {
//     //     case "name":
//     //       aValue = `${a.firstName} ${a.lastName}`.toLowerCase();
//     //       bValue = `${b.firstName} ${b.lastName}`.toLowerCase();
//     //       break;
//     //     case "join_date":
//     //       aValue = new Date(a.enrollmentDate).getTime();
//     //       bValue = new Date(b.enrollmentDate).getTime();
//     //       break;
//     //     case "site":
//     //       aValue = (a.siteName || "").toLowerCase();
//     //       bValue = (b.siteName || "").toLowerCase();
//     //       break;
//     //     case "customers":
//     //       aValue = a.customer_count || 0;
//     //       bValue = b.customer_count || 0;
//     //       break;
//     //     case "affiliates":
//     //       aValue = a.affiliate_count || 0;
//     //       bValue = b.affiliate_count || 0;
//     //       break;
//     //     case "subscription":
//     //       // Since we don't have subscription data, sort by enrollment date
//     //       aValue = new Date(a.enrollmentDate).getTime();
//     //       bValue = new Date(b.enrollmentDate).getTime();
//     //       break;
//     //     case "last_commission":
//     //       // Since we don't have commission data, sort by enrollment date
//     //       aValue = new Date(a.enrollmentDate).getTime();
//     //       bValue = new Date(b.enrollmentDate).getTime();
//     //       break;
//     //     case "status":
//     //       aValue = a.status.toLowerCase();
//     //       bValue = b.status.toLowerCase();
//     //       break;
//     //     case "tipalti":
//     //       aValue = a.tipaltiEnabled ? 1 : 0;
//     //       bValue = b.tipaltiEnabled ? 1 : 0;
//     //       break;
//     //     case "enrolled_by":
//     //       aValue = a.enrolling_affiliate
//     //         ? `${a.enrolling_affiliate.first_name} ${a.enrolling_affiliate.last_name}`.toLowerCase()
//     //         : "";
//     //       bValue = b.enrolling_affiliate
//     //         ? `${b.enrolling_affiliate.first_name} ${b.enrolling_affiliate.last_name}`.toLowerCase()
//     //         : "";
//     //       break;
//     //     default:
//     //       return 0;
//     //   }

//     //   if (sortDirection === "asc") {
//     //     return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
//     //   } else {
//     //     return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
//     //   }
//     // });

//     return filtered;
//   }, [enhancedAffiliates, debouncedEnrollingAffiliateSearch, categoryFilter, sortColumn, sortDirection, enrolledDateFrom, enrolledDateTo]);

//   // Pagination
//   const totalPages = backendAffiliatesData?.pagination?.totalPages || 1;
//   const totalCount = backendAffiliatesData?.pagination?.totalCount || 0;


//   const paginatedAffiliates = useMemo(() => {
//     if (!backendAffiliatesData?.affiliates) return [];
//     return backendAffiliatesData.affiliates.map(convertBackendAffiliate);
//   }, [backendAffiliatesData?.affiliates]);
//   // if (isLoading) {
//   //   return <div className="text-center py-8">Loading affiliates...</div>;
//   // }

//   const navigate = useNavigate();

//   const setAuth = useAuthStore((state) => state.setAuth);

//   const updateAuthUser = useAuthStore((state) => state.updateAuthUser);

//   const impersonateAffiliateMutation = useMutation({

//     mutationFn: async (affiliateId: string, payload: any) => await impersonateAffiliate(affiliateId, payload),

//     onSuccess: (response) => {


//       setAuth(response.data.data.affiliateToken, response.data.data.user, true);

//       let stateUrl = null;
//       if (response?.data?.data?.user?.profilePictureUrl) {
//         stateUrl = `${config.cloudFrontUrl}profile-pictures${response?.data?.data?.user?.profilePictureUrl?.split("/profile-pictures")[1]}`;
//       }

//       updateAuthUser({ profilePictureUrl: stateUrl });

//       queryClient.invalidateQueries();
//       queryClient.clear();

//     },

//     onError: (error) => {
//       console.log("error is ", error);
//       toast({
//         title: "Something went wrong",
//         description: "Please try to impersonate affiliate sometime later"
//       })
//     }
//   });

//   return (
//     <div className="space-y-4">
//       <div className="flex flex-col md:flex-row gap-4">
//         <div key="main-search-wrapper" className="relative flex-1">
//           <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
//           <Input

//             placeholder="Search by name, email, or phone..."
//             value={searchTerm}
//             onChange={(e) => setSearchTerm(e.target.value)}
//             className="pl-10 focus-visible:ring-0 focus-visible:ring-offset-0"
//             autoComplete="off"
//           />
//         </div>
//         <Select value={status} onValueChange={setStatus}>
//           <SelectTrigger className="w-full md:w-[180px] focus:outline-none focus:ring-0 focus:ring-offset-0 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 border-gray-300">
//             <SelectValue placeholder="Status" />
//           </SelectTrigger>
//           <SelectContent>
//             <SelectItem value="all">All Status</SelectItem>
//             <SelectItem value="1">Active</SelectItem>
//             <SelectItem value="2">Inactive</SelectItem>
//             <SelectItem value="3">Pending KYC</SelectItem>
//             <SelectItem value="4">Rejected</SelectItem>

//           </SelectContent>
//         </Select>
//       </div>

//       <div className="flex gap-2">
//         <Select value={categoryFilter} onValueChange={setCategoryFilter}>
//           <SelectTrigger className="w-full md:w-[220px] focus:outline-none focus:ring-0 focus:ring-offset-0 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 border-gray-300">
//             <SelectValue placeholder="All Affiliates" />
//           </SelectTrigger>
//           <SelectContent>
//             <SelectItem value="all">All Affiliates</SelectItem>
//             <SelectItem value="top_enrollers">Top Enrollers</SelectItem>
//             <SelectItem value="top_sellers">Top Sellers</SelectItem>
//             <SelectItem value="no_tipalti">No Tipalti Account</SelectItem>
//             <SelectItem value="no_affiliates">No Enrolled Affiliates</SelectItem>
//             <SelectItem value="no_customers">No Enrolled Customers</SelectItem>
//             <SelectItem value="no_purchases">No Personal Purchases</SelectItem>
//           </SelectContent>
//         </Select>
//         <div className="relative flex-1">
//           <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
//           <Input
//             id="enrolling-affiliate-search"
//             key="enrolling-affiliate-search-input"
//             placeholder="Enrolling Affiliate (search name)..."
//             value={enrollingAffiliateSearch}
//             onChange={(e) => setEnrollingAffiliateSearch(e.target.value)}
//             className="pl-10 focus-visible:ring-0 focus-visible:ring-offset-0"
//             autoComplete="off"
//           />
//         </div>
//         {!isAffiliate && (
//           <Button variant="outline" onClick={() => setShowDuplicates(true)}>
//             <Users className="h-4 w-4 mr-2 focus-visible:ring-0 focus-visible:ring-offset-0" />
//             Find Duplicates
//           </Button>
//         )}
//         {hasActiveFilters && (
//           <Button variant="ghost" onClick={clearFilters}>
//             <X className="h-4 w-4 mr-2 focus-visible:ring-0 focus-visible:ring-offset-0" />
//             Clear Filters
//           </Button>
//         )}
//       </div>

//       {/* Date Range Filters - Remove Last Order Date filter since we don't have commission data */}
//       <div className="flex flex-col md:flex-row gap-4">
//         <div className="flex-1">
//           <label className="text-sm font-medium mb-2 block">Last Order Date Range</label>
//           <div className="flex gap-2">
//             <Popover>
//               <PopoverTrigger asChild>
//                 <Button
//                   variant="outline"
//                   className={cn(
//                     "justify-start text-left font-normal flex-1 focus-visible:ring-0 focus-visible:ring-offset-0",
//                     !enrolledDateFrom && "text-muted-foreground"
//                   )}
//                 >
//                   <CalendarIcon className="mr-2 h-4 w-4 focus-visible:ring-0 focus-visible:ring-offset-0" />
//                   {enrolledDateFrom ? safeFormatDate(enrolledDateFrom.toISOString(), formatString) : "From"}
//                 </Button>
//               </PopoverTrigger>
//               <PopoverContent className="w-auto p-0" align="start">
//                 <Calendar
//                   mode="single"
//                   formatString={formatString}
//                   selected={enrolledDateFrom}
//                   onSelect={setEnrolledDateFrom}
//                   initialFocus
//                   className="pointer-events-auto focus-visible:ring-0 focus-visible:ring-offset-0"
//                 />
//               </PopoverContent>
//             </Popover>
//             <Popover>
//               <PopoverTrigger asChild>
//                 <Button
//                   variant="outline"
//                   className={cn(
//                     "justify-start text-left font-normal flex-1 focus-visible:ring-0 focus-visible:ring-offset-0",
//                     !enrolledDateTo && "text-muted-foreground"
//                   )}
//                 >
//                   <CalendarIcon className="mr-2 h-4 w-4" />
//                   {enrolledDateTo ? safeFormatDate(enrolledDateTo.toISOString(), formatString) : "To"}
//                 </Button>
//               </PopoverTrigger>
//               <PopoverContent className="w-auto p-0" align="start">
//                 <Calendar
//                   mode="single"
//                   selected={enrolledDateTo}
//                   formatString={formatString}
//                   onSelect={setEnrolledDateTo}
//                   initialFocus
//                   className="pointer-events-auto"
//                 />
//               </PopoverContent>
//             </Popover>
//           </div>
//         </div>
//         <div className="flex-1">
//           <label className="text-sm font-medium mb-2 block">Enrolled / Join Date Range</label>
//           <div className="flex gap-2">
//             <Popover>
//               <PopoverTrigger asChild>
//                 <Button
//                   variant="outline"
//                   className={cn(
//                     "justify-start text-left font-normal flex-1 focus-visible:ring-0 focus-visible:ring-offset-0",
//                     !enrolledDateFrom && "text-muted-foreground"
//                   )}
//                 >
//                   <CalendarIcon className="mr-2 h-4 w-4 focus-visible:ring-0 focus-visible:ring-offset-0" />
//                   {enrolledDateFrom ? safeFormatDate(enrolledDateFrom.toISOString(), formatString) : "From"}
//                 </Button>
//               </PopoverTrigger>
//               <PopoverContent className="w-auto p-0" align="start">
//                 <Calendar
//                   mode="single"
//                   formatString={formatString}
//                   selected={enrolledDateFrom}
//                   onSelect={setEnrolledDateFrom}
//                   initialFocus
//                   className="pointer-events-auto focus-visible:ring-0 focus-visible:ring-offset-0"
//                 />
//               </PopoverContent>
//             </Popover>
//             <Popover>
//               <PopoverTrigger asChild>
//                 <Button
//                   variant="outline"
//                   className={cn(
//                     "justify-start text-left font-normal flex-1 focus-visible:ring-0 focus-visible:ring-offset-0",
//                     !enrolledDateTo && "text-muted-foreground"
//                   )}
//                 >
//                   <CalendarIcon className="mr-2 h-4 w-4" />
//                   {enrolledDateTo ? safeFormatDate(enrolledDateTo.toISOString(), formatString) : "To"}
//                 </Button>
//               </PopoverTrigger>
//               <PopoverContent className="w-auto p-0" align="start">
//                 <Calendar
//                   mode="single"
//                   selected={enrolledDateTo}
//                   formatString={formatString}
//                   onSelect={setEnrolledDateTo}
//                   initialFocus
//                   className="pointer-events-auto"
//                 />
//               </PopoverContent>
//             </Popover>
//           </div>
//         </div>
//       </div>


//       {/* Mobile Card View */}
//       <div className="lg:hidden space-y-4">
//         {paginatedAffiliates?.map((affiliate) => (
//           <div key={affiliate.id} className="bg-card border rounded-lg p-4 space-y-3">
//             <div className="flex justify-between items-start">
//               <div>
//                 {(isAdmin || isAffiliate) ? (
//                   <button
//                     onClick={() => {
//                       setSelectedAffiliate(affiliate);
//                       setShowEditDialog(true);
//                       setDefaultTab("details");
//                     }}
//                     className="text-sm text-foreground hover:text-primary hover:underline transition-colors text-left"
//                   >
//                     <div>{affiliate.firstName} {affiliate.lastName}</div>
//                     <div className="text-xs text-muted-foreground">{affiliate.selfAffiliateId}</div>
//                   </button>
//                 ) : (
//                   <div className="text-sm text-left">
//                     <div>{affiliate.firstName} {affiliate.lastName}</div>
//                     <div className="text-xs text-muted-foreground">{affiliate.selfAffiliateId}</div>
//                   </div>
//                 )}
//               </div>
//               <div className="flex items-center gap-2">
//                 {getStatusBadge(affiliate.status)}
//                 <DropdownMenu>
//                   <DropdownMenuTrigger asChild>
//                     <Button variant="ghost" size="icon">
//                       <MoreVertical className="h-4 w-4" />
//                     </Button>
//                   </DropdownMenuTrigger>
//                   <DropdownMenuContent align="end">
//                     {(isAdmin || isAffiliate) && (
//                       <DropdownMenuItem onClick={() => {
//                         setSelectedAffiliate(affiliate);
//                         setShowEditDialog(true);
//                         setDefaultTab("details");
//                       }}>
//                         <Pencil className="h-4 w-4 mr-2" />
//                         View Affiliate
//                       </DropdownMenuItem>
//                     )}
//                     <DropdownMenuItem onClick={() => {
//                       setSelectedAffiliate(affiliate);
//                       setShowOrdersDialog(true);
//                     }}>
//                       <ShoppingCart className="h-4 w-4 mr-2" />
//                       View Orders
//                     </DropdownMenuItem>
//                     <DropdownMenuItem onClick={() => setNotesAffiliate(affiliate)}>
//                       <StickyNote className="h-4 w-4 mr-2" />
//                       Notes
//                     </DropdownMenuItem>
//                     {isAdmin && (
//                       <DropdownMenuItem onClick={() => syncAuthEmail(affiliate)}>
//                         <UserRoundCog className="h-4 w-4 mr-2" />
//                         Sync Auth Email
//                       </DropdownMenuItem>
//                     )}
//                     {isAdmin && canEditAffiliates && (
//                       <DropdownMenuItem onClick={() => {
//                         if (confirm("Are you sure you want to delete this affiliate?")) {
//                           deleteMutation.mutate(affiliate.id);
//                         }
//                       }}
//                         className="text-destructive">
//                         <Trash2 className="h-4 w-4 mr-2" />
//                         Delete Affiliate
//                       </DropdownMenuItem>
//                     )}
//                   </DropdownMenuContent>
//                 </DropdownMenu>
//               </div>
//             </div>

//             <div className="grid grid-cols-2 gap-2 text-sm">
//               <div>
//                 <span className="text-muted-foreground">Email/Phone:</span>
//                 <a href={`mailto:${affiliate.email}`} className="text-primary hover:underline block text-xs">
//                   {affiliate.email}
//                 </a>
//                 <div>
//                   <PhoneDisplay phoneNumbers={affiliate.phoneNumbers} />
//                 </div>
//               </div>

//               <div>
//                 <span className="text-muted-foreground">Join Date:</span>
//                 <p className="font-medium">{safeFormatDate(affiliate.enrollmentDate, formatString)}</p>
//               </div>
//               <div>
//                 <span className="text-muted-foreground">Tipalti:</span>
//                 <Badge variant={affiliate.tipaltiEnabled ? "default" : "destructive"} className="ml-1">
//                   {affiliate.tipaltiEnabled ? "Yes" : "No"}
//                 </Badge>
//               </div>
//             </div>

//             {affiliate.enrolling_affiliate && (
//               <div className="border-t pt-2">
//                 <span className="text-muted-foreground text-sm">Enrolled by:</span>
//                 <button
//                   onClick={async () => {
//                     try {
//                       const payload: ListAffiliatesPayload = {
//                         companyId,
//                         selfAffiliateId: affiliate.enrolling_affiliate.affiliate_id,
//                         limit: 1,
//                       };

//                       const response = await listAffiliates(payload);

//                       if (response.data.success && response.data.data.affiliates.length > 0) {
//                         const enrollerAffiliate = response.data.data.affiliates[0];
//                         const converted = convertBackendAffiliate(enrollerAffiliate);

//                         setSelectedAffiliate(converted);
//                         setShowEditDialog(true);
//                         setDefaultTab("details");
//                       } else {
//                         toast.error("Enroller affiliate not found");
//                       }
//                     } catch (error) {
//                       console.error("Error fetching enroller:", error);
//                       toast.error("Failed to load enroller details");
//                     }
//                   }}
//                   className="text-primary hover:underline text-left block"
//                 >
//                   {affiliate.enrolling_affiliate.first_name} {affiliate.enrolling_affiliate.last_name}
//                   <div className="text-xs text-muted-foreground block">
//                     ID: {affiliate.enrolling_affiliate.affiliate_id}
//                   </div>
//                 </button>
//               </div>
//             )}

//             <div className="flex gap-4 text-sm">
//               <div>
//                 <span className="text-muted-foreground">Customers: </span>
//                 <span className="font-medium">{affiliate.customer_count || 0}</span>
//               </div>
//               <div>
//                 <span className="text-muted-foreground">Affiliates: </span>
//                 <span className="font-medium">{affiliate.affiliate_count || 0}</span>
//               </div>
//             </div>

//             {/* Remove commission display since we don't have this data */}
//             {/* Remove subscription display since we don't have this data */}
//           </div>
//         ))}
//       </div>

//       {/* Desktop Table View - simplified without commission/subscription columns */}
//       <div className="hidden lg:block border rounded-lg">
//         <Table>
//           <TableHeader>
//             <TableRow>
//               <TableHead></TableHead>
//               <TableHead>
//                 <button
//                   onClick={() => handleSort("name")}
//                   className="flex items-center hover:text-foreground transition-colors"
//                 >
//                   Name
//                   {getSortIcon("name")}
//                 </button>
//               </TableHead>
//               <TableHead>Email/Phone</TableHead>

//               {
//                 !isAffiliate && (
//                   <>
//                     <TableHead className="min-w-[160px]">
//                       <button
//                         onClick={() => handleSort("enrolledBy")}
//                         className="flex items-center whitespace-nowrap hover:text-foreground transition-colors"
//                       >
//                         Enrolled By
//                         {getSortIcon("enrolledBy")}
//                       </button>
//                     </TableHead>
//                   </>
//                 )
//               }

//               <TableHead className="w-[100px]">
//                 <button
//                   onClick={() => handleSort("siteName")}
//                   className="flex items-center hover:text-foreground transition-colors"
//                 >
//                   Site
//                   {getSortIcon("siteName")}
//                 </button>
//               </TableHead>
//               <TableHead>
//                 <button
//                   onClick={() => handleSort("enrollmentDate")}
//                   className="flex items-center hover:text-foreground transition-colors"
//                 >
//                   Join Date
//                   {getSortIcon("enrollmentDate")}
//                 </button>
//               </TableHead>
//               <TableHead>
//                 <button
//                   onClick={() => handleSort("tipalti")}
//                   className="flex items-center hover:text-foreground transition-colors"
//                 >
//                   Tipalti
//                   {getSortIcon("tipalti")}
//                 </button>
//               </TableHead>
//               <TableHead className="text-center">
//                 <button
//                   onClick={() => handleSort("customers")}
//                   className="flex items-center mx-auto hover:text-foreground transition-colors"
//                 >
//                   Customers
//                   {getSortIcon("customers")}
//                 </button>
//               </TableHead>
//               <TableHead className="text-center">
//                 <button
//                   onClick={() => handleSort("affiliates")}
//                   className="flex items-center mx-auto hover:text-foreground transition-colors"
//                 >
//                   Affiliates
//                   {getSortIcon("affiliates")}
//                 </button>
//               </TableHead>
//               <TableHead>
//                 <button
//                   onClick={() => handleSort("lastCommission")}
//                   className="flex items-center hover:text-foreground transition-colors"
//                 >
//                   Last Commission
//                   {getSortIcon("lastCommission")}
//                 </button>
//               </TableHead>
//               <TableHead>
//                 Status
//               </TableHead>
//               <TableHead className="text-right"></TableHead>
//             </TableRow>
//           </TableHeader>

//           <TableBody>

//             {!isLoading ? (paginatedAffiliates?.length === 0 ? (
//               <TableRow>
//                 <TableCell colSpan={10} className="text-center text-muted-foreground py-8 ">
//                   <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
//                   <p>No affiliates found</p>
//                 </TableCell>
//               </TableRow>
//             ) : (
//               paginatedAffiliates?.map((affiliate) => (
//                 <TableRow key={affiliate.id}>
//                   <TableCell>

//                     {/* 
//                     <Avatar>


//                       {affiliate?.profilePictureUrl && affiliate.profilePictureUrl.trim() !== "" ? (
//                         <AvatarImage src={affiliate.profilePictureUrl} />
//                       ) : (
//                         <AvatarFallback
//                           style={{
//                             backgroundColor: affiliate?.avatarHexColor || '#3b82f6',
//                             color: '#ffffff',
//                           }}
//                         >
//                           {(
//                             affiliate?.avatarInitials ||
//                             `${affiliate?.firstName[0]}${affiliate?.lastName[0]}`
//                           ).toUpperCase()}
//                         </AvatarFallback>
//                       )}
//                     </Avatar>
//  */}
//                     <Avatar>
//                       <AvatarImage src={affiliate?.profilePictureUrl} key={affiliate?.profilePictureUrl} />
//                       <AvatarFallback
//                         style={{ backgroundColor: affiliate?.avatarHexColor || '#3b82f6', color: '#ffffff', fontWeight: 500, }}
//                       >
//                         {(
//                           affiliate?.avatarInitials ||
//                           `${affiliate?.firstName[0]}${affiliate?.lastName[0]}`
//                         ).toUpperCase()}
//                       </AvatarFallback>
//                     </Avatar>


//                   </TableCell>
//                   <TableCell>
//                     {(isAdmin || isAffiliate) ? (
//                       <button
//                         onClick={() => {
//                           setSelectedAffiliate(affiliate);
//                           setShowEditDialog(true);
//                           setDefaultTab("details");
//                         }}
//                         className="text-foreground hover:text-primary hover:underline transition-colors text-left"
//                       >
//                         <div>{affiliate.firstName} {affiliate.lastName}</div>
//                         <div className="text-xs text-muted-foreground">{affiliate.selfAffiliateId}</div>
//                       </button>
//                     ) : (
//                       <div className="text-left">
//                         <div>{affiliate.firstName} {affiliate.lastName}</div>
//                         <div className="text-xs text-muted-foreground">{affiliate.selfAffiliateId}</div>
//                       </div>
//                     )}
//                   </TableCell>
//                   <TableCell>
//                     <a href={`mailto:${affiliate.email}`} className="text-primary hover:underline">
//                       {affiliate.email}
//                     </a>
//                     <div>
//                       <PhoneDisplay phoneNumbers={affiliate.phoneNumbers || []} />
//                     </div>
//                   </TableCell>

//                   {
//                     !isAffiliate && (
//                       <TableCell>
//                         {affiliate.enrolling_affiliate ? (
//                           <button
//                             onClick={async () => {
//                               try {
//                                 // Fetch the full affiliate data using selfAffiliateId
//                                 const payload: ListAffiliatesPayload = {
//                                   companyId,
//                                   selfAffiliateId: affiliate.enrolling_affiliate.affiliate_id,
//                                   limit: 1,
//                                 };

//                                 const response = await listAffiliates(payload);

//                                 if (response.data.success && response.data.data.affiliates.length > 0) {
//                                   const enrollerAffiliate = response.data.data.affiliates[0];
//                                   const converted = convertBackendAffiliate(enrollerAffiliate);

//                                   // Now open the edit dialog with the real data
//                                   setSelectedAffiliate(converted);
//                                   setShowEditDialog(true);
//                                   setDefaultTab("details");
//                                 } else {
//                                   toast.error("Enroller affiliate not found");
//                                 }
//                               } catch (error) {
//                                 console.error("Error fetching enroller:", error);
//                                 toast.error("Failed to load enroller details");
//                               }
//                             }}
//                             className="text-primary hover:underline text-left"
//                           >
//                             <div>{affiliate.enrolling_affiliate.first_name} {affiliate.enrolling_affiliate.last_name}</div>
//                             <div className="text-xs text-muted-foreground">{affiliate.enrolling_affiliate.affiliate_id}</div>
//                           </button>
//                         ) : "-"}
//                       </TableCell>
//                     )
//                   }

//                   <TableCell>
//                     {affiliate.siteName ? (
//                       <a
//                         href={`https://www.theonglobal.com/?ref=${affiliate.siteName}`}
//                         target="_blank"
//                         rel="noopener noreferrer"
//                         className="text-primary hover:underline"
//                       >
//                         {affiliate.siteName}
//                       </a>
//                     ) : "-"}
//                   </TableCell>
//                   <TableCell className="text-center">{safeFormatDate(affiliate.enrollmentDate, formatString)}</TableCell>
//                   <TableCell>
//                     <Badge variant={affiliate.tipaltiEnabled ? "default" : "destructive"}>
//                       {affiliate.tipaltiEnabled ? "Yes" : "No"}
//                     </Badge>
//                   </TableCell>
//                   <TableCell className="text-center font-medium">
//                     {affiliate.customer_count || 0}
//                   </TableCell>
//                   <TableCell className="text-center font-medium">
//                     {affiliate.affiliate_count || 0}
//                   </TableCell>
//                   <TableCell className="text-center">
//                     {affiliate.lastCommissionEndDate ? (
//                       <button
//                         onClick={() => {
//                           setSelectedAffiliate(affiliate);
//                           setDefaultTab("commissions"); // This opens the commissions tab
//                           setShowEditDialog(true);
//                         }}
//                         className="text-sm text-primary hover:underline text-left"
//                       >
//                         <div>{format(new Date(affiliate.lastCommissionEndDate), formatString)}</div>
//                         <div className="text-muted-foreground">
//                           {formatCurrency(affiliate.lastCommissionAmount ?? 0)}
//                         </div>
//                       </button>
//                     ) : (
//                       "-"
//                     )}
//                   </TableCell>
//                   <TableCell>{getStatusBadge(affiliate.status)}</TableCell>
//                   <TableCell>
//                     <div className="flex items-center justify-end">
//                       <DropdownMenu>
//                         <DropdownMenuTrigger asChild>
//                           <Button variant="ghost" size="icon">
//                             <MoreVertical className="h-4 w-4" />
//                           </Button>
//                         </DropdownMenuTrigger>
//                         <DropdownMenuContent align="end">
//                           {(isAdmin || isAffiliate) && (
//                             <DropdownMenuItem
//                               onClick={() => {
//                                 setSelectedAffiliate(affiliate);
//                                 setDefaultTab("details");
//                                 setInitialExpandedCommission(undefined);
//                                 setShowEditDialog(true);
//                               }}
//                             >
//                               <Pencil className="h-4 w-4 mr-2" />
//                               View Affiliate
//                             </DropdownMenuItem>
//                           )}
//                           <DropdownMenuItem
//                             onClick={() => {
//                               setSelectedAffiliate(affiliate);
//                               setShowOrdersDialog(true);
//                             }}
//                           >
//                             <ShoppingCart className="h-4 w-4 mr-2" />
//                             View Orders
//                           </DropdownMenuItem>
//                           <DropdownMenuItem
//                             onClick={() => setNotesAffiliate(affiliate)}
//                           >
//                             <StickyNote className="h-4 w-4 mr-2" />
//                             Notes
//                           </DropdownMenuItem>
//                           {isAdmin && hasPermission("dashboard_module_permissions", "impersonate_top_company", "edit") && (
//                             <>
//                               <DropdownMenuItem
//                                 onClick={async () => {
//                                   await impersonateAffiliateMutation.mutateAsync(affiliate._id, {});
//                                   navigate("/affiliate-dashboard");
//                                 }}
//                               >
//                                 <UserRoundCog className="h-4 w-4 mr-2" />
//                                 Impersonate
//                               </DropdownMenuItem>
//                               {isAdmin && canEditAffiliates && affiliate.customer_count === 0 &&
//                                 affiliate.affiliate_count === 0 && (
//                                   <DropdownMenuItem
//                                     onClick={() => {
//                                       if (confirm("Are you sure you want to delete this affiliate?")) {
//                                         deleteMutation.mutate(affiliate.id);
//                                       }
//                                     }}
//                                     className="text-destructive"
//                                   >
//                                     <Trash2 className="h-4 w-4 mr-2" />
//                                     Delete Affiliate
//                                   </DropdownMenuItem>
//                                 )}
//                             </>
//                           )}
//                         </DropdownMenuContent>
//                       </DropdownMenu>
//                     </div>
//                   </TableCell>
//                 </TableRow>
//               ))
//             )) : (
//               <TableRow>
//                 <TableCell colSpan={10} className="h-64 text-center"> {/* Adjust colSpan to match your columns */}
//                   <div className="flex flex-col items-center justify-center space-y-4">
//                     <Loader2 className="h-10 w-10 animate-spin text-primary" />
//                     <p className="text-muted-foreground">Loading affiliates...</p>
//                   </div>
//                 </TableCell>
//               </TableRow>
//             )
//             }

//           </TableBody>
//         </Table>
//       </div>

//       {/* Pagination */}
//       {(filteredAffiliates?.length || 0) > 0 && (
//         <div className="flex items-center justify-between mt-4">
//           <div className="flex items-center gap-4">
//             <div className="text-sm text-muted-foreground">
//               Showing{" "}
//               {backendAffiliatesData?.affiliates.length === 0
//                 ? 0
//                 : (currentPage - 1) * itemsPerPage + 1}{" "}
//               to{" "}
//               {Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount} affiliates
//             </div>
//             <div className="flex items-center gap-2">
//               <span className="text-sm text-muted-foreground">Per page:</span>
//               <Select
//                 value={itemsPerPage.toString()}
//                 onValueChange={(value) => {
//                   setItemsPerPage(Number(value));
//                   setCurrentPage(1);
//                 }}
//               >
//                 <SelectTrigger className="w-[80px] focus:outline-none focus:ring-0 focus:ring-offset-0 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 border-gray-300" >
//                   <SelectValue />
//                 </SelectTrigger>
//                 <SelectContent>
//                   <SelectItem value="25">25</SelectItem>
//                   <SelectItem value="50">50</SelectItem>
//                   <SelectItem value="100">100</SelectItem>
//                   <SelectItem value="250">250</SelectItem>
//                 </SelectContent>
//               </Select>
//             </div>
//           </div>
//           <div className="flex items-center gap-2">
//             <Button
//               variant="outline"
//               onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
//               disabled={currentPage === 1}
//             >
//               Previous
//             </Button>
//             {totalPages > 1 && (
//               <div className="flex items-center gap-1">
//                 {Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1).map((page) => (
//                   <Button
//                     key={page}
//                     variant={currentPage === page ? "default" : "outline"}
//                     size="sm"
//                     onClick={() => setCurrentPage(page)}
//                     className="min-w-[2.5rem]"
//                   >
//                     {page}
//                   </Button>
//                 ))}
//               </div>
//             )}
//             <span className="text-sm text-muted-foreground">
//               Page {currentPage} of {totalPages}
//             </span>
//             <Button
//               variant="outline"
//               onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
//               disabled={currentPage === totalPages}
//             >
//               Next
//             </Button>
//           </div>
//         </div>
//       )}

//       <DuplicateAffiliatesDialog open={showDuplicates} onOpenChange={setShowDuplicates} />

//       {selectedAffiliate && (
//         <>
//           <AffiliateEditDialog
//             // affiliate={selectedAffiliate}
//             affiliateMongoId={selectedAffiliate._id}
//             open={showEditDialog}
//             onOpenChange={(open) => {
//               setShowEditDialog(open);
//               if (!open) {
//                 setDefaultTab("details");
//                 setInitialExpandedCommission(undefined);
//               }
//             }}
//             defaultTab={defaultTab}
//             initialExpandedCommission={initialExpandedCommission}
//           />
//           <AffiliateOrdersDialog
//             affiliateId={selectedAffiliate._id}
//             affiliate={selectedAffiliate}
//             open={showOrdersDialog}
//             onOpenChange={setShowOrdersDialog}
//           />
//         </>
//       )}

//       {/* {enrollingAffiliateToView && (
//         <AffiliateEditDialog
//           affiliate={enrollingAffiliateToView}
//           open={!!enrollingAffiliateToView}
//           onOpenChange={(open) => !open && setEnrollingAffiliateToView(null)}
//         />
//       )} */}

//       {notesAffiliate && (
//         <NotesDialog
//           open={!!notesAffiliate}
//           onOpenChange={(open) => !open && setNotesAffiliate(null)}
//           entityId={notesAffiliate.id}
//           entityType="affiliate"
//           entityName={`${notesAffiliate.firstName} ${notesAffiliate.lastName}`}
//           onViewEntity={() => {
//             setSelectedAffiliate({
//               ...notesAffiliate,
//               _fromNotes: true
//             });
//             setDefaultTab("details");
//             setInitialExpandedCommission(undefined);
//             setShowEditDialog(true);
//             setNotesAffiliate(null);
//           }}
//           onViewOrders={() => {
//             setSelectedAffiliate({
//               ...notesAffiliate,
//               _fromNotes: true
//             });
//             setShowOrdersDialog(true);
//             setNotesAffiliate(null);
//           }}
//         />
//       )}
//     </div>
//   );
// }

import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client"; // Keep for syncAuthEmail function only
import { useUserRole } from "@/hooks/use-user-role";
import { useModulePermissions } from "@/hooks/use-module-permissions";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, Search, Users, MoreVertical, X, ArrowUpDown, ArrowUp, ArrowDown, ShoppingCart, UserRoundCog, StickyNote, CalendarIcon, Loader2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { format, startOfWeek, isValid } from "date-fns"; // Added isValid
import { DuplicateAffiliatesDialog } from "./duplicate-affiliates-dialog";
import { AffiliateEditDialog } from "./affiliate-edit-dialog";
import { AffiliateOrdersDialog } from "./affiliate-orders-dialog";
import { NotesDialog } from "../shared/notes-dialog";
import { PhoneDisplay, PhoneNumber as PhoneNumberType } from "../shared/phone-display";
import { formatCurrency, cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useAuthStore } from "@/store/useAuthStore";
import { listAffiliates, getAffiliatesByEnroller, deleteAffiliate, impersonateAffiliate } from "@/api/affiliate";
import { ListAffiliatesPayload } from "@/types/api/affiliate";
import { useNavigate } from "react-router-dom";
import { getDateFormatString } from "@/utils/resolveDateFormat";
import config from '@/config/env';
import { useDateFormatStore } from "@/store/useDateFormat";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
// Define interface for affiliate from backend
interface BackendAffiliate {
  _id: string;
  selfAffiliateId: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  phoneNumbers?: PhoneNumberType[];
  addressLineOne?: string;
  addressLineTwo?: string;
  cityTown?: string;
  stateProvince?: string;
  zipPostal?: string;
  country?: string;
  siteName?: string;
  tipaltiEnabled: boolean;
  allowAutomaticChargebacks: boolean;
  kycPass: boolean;
  status: string;
  enrollmentDate: string;
  enrolledBy: number;
  enroller?: {
    selfAffiliateId: number;
    firstName: string;
    lastName: string;
    email: string;
    status: string;
  };
  downlineCount?: number;
  customerCount?: number;
  totalSales: number;
  totalCommissions: number;
  rank: string;
  createdAt: string;
  updatedAt: string;
  profilePictureUrl: string | null;
  avatarHexColor: string | null;
  avatarInitials: string | null;
  lastOrderDate?: string | null;  // ADD THIS
}
// Combine with existing interface for compatibility
type CombinedAffiliate = BackendAffiliate & {
  // Keep existing fields for compatibility
  id: string;
  affiliate_id: string;
  address: string | null;
  city: string | null;
  state_province: string | null;
  postal_code: string | null;
  teqnavi_enabled: boolean;
  auth_user_id?: string | null;
  last_commission_date?: string | null;
  last_commission_amount?: number | null;
  last_subscription_date?: string | null;
  customer_count?: number;
  affiliate_count?: number;
  _fromNotes?: boolean;
  tax_id?: string | null;
  enrolling_affiliate?: {
    id: string;
    affiliate_id: string;
    first_name: string;
    last_name: string;
  } | null;
  // For compatibility with old code
  first_name: string;
  last_name: string;
  created_at: string;
  site_name: string | null;
  phone?: string;
  phoneNumbers?: PhoneNumberType[];
  // Add these for date safety
  last_commission_date_safe?: string | null;
  profilePictureUrl: string | null;
  avatarHexColor: string | null;
  avatarInitials: string | null;
  lastOrderDate?: string | null;  // ADD THIS
};
// Helper function to convert backend affiliate to frontend format
const convertBackendAffiliate = (backendAffiliate: BackendAffiliate): CombinedAffiliate => {
  return {
    ...backendAffiliate,
    // Map fields for compatibility
    id: backendAffiliate._id,
    affiliate_id: backendAffiliate.selfAffiliateId.toString(),
    address: backendAffiliate.addressLineOne || null,
    city: backendAffiliate.cityTown || null,
    state_province: backendAffiliate.stateProvince || null,
    postal_code: backendAffiliate.zipPostal || null,
    teqnavi_enabled: backendAffiliate.tipaltiEnabled,
    // Map enroller if exists
    enrolling_affiliate: backendAffiliate.enroller ? {
      id: backendAffiliate.enroller.selfAffiliateId.toString(),
      affiliate_id: backendAffiliate.enroller.selfAffiliateId.toString(),
      first_name: backendAffiliate.enroller.firstName,
      last_name: backendAffiliate.enroller.lastName,
    } : null,
    affiliate_count: backendAffiliate.downlineCount || 0,
    customer_count: backendAffiliate.customerCount || 0,
    // Compatibility fields
    first_name: backendAffiliate.firstName,
    last_name: backendAffiliate.lastName,
    created_at: backendAffiliate.enrollmentDate,
    site_name: backendAffiliate.siteName || null,
    phone: backendAffiliate.phone,
    phoneNumbers: backendAffiliate.phoneNumbers ||
      (backendAffiliate.phone ? [
        {
          number: backendAffiliate.phone,
          type: "mobile" as const,
          primary: true
        }
      ] : []),
    // These will be populated from backend data if available
    last_commission_date: undefined,
    last_commission_amount: undefined,
    last_subscription_date: undefined,
    //`${config.cloudFrontUrl}profile-pictures${url.split("/profile-pictures")[1]}` : null
    // profilePictureUrl: backendAffiliate.profilePictureUrl || null,
    profilePictureUrl: backendAffiliate.profilePictureUrl ? `${config.cloudFrontUrl}profile-pictures${backendAffiliate.profilePictureUrl?.split("/profile-pictures")[1]}` : null,
    avatarHexColor: backendAffiliate.avatarHexColor || null,
    avatarInitials: backendAffiliate.avatarInitials || null,
    // affiliate_count: 0,
    tax_id: undefined,
    // Safe date field
    last_commission_date_safe: undefined,
  };
};
// Safe date formatter to prevent "Invalid time value" errors
const safeFormatDate = (dateString: string | null | undefined, formatStr: string = "MMM d, yyyy"): string => {
  if (!dateString) return "-";
  const date = new Date(dateString);
  if (!isValid(date)) return "-";
  try {
    return format(date, formatStr);
  } catch (error) {
    console.error("Error formatting date:", error);
    return "-";
  }
};
export function AffiliateTable() {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);
  const impersonating = useAuthStore((state) => state.impersonating);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [enrollingAffiliateSearch, setEnrollingAffiliateSearch] = useState("");
  const [debouncedEnrollingAffiliateSearch, setDebouncedEnrollingAffiliateSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [status, setStatus] = useState<string | number>("all");
  const [sortColumn, setSortColumn] = useState<"name" | "enrollmentDate" | "siteName" | "customers" | "affiliates" | "subscription" | "lastCommission" | "status" | "tipalti" | "enrolledBy" | "selfAffiliateId" | "lastOrderDate">("selfAffiliateId");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [showDuplicates, setShowDuplicates] = useState(false);
  const [selectedAffiliate, setSelectedAffiliate] = useState<CombinedAffiliate | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showOrdersDialog, setShowOrdersDialog] = useState(false);
  const [enrollingAffiliateToView, setEnrollingAffiliateToView] = useState<CombinedAffiliate | null>(null);
  const [defaultTab, setDefaultTab] = useState<string>("details");
  const [initialExpandedCommission, setInitialExpandedCommission] = useState<string | undefined>(undefined);
  const [notesAffiliate, setNotesAffiliate] = useState<CombinedAffiliate | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [lastOrderDateFrom, setLastOrderDateFrom] = useState<Date | undefined>();
  const [lastOrderDateTo, setLastOrderDateTo] = useState<Date | undefined>();
  const [enrolledDateFrom, setEnrolledDateFrom] = useState<Date | undefined>();
  const [enrolledDateTo, setEnrolledDateTo] = useState<Date | undefined>();
  const { dateFormatRegion, dateFormatVariant } = useDateFormatStore();
  const hasActiveFilters = debouncedSearchTerm || debouncedEnrollingAffiliateSearch || categoryFilter !== "all" || status !== "all" || lastOrderDateFrom || lastOrderDateTo || enrolledDateFrom || enrolledDateTo;
  const formatString = getDateFormatString(dateFormatRegion, dateFormatVariant);
  const { isAffiliate, isAdmin, isSuperAdmin } = useUserRole();
  const { hasPermission } = useModulePermissions();
  const canEditAffiliates = hasPermission("module_permissions", "affiliates", "edit");
  // Get companyId from user
  const companyId = user?.selfClientId?.toString() || "1";



  // In your queryFn (where you build the payload for listAffiliates)
  const fromLocal = lastOrderDateFrom ? new Date(lastOrderDateFrom) : null;
  const toLocal = lastOrderDateTo ? new Date(lastOrderDateTo) : null;

  // Helper: Get start of local day in UTC
  const getStartOfLocalDayUTC = (localDate: Date | null) => {
    if (!localDate) return undefined;
    const year = localDate.getFullYear();
    const month = localDate.getMonth();
    const day = localDate.getDate();

    // Create midnight local time, then convert to UTC
    const midnightLocal = new Date(year, month, day, 0, 0, 0, 0);
    return midnightLocal.toISOString(); // e.g. "2025-12-27T18:30:00.000Z" for IST
  };

  // Helper: Get end of local day in UTC
  const getEndOfLocalDayUTC = (localDate: Date | null) => {
    if (!localDate) return undefined;
    const year = localDate.getFullYear();
    const month = localDate.getMonth();
    const day = localDate.getDate();

    const endLocal = new Date(year, month, day, 23, 59, 59, 999);
    return endLocal.toISOString(); // e.g. "2025-12-28T18:29:59.999Z"
  };

  // Clear filters function
  const clearFilters = () => {
    setSearchTerm("");
    setEnrollingAffiliateSearch("");
    setCategoryFilter("all");
    setStatus("all");
    setLastOrderDateFrom(undefined);
    setLastOrderDateTo(undefined);
    setEnrolledDateFrom(undefined);
    setEnrolledDateTo(undefined);
  };
  // Reset page to 1 when any filter changes (but NOT when only page changes)
  useEffect(() => {
    setCurrentPage(1);
  }, [
    debouncedSearchTerm,
    status,
    sortColumn,
    sortDirection,
    itemsPerPage,
    lastOrderDateFrom,
    lastOrderDateTo,
    enrolledDateFrom,
    enrolledDateTo,
  ]);
  // Sync auth email function (only Supabase function we keep)
  const syncAuthEmail = async (aff: CombinedAffiliate) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Please log in first");
        return;
      }
      if (!aff.auth_user_id) {
        toast.error("No linked auth user for this affiliate");
        return;
      }
      const { error } = await supabase.functions.invoke('sync-affiliate-email', {
        body: { affiliateAuthUserId: aff.auth_user_id },
        headers: { Authorization: `Bearer ${session.access_token}` }
      });
      if (error) throw error;
      toast.success(`Synced auth email to ${aff.email}`);
    } catch (e: any) {
      toast.error(e.message || "Failed to sync auth email");
    }
  };
  // Delete mutation (using your deleteAffiliate function)
  const deleteMutation = useMutation({
    mutationFn: (affiliateId: string) => deleteAffiliate(affiliateId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["affiliates"] });
      toast.success("Affiliate moved to deleted folder");
    },
    onError: () => toast.error("Failed to delete affiliate"),
  });
  // Handle sort function
  const handleSort = (column: "name" | "enrollmentDate" | "siteName" | "customers" | "affiliates" | "subscription" | "lastCommission" | "status" | "tipalti" | "enrolledBy" | "lastOrderDate") => {
    setCategoryFilter("all") 
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("desc");
    }
    setCurrentPage(1);
  };
  // Get sort icon function
  const getSortIcon = (column: "name" | "enrollmentDate" | "siteName" | "customers" | "affiliates" | "subscription" | "lastCommission" | "status" | "tipalti" | "enrolledBy" | "lastOrderDate") => {
    if (sortColumn !== column) {
      return <ArrowUpDown className="h-4 w-4 ml-1" />;
    }
    return sortDirection === "asc" ? (
      <ArrowUp className="h-4 w-4 ml-1" />
    ) : (
      <ArrowDown className="h-4 w-4 ml-1" />
    );
  };
  // Get status badge function
  const getStatusBadge = (status: number) => {
    // Convert backend status to frontend display format
    const statusDisplayMap = {
      1: "Active",
      2: "Inactive",
      3: "Pending KYC", // Note the space
      4: "Rejected"
    };
    const displayText = statusDisplayMap[status] || status;
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      1: "default",
      2: "secondary",
      3: "outline",
      4: "destructive"
    };
    const variant = variants[status] || "default";
    return <Badge variant={variant}>{displayText}</Badge>;
  };
  const handleViewEnrollerAffiliate = async (affiliateId: string) => {
    try {
      const payload: ListAffiliatesPayload = {
        companyId,
        selfAffiliateId: affiliateId,
        limit: 1,
      };
      const response = await listAffiliates(payload);
      if (response.data.success && response.data.data.affiliates.length > 0) {
        const enrollerAffiliate = response.data.data.affiliates[0];
        const converted = convertBackendAffiliate(enrollerAffiliate);
        setEnrollingAffiliateToView(converted);
      } else {
        toast.error("Enroller affiliate not found");
      }
    } catch (error) {
      console.error("Error fetching enroller:", error);
      toast.error("Failed to load enroller details");
    }
  };
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedEnrollingAffiliateSearch(enrollingAffiliateSearch);
    }, 500);
    return () => clearTimeout(timer);
  }, [enrollingAffiliateSearch]);
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm, status, categoryFilter, debouncedEnrollingAffiliateSearch, enrolledDateFrom, enrolledDateTo, sortColumn, sortDirection]);
  // Use backend API for listing affiliates - MAIN QUERY
  const { data: backendAffiliatesData, isLoading } = useQuery({
    queryKey: ["affiliates", debouncedSearchTerm, categoryFilter, status, currentPage, itemsPerPage, companyId, debouncedEnrollingAffiliateSearch, enrolledDateFrom, enrolledDateTo, lastOrderDateFrom, lastOrderDateTo, sortColumn, sortDirection],
    queryFn: async () => {
      const payload: ListAffiliatesPayload = {
        companyId,
        page: currentPage,
        limit: itemsPerPage,
        search: debouncedSearchTerm || undefined,
        affiliateSearch: debouncedEnrollingAffiliateSearch || undefined,
        enrollmentDateFrom: enrolledDateFrom ? format(enrolledDateFrom, 'yyyy-MM-dd') : undefined,
        enrollmentDateTo: enrolledDateTo ? format(enrolledDateTo, 'yyyy-MM-dd') : undefined,
        lastOrderDateFrom: getStartOfLocalDayUTC(fromLocal),
        lastOrderDateTo: getEndOfLocalDayUTC(toLocal),
        // Map frontend status to backend format
        status: status !== "all" ?
          (status === 3 ? 3 : status)
          : undefined,
        sortBy: sortColumn || "enrollmentDate",
        sortOrder: sortDirection || "desc",
        categoryFilter: categoryFilter
      };
      const response = await listAffiliates(payload);
      if (!response.data.success) {
        throw new Error(response.data.message);
      }
      return response.data.data;
    },
  });
  // Convert backend data to frontend format WITHOUT Supabase queries
  const enhancedAffiliates = useMemo(() => {
    if (!backendAffiliatesData?.affiliates) return [];
    // Convert to combined format
    const combinedAffiliates = backendAffiliatesData.affiliates.map(convertBackendAffiliate);
    // Add any additional data that might come from backend statistics
    // For now, we're not fetching customer counts, commissions, etc. from Supabase
    return combinedAffiliates.map((affiliate) => ({
      ...affiliate,
      // These fields would come from your backend if needed
      // For now, set defaults or use data from backend if available
      // affiliate_count: 0,
      last_commission_date: null,
      last_commission_amount: null,
      last_subscription_date: null,
    }));
  }, [backendAffiliatesData?.affiliates]);
  // Filter affiliates based on enrolling affiliate search
  const filteredAffiliates = useMemo(() => {
    if (!enhancedAffiliates) return [];
    let filtered = [...enhancedAffiliates];
    // Apply category filters - simplified since we don't have Supabase data
    if (categoryFilter === "top_enrollers") {
      // Can't filter by affiliate_count since we don't have this data
      filtered = filtered;
    } else if (categoryFilter === "top_sellers") {
      // Can't filter by commission amount since we don't have this data
      filtered = filtered;
    } else if (categoryFilter === "no_teqnavi") {
      filtered = filtered.filter(a => !a.tipaltiEnabled);
    } else if (categoryFilter === "no_affiliates") {
      // All affiliates have 0 affiliate_count (default)
      filtered = filtered;
    } else if (categoryFilter === "no_customers") {
      // All affiliates have 0 customer_count (default)
      filtered = filtered;
    }
    return filtered;
  }, [enhancedAffiliates, debouncedEnrollingAffiliateSearch, categoryFilter, sortColumn, sortDirection, enrolledDateFrom, enrolledDateTo]);
  // Pagination
  const totalPages = backendAffiliatesData?.pagination?.totalPages || 1;
  const totalCount = backendAffiliatesData?.pagination?.totalCount || 0;
  const paginatedAffiliates = useMemo(() => {
    if (!backendAffiliatesData?.affiliates) return [];
    return backendAffiliatesData.affiliates.map(convertBackendAffiliate);
  }, [backendAffiliatesData?.affiliates]);
  // if (isLoading) {
  // return <div className="text-center py-8">Loading affiliates...</div>;
  // }
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const updateAuthUser = useAuthStore((state) => state.updateAuthUser);

  const updateAuthAnnouncement = useAuthStore((state) => state.updateAuthAnnouncement);

  const impersonateAffiliateMutation = useMutation({
    mutationFn: async (affiliateId: string, payload: any) => await impersonateAffiliate(affiliateId, payload),
    onSuccess: (response) => {
      setAuth(response.data.data.affiliateToken, response.data.data.user, true);
      let stateUrl = null;
      if (response?.data?.data?.user?.profilePictureUrl) {
        stateUrl = `${config.cloudFrontUrl}profile-pictures${response?.data?.data?.user?.profilePictureUrl?.split("/profile-pictures")[1]}`;
      }
      updateAuthUser({ profilePictureUrl: stateUrl });

      updateAuthAnnouncement(false);

      queryClient.invalidateQueries();
      queryClient.clear();
    },
    onError: (error) => {
      console.log("error is ", error);
      toast({
        title: "Something went wrong",
        description: "Please try to impersonate affiliate sometime later"
      })
    }
  });
  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-4">
        <div key="main-search-wrapper" className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 focus-visible:ring-0 focus-visible:ring-offset-0"
            autoComplete="off"
          />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-full md:w-[180px] focus:outline-none focus:ring-0 focus:ring-offset-0 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 border-gray-300">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="1">Active</SelectItem>
            <SelectItem value="2">Inactive</SelectItem>
            <SelectItem value="3">Pending KYC</SelectItem>
            <SelectItem value="4">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex gap-2">
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full md:w-[220px] focus:outline-none focus:ring-0 focus:ring-offset-0 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 border-gray-300">
            <SelectValue placeholder="All Affiliates" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Affiliates</SelectItem>
            <SelectItem value="top_enrollers">Top Enrollers</SelectItem>
            <SelectItem value="top_sellers">Top Sellers</SelectItem>
            <SelectItem value="no_tipalti">No Tipalti Account</SelectItem>
            <SelectItem value="no_affiliates">No Enrolled Affiliates</SelectItem>
            <SelectItem value="no_customers">No Enrolled Customers</SelectItem>
            <SelectItem value="no_purchases">No Personal Purchases</SelectItem>
          </SelectContent>
        </Select>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="enrolling-affiliate-search"
            key="enrolling-affiliate-search-input"
            placeholder="Enrolling Affiliate (search name)..."
            value={enrollingAffiliateSearch}
            onChange={(e) => setEnrollingAffiliateSearch(e.target.value)}
            className="pl-10 focus-visible:ring-0 focus-visible:ring-offset-0"
            autoComplete="off"
          />
        </div>
        {!isAffiliate && (
          <Button variant="outline" onClick={() => setShowDuplicates(true)}>
            <Users className="h-4 w-4 mr-2 focus-visible:ring-0 focus-visible:ring-offset-0" />
            Find Duplicates
          </Button>
        )}
        {hasActiveFilters && (
          <Button variant="ghost" onClick={clearFilters}>
            <X className="h-4 w-4 mr-2 focus-visible:ring-0 focus-visible:ring-offset-0" />
            Clear Filters
          </Button>
        )}
      </div>
      {/* Date Range Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <label className="text-sm font-medium mb-2 block">Last Order Date Range</label>
          <div className="flex gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "justify-start text-left font-normal flex-1 focus-visible:ring-0 focus-visible:ring-offset-0",
                    !lastOrderDateFrom && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4 focus-visible:ring-0 focus-visible:ring-offset-0" />
                  {lastOrderDateFrom ? safeFormatDate(lastOrderDateFrom.toISOString(), formatString) : "From"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  formatString={formatString}
                  selected={lastOrderDateFrom}
                  onSelect={setLastOrderDateFrom}
                  initialFocus
                  className="pointer-events-auto focus-visible:ring-0 focus-visible:ring-offset-0"
                />
              </PopoverContent>
            </Popover>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "justify-start text-left font-normal flex-1 focus-visible:ring-0 focus-visible:ring-offset-0",
                    !lastOrderDateTo && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {lastOrderDateTo ? safeFormatDate(lastOrderDateTo.toISOString(), formatString) : "To"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={lastOrderDateTo}
                  formatString={formatString}
                  onSelect={setLastOrderDateTo}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
        <div className="flex-1">
          <label className="text-sm font-medium mb-2 block">Enrolled / Join Date Range</label>
          <div className="flex gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "justify-start text-left font-normal flex-1 focus-visible:ring-0 focus-visible:ring-offset-0",
                    !enrolledDateFrom && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4 focus-visible:ring-0 focus-visible:ring-offset-0" />
                  {enrolledDateFrom ? safeFormatDate(enrolledDateFrom.toISOString(), formatString) : "From"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  formatString={formatString}
                  selected={enrolledDateFrom}
                  onSelect={setEnrolledDateFrom}
                  initialFocus
                  className="pointer-events-auto focus-visible:ring-0 focus-visible:ring-offset-0"
                />
              </PopoverContent>
            </Popover>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "justify-start text-left font-normal flex-1 focus-visible:ring-0 focus-visible:ring-offset-0",
                    !enrolledDateTo && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {enrolledDateTo ? safeFormatDate(enrolledDateTo.toISOString(), formatString) : "To"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={enrolledDateTo}
                  formatString={formatString}
                  onSelect={setEnrolledDateTo}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>
      {/* Mobile Card View */}
      <div className="lg:hidden space-y-4">
        {paginatedAffiliates?.map((affiliate) => (
          <div key={affiliate.id} className="bg-card border rounded-lg p-4 space-y-3">
            <div className="flex justify-between items-start">
              <div>
                {(isAdmin || isAffiliate) ? (
                  <button
                    onClick={() => {
                      setSelectedAffiliate(affiliate);
                      setShowEditDialog(true);
                      setDefaultTab("details");
                    }}
                    className="text-sm text-foreground hover:text-primary hover:underline transition-colors text-left"
                  >
                    <div>{affiliate.firstName} {affiliate.lastName}</div>
                    <div className="text-xs text-muted-foreground">{affiliate.selfAffiliateId}</div>
                  </button>
                ) : (
                  <div className="text-sm text-left">
                    <div>{affiliate.firstName} {affiliate.lastName}</div>
                    <div className="text-sm text-muted-foreground">{affiliate.selfAffiliateId}</div>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                {getStatusBadge(affiliate.status)}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {(isAdmin || isAffiliate) && (
                      <DropdownMenuItem onClick={() => {
                        setSelectedAffiliate(affiliate);
                        setShowEditDialog(true);
                        setDefaultTab("details");
                      }}>
                        <Pencil className="h-4 w-4 mr-2" />
                        View Affiliate
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={() => {
                      setSelectedAffiliate(affiliate);
                      setShowOrdersDialog(true);
                    }}>
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      View Orders
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setNotesAffiliate(affiliate)}>
                      <StickyNote className="h-4 w-4 mr-2" />
                      Notes
                    </DropdownMenuItem>
                    {isAdmin && (
                      <DropdownMenuItem onClick={() => syncAuthEmail(affiliate)}>
                        <UserRoundCog className="h-4 w-4 mr-2" />
                        Sync Auth Email
                      </DropdownMenuItem>
                    )}
                    {isAdmin && canEditAffiliates && affiliate.customer_count === 0  &&
                                affiliate.affiliate_count === 0 && affiliate?.purchaseCount <= 0 &&  !affiliate?.lastCommissionAmount &&(
                      <DropdownMenuItem onClick={() => {
                        if (confirm("Are you sure you want to delete this affiliate?")) {
                          deleteMutation.mutate(affiliate.id);
                        }
                      }}
                        className="text-destructive">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Affiliate
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">Email/Phone:</span>
                <a href={`mailto:${affiliate.email}`} className="text-primary hover:underline block text-xs">
                  {affiliate.email}
                </a>
                <div>
                  <PhoneDisplay phoneNumbers={affiliate.phoneNumbers} />
                </div>
              </div>
              <div>
                <span className="text-muted-foreground">Join Date:</span>
                <p className="font-medium">{safeFormatDate(affiliate.enrollmentDate, formatString)}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Last Order:</span>
                <p className="font-medium">{safeFormatDate(affiliate.lastOrderDate, formatString) || "-"}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Tipalti:</span>
                <Badge variant={affiliate.tipaltiEnabled ? "default" : "destructive"} className="ml-1">
                  {affiliate.tipaltiEnabled ? "Yes" : "No"}
                </Badge>
              </div>
            </div>
            {affiliate.enrolling_affiliate && (
              <div className="border-t pt-2">
                <span className="text-muted-foreground text-sm">Enrolled by:</span>
                <button
                  onClick={async () => {
                    try {
                      const payload: ListAffiliatesPayload = {
                        companyId,
                        selfAffiliateId: affiliate.enrolling_affiliate.affiliate_id,
                        limit: 1,
                      };
                      const response = await listAffiliates(payload);
                      if (response.data.success && response.data.data.affiliates.length > 0) {
                        const enrollerAffiliate = response.data.data.affiliates[0];
                        const converted = convertBackendAffiliate(enrollerAffiliate);
                        setSelectedAffiliate(converted);
                        setShowEditDialog(true);
                        setDefaultTab("details");
                      } else {
                        toast.error("Enroller affiliate not found");
                      }
                    } catch (error) {
                      console.error("Error fetching enroller:", error);
                      toast.error("Failed to load enroller details");
                    }
                  }}
                  className="text-primary hover:underline text-left block"
                >
                  {affiliate.enrolling_affiliate.first_name} {affiliate.enrolling_affiliate.last_name}
                  <div className="text-xs text-muted-foreground block">
                    ID: {affiliate.enrolling_affiliate.affiliate_id}
                  </div>
                </button>
              </div>
            )}
            <div className="flex gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Customers: </span>
                <span className="font-medium">{affiliate.customer_count || 0}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Affiliates: </span>
                <span className="font-medium">{affiliate.affiliate_count || 0}</span>
              </div>
            </div>
            {/* Remove commission display since we don't have this data */}
            {/* Remove subscription display since we don't have this data */}
          </div>
        ))}
      </div>
      {/* Desktop Table View - simplified without commission/subscription columns */}
      <div className="hidden lg:block border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead></TableHead>
              <TableHead>
                <button
                  onClick={() => handleSort("name")}
                  className="flex items-center hover:text-foreground transition-colors"
                >
                  Name
                  {getSortIcon("name")}
                </button>
              </TableHead>
              <TableHead>Email/Phone</TableHead>
              {
                !isAffiliate && (
                  <>
                    <TableHead className="min-w-[160px]">
                      <button
                        onClick={() => handleSort("enrolledBy")}
                        className="flex items-center whitespace-nowrap hover:text-foreground transition-colors"
                      >
                        Enrolled By
                        {getSortIcon("enrolledBy")}
                      </button>
                    </TableHead>
                  </>
                )
              }
              <TableHead className="w-[100px]">
                <button
                  onClick={() => handleSort("siteName")}
                  className="flex items-center hover:text-foreground transition-colors"
                >
                  Site
                  {getSortIcon("siteName")}
                </button>
              </TableHead>
              <TableHead>
                <button
                  onClick={() => handleSort("enrollmentDate")}
                  className="flex items-center hover:text-foreground transition-colors"
                >
                  Join Date
                  {getSortIcon("enrollmentDate")}
                </button>
              </TableHead>

              <TableHead>
                <button
                  onClick={() => handleSort("tipalti")}
                  className="flex items-center hover:text-foreground transition-colors"
                >
                  Tipalti
                  {getSortIcon("tipalti")}
                </button>
              </TableHead>
              <TableHead className="text-center">
                <button
                  onClick={() => handleSort("customers")}
                  className="flex items-center mx-auto hover:text-foreground transition-colors"
                >
                  Customers
                  {getSortIcon("customers")}
                </button>
              </TableHead>
              <TableHead className="text-center">
                <button
                  onClick={() => handleSort("affiliates")}
                  className="flex items-center mx-auto hover:text-foreground transition-colors"
                >
                  Affiliates
                  {getSortIcon("affiliates")}
                </button>
              </TableHead>
              <TableHead>
                <button
                  onClick={() => handleSort("lastCommission")}
                  className="flex items-center hover:text-foreground transition-colors"
                >
                  Last Commission
                  {getSortIcon("lastCommission")}
                </button>
              </TableHead>
              <TableHead>
                Status
              </TableHead>
              <TableHead className="text-right"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!isLoading ? (paginatedAffiliates?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={12} className="text-center text-muted-foreground py-8 ">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No affiliates found</p>
                </TableCell>
              </TableRow>
            ) : (
              paginatedAffiliates?.map((affiliate) => (
                <TableRow key={affiliate.id}>
                  <TableCell>
                    <Avatar>
                      <AvatarImage src={affiliate?.profilePictureUrl} key={affiliate?.profilePictureUrl} />
                      <AvatarFallback
                        style={{ backgroundColor: affiliate?.avatarHexColor || '#3b82f6', color: '#ffffff', fontWeight: 500, }}
                      >
                        {(
                          affiliate?.avatarInitials ||
                          `${affiliate?.firstName[0]}${affiliate?.lastName[0]}`
                        ).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </TableCell>
                  <TableCell>
                    {(isAdmin || isAffiliate) ? (
                      <button
                        onClick={() => {
                          setSelectedAffiliate(affiliate);
                          setShowEditDialog(true);
                          setDefaultTab("details");
                        }}
                        className="text-foreground hover:text-primary hover:underline transition-colors text-left"
                      >
                        <div>{affiliate.firstName} {affiliate.lastName}</div>
                        <div className="text-xs text-muted-foreground">{affiliate.selfAffiliateId}</div>
                      </button>
                    ) : (
                      <div className="text-left">
                        <div>{affiliate.firstName} {affiliate.lastName}</div>
                        <div className="text-sm text-muted-foreground">{affiliate.selfAffiliateId}</div>
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <a href={`mailto:${affiliate.email}`} className="text-primary hover:underline">
                      {affiliate.email}
                    </a>
                    <div>
                      <PhoneDisplay phoneNumbers={affiliate.phoneNumbers || []} />
                    </div>
                  </TableCell>
                  {
                    !isAffiliate && (
                      <TableCell>
                        {affiliate.enrolling_affiliate ? (
                          <button
                            onClick={async () => {
                              try {
                                // Fetch the full affiliate data using selfAffiliateId
                                const payload: ListAffiliatesPayload = {
                                  companyId,
                                  selfAffiliateId: affiliate.enrolling_affiliate.affiliate_id,
                                  limit: 1,
                                };
                                const response = await listAffiliates(payload);
                                if (response.data.success && response.data.data.affiliates.length > 0) {
                                  const enrollerAffiliate = response.data.data.affiliates[0];
                                  const converted = convertBackendAffiliate(enrollerAffiliate);
                                  // Now open the edit dialog with the real data
                                  setSelectedAffiliate(converted);
                                  setShowEditDialog(true);
                                  setDefaultTab("details");
                                } else {
                                  toast.error("Enroller affiliate not found");
                                }
                              } catch (error) {
                                console.error("Error fetching enroller:", error);
                                toast.error("Failed to load enroller details");
                              }
                            }}
                            className="text-primary hover:underline text-left"
                          >
                            <div>{affiliate.enrolling_affiliate.first_name} {affiliate.enrolling_affiliate.last_name}</div>
                            <div className="text-xs text-muted-foreground">{affiliate.enrolling_affiliate.affiliate_id}</div>
                          </button>
                        ) : "-"}
                      </TableCell>
                    )
                  }
                  <TableCell>
                    {affiliate.siteName ? (
                      <a
                        href={`https://www.theonglobal.com/?ref=${affiliate.siteName}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        {affiliate.siteName}
                      </a>
                    ) : "-"}
                  </TableCell>
                  <TableCell className="text-center">{safeFormatDate(affiliate.enrollmentDate, formatString)}</TableCell>

                  <TableCell>
                    <Badge variant={affiliate.tipaltiEnabled ? "default" : "destructive"}>
                      {affiliate.tipaltiEnabled ? "Yes" : "No"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center font-medium">
                    {affiliate.customer_count || 0}
                  </TableCell>
                  <TableCell className="text-center font-medium">
                    {affiliate.affiliate_count || 0}
                  </TableCell>
                  <TableCell className="text-center">
                    {affiliate.lastCommissionEndDate ? (
                      <button
                        onClick={() => {
                          setSelectedAffiliate(affiliate);
                          setDefaultTab("commissions"); // This opens the commissions tab
                          setShowEditDialog(true);
                        }}
                        className="text-sm text-primary hover:underline text-left"
                      >
                        <div>{format(new Date(affiliate.lastCommissionEndDate), formatString)}</div>
                        <div className="text-muted-foreground">
                          {formatCurrency(affiliate.lastCommissionAmount ?? 0)}
                        </div>
                      </button>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell>{getStatusBadge(affiliate.status)}</TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {(isAdmin || isAffiliate) && (
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedAffiliate(affiliate);
                                setDefaultTab("details");
                                setInitialExpandedCommission(undefined);
                                setShowEditDialog(true);
                              }}
                            >
                              <Pencil className="h-4 w-4 mr-2" />
                              View Affiliate
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedAffiliate(affiliate);
                              setShowOrdersDialog(true);
                            }}
                          >
                            <ShoppingCart className="h-4 w-4 mr-2" />
                            View Orders
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setNotesAffiliate(affiliate)}
                          >
                            <StickyNote className="h-4 w-4 mr-2" />
                            Notes
                          </DropdownMenuItem>
                          {isAdmin && hasPermission("dashboard_module_permissions", "impersonate_top_company", "edit") && (
                            <>
                              <DropdownMenuItem
                                onClick={async () => {
                                  await impersonateAffiliateMutation.mutateAsync(affiliate._id, {});
                                  navigate("/affiliate-dashboard");
                                }}
                              >
                                <UserRoundCog className="h-4 w-4 mr-2" />
                                Impersonate
                              </DropdownMenuItem>
                              {isAdmin && canEditAffiliates && affiliate.customer_count === 0  &&
                                affiliate.affiliate_count === 0 && affiliate?.purchaseCount <= 0 &&  !affiliate?.lastCommissionAmount &&(
                                  <DropdownMenuItem
                                    onClick={() => {
                                      if (confirm("Are you sure you want to delete this affiliate?")) {
                                        deleteMutation.mutate(affiliate.id);
                                      }
                                    }}
                                    className="text-destructive"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete Affiliate
                                  </DropdownMenuItem>
                                )}
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )) : (
              <TableRow>
                <TableCell colSpan={12} className="h-64 text-center"> {/* Adjust colSpan to match your columns */}
                  <div className="flex flex-col items-center justify-center space-y-4">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    <p className="text-muted-foreground">Loading affiliates...</p>
                  </div>
                </TableCell>
              </TableRow>
            )
            }
          </TableBody>
        </Table>
      </div>
      {/* Pagination */}
      {(filteredAffiliates?.length || 0) > 0 && (
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center gap-4">
            <div className="text-sm text-muted-foreground">
              Showing{" "}
              {backendAffiliatesData?.affiliates.length === 0
                ? 0
                : (currentPage - 1) * itemsPerPage + 1}{" "}
              to{" "}
              {Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount} affiliates
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Per page:</span>
              <Select
                value={itemsPerPage.toString()}
                onValueChange={(value) => {
                  setItemsPerPage(Number(value));
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-[80px] focus:outline-none focus:ring-0 focus:ring-offset-0 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 border-gray-300" >
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
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1).map((page) => (
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
      <DuplicateAffiliatesDialog open={showDuplicates} onOpenChange={setShowDuplicates} />
      {selectedAffiliate && (
        <>
          <AffiliateEditDialog
            // affiliate={selectedAffiliate}
            affiliateMongoId={selectedAffiliate._id}
            open={showEditDialog}
            onOpenChange={(open) => {
              setShowEditDialog(open);
              if (!open) {
                setDefaultTab("details");
                setInitialExpandedCommission(undefined);
              }
            }}
            defaultTab={defaultTab}
            initialExpandedCommission={initialExpandedCommission}
          />
          <AffiliateOrdersDialog
            affiliateId={selectedAffiliate._id}
            affiliate={selectedAffiliate}
            open={showOrdersDialog}
            onOpenChange={setShowOrdersDialog}
          />
        </>
      )}
      {notesAffiliate && (
        <NotesDialog
          open={!!notesAffiliate}
          onOpenChange={(open) => !open && setNotesAffiliate(null)}
          entityId={notesAffiliate.id}
          entityType="affiliate"
          entityName={`${notesAffiliate.firstName} ${notesAffiliate.lastName}`}
          onViewEntity={() => {
            setSelectedAffiliate({
              ...notesAffiliate,
              _fromNotes: true
            });
            setDefaultTab("details");
            setInitialExpandedCommission(undefined);
            setShowEditDialog(true);
            setNotesAffiliate(null);
          }}
          onViewOrders={() => {
            setSelectedAffiliate({
              ...notesAffiliate,
              _fromNotes: true
            });
            setShowOrdersDialog(true);
            setNotesAffiliate(null);
          }}
        />
      )}
    </div>
  );
}