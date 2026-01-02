// import { useState, useEffect } from "react";
// import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
// import { supabase } from "@/integrations/supabase/client";
// import { useUserRole } from "@/hooks/use-user-role";
// import { useModulePermissions } from "@/hooks/use-module-permissions";
// import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// import { Badge } from "@/components/ui/badge";
// import { Pencil, Trash2, ShoppingCart, Search, Users, MoreVertical, X, ArrowUpDown, ArrowUp, ArrowDown, StickyNote, UserPlus, CalendarIcon } from "lucide-react";
// import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
// import { toast } from "sonner";
// import { getStatusBadgeVariant } from "@/lib/badge-variants";
// import { format } from "date-fns";
// import { CustomerEditDialog } from "./customer-edit-dialog";
// import { CustomerOrdersDialog } from "./customer-orders-dialog";
// import { DuplicateCustomersDialog } from "./duplicate-customers-dialog";
// import { AffiliateEditDialog } from "../affiliates/affiliate-edit-dialog";
// import { NotesDialog } from "../shared/notes-dialog";
// import { PhoneDisplay, PhoneNumber } from "../shared/phone-display";
// import { PromoteToAffiliateDialog } from "./promote-to-affiliate-dialog";
// import { formatCurrency, cn } from "@/lib/utils";
// import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
// import { Calendar } from "@/components/ui/calendar";

// interface Customer {
//   id: string;
//   customer_id: string;
//   first_name: string;
//   last_name: string;
//   email: string;
//   phone: string | null;
//   phone_numbers?: PhoneNumber[];
//   address: string | null;
//   city: string | null;
//   state_province: string | null;
//   postal_code: string | null;
//   status: string;
//   country: string;
//   enrolled_by: string | null;
//   created_at: string;
//   order_count?: number;
//   total_spent?: number;
//   last_order_date?: string;
//   last_order_amount?: number;
//   last_subscription_date?: string | null;
//   affiliate_name?: string | null;
//   enrolling_affiliate?: {
//     id: string;
//     affiliate_id: string;
//     first_name: string;
//     last_name: string;
//   } | null;
//   email_opted_out?: boolean;
//   email_opted_out_at?: string | null;
//   _fromNotes?: boolean;
// }

// export function CustomerTable() {
//   const queryClient = useQueryClient();
//   const [searchTerm, setSearchTerm] = useState("");
//   const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
//   const [status, setStatus] = useState<string>("all");
//   const [quickFilter, setQuickFilter] = useState<string>("all");
//   const [affiliateSearch, setAffiliateSearch] = useState<string>("");
//   const [debouncedAffiliateSearch, setDebouncedAffiliateSearch] = useState<string>("");
//   const [sortColumn, setSortColumn] = useState<"name" | "orders" | "spent" | "last_order" | "affiliate" | "status" | "subscription">("last_order");
//   const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
//   const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
//   const [viewingOrdersCustomer, setViewingOrdersCustomer] = useState<Customer | null>(null);
//   const [showDuplicates, setShowDuplicates] = useState(false);
//   const [enrollingAffiliateToView, setEnrollingAffiliateToView] = useState<any>(null);
//   const [notesCustomer, setNotesCustomer] = useState<Customer | null>(null);
//   const [promoteDialogOpen, setPromoteDialogOpen] = useState(false);
//   const [customerToPromote, setCustomerToPromote] = useState<Customer | null>(null);
//   const [currentPage, setCurrentPage] = useState(1);
//   const [itemsPerPage, setItemsPerPage] = useState(50);
//   const [lastOrderDateFrom, setLastOrderDateFrom] = useState<Date | undefined>();
//   const [lastOrderDateTo, setLastOrderDateTo] = useState<Date | undefined>();
//   const [enrolledDateFrom, setEnrolledDateFrom] = useState<Date | undefined>();
//   const [enrolledDateTo, setEnrolledDateTo] = useState<Date | undefined>();

//   const { isAffiliate, isAdmin } = useUserRole();
//   const { hasPermission } = useModulePermissions();
//   const canEditCustomers = hasPermission("customers", "edit");

//   // Debounce search term
//   useEffect(() => {
//     const timer = setTimeout(() => {
//       setDebouncedSearchTerm(searchTerm);
//     }, 500);

//     return () => clearTimeout(timer);
//   }, [searchTerm]);

//   // Debounce affiliate search
//   useEffect(() => {
//     const timer = setTimeout(() => {
//       setDebouncedAffiliateSearch(affiliateSearch);
//     }, 500);

//     return () => clearTimeout(timer);
//   }, [affiliateSearch]);

//   const { data: customers, isLoading } = useQuery({
//     queryKey: ["customers", debouncedSearchTerm, status, quickFilter, debouncedAffiliateSearch, sortColumn, sortDirection, lastOrderDateFrom, lastOrderDateTo, enrolledDateFrom, enrolledDateTo],
//     queryFn: async () => {
//       let query = supabase
//         .from("customers")
//         .select(`
//           *,
//           enrolled_by_affiliate:affiliates!customers_enrolled_by_fkey(id, affiliate_id, first_name, last_name, enrolled_by),
//           orders(amount, order_date, subscription)
//         `);

//       // Search filter
//       if (debouncedSearchTerm) {
//         const term = debouncedSearchTerm.trim().replace(/,/g, "");
//         const parts = term.split(/\s+/).filter(Boolean);
//         let orFilter = `first_name.ilike.%${term}%,last_name.ilike.%${term}%,email.ilike.%${term}%,phone.ilike.%${term}%`;
//         if (parts.length >= 2) {
//           const [p1, p2] = parts;
//           orFilter += `,and(first_name.ilike.%${p1}%,last_name.ilike.%${p2}%),and(first_name.ilike.%${p2}%,last_name.ilike.%${p1}%)`;
//         }
//         query = query.or(orFilter);
//       }

//       // Status filter
//       if (status !== "all") {
//         query = query.eq("status", status);
//       }

//       const { data, error } = await query;

//       if (error) throw error;

//       // Filter by affiliate name if search term provided
//       let filteredData = data;
//       if (debouncedAffiliateSearch) {
//         const searchLower = debouncedAffiliateSearch.toLowerCase();
//         filteredData = data.filter((customer: any) => {
//           if (!customer.enrolled_by_affiliate) return false;
//           const fullName = `${customer.enrolled_by_affiliate.first_name} ${customer.enrolled_by_affiliate.last_name}`.toLowerCase();
//           return fullName.includes(searchLower);
//         });
//       }

//       // Process data to add aggregates
//       const processedData = filteredData.map((customer: any) => {
//         const orders = customer.orders || [];
//         const orderCount = orders.length;
//         const totalSpent = orders.reduce((sum: number, order: any) => sum + parseFloat(order.amount), 0);
//         const sortedOrders = orders.sort((a: any, b: any) => 
//           new Date(b.order_date).getTime() - new Date(a.order_date).getTime()
//         );
//         const lastOrder = sortedOrders[0];

//         // Check for subscription orders in past 90 days
//         const ninetyDaysAgo = new Date();
//         ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
//         const recentSubscriptions = orders.filter((order: any) => 
//           order.subscription && new Date(order.order_date) >= ninetyDaysAgo
//         );
//         const lastSubscription = recentSubscriptions.sort((a: any, b: any) => 
//           new Date(b.order_date).getTime() - new Date(a.order_date).getTime()
//         )[0];

//         return {
//           ...customer,
//           order_count: orderCount,
//           total_spent: totalSpent,
//           last_order_date: lastOrder?.order_date,
//           last_order_amount: lastOrder ? parseFloat(lastOrder.amount) : 0,
//           last_subscription_date: lastSubscription?.order_date || null,
//           affiliate_name: customer.enrolled_by_affiliate 
//             ? `${customer.enrolled_by_affiliate.first_name} ${customer.enrolled_by_affiliate.last_name}`
//             : null,
//           enrolling_affiliate: customer.enrolled_by_affiliate || null,
//         };
//       });

