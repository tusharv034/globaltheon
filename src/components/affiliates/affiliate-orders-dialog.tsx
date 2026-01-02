// import { useState } from "react";
// import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
// import { supabase } from "@/integrations/supabase/client";
// import { useUserRole } from "@/hooks/use-user-role";
// import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
// import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
// import { Badge } from "@/components/ui/badge";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { format } from "date-fns";
// import { Eye, Search, ArrowLeft, MoreVertical, Trash2, StickyNote, Pencil, ExternalLink, ShoppingCart } from "lucide-react";
// import { OrderDetailDialog } from "../customers/order-detail-dialog";
// import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
// import { NotesDialog } from "../shared/notes-dialog";
// import { toast } from "sonner";
// import { formatCurrency } from "@/lib/utils";

// interface Affiliate {
//   id: string;
//   affiliate_id: string;
//   first_name: string;
//   last_name: string;
//   email?: string | null;
// }

// interface AffiliateOrdersDialogProps {
//   affiliate: Affiliate;
//   open: boolean;
//   onOpenChange: (open: boolean) => void;
//   onBack?: () => void;
// }

// export function AffiliateOrdersDialog({ affiliate, open, onOpenChange, onBack }: AffiliateOrdersDialogProps) {
//   const queryClient = useQueryClient();
//   const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
//   const [notesOrderId, setNotesOrderId] = useState<string | null>(null);
//   const [notesOrderNumber, setNotesOrderNumber] = useState<string>("");
//   const [searchTerm, setSearchTerm] = useState("");
//   const [startDate, setStartDate] = useState("");
//   const [endDate, setEndDate] = useState("");

//   const { isAdmin, isAffiliate } = useUserRole();

//   const { data: orders, isLoading } = useQuery({
//     queryKey: ["affiliate-orders", affiliate.id],
//     queryFn: async () => {
//       // Get customers: (1) enrolled by this affiliate (downline) and (2) the affiliate themselves as a customer (by email)
//       const [{ data: downline, error: downlineError }, { data: selfRows, error: selfError }] = await Promise.all([
//         supabase.from("customers").select("id").eq("enrolled_by", affiliate.id),
//         affiliate.email ? supabase.from("customers").select("id").eq("email", affiliate.email).limit(1) : Promise.resolve({ data: [], error: null } as any)
//       ]);

//       if (downlineError) throw downlineError;
//       if (selfError) throw selfError;

//       const customerIds = [
//         ...(downline || []).map((c: any) => c.id),
//         ...((selfRows as any) || []).map((c: any) => c.id),
//       ].filter(Boolean);

//       if (customerIds.length === 0) {
//         return [];
//       }

//       // Get orders for those customers (including affiliate's own purchases)
//       const { data, error } = await supabase
//         .from("orders")
//         .select("*")
//         .in("customer_id", customerIds)
//         .order("order_date", { ascending: false });

//       if (error) throw error;
//       return data;
//     },
//     enabled: open,
//   });

//   // Filter orders based on search criteria
//   const filteredOrders = orders?.filter((order) => {
//     let matches = true;

//     // Filter by order number
//     if (searchTerm) {
//       matches = matches && order.order_number.toLowerCase().includes(searchTerm.toLowerCase());
//     }

//     // Filter by date range
//     if (startDate) {
//       matches = matches && new Date(order.order_date) >= new Date(startDate);
//     }
//     if (endDate) {
//       const endDateTime = new Date(endDate);
//       endDateTime.setHours(23, 59, 59, 999);
//       matches = matches && new Date(order.order_date) <= endDateTime;
//     }

//     return matches;
//   });

//   const getStatusBadge = (status: string) => {
//     const statusColors: Record<string, { bg: string; text: string }> = {
//       Accepted: { bg: "#28A745", text: "#FFFFFF" },
//       Printed: { bg: "#007BFF", text: "#FFFFFF" },
//       Shipped: { bg: "#6F42C1", text: "#FFFFFF" },
//       Cancelled: { bg: "#DC3545", text: "#FFFFFF" },
//       Refunded: { bg: "#FD7E14", text: "#FFFFFF" },
//     };

//     const colors = statusColors[status] || { bg: "#6B7280", text: "#FFFFFF" };

