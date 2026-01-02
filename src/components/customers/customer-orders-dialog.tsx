// import { useState } from "react";
// import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
// import { supabase } from "@/integrations/supabase/client";
// import { useUserRole } from "@/hooks/use-user-role";
// import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
// import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
// import { Badge } from "@/components/ui/badge";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { getOrderStatusBadgeVariant } from "@/lib/badge-variants";
// import { format } from "date-fns";
// import { Eye, Search, ArrowLeft, MoreVertical, Trash2, StickyNote, Pencil, ExternalLink, ShoppingCart } from "lucide-react";
// import { OrderDetailDialog } from "./order-detail-dialog";
// import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
// import { NotesDialog } from "../shared/notes-dialog";
// import { toast } from "sonner";
// import { formatCurrency } from "@/lib/utils";

// interface Customer {
//   id: string;
//   customer_id: string;
//   first_name: string;
//   last_name: string;
// }

// interface CustomerOrdersDialogProps {
//   customer: Customer;
//   open: boolean;
//   onOpenChange: (open: boolean) => void;
//   viewingContext?: {
//     affiliateName?: string;
//   };
//   onBack?: () => void;
// }

// export function CustomerOrdersDialog({ customer, open, onOpenChange, viewingContext, onBack }: CustomerOrdersDialogProps) {
//   const queryClient = useQueryClient();
//   const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
//   const [notesOrderId, setNotesOrderId] = useState<string | null>(null);
//   const [notesOrderNumber, setNotesOrderNumber] = useState<string>("");
//   const [searchTerm, setSearchTerm] = useState("");
//   const [startDate, setStartDate] = useState("");
//   const [endDate, setEndDate] = useState("");

//   const { isAdmin, isAffiliate } = useUserRole();

//   const { data: orders, isLoading } = useQuery({
//     queryKey: ["customer-orders", customer.id],
//     queryFn: async () => {
//       const { data, error } = await supabase
//         .from("orders")
//         .select("*")
//         .eq("customer_id", customer.id)
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
//     return (
//       <Badge variant={getOrderStatusBadgeVariant(status as any)}>
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
//       queryClient.invalidateQueries({ queryKey: ["customer-orders"] });
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
//             <div>
//               <DialogTitle>
//                 Orders for {customer.first_name} {customer.last_name}
//               </DialogTitle>
//               {viewingContext?.affiliateName && (
//                 <p className="text-sm text-muted-foreground mt-1">
//                   Viewing orders of customers enrolled by {viewingContext.affiliateName}
//                 </p>
//               )}
//             </div>
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
//               No orders found for this customer.
//             </div>
//           )}
//         </div>
//       </DialogContent>

//       {selectedOrderId && (
//         <OrderDetailDialog
//           orderId={selectedOrderId}
//           open={!!selectedOrderId}
//           onOpenChange={(open) => !open && setSelectedOrderId(null)}
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

//commenitng for tracking the code

// import { useState } from "react";
// import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
// import { supabase } from "@/integrations/supabase/client";
// import { useUserRole } from "@/hooks/use-user-role";
// import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
// import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
// import { Badge } from "@/components/ui/badge";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { getOrderStatusBadgeVariant } from "@/lib/badge-variants";
// import { format } from "date-fns";
// import { Eye, Search, ArrowLeft, MoreVertical, Trash2, StickyNote, Pencil, ExternalLink, ShoppingCart } from "lucide-react";
// import { OrderDetailDialog } from "./order-detail-dialog";
// import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
// import { NotesDialog } from "../shared/notes-dialog";
// import { toast } from "sonner";
// import { formatCurrency } from "@/lib/utils";
// import {getCustomerOrders} from "@/api/orders";

// interface Customer {
//   id: string;
//   customer_id: string;
//   first_name: string;
//   last_name: string;
// }

// interface CustomerOrdersDialogProps {
//   customer: Customer;
//   customerId: string | number;
//   open: boolean;
//   onOpenChange: (open: boolean) => void;
//   viewingContext?: {
//     affiliateName?: string;
//   };
//   onBack?: () => void;
// }

// export function CustomerOrdersDialog({ customer, customerId, open, onOpenChange, viewingContext, onBack }: CustomerOrdersDialogProps) {
//   const queryClient = useQueryClient();
//   const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
//   const [notesOrderId, setNotesOrderId] = useState<string | null>(null);
//   const [notesOrderNumber, setNotesOrderNumber] = useState<string>("");
//   const [searchTerm, setSearchTerm] = useState("");
//   const [startDate, setStartDate] = useState("");
//   const [endDate, setEndDate] = useState("");
//   console.log("CustomerId is : ",customerId);
//   const { isAdmin, isAffiliate } = useUserRole();