//       // Apply date range filters
//       let filtered = processedData;

//       // Last Order Date filter
//       if (lastOrderDateFrom || lastOrderDateTo) {
//         filtered = filtered.filter((c: any) => {
//           if (!c.last_order_date) return false;
//           const orderDate = new Date(c.last_order_date);
//           orderDate.setHours(0, 0, 0, 0);

//           if (lastOrderDateFrom) {
//             const fromDate = new Date(lastOrderDateFrom);
//             fromDate.setHours(0, 0, 0, 0);
//             if (orderDate < fromDate) return false;
//           }

//           if (lastOrderDateTo) {
//             const toDate = new Date(lastOrderDateTo);
//             toDate.setHours(23, 59, 59, 999);
//             if (orderDate > toDate) return false;
//           }

//           return true;
//         });
//       }

//       // Enrolled Date filter
//       if (enrolledDateFrom || enrolledDateTo) {
//         filtered = filtered.filter((c: any) => {
//           const enrolledDate = new Date(c.created_at);
//           enrolledDate.setHours(0, 0, 0, 0);

//           if (enrolledDateFrom) {
//             const fromDate = new Date(enrolledDateFrom);
//             fromDate.setHours(0, 0, 0, 0);
//             if (enrolledDate < fromDate) return false;
//           }

//           if (enrolledDateTo) {
//             const toDate = new Date(enrolledDateTo);
//             toDate.setHours(23, 59, 59, 999);
//             if (enrolledDate > toDate) return false;
//           }

//           return true;
//         });
//       }

//       // Apply quick filters
//       const now = new Date();
//       const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
//       const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

//       switch (quickFilter) {
//         case "top_spenders":
//           filtered = filtered.filter((c: any) => c.total_spent > 1000).sort((a: any, b: any) => b.total_spent - a.total_spent);
//           break;
//         case "new_month":
//           filtered = filtered.filter((c: any) => new Date(c.created_at) >= thirtyDaysAgo);
//           break;
//         case "no_orders":
//           filtered = filtered.filter((c: any) => c.order_count === 0);
//           break;
//         case "inactive_90":
//           filtered = filtered.filter((c: any) => 
//             !c.last_order_date || new Date(c.last_order_date) < ninetyDaysAgo
//           );
//           break;
//       }

//       // Apply sorting
//       filtered.sort((a: any, b: any) => {
//         let aValue: any;
//         let bValue: any;

//         switch (sortColumn) {
//           case "name":
//             aValue = `${a.first_name} ${a.last_name}`.toLowerCase();
//             bValue = `${b.first_name} ${b.last_name}`.toLowerCase();
//             break;
//           case "orders":
//             aValue = a.order_count || 0;
//             bValue = b.order_count || 0;
//             break;
//           case "spent":
//             aValue = a.total_spent || 0;
//             bValue = b.total_spent || 0;
//             break;
//           case "last_order":
//             aValue = a.last_order_date ? new Date(a.last_order_date).getTime() : 0;
//             bValue = b.last_order_date ? new Date(b.last_order_date).getTime() : 0;
//             break;
//           case "affiliate":
//             aValue = (a.affiliate_name || "").toLowerCase();
//             bValue = (b.affiliate_name || "").toLowerCase();
//             break;
//           case "status":
//             aValue = a.status.toLowerCase();
//             bValue = b.status.toLowerCase();
//             break;
//           case "subscription":
//             aValue = a.last_subscription_date ? new Date(a.last_subscription_date).getTime() : 0;
//             bValue = b.last_subscription_date ? new Date(b.last_subscription_date).getTime() : 0;
//             break;
//           default:
//             return 0;
//         }

//         if (sortDirection === "asc") {
//           return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
//         } else {
//           return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
//         }
//       });

//       return filtered;
//     },
//   });

//   // Pagination logic
//   const totalPages = Math.ceil((customers?.length || 0) / itemsPerPage);
//   const paginatedCustomers = customers?.slice(
//     (currentPage - 1) * itemsPerPage,
//     currentPage * itemsPerPage
//   );

//   const deleteMutation = useMutation({
//     mutationFn: async (customerId: string) => {
//       const { data: { user } } = await supabase.auth.getUser();
//       if (!user) throw new Error("User not authenticated");

//       const { error } = await supabase
//         .from("customers")
//         .update({ 
//           deleted_at: new Date().toISOString(),
//           deleted_by: user.id
//         })
//         .eq("id", customerId);
//       if (error) throw error;
//     },
//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: ["customers"] });
//       toast.success("Customer moved to deleted folder");
//     },
//     onError: () => {
//       toast.error("Failed to delete customer");
//     },
//   });

//   const getStatusBadge = (status: string) => {
//     return <Badge variant={getStatusBadgeVariant(status as any)}>{status}</Badge>;
//   };

//   const clearFilters = () => {
//     setSearchTerm("");
//     setStatus("all");
//     setQuickFilter("all");
//     setAffiliateSearch("");
//     setLastOrderDateFrom(undefined);
//     setLastOrderDateTo(undefined);
//     setEnrolledDateFrom(undefined);
//     setEnrolledDateTo(undefined);
//   };

//   const hasActiveFilters = debouncedSearchTerm || status !== "all" || quickFilter !== "all" || debouncedAffiliateSearch || lastOrderDateFrom || lastOrderDateTo || enrolledDateFrom || enrolledDateTo;

//   const handleSort = (column: "name" | "orders" | "spent" | "last_order" | "affiliate" | "status" | "subscription") => {
//     if (sortColumn === column) {
//       setSortDirection(sortDirection === "asc" ? "desc" : "asc");
//     } else {
//       setSortColumn(column);
//       setSortDirection("desc");
//     }
//   };

//   const getSortIcon = (column: "name" | "orders" | "spent" | "last_order" | "affiliate" | "status" | "subscription") => {
//     if (sortColumn !== column) {
//       return <ArrowUpDown className="h-4 w-4 ml-1" />;
//     }
//     return sortDirection === "asc" ? (
//       <ArrowUp className="h-4 w-4 ml-1" />
//     ) : (
//       <ArrowDown className="h-4 w-4 ml-1" />
//     );
//   };

//   if (isLoading) {
//     return <div className="text-center py-8">Loading customers...</div>;
//   }

//   return (
//     <div className="space-y-4">
//       <div className="flex flex-col md:flex-row gap-4">
//         <div className="relative flex-1">
//           <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
//           <Input
//             id="customer-search"
//             key="customer-search-input"
//             placeholder="Search by name, email, or phone..."
//             value={searchTerm}
//             onChange={(e) => setSearchTerm(e.target.value)}
//             className="pl-10"
//             autoComplete="off"
//           />
//         </div>
//         <Select value={status} onValueChange={setStatus}>
//           <SelectTrigger className="w-full md:w-[180px]">
//             <SelectValue placeholder="Status" />
//           </SelectTrigger>
//           <SelectContent>
//             <SelectItem value="all">All Status</SelectItem>
//             <SelectItem value="active">Active</SelectItem>
//             <SelectItem value="inactive">Inactive</SelectItem>
//             <SelectItem value="cancelled">Cancelled</SelectItem>
//             <SelectItem value="terminated">Terminated</SelectItem>
//           </SelectContent>
//         </Select>
//       </div>

//       <div className="flex flex-col md:flex-row gap-4">
//         <Select value={quickFilter} onValueChange={setQuickFilter}>
//           <SelectTrigger className="w-full md:w-[200px]">
//             <SelectValue placeholder="Quick Filters" />
//           </SelectTrigger>
//           <SelectContent>
//             <SelectItem value="all">All Customers</SelectItem>
//             <SelectItem value="top_spenders">Top Spenders</SelectItem>
//             <SelectItem value="new_month">New This Month</SelectItem>
//             <SelectItem value="no_orders">No Orders Yet</SelectItem>
//             <SelectItem value="inactive_90">Inactive 90+ Days</SelectItem>
//           </SelectContent>
//         </Select>