//     return (
//       <Badge 
//         className="w-24 justify-center" 
//         style={{ 
//           backgroundColor: colors.bg, 
//           color: colors.text,
//           borderColor: colors.bg
//         }}
//       >
//         {status}
//       </Badge>
//     );
//   };

//   const deleteMutation = useMutation({
//     mutationFn: async (orderId: string) => {
//       const { data: { user } } = await supabase.auth.getUser();
//       if (!user) throw new Error("User not authenticated");

//       const { error } = await supabase
//         .from("orders")
//         .update({ 
//           deleted_at: new Date().toISOString(),
//           deleted_by: user.id
//         })
//         .eq("id", orderId);
//       if (error) throw error;
//     },
//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: ["affiliate-orders"] });
//       toast.success("Order moved to deleted folder");
//     },
//     onError: () => {
//       toast.error("Failed to delete order");
//     },
//   });

//   return (
//     <Dialog open={open} onOpenChange={onOpenChange}>
//       <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
//         <DialogHeader>
//           <div className="flex items-center gap-2">
//             {onBack && (
//               <Button
//                 variant="ghost"
//                 size="icon"
//                 onClick={onBack}
//                 className="h-8 w-8"
//               >
//                 <ArrowLeft className="h-4 w-4" />
//               </Button>
//             )}
//             <DialogTitle>
//               Orders for Affiliate: {affiliate.first_name} {affiliate.last_name}
//             </DialogTitle>
//           </div>
//         </DialogHeader>

//         <div className="space-y-4">
//           <div className="flex gap-4 items-end">
//             <div className="flex-1">
//               <label className="text-sm font-medium mb-2 block">Search by Order Number</label>
//               <div className="relative">
//                 <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
//                 <Input
//                   placeholder="Enter order number..."
//                   value={searchTerm}
//                   onChange={(e) => setSearchTerm(e.target.value)}
//                   className="pl-9"
//                 />
//               </div>
//             </div>
//             <div>
//               <label className="text-sm font-medium mb-2 block">Start Date</label>
//               <Input
//                 type="date"
//                 value={startDate}
//                 onChange={(e) => setStartDate(e.target.value)}
//               />
//             </div>
//             <div>
//               <label className="text-sm font-medium mb-2 block">End Date</label>
//               <Input
//                 type="date"
//                 value={endDate}
//                 onChange={(e) => setEndDate(e.target.value)}
//               />
//             </div>
//             {(searchTerm || startDate || endDate) && (
//               <Button
//                 variant="outline"
//                 onClick={() => {
//                   setSearchTerm("");
//                   setStartDate("");
//                   setEndDate("");
//                 }}
//               >
//                 Clear
//               </Button>
//             )}
//           </div>