//   const { data: orderData, isLoading } = useQuery({
//     queryKey: [
//       "customer-orders",
//       customerId,
//       searchTerm || null,
//       startDate || null,
//       endDate || null,
//     ],
//     queryFn: async () => {
//       return await getCustomerOrders(customerId, {
//         orderId: searchTerm || undefined,
//         startDate: startDate || undefined,
//         endDate: endDate || undefined,
//       });
//     },
//     enabled: !!customerId && open, // extra safety: only fetch when dialog is open
//   });

//   console.log("Order data : ",orderData);
//   const customerData=orderData?.data?.customer;
//   const customerOrders=orderData?.data?.orders;
//   const paginationData=orderData?.data?.pagination;
//   console.log("customerData  :",customerData);
//   console.log("customerOrders : ",customerOrders);
//   console.log("paginationData : ",paginationData);

//   const { data: orders, isLoadinga } = useQuery({
//     queryKey: ["customer-orders", customer.id],
//     queryFn: async () => {
//       const { data, error } = await supabase
//         .from("orders")
//         .select("*")
//         .eq("customer_id", customer.id)
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
//     return (
//       <Badge variant={getOrderStatusBadgeVariant(status as any)}>
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
//       queryClient.invalidateQueries({ queryKey: ["customer-orders"] });
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
//             <div>
//               <DialogTitle>
//                 Orders for {customer.first_name} {customer.last_name}
//               </DialogTitle>
//               {viewingContext?.affiliateName && (
//                 <p className="text-sm text-muted-foreground mt-1">
//                   Viewing orders of customers enrolled by {viewingContext.affiliateName}
//                 </p>
//               )}
//             </div>
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
//               No orders found for this customer.
//             </div>
//           )}
//         </div>
//       </DialogContent>

//       {selectedOrderId && (
//         <OrderDetailDialog
//           orderId={selectedOrderId}
//           open={!!selectedOrderId}
//           onOpenChange={(open) => !open && setSelectedOrderId(null)}
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
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useUserRole } from "@/hooks/use-user-role";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { getOrderStatusBadgeVariant } from "@/lib/badge-variants";
import { format } from "date-fns";
import { Eye, Search, ArrowLeft, MoreVertical, Trash2, StickyNote, ShoppingCart, Loader2, CalendarIcon } from "lucide-react";
import { OrderDetailDialog } from "./order-detail-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { NotesDialog } from "../shared/notes-dialog";
import { toast } from "sonner";
import { formatCurrency, cn } from "@/lib/utils";
import { getCustomerOrders, deleteOrder } from "@/api/orders";
import { useShopifyStore } from "@/store/useAuthStore";
import { useDateFormatStore } from "@/store/useDateFormat";
import { getDateFormatString } from "@/utils/resolveDateFormat";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface CustomerOrdersDialogProps {
  customerId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBack?: () => void;
}

const ORDER_STATUS_MAP: Record<number, string> = {
  0: "Pending",
  1: "Accepted",
  2: "Paid",
  3: "Fulfilled",
  4: "Refunded",
  5: "Canceled",
};