//         <div className="relative flex-1 md:max-w-[300px]">
//           <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
//           <Input
//             id="affiliate-search"
//             key="affiliate-search-input"
//             placeholder="Enrolling Affiliate (search name)..."
//             value={affiliateSearch}
//             onChange={(e) => setAffiliateSearch(e.target.value)}
//             className="pl-10"
//             autoComplete="off"
//           />
//         </div>

//         <div className="flex gap-2 flex-wrap">
//           {!isAffiliate && (
//             <Button variant="outline" onClick={() => setShowDuplicates(true)}>
//               <Users className="h-4 w-4 mr-2" />
//               Find Duplicates
//             </Button>
//           )}

//           {hasActiveFilters && (
//             <Button variant="ghost" onClick={clearFilters}>
//               <X className="h-4 w-4 mr-2" />
//               Clear Filters
//             </Button>
//           )}
//         </div>
//       </div>

//       {/* Date Range Filters */}
//       <div className="flex flex-col md:flex-row gap-4">
//         <div className="flex-1">
//           <label className="text-sm font-medium mb-2 block">Last Order Date Range</label>
//           <div className="flex gap-2">
//             <Popover>
//               <PopoverTrigger asChild>
//                 <Button
//                   variant="outline"
//                   className={cn(
//                     "justify-start text-left font-normal flex-1",
//                     !lastOrderDateFrom && "text-muted-foreground"
//                   )}
//                 >
//                   <CalendarIcon className="mr-2 h-4 w-4" />
//                   {lastOrderDateFrom ? format(lastOrderDateFrom, "MMM d, yyyy") : "From"}
//                 </Button>
//               </PopoverTrigger>
//               <PopoverContent className="w-auto p-0" align="start">
//                 <Calendar
//                   mode="single"
//                   selected={lastOrderDateFrom}
//                   onSelect={setLastOrderDateFrom}
//                   initialFocus
//                   className="pointer-events-auto"
//                 />
//               </PopoverContent>
//             </Popover>
//             <Popover>
//               <PopoverTrigger asChild>
//                 <Button
//                   variant="outline"
//                   className={cn(
//                     "justify-start text-left font-normal flex-1",
//                     !lastOrderDateTo && "text-muted-foreground"
//                   )}
//                 >
//                   <CalendarIcon className="mr-2 h-4 w-4" />
//                   {lastOrderDateTo ? format(lastOrderDateTo, "MMM d, yyyy") : "To"}
//                 </Button>
//               </PopoverTrigger>
//               <PopoverContent className="w-auto p-0" align="start">
//                 <Calendar
//                   mode="single"
//                   selected={lastOrderDateTo}
//                   onSelect={setLastOrderDateTo}
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
//                     "justify-start text-left font-normal flex-1",
//                     !enrolledDateFrom && "text-muted-foreground"
//                   )}
//                 >
//                   <CalendarIcon className="mr-2 h-4 w-4" />
//                   {enrolledDateFrom ? format(enrolledDateFrom, "MMM d, yyyy") : "From"}
//                 </Button>
//               </PopoverTrigger>
//               <PopoverContent className="w-auto p-0" align="start">
//                 <Calendar
//                   mode="single"
//                   selected={enrolledDateFrom}
//                   onSelect={setEnrolledDateFrom}
//                   initialFocus
//                   className="pointer-events-auto"
//                 />
//               </PopoverContent>
//             </Popover>
//             <Popover>
//               <PopoverTrigger asChild>
//                 <Button
//                   variant="outline"
//                   className={cn(
//                     "justify-start text-left font-normal flex-1",
//                     !enrolledDateTo && "text-muted-foreground"
//                   )}
//                 >
//                   <CalendarIcon className="mr-2 h-4 w-4" />
//                   {enrolledDateTo ? format(enrolledDateTo, "MMM d, yyyy") : "To"}
//                 </Button>
//               </PopoverTrigger>
//               <PopoverContent className="w-auto p-0" align="start">
//                 <Calendar
//                   mode="single"
//                   selected={enrolledDateTo}
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
//         {paginatedCustomers?.map((customer) => (
//           <div key={customer.id} className="bg-card border rounded-lg p-4 space-y-3">
//             <div className="flex justify-between items-start">
//               <div>
//                 {isAdmin ? (
//                   <button
//                     onClick={() => setEditingCustomer(customer)}
//                     className="text-left"
//                   >
//                     <div className="font-medium text-foreground hover:text-primary transition-colors">
//                       {customer.first_name} {customer.last_name}
//                     </div>
//                     <div className="text-sm text-muted-foreground">
//                       {customer.customer_id}
//                     </div>
//                   </button>
//                 ) : (
//                   <div className="text-left">
//                     <div className="font-medium text-foreground">
//                       {customer.first_name} {customer.last_name}
//                     </div>
//                     <div className="text-sm text-muted-foreground">
//                       {customer.customer_id}
//                     </div>
//                   </div>
//                 )}
//               </div>
//               <div className="flex items-center gap-2">
//                 {getStatusBadge(customer.status)}
//                 <DropdownMenu>
//                   <DropdownMenuTrigger asChild>
//                     <Button variant="ghost" size="icon">
//                       <MoreVertical className="h-4 w-4" />
//                     </Button>
//                   </DropdownMenuTrigger>
//                   <DropdownMenuContent align="end">
//                     <DropdownMenuItem onClick={() => setEditingCustomer(customer)}>
//                       <Pencil className="h-4 w-4 mr-2" />
//                       View Customer
//                     </DropdownMenuItem>
//                     <DropdownMenuItem onClick={() => setViewingOrdersCustomer(customer)}>
//                       <ShoppingCart className="h-4 w-4 mr-2" />
//                       View Orders
//                     </DropdownMenuItem>
//                     <DropdownMenuItem onClick={() => setNotesCustomer(customer)}>
//                       <StickyNote className="h-4 w-4 mr-2" />
//                       Notes
//                     </DropdownMenuItem>
//                     {isAdmin && canEditCustomers && (
//                       <>
//                         <DropdownMenuItem onClick={() => {
//                           setCustomerToPromote(customer);
//                           setPromoteDialogOpen(true);
//                         }}>
//                           <UserPlus className="h-4 w-4 mr-2" />
//                           Promote to Affiliate
//                         </DropdownMenuItem>
//                         {(customer.order_count || 0) === 0 && (
//                           <DropdownMenuItem
//                             onClick={() => {
//                               if (confirm("Are you sure you want to delete this customer?")) {
//                                 deleteMutation.mutate(customer.id);
//                               }
//                             }}
//                             className="text-destructive"
//                           >
//                             <Trash2 className="h-4 w-4 mr-2" />
//                             Delete
//                           </DropdownMenuItem>
//                         )}
//                       </>
//                     )}
//                   </DropdownMenuContent>
//                 </DropdownMenu>
//               </div>
//             </div>

//             <div className="grid grid-cols-2 gap-2 text-sm">
//               <div>
//                 <span className="text-muted-foreground">Email:</span>
//                 <a href={`mailto:${customer.email}`} className="text-primary hover:underline block text-xs">
//                   {customer.email}
//                 </a>
//               </div>
//               <div>
//                 <span className="text-muted-foreground">Phone:</span>
//                 <PhoneDisplay phoneNumbers={(customer.phone_numbers as any) || []} />
//               </div>
//               <div>
//                 <span className="text-muted-foreground">Orders:</span>
//                 <p className="font-medium">{customer.order_count || 0}</p>
//               </div>
//               <div>
//                 <span className="text-muted-foreground">Total Spent:</span>
//                 <p className="font-medium">{formatCurrency(customer.total_spent)}</p>
//               </div>
//             </div>

//             {customer.last_order_date && (
//               <div className="border-t pt-2 text-sm">
//                 <span className="text-muted-foreground">Last Order:</span>
//                 <div className="font-medium">
//                   {format(new Date(customer.last_order_date), "MMM d, yyyy")} - {formatCurrency(customer.last_order_amount)}
//                 </div>
//               </div>
//             )}