//           {isLoading ? (
//             <div className="text-center py-8">Loading orders...</div>
//           ) : filteredOrders && filteredOrders.length > 0 ? (
//             <div className="border rounded-lg">
//               <Table>
//                 <TableHeader>
//                   <TableRow>
//                     <TableHead>Order Number</TableHead>
//                     <TableHead>Date</TableHead>
//                     <TableHead className="text-right">Amount</TableHead>
//                     <TableHead>Subscription</TableHead>
//                     <TableHead>Status</TableHead>
//                     <TableHead>Shopify Order #</TableHead>
//                     <TableHead className="text-right">Actions</TableHead>
//                   </TableRow>
//                 </TableHeader>
//                 <TableBody>
//                   {filteredOrders.map((order) => (
//                     <TableRow key={order.id}>
//                       <TableCell className="font-medium">{order.order_number}</TableCell>
//                       <TableCell>{format(new Date(order.order_date), "MMM d, yyyy h:mm a")}</TableCell>
//                       <TableCell className="text-right">{formatCurrency(order.amount)}</TableCell>
//                       <TableCell>{order.subscription ? "Yes" : "No"}</TableCell>
//                       <TableCell>{getStatusBadge(order.status)}</TableCell>
//                       <TableCell>{(order as any).shopify_order_number || "-"}</TableCell>
//                       <TableCell className="text-right">
//                         <DropdownMenu>
//                           <DropdownMenuTrigger asChild>
//                             <Button variant="ghost" size="icon">
//                               <MoreVertical className="h-4 w-4" />
//                             </Button>
//                           </DropdownMenuTrigger>
//                           <DropdownMenuContent align="end" className="bg-popover z-50">
//                             <DropdownMenuItem onClick={() => setSelectedOrderId(order.id)}>
//                               <Eye className="h-4 w-4 mr-2" />
//                               View
//                             </DropdownMenuItem>
//                             {isAdmin && (
//                               <>
//                                 <DropdownMenuItem onClick={() => {
//                                   window.open(`https://admin.shopify.com/store/theonglobal/orders/${order.order_number}`, '_blank');
//                                 }}>
//                                   <ShoppingCart className="h-4 w-4 mr-2" />
//                                   View in Shopify
//                                 </DropdownMenuItem>
//                               </>
//                             )}
//                             <DropdownMenuItem onClick={() => {
//                               setNotesOrderId(order.id);
//                               setNotesOrderNumber(order.order_number);
//                             }}>
//                               <StickyNote className="h-4 w-4 mr-2" />
//                               Notes
//                             </DropdownMenuItem>
//                             {isAdmin && (
//                               <DropdownMenuItem
//                                 onClick={() => {
//                                   if (confirm("Are you sure you want to delete this order?")) {
//                                     deleteMutation.mutate(order.id);
//                                   }
//                                 }}
//                                 className="text-destructive"
//                               >
//                                 <Trash2 className="h-4 w-4 mr-2" />
//                                 Delete
//                               </DropdownMenuItem>
//                             )}
//                           </DropdownMenuContent>
//                         </DropdownMenu>
//                       </TableCell>
//                     </TableRow>
//                   ))}
//                 </TableBody>
//               </Table>
//             </div>
//           ) : orders && orders.length > 0 ? (
//             <div className="text-center py-8 text-muted-foreground">
//               No orders match your search criteria.
//             </div>
//           ) : (
//             <div className="text-center py-8 text-muted-foreground">
//               No orders found for this affiliate's customers.
//             </div>
//           )}
//         </div>
//       </DialogContent>

//       {selectedOrderId && (
//         <OrderDetailDialog
//           orderId={selectedOrderId}
//           open={!!selectedOrderId}
//           onOpenChange={(open) => !open && setSelectedOrderId(null)}
//           // onOpenChange={(open) => true}
//         />
//       )}

//       {notesOrderId && (
//         <NotesDialog
//           open={!!notesOrderId}
//           onOpenChange={(open) => !open && setNotesOrderId(null)}
//           entityId={notesOrderId}
//           entityType="order"
//           entityName={`Order ${notesOrderNumber}`}
//         />
//       )}
//     </Dialog>
//   );
// }

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useUserRole } from "@/hooks/use-user-role";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { Eye, Search, ArrowLeft, MoreVertical, StickyNote, ShoppingCart, Trash2, CalendarIcon } from "lucide-react";
import { OrderDetailDialog } from "../customers/order-detail-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { NotesDialog } from "../shared/notes-dialog";
import { toast } from "sonner";
import { formatCurrency, cn } from "@/lib/utils";
import { deleteOrder, getAffiliateOrders } from "@/api/orders";
import { useDateFormatStore } from "@/store/useDateFormat";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useShopifyStore } from "@/store/useAuthStore";
import { getDateFormatString } from "@/utils/resolveDateFormat";

interface AffiliateOrdersDialogProps {
  affiliateId: string;
  affiliate: { first_name: string; last_name: string };
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBack?: () => void;
}