export function CustomerOrdersDialog({
  customerId,
  open,
  onOpenChange,
  onBack,
}: CustomerOrdersDialogProps) {
  const queryClient = useQueryClient();

  // States
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [notesOrderId, setNotesOrderId] = useState<string | null>(null);
  const [notesOrderNumber, setNotesOrderNumber] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const shopifyUrl = useShopifyStore((state) => state.shopifyUrl);

  const { dateFormatRegion, dateFormatVariant } = useDateFormatStore();
  const formatString = getDateFormatString(dateFormatRegion, dateFormatVariant);
  const { isAdmin } = useUserRole();
  const { data: orderData, isLoading } = useQuery({
    queryKey: [
      "customer-orders",
      customerId,
      debouncedSearchTerm,
      startDate,
      endDate,
      currentPage,
      itemsPerPage,
    ],
    queryFn: async () => {
      return await getCustomerOrders(customerId, {
        orderId: debouncedSearchTerm || undefined,
        startDate: startDate ? format(startDate,formatString) : undefined,
        endDate: endDate ? format(endDate, formatString) : undefined,
        page: currentPage,
        limit: itemsPerPage,
      });
    },
    enabled: !!customerId && open,
  });

  // Extract data from your real API response
  const customerData = orderData?.data?.customer;
  const customerOrders = orderData?.data?.orders || [];
  const pagination = orderData?.data?.pagination;

  const customerName = customerData
    ? `${customerData.firstName} ${customerData.lastName}`
    : "Loading...";

  // Safe fallbacks
  const totalOrders = pagination?.total || 0;
  const totalPages = pagination?.totalPages || 1;
  const hasNext = pagination?.hasNext || false;
  const hasPrev = pagination?.hasPrev || false;

  const getStatusText = (status: number) => ORDER_STATUS_MAP[status] || "Unknown";
  const getStatusBadge = (status: number) => (
    <Badge variant={getOrderStatusBadgeVariant(getStatusText(status) as any)}>
      {getStatusText(status)}
    </Badge>
  );

  const deleteMutation = useMutation({
    mutationFn: (orderId: string) => deleteOrder(orderId),
    onSuccess: () => {
      // Invalidate relevant queries so lists and detail view refresh
      setCurrentPage(1)
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["customer-orders"] });

      // or ["admin-orders"], ["customer-orders"], etc.
      toast.success("Order deleted successfully");

    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message || "Failed to delete order"
      );
      console.error("Delete order error:", error);
    },
  });


  //debounced search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm])

  // Reset page when filters change
  const resetPageOnFilter = () => setCurrentPage(1);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            {onBack && (
              <Button variant="ghost" size="icon" onClick={onBack}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
            )}
            <div>
              <DialogTitle>Orders for {customerName}</DialogTitle>
              <p className="text-sm text-muted-foreground">Customer ID: {customerId}</p>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1">
              <label className="text-sm font-medium">Search Order ID</label>
              <div className="relative mt-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="e.g. IWHA8NEJILHV"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    resetPageOnFilter();
                  }}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">From Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "mt-1 justify-start text-left font-normal w-full",
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
                      resetPageOnFilter();
                    }}
                    formatString={formatString}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <label className="text-sm font-medium">To Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "mt-1 justify-start text-left font-normal w-full",
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
                      resetPageOnFilter();
                    }}
                    formatString={formatString}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            {(searchTerm || startDate || endDate) && (
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm("");
                  setStartDate(undefined);
                  setEndDate(undefined);
                  setCurrentPage(1);
                }}
              >
                Clear
              </Button>
            )}
          </div>

          {/* Content */}
          {isLoading ? (
            <div className="text-center py-16">
              <Loader2 className="h-10 w-10 animate-spin mx-auto text-primary" />
              <p className="text-muted-foreground mt-4">Loading orders...</p>
            </div>
          ) : customerOrders.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              No orders found.
            </div>
          ) : (
            <>
              {/* Table */}
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order ID</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Subscription</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Shopify #</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customerOrders.map((order: any) => (
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
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setSelectedOrderId(order._id)}>
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              {isAdmin && order.shopifyOrderId && (
                                <DropdownMenuItem
                                  onClick={() => window.open(`${shopifyUrl}/orders/${order.shopifyOrderId}`, "_blank")}
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
                                  onClick={() => confirm("Delete this order?") && deleteMutation.mutate(order._id)}
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

              {/* Pagination - IDENTICAL to AffiliateCustomersList */}
              {/* Pagination - EXACT SAME DESIGN as AffiliateCustomersList */}
              {totalOrders > 0 && (
                <div className="flex items-center justify-between mt-6">
                  {/* Left side: Showing X to Y of Z + Per page selector */}
                  <div className="flex items-center gap-6">
                    <div className="text-sm text-muted-foreground">
                      Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                      {Math.min(currentPage * itemsPerPage, totalOrders)} of {totalOrders}{" "}
                      order{totalOrders !== 1 ? "s" : ""}
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

                  {/* Right side: Previous, Page Buttons  Next */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>

                    {/* Page Number Buttons - Show up to 5 pages */}
                    {totalPages > 1 && (
                      <div className="flex items-center gap-1">
                        {Array.from(
                          { length: Math.min(5, totalPages) },
                          (_, i) => i + 1
                        ).map((page) => (
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
            </>
          )}
        </div>
      </DialogContent>

      {selectedOrderId && (
        <OrderDetailDialog
          orderId={selectedOrderId}
          customerType={'customer'}
          open={!!selectedOrderId}
          onOpenChange={(o) => !o && setSelectedOrderId(null)}
        />
      )}

      {notesOrderId && (
        <NotesDialog
          open={!!notesOrderId}
          onOpenChange={(o) => !o && setNotesOrderId(null)}
          entityId={notesOrderId}
          entityType="order"
          entityName={`Order ${notesOrderNumber}`}
        />
      )}
    </Dialog>
  );
}