//             <div className="border-t pt-2 text-sm">
//               <span className="text-muted-foreground">Subscription:</span>
//               <div className="font-medium flex items-center gap-2 mt-1">
//                 <Badge variant={customer.last_subscription_date ? "default" : "destructive"}>
//                   {customer.last_subscription_date ? "Yes" : "No"}
//                 </Badge>
//                 {customer.last_subscription_date && (
//                   <span className="text-muted-foreground text-xs">
//                     ({format(new Date(customer.last_subscription_date), "MMM d")})
//                   </span>
//                 )}
//               </div>
//             </div>

//             {customer.enrolling_affiliate && (
//               <div className="border-t pt-2">
//                 <span className="text-muted-foreground text-sm">Enrolled by:</span>
//                 <button
//                   onClick={() => setEnrollingAffiliateToView({
//                     ...customer.enrolling_affiliate,
//                     enrolled_by: (customer.enrolling_affiliate as any).enrolled_by || null,
//                     email: "",
//                     phone: null,
//                     address: null,
//                     city: null,
//                     state_province: null,
//                     postal_code: null,
//                     country: "USA",
//                     site_name: null,
//                     teqnavi_enabled: false,
//                     status: "active",
//                     created_at: "",
//                   })}
//                   className="text-primary hover:underline text-left block"
//                 >
//                   {customer.enrolling_affiliate.first_name} {customer.enrolling_affiliate.last_name}
//                 </button>
//               </div>
//             )}
//           </div>
//         ))}
//       </div>

//       {/* Desktop Table View */}
//       <div className="hidden lg:block border rounded-lg">
//         <Table>
//           <TableHeader>
//             <TableRow>
//               <TableHead>
//                 <button
//                   onClick={() => handleSort("name")}
//                   className="flex items-center hover:text-foreground transition-colors"
//                 >
//                   Name
//                   {getSortIcon("name")}
//                 </button>
//               </TableHead>
//               <TableHead>Email</TableHead>
//               <TableHead>Phone</TableHead>
//               <TableHead>
//                 <button
//                   onClick={() => handleSort("status")}
//                   className="flex items-center hover:text-foreground transition-colors"
//                 >
//                   Status
//                   {getSortIcon("status")}
//                 </button>
//               </TableHead>
//               <TableHead className="text-right">
//                 <button
//                   onClick={() => handleSort("orders")}
//                   className="flex items-center ml-auto hover:text-foreground transition-colors"
//                 >
//                   # Orders
//                   {getSortIcon("orders")}
//                 </button>
//               </TableHead>
//               <TableHead className="text-right">
//                 <button
//                   onClick={() => handleSort("spent")}
//                   className="flex items-center ml-auto hover:text-foreground transition-colors"
//                 >
//                   Total Purchased
//                   {getSortIcon("spent")}
//                 </button>
//               </TableHead>
//               <TableHead>
//                 <button
//                   onClick={() => handleSort("last_order")}
//                   className="flex items-center hover:text-foreground transition-colors"
//                 >
//                   Last Order
//                   {getSortIcon("last_order")}
//                 </button>
//               </TableHead>
//               <TableHead>
//                 <button
//                   onClick={() => handleSort("subscription")}
//                   className="flex items-center hover:text-foreground transition-colors"
//                 >
//                   Subscription
//                   {getSortIcon("subscription")}
//                 </button>
//               </TableHead>
//               <TableHead>
//                 <button
//                   onClick={() => handleSort("affiliate")}
//                   className="flex items-center hover:text-foreground transition-colors"
//                 >
//                   Enrolled by
//                   {getSortIcon("affiliate")}
//                 </button>
//               </TableHead>
//               <TableHead className="text-right"></TableHead>
//             </TableRow>
//           </TableHeader>
//           <TableBody>
//             {paginatedCustomers?.map((customer) => (
//               <TableRow key={customer.id}>
//                 <TableCell>
//                   {isAdmin ? (
//                     <button
//                       onClick={() => setEditingCustomer(customer)}
//                       className="text-left"
//                     >
//                       <div className="font-medium text-foreground hover:text-primary transition-colors">
//                         {customer.first_name} {customer.last_name}
//                       </div>
//                       <div className="text-sm text-muted-foreground">
//                         {customer.customer_id}
//                       </div>
//                     </button>
//                   ) : (
//                     <div className="text-left">
//                       <div className="font-medium text-foreground">
//                         {customer.first_name} {customer.last_name}
//                       </div>
//                       <div className="text-sm text-muted-foreground">
//                         {customer.customer_id}
//                       </div>
//                     </div>
//                   )}
//                 </TableCell>
//                 <TableCell>
//                   <a href={`mailto:${customer.email}`} className="text-primary hover:underline">
//                     {customer.email}
//                   </a>
//                 </TableCell>
//                 <TableCell>
//                   <PhoneDisplay phoneNumbers={(customer.phone_numbers as any) || []} />
//                 </TableCell>
//                 <TableCell>{getStatusBadge(customer.status)}</TableCell>
//                 <TableCell className="text-right">{customer.order_count || 0}</TableCell>
//                 <TableCell className="text-right">
//                   {formatCurrency(customer.total_spent)}
//                 </TableCell>
//                 <TableCell>
//                   {customer.last_order_date ? (
//                     <div className="text-sm">
//                       <div>{format(new Date(customer.last_order_date), "MMM d, yyyy")}</div>
//                       <div className="text-muted-foreground">
//                         {formatCurrency(customer.last_order_amount)}
//                       </div>
//                     </div>
//                   ) : (
//                     "-"
//                   )}
//                 </TableCell>
//                 <TableCell>
//                   {customer.last_subscription_date ? (
//                     <div className="text-sm">
//                       <Badge variant="default">Yes</Badge>
//                       <div className="text-muted-foreground mt-1">
//                         {format(new Date(customer.last_subscription_date), "MMM d")}
//                       </div>
//                     </div>
//                   ) : (
//                     <Badge variant="destructive">No</Badge>
//                   )}
//                 </TableCell>
//                 <TableCell>
//                   {customer.enrolling_affiliate ? (
//                     <button
//                       onClick={() => setEnrollingAffiliateToView({
//                         ...customer.enrolling_affiliate,
//                         enrolled_by: (customer.enrolling_affiliate as any).enrolled_by || null,
//                         email: "",
//                         phone: null,
//                         address: null,
//                         city: null,
//                         state_province: null,
//                         postal_code: null,
//                         country: "USA",
//                         site_name: null,
//                         teqnavi_enabled: false,
//                         status: "active",
//                         created_at: "",
//                       })}
//                       className="text-primary hover:underline text-left"
//                     >
//                       <div>{customer.enrolling_affiliate.first_name} {customer.enrolling_affiliate.last_name}</div>
//                       <div className="text-xs text-muted-foreground">{customer.enrolling_affiliate.affiliate_id}</div>
//                     </button>
//                   ) : <span className="text-muted-foreground">-</span>}
//                 </TableCell>
//                 <TableCell>
//                   <div className="flex items-center justify-end">
//                     <DropdownMenu>
//                       <DropdownMenuTrigger asChild>
//                         <Button variant="ghost" size="icon">
//                           <MoreVertical className="h-4 w-4" />
//                         </Button>
//                       </DropdownMenuTrigger>
//                       <DropdownMenuContent align="end">
//                         <DropdownMenuItem onClick={() => setEditingCustomer(customer)}>
//                           <Pencil className="h-4 w-4 mr-2" />
//                           View Customer
//                         </DropdownMenuItem>
//                         <DropdownMenuItem onClick={() => setViewingOrdersCustomer(customer)}>
//                           <ShoppingCart className="h-4 w-4 mr-2" />
//                           View Orders
//                         </DropdownMenuItem>
//                         <DropdownMenuItem onClick={() => setNotesCustomer(customer)}>
//                           <StickyNote className="h-4 w-4 mr-2" />
//                           Notes
//                         </DropdownMenuItem>
//                         {isAdmin && canEditCustomers && (
//                           <>
//                             <DropdownMenuItem onClick={() => {
//                               setCustomerToPromote(customer);
//                               setPromoteDialogOpen(true);
//                             }}>
//                               <UserPlus className="h-4 w-4 mr-2" />
//                               Promote to Affiliate
//                             </DropdownMenuItem>
//                             {(customer.order_count || 0) === 0 && (
//                               <DropdownMenuItem
//                                 onClick={() => {
//                                   if (confirm("Are you sure you want to delete this customer?")) {
//                                     deleteMutation.mutate(customer.id);
//                                   }
//                                 }}
//                                 className="text-destructive"
//                               >
//                                 <Trash2 className="h-4 w-4 mr-2" />
//                                 Delete
//                               </DropdownMenuItem>
//                             )}
//                           </>
//                         )}
//                       </DropdownMenuContent>
//                     </DropdownMenu>
//                   </div>
//                 </TableCell>
//               </TableRow>
//             ))}
//           </TableBody>
//         </Table>
//       </div>