export function AffiliateOrdersDialog({
  affiliateId,
  affiliate,
  open,
  onOpenChange,
  onBack,
}: AffiliateOrdersDialogProps) {
  const queryClient = useQueryClient();
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [selectedOrderType, setSelectedOrderType] = useState<string | null>(null);
  const [notesOrderId, setNotesOrderId] = useState<string | null>(null);
  const [notesOrderNumber, setNotesOrderNumber] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [limit, setLimit] = useState(5);
  const [page, setPage] = useState(1);
  const shopifyUrl = useShopifyStore((state) => state.shopifyUrl);
  const { dateFormatRegion, dateFormatVariant } = useDateFormatStore();
  const formatString = getDateFormatString(dateFormatRegion, dateFormatVariant);
  const { isAdmin } = useUserRole();

  const {
    data: response,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["affiliateOrders", affiliateId, page, debouncedSearchTerm, startDate, endDate, limit],
    queryFn: () =>
      getAffiliateOrders(affiliateId, {
        page,
        limit,
        orderId: debouncedSearchTerm || undefined,
        startDate: startDate ? format(startDate, "yyyy-MM-dd") : undefined,
        endDate: endDate ? format(endDate, "yyyy-MM-dd") : undefined,
      }),
    enabled: open && !!affiliateId,
  });

  const orders = response?.data?.orders || [];
  const pagination = response?.data?.pagination;

  const getStatusBadge = (status: number) => {
    const statusColors: Record<number, { label: string; bg: string; text: string }> = {
      0: { label: "Pending", bg: "#FFC107", text: "#000000" },
      1: { label: "Accepted", bg: "#28A745", text: "#FFFFFF" },
      2: { label: "Paid", bg: "#007BFF", text: "#FFFFFF" },
      3: { label: "Fulfilled", bg: "#6F42C1", text: "#FFFFFF" },
      4: { label: "Refunded", bg: "#FD7E14", text: "#FFFFFF" },
      5: { label: "Cancelled", bg: "#DC3545", text: "#FFFFFF" },
    };

    const { label, bg, text } = statusColors[status] || {
      label: "Unknown",
      bg: "#6B7280",
      text: "#FFFFFF",
    };

    return (
      <Badge
        className="w-24 justify-center font-medium"
        style={{
          backgroundColor: bg,
          color: text,
          borderColor: bg,
        }}
      >
        {label}
      </Badge>
    );
  };

  const deleteMutation = useMutation({
    mutationFn: (orderId: string) => deleteOrder(orderId),
    onSuccess: () => {
      setPage(1);
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["customer-orders"] });
      queryClient.invalidateQueries({ queryKey: ["customer-orders-edit-dialog"] });
      queryClient.invalidateQueries({ queryKey: ["affiliateOrders"] });
      toast.success("Order deleted successfully");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to delete order");
      console.error("Delete order error:", error);
    },
  });

  const handleClearFilters = () => {
    setSearchTerm("");
    setStartDate(undefined);
    setEndDate(undefined);
    setPage(1);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            {onBack && (
              <Button variant="ghost" size="icon" onClick={onBack} className="h-8 w-8">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <DialogTitle>
              Orders for Affiliate: {affiliate.first_name} {affiliate.last_name}
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Filters */}
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Search by Order Number</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Enter order number..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setPage(1);
                  }}
                  className="pl-9"
                />
              </div>
            </div>
            
            {/* Start Date Picker */}
            <div>
              <label className="text-sm font-medium mb-2 block">From Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-[200px] justify-start text-left font-normal",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, formatString) : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={(date) => {
                      setStartDate(date);
                      setPage(1);
                    }}
                    formatString={formatString}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* End Date Picker */}
            <div>
              <label className="text-sm font-medium mb-2 block">To Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-[200px] justify-start text-left font-normal",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, formatString) : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={(date) => {
                      setEndDate(date);
                      setPage(1);
                    }}
                    formatString={formatString}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {(searchTerm || startDate || endDate) && (
              <Button variant="outline" onClick={handleClearFilters}>
                Clear
              </Button>
            )}
          </div>

          {/* Content */}
          {isLoading ? (
            <div className="text-center py-8">Loading orders...</div>
          ) : isError ? (
            <div className="text-center py-8 text-destructive">Failed to load orders</div>
          ) : orders.length > 0 ? (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order Number</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Subscription</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Shopify Order #</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order: any) => (
                    <TableRow key={order._id}>
                      <TableCell className="font-medium">{order.orderId}</TableCell>
                      <TableCell>{format(new Date(order.orderDate), `${formatString} h:mm a`)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(order.amount)}</TableCell>
                      <TableCell>{order.subscription ? "Yes" : "No"}</TableCell>
                      <TableCell>{getStatusBadge(order.orderStatus)}</TableCell>
                      <TableCell>{order.shopifyOrderId || "-"}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-popover z-50">
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedOrderId(order._id);
                                setSelectedOrderType(order.orderBy);
                              }}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View
                            </DropdownMenuItem>

                            {isAdmin && order.shopifyOrderId && (
                              <DropdownMenuItem
                                onClick={() =>
                                  window.open(
                                    `${shopifyUrl}/orders/${order.shopifyOrderId}`,
                                    "_blank"
                                  )
                                }
                              >
                                <ShoppingCart className="h-4 w-4 mr-2" />
                                View in Shopify
                              </DropdownMenuItem>
                            )}

                            <DropdownMenuItem
                              onClick={() => {
                                setNotesOrderId(order._id);
                                setNotesOrderNumber(order.orderId);
                              }}
                            >
                              <StickyNote className="h-4 w-4 mr-2" />
                              Notes
                            </DropdownMenuItem>
                            {isAdmin && (
                              <DropdownMenuItem
                                onClick={() => {
                                  if (confirm("Are you sure you want to delete this order?")) {
                                    deleteMutation.mutate(order._id);
                                  }
                                }}
                                className="text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No orders found for this affiliate's customers.
            </div>
          )}

          {/* Pagination */}
          {pagination && pagination.total > 0 && (
            <div className="flex items-center justify-between mt-6">
              <div className="flex items-center gap-6">
                <div className="text-sm text-muted-foreground">
                  Showing {((pagination.page - 1) * pagination.limit) + 1} to{" "}
                  {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
                  {pagination.total} order{pagination.total !== 1 ? "s" : ""}
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
                      <SelectItem value="5">5</SelectItem>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="25">25</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={!pagination.hasPrev}
                >
                  Previous
                </Button>

                {pagination.totalPages > 1 && (
                  <div className="flex items-center gap-1">
                    {(() => {
                      const pages = [];
                      const current = pagination.page;
                      const total = pagination.totalPages;

                      let startPage = Math.max(1, current - 2);
                      let endPage = Math.min(total, current + 2);

                      if (current <= 3) {
                        endPage = Math.min(total, 5);
                      }
                      if (current >= total - 2) {
                        startPage = Math.max(1, total - 4);
                      }

                      for (let i = startPage; i <= endPage; i++) {
                        pages.push(
                          <Button
                            key={i}
                            variant={current === i ? "default" : "outline"}
                            size="sm"
                            onClick={() => setPage(i)}
                            className="min-w-[2.5rem]"
                          >
                            {i}
                          </Button>
                        );
                      }

                      if (startPage > 1) {
                        pages.unshift(
                          <span key="start-ellipsis" className="px-2 text-sm text-muted-foreground">
                            ...
                          </span>
                        );
                        pages.unshift(
                          <Button
                            key={1}
                            variant={current === 1 ? "default" : "outline"}
                            size="sm"
                            onClick={() => setPage(1)}
                            className="min-w-[2.5rem]"
                          >
                            1
                          </Button>
                        );
                      }

                      if (endPage < total) {
                        pages.push(
                          <span key="end-ellipsis" className="px-2 text-sm text-muted-foreground">
                            ...
                          </span>
                        );
                        pages.push(
                          <Button
                            key={total}
                            variant={current === total ? "default" : "outline"}
                            size="sm"
                            onClick={() => setPage(total)}
                            className="min-w-[2.5rem]"
                          >
                            {total}
                          </Button>
                        );
                      }

                      return pages;
                    })()}
                  </div>
                )}

                <span className="text-sm text-muted-foreground">
                  Page {pagination.page} of {pagination.totalPages}
                </span>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                  disabled={!pagination.hasNext}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>

      {selectedOrderId && (
        <OrderDetailDialog
          orderId={selectedOrderId}
          customerType={selectedOrderType}
          open={!!selectedOrderId}
          onOpenChange={(open) => !open && setSelectedOrderId(null)}
        />
      )}

      {notesOrderId && (
        <NotesDialog
          open={!!notesOrderId}
          onOpenChange={(open) => {
            if (!open) {
              setNotesOrderId(null);
              setNotesOrderNumber("");
            }
          }}
          entityId={notesOrderId}
          entityType="order"
          entityName={`Order ${notesOrderNumber}`}
        />
      )}
    </Dialog>
  );
}