//       {/* Pagination */}
//       {totalPages > 1 && (
//         <div className="flex items-center justify-between mt-4">
//           <div className="flex items-center gap-4">
//             <div className="text-sm text-muted-foreground">
//               Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, customers?.length || 0)} of {customers?.length || 0} customers
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
//                 <SelectTrigger className="w-[80px]">
//                   <SelectValue />
//                 </SelectTrigger>
//                 <SelectContent>
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
//             <div className="flex items-center gap-1">
//               {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
//                 <Button
//                   key={page}
//                   variant={currentPage === page ? "default" : "outline"}
//                   size="sm"
//                   onClick={() => setCurrentPage(page)}
//                   className="min-w-[2.5rem]"
//                 >
//                   {page}
//                 </Button>
//               ))}
//             </div>
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

//       {editingCustomer && (
//         <CustomerEditDialog
//           customer={editingCustomer}
//           open={!!editingCustomer}
//           onOpenChange={(open) => !open && setEditingCustomer(null)}
//           onBack={editingCustomer._fromNotes ? () => {
//             setNotesCustomer(editingCustomer);
//             setEditingCustomer(null);
//           } : undefined}
//           readOnly={isAffiliate}
//         />
//       )}

//       {viewingOrdersCustomer && (
//         <CustomerOrdersDialog
//           customer={viewingOrdersCustomer}
//           open={!!viewingOrdersCustomer}
//           onOpenChange={(open) => !open && setViewingOrdersCustomer(null)}
//           onBack={viewingOrdersCustomer._fromNotes ? () => {
//             setNotesCustomer(viewingOrdersCustomer);
//             setViewingOrdersCustomer(null);
//           } : undefined}
//         />
//       )}

//       <DuplicateCustomersDialog open={showDuplicates} onOpenChange={setShowDuplicates} />

//       {enrollingAffiliateToView && (
//         <AffiliateEditDialog
//           affiliate={enrollingAffiliateToView}
//           open={!!enrollingAffiliateToView}
//           onOpenChange={(open) => !open && setEnrollingAffiliateToView(null)}
//         />
//       )}

//       {notesCustomer && (
//         <NotesDialog
//           open={!!notesCustomer}
//           onOpenChange={(open) => !open && setNotesCustomer(null)}
//           entityId={notesCustomer.id}
//           entityType="customer"
//           entityName={`${notesCustomer.first_name} ${notesCustomer.last_name}`}
//           onViewEntity={() => {
//             setEditingCustomer({
//               ...notesCustomer,
//               _fromNotes: true
//             });
//             setNotesCustomer(null);
//           }}
//           onViewOrders={() => {
//             setViewingOrdersCustomer({
//               ...notesCustomer,
//               _fromNotes: true
//             });
//             setNotesCustomer(null);
//           }}
//         />
//       )}

//       {customerToPromote && (
//         <PromoteToAffiliateDialog
//           open={promoteDialogOpen}
//           onOpenChange={setPromoteDialogOpen}
//           customer={customerToPromote}
//           onSuccess={() => {
//             setPromoteDialogOpen(false);
//             setCustomerToPromote(null);
//           }}
//         />
//       )}
//     </div>
//   );
// }
// CustomerTable.tsx
import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getCustomers, deleteCustomer } from "@/api/customer";
import { useUserRole } from "@/hooks/use-user-role";
import { useModulePermissions } from "@/hooks/use-module-permissions";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, ShoppingCart, Search, Users, MoreVertical, X, ArrowUpDown, ArrowUp, ArrowDown, StickyNote, UserPlus, CalendarIcon, Loader2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { getStatusBadgeVariant, CustomerStatus } from "@/lib/badge-variants";
import { format } from "date-fns";
import { CustomerEditDialog } from "./customer-edit-dialog";
import { CustomerOrdersDialog } from "./customer-orders-dialog";
import { DuplicateCustomersDialog } from "./duplicate-customers-dialog";
import { AffiliateEditDialog } from "../affiliates/affiliate-edit-dialog";
import { NotesDialog } from "../shared/notes-dialog";
import { PhoneDisplay } from "../shared/phone-display";
import { PromoteToAffiliateDialog } from "./promote-to-affiliate-dialog";
import { formatCurrency, cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Customer } from "@/types"; // Make sure this exists!
import { useDateFormatStore } from "@/store/useDateFormat";
import { getDateFormatString } from "@/utils/resolveDateFormat";


export function CustomerTable() {
  // queryClient majorly used for invalidating queries
  const queryClient = useQueryClient();
  // state to store the search value
  const [searchTerm, setSearchTerm] = useState("");
  // state to store debounced search term
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  // state to store the DropDown value aside search bar
  const [status, setStatus] = useState<number>(0);
  // state to store the DropDown value on the left side of affiliate 
  const [quickFilter, setQuickFilter] = useState<string>("all");
  // state to store affiliate search
  const [affiliateSearch, setAffiliateSearch] = useState("");
  // state to store debounced affiliate search
  const [debouncedAffiliateSearch, setDebouncedAffiliateSearch] = useState("");
  // state to store the sorting parameter
  const [sortColumn, setSortColumn] = useState<"name" | "orders" | "spent" | "lastOrder" | "affiliate" | "status" | "subscription" | "selfCustomerId">("selfCustomerId");
  // state to store whether to sort in ascending or descending by sorting parameter
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  // state to store the customer being editted
  // const [editingCustomer, setEditingCustomer] = useState<Customer | null | any>(null);
  const [editingCustomer, setEditingCustomer] = useState<any | null>(null);
  // state to store the 
  const [viewingOrdersCustomer, setViewingOrdersCustomer] = useState<Customer | null>(null);
  // state to toggle Duplicates
  const [showDuplicates, setShowDuplicates] = useState(false);
  // state to store the enrolling affiliate being viewed
  const [enrollingAffiliateToView, setEnrollingAffiliateToView] = useState<any>(null);
  // state to store the customer notes being  viewed
  const [notesCustomer, setNotesCustomer] = useState<Customer | null>(null);
  // state to toggle the promote dialog
  const [promoteDialogOpen, setPromoteDialogOpen] = useState(false);
  // state to store the customer being promoted
  const [customerToPromote, setCustomerToPromote] = useState<Customer | null>(null);
  // state to store pagination value: page
  const [currentPage, setCurrentPage] = useState(1);
  // state to store pagination value: limit
  const [itemsPerPage, setItemsPerPage] = useState(25);
  // state to store the last order date range from
  const [lastOrderDateFrom, setLastOrderDateFrom] = useState<Date | undefined>();
  // state to store the last order date range to
  const [lastOrderDateTo, setLastOrderDateTo] = useState<Date | undefined>();
  // state to store the enrolled date from
  const [enrolledDateFrom, setEnrolledDateFrom] = useState<Date | undefined>();
  // state to store the enrolled date to
  const [enrolledDateTo, setEnrolledDateTo] = useState<Date | undefined>();
  // ref to store the customer ref
  const selectedCustomerRef = useRef<string | null>(null);
  // vars store whether the user is affiliate or admin
  const { isAffiliate, isAdmin } = useUserRole();
  // console.log("isAffliate : ", isAffiliate);
  // console.log("isAdmin : ", isAdmin);
  // hasPermission function to validate whether the user is allowed to perform a functionality or not
  const { hasPermission } = useModulePermissions();
  // var to store whether the user can update customer or not
  const canEditCustomers = hasPermission("module_permissions", "customers", "edit");

  const { dateFormatRegion, dateFormatVariant } = useDateFormatStore();
  const formatString = getDateFormatString(dateFormatRegion, dateFormatVariant);
  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearchTerm(searchTerm), 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedAffiliateSearch(affiliateSearch), 500);
    return () => clearTimeout(timer);
  }, [affiliateSearch]);


  // console.log("lastOrderDateFrom : ",lastOrderDateFrom);
  // console.log("lastOrderDateTo : ",lastOrderDateTo);
  const { data, isLoading } = useQuery({
    queryKey: [
      "customers",
      debouncedSearchTerm,
      status,
      quickFilter,
      debouncedAffiliateSearch,
      sortColumn,
      sortDirection,
      currentPage,
      itemsPerPage,
      lastOrderDateFrom?.toISOString().split("T")[0],
      lastOrderDateTo?.toISOString().split("T")[0],
      enrolledDateFrom?.toISOString().split("T")[0],
      enrolledDateTo?.toISOString().split("T")[0],

    ],
    queryFn: async () => {
      // setCurrentPage(1);
      const result = await getCustomers({
        search: debouncedSearchTerm || undefined,
        status: status || undefined,
        quickFilter: quickFilter === "all" ? undefined : quickFilter,
        affiliateSearch: debouncedAffiliateSearch || undefined,
        sortBy: sortColumn,
        sortOrder: sortDirection,
        page: currentPage,
        limit: itemsPerPage,
        lastOrderFrom: lastOrderDateFrom?.toISOString().split("T")[0],
        lastOrderTo: lastOrderDateTo?.toISOString().split("T")[0],
        enrolledFrom: enrolledDateFrom?.toISOString().split("T")[0],
        enrolledTo: enrolledDateTo?.toISOString().split("T")[0],

      })

      return result;
    },
  });

  // Reset page to 1 when any filter changes (but NOT when only page changes)
  useEffect(() => {
    setCurrentPage(1);
  }, [
    debouncedSearchTerm,
    status,
    quickFilter,
    debouncedAffiliateSearch,
    sortColumn,
    sortDirection,
    itemsPerPage,
    lastOrderDateFrom,
    lastOrderDateTo,
    enrolledDateFrom,
    enrolledDateTo,
  ]);

  // Now correctly extract from server response
  const customers = data?.data || [];
  const pagination = data?.pagination;
  const totalPages = pagination?.totalPages || 1;
  const totalCustomers = pagination?.total || 0;

  const deleteMutation = useMutation({
    mutationFn: (customerId: string) => deleteCustomer(customerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast.success("Customer moved to deleted folder");
    },
    onError: () => toast.error("Failed to delete customer"),
  });

  const getStatusBadge = (status: string) => {
    // Type assertion – we know the backend only returns valid statuses
    const validStatus = status as 1 | 2 | 3 | 4;
    return <Badge variant={getStatusBadgeVariant(validStatus)}>{status}</Badge>;
  };
  const clearFilters = () => {
    setSearchTerm("");
    setStatus(0);
    setQuickFilter("all");
    setAffiliateSearch("");
    setLastOrderDateFrom(undefined);
    setLastOrderDateTo(undefined);
    setEnrolledDateFrom(undefined);
    setEnrolledDateTo(undefined);
  };

  const hasActiveFilters =
    debouncedSearchTerm ||
    status !== 0 ||
    quickFilter !== "all" ||
    debouncedAffiliateSearch ||
    lastOrderDateFrom ||
    lastOrderDateTo ||
    enrolledDateFrom ||
    enrolledDateTo;

  // This function changes the sort column and sort direction conditionally along with
  const handleSort = (column: typeof sortColumn) => {
    setQuickFilter("all")
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("desc");
    }
    setCurrentPage(1);
  };

  const getSortIcon = (column: typeof sortColumn) => {
    if (sortColumn !== column) return <ArrowUpDown className="h-4 w-4 ml-1" />;
    return sortDirection === "asc" ? <ArrowUp className="h-4 w-4 ml-1" /> : <ArrowDown className="h-4 w-4 ml-1" />;
  };

  const getStatusValue = (incoming) => {
    let value = "all";

    if (incoming === 1) value = "active";
    if (incoming === 2) value = "inactive";
    if (incoming === 3) value = "cancelled";
    if (incoming === 4) value = "terminated";

    return value;
  }


  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-4">

        {/* Search Bar */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="customer-search"
            key="customer-search-input"
            placeholder="Search by name, email, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 focus-visible:ring-0 focus-visible:ring-offset-0"
            autoComplete="off"
          />
        </div>

        {/* Status Toggle */}
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-full md:w-[180px] focus:outline-none focus:ring-0 focus:ring-offset-0 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 border-gray-300">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={0}>All Status</SelectItem>
            <SelectItem value={1}>Active</SelectItem>
            <SelectItem value={2}>Inactive</SelectItem>
            <SelectItem value={3}>Cancelled</SelectItem>
            <SelectItem value={4}>Terminated</SelectItem>
          </SelectContent>
        </Select>

      </div>

      <div className="flex flex-col md:flex-row gap-4">

        {/* Quick Filter */}
        <Select value={quickFilter} onValueChange={setQuickFilter}>
          <SelectTrigger className="w-full md:w-[200px] focus:outline-none focus:ring-0 focus:ring-offset-0 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 border-gray-300">
            <SelectValue placeholder="Quick Filters" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Customers</SelectItem>
            <SelectItem value="topSpenders">Top Spenders</SelectItem>
            <SelectItem value="newMonth">New This Month</SelectItem>
            <SelectItem value="noOrders">No Orders Yet</SelectItem>
            <SelectItem value="inactiveNinety">Inactive 90+ Days</SelectItem>
          </SelectContent>
        </Select>

        {/* Enrolling affiliate filter */}
        <div className="relative flex-1 md:max-w-[300px] !outline-none">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="affiliate-search"
            key="affiliate-search-input"
            placeholder="Enrolling Affiliate (search name)..."
            value={affiliateSearch}
            onChange={(e) => setAffiliateSearch(e.target.value)}
            className="pl-10 focus-visible:ring-0 focus-visible:ring-offset-0"
            autoComplete="off"
          />
        </div>

        {/* Show Duplicate filter */}
        <div className="flex gap-2 flex-wrap">
          {!isAffiliate && (
            <Button className=" focus-visible:ring-0 focus-visible:ring-offset-0" variant="outline" onClick={() => setShowDuplicates(true)}>
              <Users className="h-4 w-4 mr-2" />
              Find Duplicates
            </Button>
          )}

          {hasActiveFilters && (
            <Button variant="ghost" onClick={clearFilters}>
              <X className="h-4 w-4 mr-2" />
              Clear Filters
            </Button>
          )}
        </div>
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
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {lastOrderDateFrom ? format(lastOrderDateFrom, formatString) : "From"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  selected={lastOrderDateFrom}
                  className="pointer-events-auto"
                  formatString={formatString}
                  initialFocus
                  mode="single"
                  onSelect={setLastOrderDateFrom}
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
                  {lastOrderDateTo ? format(lastOrderDateTo, formatString) : "To"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  formatString={formatString}
                  mode="single"
                  selected={lastOrderDateTo}
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
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {enrolledDateFrom ? format(enrolledDateFrom, formatString) : "From"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  formatString={formatString}
                  mode="single"
                  selected={enrolledDateFrom}
                  onSelect={setEnrolledDateFrom}
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
                    "justify-start text-left font-normal flex-1 focus-visible:ring-0 focus-visible:ring-offset-0",
                    !enrolledDateTo && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {enrolledDateTo ? format(enrolledDateTo, formatString) : "To"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  formatString={formatString}
                  mode="single"
                  selected={enrolledDateTo}
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
        {customers?.map((customer) => (
          <div key={customer._id} className="bg-card border rounded-lg p-4 space-y-3">
            <div className="flex justify-between items-start">
              <div>
                {(isAdmin || isAffiliate) ? (
                  <button
                    onClick={() => setEditingCustomer(customer)}
                    className="text-left"
                  >
                    <div className="font-medium text-foreground hover:text-primary transition-colors">
                      {customer.firstName} {customer.lastName}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {customer.selfCustomerId}
                    </div>
                  </button>
                ) : (
                  <div className="text-left">
                    <div className="font-medium text-foreground">
                      {customer.firstName} {customer.lastName}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {customer.selfCustomerId}
                    </div>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 capitalize">
                {/* status__change */}
                <Badge variant={getStatusBadgeVariant(getStatusValue(customer.status))}>{getStatusValue(customer.status)}</Badge>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setEditingCustomer(customer)}>
                      <Pencil className="h-4 w-4 mr-2" />
                      View Customer
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setViewingOrdersCustomer(customer)}>
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      View Orders
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setNotesCustomer(customer)}>
                      <StickyNote className="h-4 w-4 mr-2" />
                      Notes
                    </DropdownMenuItem>
                    {isAdmin && canEditCustomers && (
                      <>
                        <DropdownMenuItem onClick={() => {
                          setCustomerToPromote(customer);
                          setPromoteDialogOpen(true);
                        }}>
                          <UserPlus className="h-4 w-4 mr-2" />
                          Promote to Affiliate
                        </DropdownMenuItem>
                        {(customer.order_count || 0) === 0 && (
                          <DropdownMenuItem
                            onClick={() => {
                              if (confirm("Are you sure you want to delete this customer?")) {
                                deleteMutation.mutate(customer._id);
                              }
                            }}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        )}
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">Email/Phone:</span>
                <a href={`mailto:${customer.email}`} className="text-primary hover:underline block text-xs">
                  {customer.email}
                </a>
                <div>
                  <PhoneDisplay phoneNumbers={(customer.phoneNumbers as any) || []} />
                </div>
              </div>

              <div>
                <span className="text-muted-foreground">Orders:</span>
                <p className="font-medium">{customer.orderCount || 0}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Total Spent:</span>
                <p className="font-medium">{formatCurrency(customer.totalSpent)}</p>
              </div>
            </div>

            {customer.lastOrderDate && (
              <div className="border-t pt-2 text-sm">
                <span className="text-muted-foreground">Last Order:</span>
                <div className="font-medium">
                  {format(new Date(customer.lastOrderDate), formatString)} - {formatCurrency(customer.lastOrderAmount)}
                </div>
              </div>
            )}

            <div className="border-t pt-2 text-sm">
              <span className="text-muted-foreground">Subscription:</span>
              <div className="font-medium flex items-center gap-2 mt-1">
                <Badge variant={customer.lastSubscriptionDate ? "default" : "destructive"}>
                  {customer.lastSubscriptionDate ? "Yes" : "No"}
                </Badge>
                {customer.lastSubscriptionDate && (
                  <span className="text-muted-foreground text-xs">
                    ({format(new Date(customer.lastSubscriptionDate), formatString)})
                  </span>
                )}
              </div>
            </div>

            {!isAffiliate && customer.enrollingAffiliate && (
              <div className="border-t pt-2">
                <span className="text-muted-foreground text-sm">Enrolled by:</span>
                <button
                  onClick={() => setEnrollingAffiliateToView({
                    ...customer.enrollingAffiliate,
                    enrolled_by: (customer.enrollingAffiliate as any).enrolledBy || null,
                    email: "",
                    phone: null,
                    address: null,
                    cityTown: null,
                    stateProvince: null,
                    zipPostal: null,
                    country: "USA",
                    siteName: null,
                    teqnaviEnabled: false,
                    status: "active",
                    createdAt: "",
                  })}
                  className="text-primary hover:underline text-left block"
                >
                  {customer.enrollingAffiliate.firstName} {customer.enrollingAffiliate.lastName}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Desktop Table View */}
      <div className="hidden lg:block border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
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
              <TableHead>
                <button
                  onClick={() => handleSort("status")}
                  className="flex items-center hover:text-foreground transition-colors"
                >
                  Status
                  {getSortIcon("status")}
                </button>
              </TableHead>
              <TableHead className="text-right">
                <button
                  onClick={() => handleSort("orders")}
                  className="flex items-center ml-auto hover:text-foreground transition-colors"
                >
                  # Orders
                  {getSortIcon("orders")}
                </button>
              </TableHead>
              <TableHead className="text-right">
                <button
                  onClick={() => handleSort("spent")}
                  className="flex items-center ml-auto hover:text-foreground transition-colors"
                >
                  Total Purchased
                  {getSortIcon("spent")}
                </button>
              </TableHead>
              <TableHead>
                <button
                  onClick={() => handleSort("lastOrder")}
                  className="flex items-center hover:text-foreground transition-colors"
                >
                  Last Order
                  {getSortIcon("lastOrder")}
                </button>
              </TableHead>
              <TableHead>
                <button
                  onClick={() => handleSort("subscription")}
                  className="flex items-center hover:text-foreground transition-colors"
                >
                  Subscription
                  {getSortIcon("subscription")}
                </button>
              </TableHead>

              {
                !isAffiliate && (
                  <TableHead>
                    <button
                      onClick={() => handleSort("affiliate")}
                      className="flex items-center hover:text-foreground transition-colors"
                    >
                      Enrolled by
                      {getSortIcon("affiliate")}
                    </button>
                  </TableHead>
                )
              }

              {/* <TableHead className="text-right">
                <button
                  onClick={() => handleSort("affiliate")}
                  className="flex items-center hover:text-foreground transition-colors"
                >
                  Enrollement Date
                  {getSortIcon("enrollmentDate")}
                </button>
              </TableHead> */}
              <TableHead className="text-right">
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {!isLoading ? (customers.length !== 0 ? customers?.map((customer) => (
              <TableRow key={customer._id}>
                <TableCell>
                  {(isAdmin || isAffiliate) ? (
                    <button
                      onClick={() => {
                        selectedCustomerRef.current = customer._id;

                        setEditingCustomer(customer)
                      }}
                      className="text-left"
                    >
                      <div className="font-medium text-foreground hover:text-primary transition-colors">
                        {customer.firstName} {customer.lastName}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {customer.selfCustomerId}
                      </div>
                    </button>
                  ) : (
                    <div className="text-left">
                      <div className="font-medium text-foreground">
                        {customer.firstName} {customer.lastName}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {customer.selfCustomerId}
                      </div>
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <a href={`mailto:${customer.email}`} className="text-primary hover:underline">
                    {customer.email}
                  </a>
                  <div>
                    <PhoneDisplay phoneNumbers={(customer.phoneNumbers as any) || []} />
                  </div>
                </TableCell>
                {/* <TableCell>
                  <PhoneDisplay phoneNumbers={(customer.phoneNumbers as any) || []} />
                </TableCell> */}
                <TableCell className="capitalize"><Badge variant={getStatusBadgeVariant(getStatusValue(customer.status))}>{getStatusValue(customer.status)}</Badge></TableCell>
                {/* status__change */}
                <TableCell className="text-right">{customer.orderCount || 0}</TableCell>
                <TableCell className="text-right">
                  {formatCurrency(customer.totalSpent)}
                </TableCell>
                <TableCell>
                  {customer.lastOrderDate ? (
                    <div className="text-sm">
                      <div>{customer.lastOrderDate && format(new Date(customer.lastOrderDate), formatString)}</div>
                      <div className="text-muted-foreground">
                        {formatCurrency(customer.lastOrderAmount)}
                      </div>
                    </div>
                  ) : (
                    "-"
                  )}
                </TableCell>
                <TableCell>
                  {customer?.lastSubscriptionDate ? (
                    <div className="text-sm">
                      <Badge variant="default">Yes</Badge>
                      <div className="text-muted-foreground mt-1">
                        {format(new Date(customer?.lastSubscriptionDate), formatString)}
                      </div>
                    </div>
                  ) : (
                    <Badge variant="destructive">No</Badge>
                  )}
                </TableCell>

                {!isAffiliate && (
                  <TableCell>
                    {customer?.enrollingAffiliate ? (
                      <button
                        onClick={() => setEnrollingAffiliateToView({
                          ...customer.enrollingAffiliate,
                          enrolledBy: (customer.enrollingAffiliate as any).enrolledBy || null,
                          email: "",
                          phone: null,
                          address: null,
                          cityTown: null,
                          stateProvince: null,
                          zipPostal: null,
                          country: "USA",
                          siteName: null,
                          teqnaviEnabled: false,
                          status: "active",
                          createdAt: "",
                        })}
                        className="text-primary hover:underline text-left"
                      >
                        <div>{customer.enrollingAffiliate.firstName} {customer.enrollingAffiliate.lastName}</div>
                        <div className="text-xs text-muted-foreground">{customer.enrollingAffiliate.affiliateId}</div>
                      </button>
                    ) : <span className="text-muted-foreground">-</span>}
                  </TableCell>
                )}

                {/* <TableCell className="text-center">

                  {format(new Date(customer.enrollmentDate), formatString)}

                </TableCell> */}
                <TableCell>
                  <div className="flex items-center justify-end">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => {
                          selectedCustomerRef.current = customer._id
                          setEditingCustomer(customer)
                        }}>
                          <Pencil className="h-4 w-4 mr-2" />
                          View Customer
                        </DropdownMenuItem>
                        {/* revert back on order_complete */}

                        <DropdownMenuItem onClick={() => {
                          selectedCustomerRef.current = customer._id
                          setViewingOrdersCustomer(customer)
                        }}>
                          <ShoppingCart className="h-4 w-4 mr-2" />
                          View Orders
                        </DropdownMenuItem>

                        <DropdownMenuItem onClick={() => {
                          selectedCustomerRef.current = customer._id
                          setNotesCustomer(customer)
                        }}>
                          <StickyNote className="h-4 w-4 mr-2" />
                          Notes
                        </DropdownMenuItem>
                        {isAdmin && canEditCustomers && (
                          <>
                            <DropdownMenuItem onClick={() => {
                              setCustomerToPromote(customer);
                              setPromoteDialogOpen(true);
                            }}>
                              <UserPlus className="h-4 w-4 mr-2" />
                              Promote to Affiliate
                            </DropdownMenuItem>
                            {(customer.orderCount || 0) === 0 && (
                              <DropdownMenuItem
                                onClick={() => {
                                  if (confirm("Are you sure you want to delete this customer?")) {
                                    deleteMutation.mutate(customer._id);
                                  }
                                }}
                                className="text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            )}
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>
              </TableRow>
            )) : (
              <TableRow>
                <TableCell colSpan={10} className="text-center text-muted-foreground py-8">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No customers found in downline</p>
                </TableCell>
              </TableRow>
            )) : (
              <TableRow>
                <TableCell colSpan={10} className="h-64 text-center"> {/* Adjust colSpan to match your columns */}
                  <div className="flex flex-col items-center justify-center space-y-4">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    <p className="text-muted-foreground">Loading customers...</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {/* {true && ( */}
      {(customers?.length || 0) > 0 && (
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center gap-4">
            <div className="text-sm text-muted-foreground">
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, data?.pagination?.total || 0)} of {data?.pagination?.total || 0} customers
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
                <SelectTrigger className="w-[80px] focus:outline-none focus:ring-0 focus:ring-offset-0 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 border-gray-300">
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
            {/* Buttons for jumping to pages quickly */}
            {/* 
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
             */}
            {/* Buttons end */}
            {/* Smart pagination – only what you asked for, all inline */}
            <div className="flex items-center gap-1">
              {(() => {
                const pages: (number | string)[] = [];

                if (totalPages <= 5) {
                  // show all when ≤7 pages
                  for (let i = 1; i <= totalPages; i++) pages.push(i);
                } else {
                  // always show page 1
                  pages.push(1);

                  // left side
                  if (currentPage > 3) {
                    pages.push("...");
                  }

                  // near start
                  if (currentPage < 3) {
                    for (let i = 2; i <= 5; i++) pages.push(i);
                  }

                  // near end
                  else if (currentPage >= totalPages - 3) {
                    for (let i = totalPages - 4; i <= totalPages - 1; i++) pages.push(i);
                  }
                  // middle
                  else {
                    pages.push(currentPage - 1);
                    pages.push(currentPage);
                    pages.push(currentPage + 1);
                  }

                  // right ellipsis
                  if (currentPage < totalPages - 3) {
                    pages.push("...");
                  }

                  // always show last page (unless already added)
                  // if (currentPage < totalPages - 3 || totalPages <= 7) {
                  // }
                  pages.push(totalPages);
                }

                return pages.map((p, idx) =>
                  p === "..." ? (
                    <span key={`dots-${idx}`} className="px-3 py-2 text-muted-foreground">
                      ...
                    </span>
                  ) : (
                    <Button
                      key={p}
                      variant={currentPage === p ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(p as number)}
                      className="min-w-[2.5rem]"
                    >
                      {p}
                    </Button>
                  )
                );
              })()}
            </div>

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

      {editingCustomer && (
        <CustomerEditDialog
          customer={editingCustomer}
          open={!!editingCustomer}
          onOpenChange={(open) => !open && setEditingCustomer(null)}
          onBack={editingCustomer._fromNotes ? () => {
            setNotesCustomer(editingCustomer);
            setEditingCustomer(null);
          } : undefined}
          readOnly={isAffiliate}
          customerId={selectedCustomerRef.current}
        />
      )}

      {viewingOrdersCustomer && (
        <CustomerOrdersDialog
          customer={viewingOrdersCustomer}
          customerId={viewingOrdersCustomer.selfCustomerId}
          open={!!viewingOrdersCustomer}
          onOpenChange={(open) => !open && setViewingOrdersCustomer(null)}
          onBack={viewingOrdersCustomer._fromNotes ? () => {
            setNotesCustomer(viewingOrdersCustomer);
            setViewingOrdersCustomer(null);
          } : undefined}
        />
      )}

      <DuplicateCustomersDialog open={showDuplicates} onOpenChange={setShowDuplicates} />

      {enrollingAffiliateToView && (
        <AffiliateEditDialog
          affiliateMongoId={enrollingAffiliateToView._id}
          affiliate={enrollingAffiliateToView}
          open={!!enrollingAffiliateToView}
          onOpenChange={(open) => !open && setEnrollingAffiliateToView(null)}
        />
      )}

      {notesCustomer && (
        <NotesDialog
          open={!!notesCustomer}
          onOpenChange={(open) => !open && setNotesCustomer(null)}
          entityId={notesCustomer._id}
          entityType="customer"
          entityName={`${notesCustomer.firstName} ${notesCustomer.lastName}`}
          onViewEntity={() => {
            setEditingCustomer({
              ...notesCustomer,
              _fromNotes: true
            });
            setNotesCustomer(null);
          }}
          onViewOrders={() => {
            setViewingOrdersCustomer({
              ...notesCustomer,
              _fromNotes: true
            });
            setNotesCustomer(null);
          }}
        />
      )}

      {customerToPromote && (
        <PromoteToAffiliateDialog
          open={promoteDialogOpen}
          onOpenChange={setPromoteDialogOpen}
          customer={customerToPromote}
          onSuccess={() => {
            setPromoteDialogOpen(false);
            setCustomerToPromote(null);
          }}
        />
      )}
    </div>
  );
}
