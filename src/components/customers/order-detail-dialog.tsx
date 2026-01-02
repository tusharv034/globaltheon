// import { useState } from "react";
// import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
// import { supabase } from "@/integrations/supabase/client";
// import { useUserRole } from "@/hooks/use-user-role";
// import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// import { Badge } from "@/components/ui/badge";
// import { Button } from "@/components/ui/button";
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// import { Separator } from "@/components/ui/separator";
// import { getOrderStatusBadgeVariant } from "@/lib/badge-variants";
// import { format } from "date-fns";
// import { toast } from "sonner";
// import { Edit2, Save, X, ExternalLink, Pencil } from "lucide-react";
// import { OrderNotes } from "./order-notes";
// import { formatCurrency, formatNumber } from "@/lib/utils";
// import { EnrollingAffiliateChangeDialog } from "../shared/enrolling-affiliate-change-dialog";
// import { CommissionAdjustmentDialog } from "../shared/commission-adjustment-dialog";
// import { analyzeSingleOrderCommissionImpact, applyCommissionAdjustments, CommissionImpact } from "@/lib/commission-utils";
// import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
// import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

// interface Order {
//   id: string;
//   order_number: string;
//   shopify_order_number?: string;
//   customer_id: string;
//   amount: number;
//   order_date: string;
//   status: string;
//   created_at: string;
//   updated_at: string;
//   shipping_method?: string;
//   sales_tax_id?: string;
//   payment_method?: string;
//   payment_date?: string;
//   cancelled_date?: string;
//   refunded_date?: string;
//   subtotal: number;
//   shipping_cost: number;
//   tax_amount: number;
//   amount_paid: number;
//   subscription: boolean;
//   shipping_address_line1?: string;
//   shipping_address_line2?: string;
//   shipping_city?: string;
//   shipping_state?: string;
//   shipping_postal_code?: string;
//   shipping_country?: string;
//   billing_address_line1?: string;
//   billing_address_line2?: string;
//   billing_city?: string;
//   billing_state?: string;
//   billing_postal_code?: string;
//   billing_country?: string;
//   billing_same_as_shipping?: boolean;
// }

// interface OrderItem {
//   id: string;
//   item_id: string;
//   description: string;
//   quantity: number;
//   price: number;
//   total: number;
// }

// interface OrderDetailDialogProps {
//   orderId: string;
//   open: boolean;
//   onOpenChange: (open: boolean) => void;
// }

// export function OrderDetailDialog({ orderId, open, onOpenChange }: OrderDetailDialogProps) {
//   const [isEditing, setIsEditing] = useState(false);
//   const [selectedStatus, setSelectedStatus] = useState<string>("");
//   const [showAffiliateSelector, setShowAffiliateSelector] = useState(false);
//   const [showAffiliateChangeDialog, setShowAffiliateChangeDialog] = useState(false);
//   const [showCommissionAdjustmentDialog, setShowCommissionAdjustmentDialog] = useState(false);
//   const [pendingAffiliateChange, setPendingAffiliateChange] = useState<{ newId: string; newName: string; newAffiliateId: string } | null>(null);
//   const [commissionImpacts, setCommissionImpacts] = useState<CommissionImpact[]>([]);
//   const queryClient = useQueryClient();

//   const { isAdmin, isAffiliate } = useUserRole();

//   const { data: order, isLoading: orderLoading } = useQuery({
//     queryKey: ["order", orderId],
//     queryFn: async () => {
//       const { data, error } = await supabase
//         .from("orders")
//         .select("*")
//         .eq("id", orderId)
//         .single();

//       if (error) throw error;
//       setSelectedStatus(data.status);
//       return data as Order;
//     },
//     enabled: open,
//   });

//   const { data: customer, isLoading: customerLoading } = useQuery({
//     queryKey: ["customer", order?.customer_id],
//     queryFn: async () => {
//       if (!order?.customer_id) return null;
//       const { data, error } = await supabase
//         .from("customers")
//         .select("*")
//         .eq("id", order.customer_id)
//         .single();

//       if (error) throw error;
//       return data;
//     },
//     enabled: !!order?.customer_id,
//   });

//   const { data: orderItems, isLoading: itemsLoading } = useQuery({
//     queryKey: ["order-items", orderId],
//     queryFn: async () => {
//       const { data, error } = await supabase
//         .from("order_items")
//         .select("*")
//         .eq("order_id", orderId)
//         .order("created_at", { ascending: true });

//       if (error) throw error;
//       return data as OrderItem[];
//     },
//     enabled: open,
//   });

//   const { data: compensationPlan } = useQuery({
//     queryKey: ["compensation-plan"],
//     queryFn: async () => {
//       const { data, error } = await supabase
//         .from("compensation_plans")
//         .select("*")
//         .maybeSingle();

//       if (error) throw error;
//       return data;
//     },
//     enabled: open,
//   });

//   const { data: orderCommissions } = useQuery({
//     queryKey: ["order-commissions", orderId],
//     queryFn: async () => {
//       const { data, error } = await supabase
//         .from("order_commissions" as any)
//         .select(`
//           *,
//           affiliate:affiliates!order_commissions_affiliate_id_fkey(
//             id,
//             affiliate_id,
//             first_name,
//             last_name
//           )
//         `)
//         .eq("order_id", orderId)
//         .order("level", { ascending: true });

//       if (error) throw error;
//       return data as any;
//     },
//     enabled: open,
//   });

//   // Query for all affiliates (for affiliate selector)
//   const { data: allAffiliates } = useQuery({
//     queryKey: ["all-affiliates-for-selection"],
//     queryFn: async () => {
//       const { data, error } = await supabase
//         .from("affiliates")
//         .select("id, affiliate_id, first_name, last_name")
//         .eq("status", "active")
//         .order("first_name");

//       if (error) throw error;
//       return data;
//     },
//     enabled: showAffiliateSelector,
//   });

//   const updateStatusMutation = useMutation({
//     mutationFn: async (newStatus: string) => {
//       const { error } = await supabase
//         .from("orders")
//         .update({ status: newStatus })
//         .eq("id", orderId);

//       if (error) throw error;
//     },
//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: ["order", orderId] });
//       queryClient.invalidateQueries({ queryKey: ["customer-orders"] });
//       queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
//       queryClient.invalidateQueries({ queryKey: ["affiliate-orders"] });
//       toast.success("Order status updated successfully");
//       setIsEditing(false);
//     },
//     onError: () => {
//       toast.error("Failed to update order status");
//     },
//   });

//   const getStatusBadge = (status: string) => {
//     return (
//       <Badge variant={getOrderStatusBadgeVariant(status as any)}>
//         {status}
//       </Badge>
//     );
//   };

//   const handleSaveStatus = () => {
//     if (selectedStatus !== order?.status) {
//       updateStatusMutation.mutate(selectedStatus);
//     } else {
//       setIsEditing(false);
//     }
//   };

//   const handleAffiliateSelect = async (affiliateId: string) => {
//     if (!customer || !orderCommissions || orderCommissions.length === 0) return;

//     const currentLevel1Commission = orderCommissions.find((c: any) => c.level === 1);
//     if (!currentLevel1Commission) {
//       toast.error("No Level 1 commission found for this order");
//       return;
//     }

//     const currentAffiliateId = currentLevel1Commission.affiliate.id;
//     if (affiliateId === currentAffiliateId) {
//       toast.info("Selected affiliate is already the enrolling affiliate");
//       setShowAffiliateSelector(false);
//       return;
//     }

//     const selectedAffiliate = allAffiliates?.find(a => a.id === affiliateId);
//     if (!selectedAffiliate) return;

//     setPendingAffiliateChange({
//       newId: affiliateId,
//       newName: `${selectedAffiliate.first_name} ${selectedAffiliate.last_name}`,
//       newAffiliateId: selectedAffiliate.affiliate_id
//     });
//     setShowAffiliateSelector(false);
//     setShowAffiliateChangeDialog(true);
//   };

//   const handleAffiliateChangeConfirm = async (note?: string) => {
//     if (!pendingAffiliateChange) return;

//     setShowAffiliateChangeDialog(false);

//     const loadingToast = toast.loading("Analyzing commission impact...");

//     try {
//       // Analyze commission impact for this specific order only
//       const impacts = await analyzeSingleOrderCommissionImpact(
//         orderId,
//         pendingAffiliateChange.newId
//       );

//       toast.dismiss(loadingToast);

//       // Always show commission adjustment dialog to give admin control
//       // Even if there are no impacts, admin should be able to choose
//       setCommissionImpacts(impacts);
//       setShowCommissionAdjustmentDialog(true);
//     } catch (error) {
//       toast.dismiss(loadingToast);
//       toast.error("Failed to analyze commission impact");
//       console.error(error);
//     }
//   };

//   const handleCommissionAdjustmentConfirm = async (approvedImpacts: CommissionImpact[], selectedOrderIds: string[], note?: string) => {
//     if (!pendingAffiliateChange || !customer) return;

//     const { data: { user } } = await supabase.auth.getUser();
//     if (!user) {
//       toast.error("Not authenticated");
//       return;
//     }

//     setShowCommissionAdjustmentDialog(false);

//     const loadingToast = toast.loading("Updating order commissions...");

//     try {
//       // Step 1: Update customer's enrolled_by to new affiliate
//       const { error: customerError } = await supabase
//         .from("customers")
//         .update({ enrolled_by: pendingAffiliateChange.newId })
//         .eq("id", customer.id);

//       if (customerError) throw customerError;

//       // Step 2: Get new affiliate hierarchy for commission recalculation
//       const { data: newAffiliate } = await supabase
//         .from("affiliates")
//         .select("id, enrolled_by, affiliate_id, first_name, last_name")
//         .eq("id", pendingAffiliateChange.newId)
//         .single();

//       if (!newAffiliate) throw new Error("New affiliate not found");

//       // Step 3: Get compensation plan for commission rates
//       const { data: compPlan } = await supabase
//         .from("compensation_plans")
//         .select("level_percentages")
//         .limit(1)
//         .single();

//       const levelPercentages = compPlan?.level_percentages as Record<string, number> || { "1": 25, "2": 12 };

//       // Step 4: Delete old commission records for this order
//       await supabase
//         .from("order_commissions")
//         .delete()
//         .eq("order_id", orderId);

//       // Step 5: Create new commission records based on new hierarchy
//       const { data: orderData } = await supabase
//         .from("orders")
//         .select("amount")
//         .eq("id", orderId)
//         .single();

//       if (!orderData) throw new Error("Order not found");

//       const orderAmount = typeof orderData.amount === 'string' ? parseFloat(orderData.amount) : Number(orderData.amount);
//       const newCommissions: any[] = [];

//       // Level 1 commission
//       const level1Rate = levelPercentages["1"] || 25;
//       newCommissions.push({
//         order_id: orderId,
//         affiliate_id: newAffiliate.id,
//         level: 1,
//         commission_rate: level1Rate,
//         commission_amount: (orderAmount * level1Rate) / 100
//       });

//       // Level 2 commission (if new affiliate has an upline)
//       if (newAffiliate.enrolled_by) {
//         const level2Rate = levelPercentages["2"] || 12;
//         newCommissions.push({
//           order_id: orderId,
//           affiliate_id: newAffiliate.enrolled_by,
//           level: 2,
//           commission_rate: level2Rate,
//           commission_amount: (orderAmount * level2Rate) / 100
//         });
//       }

//       // Insert new commission records
//       const { error: commissionsError } = await supabase
//         .from("order_commissions")
//         .insert(newCommissions);

//       if (commissionsError) throw commissionsError;

//       // Step 6: Apply commission adjustments (for notes and clawbacks/credits if needed)
//       if (approvedImpacts.length > 0) {
//         await applyCommissionAdjustments(
//           approvedImpacts,
//           note,
//           user.id,
//           orderId,
//           'customer'
//         );
//       }

//       // Step 7: Add note to customer about enrolling affiliate change
//       const customerNoteText = `Enrolling affiliate changed to ${pendingAffiliateChange.newName} (${pendingAffiliateChange.newAffiliateId})${note ? `\nReason: ${note}` : ''}`;
//       await supabase.from("customer_notes").insert([{
//         customer_id: customer.id,
//         note_text: customerNoteText,
//         note_type: "note",
//         created_by: user.id
//       }]);

//       toast.dismiss(loadingToast);

//       setPendingAffiliateChange(null);
//       setCommissionImpacts([]);

//       // Invalidate and refetch queries to update the UI
//       await Promise.all([
//         queryClient.invalidateQueries({ queryKey: ["customer", customer.id] }),
//         queryClient.invalidateQueries({ queryKey: ["order-commissions", orderId] }),
//         queryClient.invalidateQueries({ queryKey: ["order", orderId] }),
//         queryClient.invalidateQueries({ queryKey: ["admin-orders"] }),
//         queryClient.invalidateQueries({ queryKey: ["customer-orders"] }),
//       ]);

//       // Force refetch to ensure the UI updates with new data
//       await queryClient.refetchQueries({ queryKey: ["order-commissions", orderId] });

//       toast.success("Order enrolling affiliate updated successfully");
//     } catch (error) {
//       toast.dismiss(loadingToast);
//       console.error("Failed to update order commissions:", error);
//       toast.error("Failed to update order commissions");
//     }
//   };

//   const handleCommissionAdjustmentCancel = () => {
//     setShowCommissionAdjustmentDialog(false);
//     setShowAffiliateChangeDialog(false);
//     setCommissionImpacts([]);
//     setPendingAffiliateChange(null);
//   };


//   if (orderLoading || customerLoading || itemsLoading) {
//     return (
//       <Dialog open={open} onOpenChange={onOpenChange}>
//         <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
//           <div className="text-center py-8">Loading order details...</div>
//         </DialogContent>
//       </Dialog>
//     );
//   }

//   if (!order) return null;

//   return (
//     <Dialog open={open} onOpenChange={onOpenChange}>
//       <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
//         <DialogHeader>
//           <div className="flex items-center justify-between">
//             <DialogTitle className="text-2xl font-bold">
//               Order #{order.order_number}
//             </DialogTitle>
//             <div className="flex items-center gap-2">
//               {isEditing ? (
//                 <>
//                   <Button size="sm" variant="outline" onClick={() => setIsEditing(false)}>
//                     <X className="h-4 w-4 mr-1" />
//                     Cancel
//                   </Button>
//                   <Button size="sm" onClick={handleSaveStatus}>
//                     <Save className="h-4 w-4 mr-1" />
//                     Save
//                   </Button>
//                 </>
//               ) : (
//                 <>
//                   {isAdmin && !isAffiliate && (
//                     <>
//                       <Button 
//                         size="sm" 
//                         variant="outline"
//                         onClick={() => window.open(`https://admin.shopify.com/store/theonglobal/orders/${order.order_number}`, '_blank')}
//                       >
//                         <ExternalLink className="h-4 w-4 mr-1" />
//                         View in Shopify
//                       </Button>
//                       <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>
//                         <Edit2 className="h-4 w-4 mr-1" />
//                         Edit
//                       </Button>
//                     </>
//                   )}
//                 </>
//               )}
//             </div>
//           </div>
//         </DialogHeader>

//         <Tabs defaultValue="details" className="w-full">
//           <TabsList className="grid w-full grid-cols-3">
//             <TabsTrigger value="details">Details</TabsTrigger>
//             <TabsTrigger value="commissions">Commissions</TabsTrigger>
//             <TabsTrigger value="notes">Notes & History</TabsTrigger>
//           </TabsList>

//           <TabsContent value="details" className="space-y-6 mt-6">
//             {/* Order Status Section */}
//             <div className="bg-muted/50 p-6 rounded-lg space-y-4">
//               <h3 className="text-lg font-semibold">Order Status</h3>
//               <Separator />
//               <div className="flex items-center gap-2">
//                 <span className="text-sm font-medium">Current Status:</span>
//                 {isEditing && isAdmin && !isAffiliate ? (
//                   <Select value={selectedStatus} onValueChange={setSelectedStatus}>
//                     <SelectTrigger className="w-40">
//                       <SelectValue />
//                     </SelectTrigger>
//                     <SelectContent>
//                       <SelectItem value="Accepted">Accepted</SelectItem>
//                       <SelectItem value="Printed">Printed</SelectItem>
//                       <SelectItem value="Shipped">Shipped</SelectItem>
//                       <SelectItem value="Cancelled">Cancelled</SelectItem>
//                       <SelectItem value="Refunded">Refunded</SelectItem>
//                     </SelectContent>
//                   </Select>
//                 ) : (
//                   getStatusBadge(order.status)
//                 )}
//               </div>
//             </div>

//             {/* Order Information */}
//             <div className="bg-muted/50 p-6 rounded-lg space-y-4">
//               <h3 className="text-lg font-semibold">Order Information</h3>
//               <Separator />
//               <div className="grid grid-cols-2 gap-4">
//                 <div>
//                   <p className="text-sm text-muted-foreground">Order No.</p>
//                   <p className="font-medium">{order.order_number}</p>
//                 </div>
//                 <div>
//                   <p className="text-sm text-muted-foreground">Shopify Order #</p>
//                   {order.shopify_order_number ? (
//                     <a
//                       href={`https://admin.shopify.com/store/theonglobal/orders/${order.order_number}`}
//                       target="_blank"
//                       rel="noopener noreferrer"
//                       className="font-medium text-primary hover:underline cursor-pointer"
//                     >
//                       {order.shopify_order_number}
//                     </a>
//                   ) : (
//                     <p className="font-medium">N/A</p>
//                   )}
//                 </div>
//                 <div>
//                   <p className="text-sm text-muted-foreground">Date</p>
//                   <p className="font-medium">
//                     {format(new Date(order.order_date), "MMM d, yyyy h:mm a")}
//                   </p>
//                 </div>
//                 <div>
//                   <p className="text-sm text-muted-foreground">Subscription</p>
//                   <p className="font-medium">{order.subscription ? "Yes" : "No"}</p>
//                 </div>
//                 <div>
//                   <p className="text-sm text-muted-foreground">Shipping Method</p>
//                   <p className="font-medium">{order.shipping_method || "N/A"}</p>
//                 </div>
//                 <div>
//                   <p className="text-sm text-muted-foreground">Sales Tax ID</p>
//                   <p className="font-medium">{order.sales_tax_id || "N/A"}</p>
//                 </div>
//               </div>
//             </div>

//             {/* Customer Information */}
//             {customer && (
//               <div className="bg-muted/50 p-6 rounded-lg space-y-4">
//                 <h3 className="text-lg font-semibold">Customer Information</h3>
//                 <Separator />
//                 <div className="grid grid-cols-2 gap-4">
//                   <div>
//                     <p className="text-sm text-muted-foreground">Customer ID</p>
//                     <p className="font-medium">{customer.customer_id}</p>
//                   </div>
//                   <div>
//                     <p className="text-sm text-muted-foreground">Customer Name</p>
//                     <p className="font-medium">
//                       {customer.first_name} {customer.last_name}
//                     </p>
//                   </div>
//                   <div>
//                     <p className="text-sm text-muted-foreground">Email</p>
//                     <p className="font-medium">{customer.email || "N/A"}</p>
//                   </div>
//                   <div>
//                     <p className="text-sm text-muted-foreground">Phone</p>
//                     <p className="font-medium">{customer.phone || "N/A"}</p>
//                   </div>
//                 </div>
//               </div>
//             )}

//             {/* Shipping and Billing Address */}
//             <div className="bg-muted/50 p-6 rounded-lg space-y-4">
//               <h3 className="text-lg font-semibold">Address Information</h3>
//               <Separator />
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                 {/* Shipping Address */}
//                 <div>
//                   <p className="text-sm text-muted-foreground mb-2 font-semibold">Shipping Address</p>
//                   {order.shipping_address_line1 ? (
//                     <div className="font-medium space-y-1">
//                       <p>{order.shipping_address_line1}</p>
//                       {order.shipping_address_line2 && <p>{order.shipping_address_line2}</p>}
//                       <p>{order.shipping_city}, {order.shipping_state} {order.shipping_postal_code}</p>
//                       <p>{order.shipping_country}</p>
//                     </div>
//                   ) : (
//                     <p className="font-medium text-muted-foreground">No shipping address on file</p>
//                   )}
//                 </div>

//                 {/* Billing Address */}
//                 <div>
//                   <p className="text-sm text-muted-foreground mb-2 font-semibold">Billing Address</p>
//                   {order.billing_same_as_shipping ? (
//                     <p className="font-medium italic text-muted-foreground">Same as Shipping Address</p>
//                   ) : order.billing_address_line1 ? (
//                     <div className="font-medium space-y-1">
//                       <p>{order.billing_address_line1}</p>
//                       {order.billing_address_line2 && <p>{order.billing_address_line2}</p>}
//                       <p>{order.billing_city}, {order.billing_state} {order.billing_postal_code}</p>
//                       <p>{order.billing_country}</p>
//                     </div>
//                   ) : (
//                     <p className="font-medium text-muted-foreground">No billing address on file</p>
//                   )}
//                 </div>
//               </div>
//             </div>

//             {/* Order Items */}
//             <div className="bg-muted/50 p-6 rounded-lg space-y-4">
//               <h3 className="text-lg font-semibold">Order Items</h3>
//               <Separator />
//               {orderItems && orderItems.length > 0 ? (
//                 <div className="overflow-x-auto">
//                   <table className="w-full">
//                     <thead>
//                       <tr className="border-b">
//                         <th className="text-left py-3 px-2 text-sm font-semibold">Item ID</th>
//                         <th className="text-left py-3 px-2 text-sm font-semibold">Description</th>
//                         <th className="text-center py-3 px-2 text-sm font-semibold">Quantity</th>
//                         <th className="text-right py-3 px-2 text-sm font-semibold">Price</th>
//                         <th className="text-right py-3 px-2 text-sm font-semibold">Total</th>
//                       </tr>
//                     </thead>
//                     <tbody>
//                       {orderItems.map((item) => (
//                         <tr key={item.id} className="border-b">
//                           <td className="py-3 px-2 text-sm">{item.item_id}</td>
//                           <td className="py-3 px-2 text-sm">{item.description}</td>
//                           <td className="py-3 px-2 text-sm text-center">{item.quantity}</td>
//                           <td className="py-3 px-2 text-sm text-right">
//                             {formatCurrency(item.price)}
//                           </td>
//                           <td className="py-3 px-2 text-sm text-right font-medium">
//                             {formatCurrency(item.total)}
//                           </td>
//                         </tr>
//                       ))}
//                     </tbody>
//                   </table>
//                 </div>
//               ) : (
//                 <div className="text-center py-8 text-muted-foreground">
//                   No items found for this order
//                 </div>
//               )}
//             </div>

//             {/* Payment Details */}
//             <div className="bg-muted/50 p-6 rounded-lg space-y-4">
//               <h3 className="text-lg font-semibold">Payment Details</h3>
//               <Separator />
//               <div className="grid grid-cols-2 gap-4 mb-4">
//                 <div>
//                   <p className="text-sm text-muted-foreground">Payment Method</p>
//                   <p className="font-medium">{order.payment_method || "N/A"}</p>
//                 </div>
//                 <div>
//                   <p className="text-sm text-muted-foreground">Payment Date</p>
//                   <p className="font-medium">
//                     {order.payment_date 
//                       ? format(new Date(order.payment_date), "MMM d, yyyy h:mm a")
//                       : "N/A"}
//                   </p>
//                 </div>
//                 {order.cancelled_date && (
//                   <div>
//                     <p className="text-sm text-muted-foreground">Cancelled Date</p>
//                     <p className="font-medium text-destructive">
//                       {format(new Date(order.cancelled_date), "MMM d, yyyy h:mm a")}
//                     </p>
//                   </div>
//                 )}
//                 {order.refunded_date && (
//                   <div>
//                     <p className="text-sm text-muted-foreground">Refunded Date</p>
//                     <p className="font-medium text-orange-500">
//                       {format(new Date(order.refunded_date), "MMM d, yyyy h:mm a")}
//                     </p>
//                   </div>
//                 )}
//               </div>
//               <Separator />
//               <div className="space-y-2">
//                 <div className="flex justify-between text-sm">
//                   <span className="text-muted-foreground">Subtotal:</span>
//                   <span className="font-medium">
//                     {formatCurrency(order.subtotal || 0)}
//                   </span>
//                 </div>
//                 <div className="flex justify-between text-sm">
//                   <span className="text-muted-foreground">Shipping:</span>
//                   <span className="font-medium">
//                     {formatCurrency(order.shipping_cost || 0)}
//                   </span>
//                 </div>
//                 <div className="flex justify-between text-sm">
//                   <span className="text-muted-foreground">Taxes:</span>
//                   <span className="font-medium">
//                     {formatCurrency(order.tax_amount || 0)}
//                   </span>
//                 </div>
//                 <Separator />
//                 <div className="flex justify-between text-base font-bold">
//                   <span>Total:</span>
//                   <span>{formatCurrency(order.amount)}</span>
//                 </div>
//                 <div className="flex justify-between text-base font-bold text-primary">
//                   <span>Amount Paid:</span>
//                   <span>{formatCurrency(order.amount_paid || 0)}</span>
//                 </div>
//               </div>
//             </div>
//           </TabsContent>

//           <TabsContent value="commissions" className="space-y-6 mt-6">
//             <div className="bg-muted/50 p-6 rounded-lg space-y-4">
//               <h3 className="text-lg font-semibold">Commission Breakdown</h3>
//               <Separator />

//               {!compensationPlan ? (
//                 <div className="text-center py-8 text-muted-foreground">
//                   No compensation plan configured
//                 </div>
//               ) : !orderCommissions || orderCommissions.length === 0 ? (
//                 <div className="text-center py-8 text-muted-foreground">
//                   No commission data available for this order
//                 </div>
//               ) : (
//                 <div className="space-y-4">
//                   <div className="bg-background p-4 rounded-lg">
//                     <p className="text-sm text-muted-foreground mb-2">Compensation Plan</p>
//                     <p className="font-medium">{compensationPlan.num_levels}-Level Program</p>
//                   </div>

//                   <div className="overflow-x-auto">
//                     <table className="w-full">
//                       <thead>
//                         <tr className="border-b">
//                           <th className="text-left py-3 px-2 text-sm font-semibold">Level</th>
//                           <th className="text-left py-3 px-2 text-sm font-semibold">Affiliate</th>
//                           <th className="text-left py-3 px-2 text-sm font-semibold">Customer ID</th>
//                           <th className="text-right py-3 px-2 text-sm font-semibold">Rate</th>
//                           <th className="text-right py-3 px-2 text-sm font-semibold">Commission</th>
//                           <th className="text-center py-3 px-2 text-sm font-semibold">Actions</th>
//                         </tr>
//                       </thead>
//                       <tbody>
//                         {orderCommissions.map((commission: any) => (
//                           <tr key={commission.id} className="border-b">
//                             <td className="py-3 px-2 text-sm">Level {commission.level}</td>
//                             <td className="py-3 px-2 text-sm">
//                               {commission.affiliate.first_name} {commission.affiliate.last_name}
//                             </td>
//                             <td className="py-3 px-2 text-sm">{commission.affiliate.affiliate_id}</td>
//                             <td className="py-3 px-2 text-sm text-right">
//                               {(() => {
//                                 const rate = parseFloat(commission.commission_rate);
//                                 // If rate is less than 1, it's stored as decimal (0.25), multiply by 100
//                                 // If rate is >= 1, it's already a percentage (25)
//                                 const displayRate = rate < 1 ? rate * 100 : rate;
//                                 return `${formatNumber(displayRate)}%`;
//                               })()}
//                             </td>
//                             <td className="py-3 px-2 text-sm text-right font-medium text-primary">
//                               {formatCurrency(commission.commission_amount)}
//                             </td>
//                             <td className="py-3 px-2 text-center">
//                               {commission.level === 1 && isAdmin && !isAffiliate && (
//                                 <Popover open={showAffiliateSelector} onOpenChange={setShowAffiliateSelector}>
//                                   <PopoverTrigger asChild>
//                                     <Button 
//                                       variant="ghost" 
//                                       size="sm"
//                                       className="h-8 w-8 p-0"
//                                     >
//                                       <Pencil className="h-4 w-4" />
//                                     </Button>
//                                   </PopoverTrigger>
//                                   <PopoverContent className="w-[300px] p-0" align="end">
//                                     <Command>
//                                       <CommandInput placeholder="Search affiliates..." />
//                                       <CommandList>
//                                         <CommandEmpty>No affiliates found.</CommandEmpty>
//                                         <CommandGroup>
//                                           {allAffiliates?.map((affiliate) => (
//                                             <CommandItem
//                                               key={affiliate.id}
//                                               value={`${affiliate.first_name} ${affiliate.last_name} ${affiliate.affiliate_id}`}
//                                               onSelect={() => handleAffiliateSelect(affiliate.id)}
//                                             >
//                                               <div className="flex flex-col">
//                                                 <span>{affiliate.first_name} {affiliate.last_name}</span>
//                                                 <span className="text-xs text-muted-foreground">{affiliate.affiliate_id}</span>
//                                               </div>
//                                             </CommandItem>
//                                           ))}
//                                         </CommandGroup>
//                                       </CommandList>
//                                     </Command>
//                                   </PopoverContent>
//                                 </Popover>
//                               )}
//                             </td>
//                           </tr>
//                         ))}
//                       </tbody>
//                     </table>
//                   </div>

//                   <div className="bg-primary/10 p-4 rounded-lg">
//                     <div className="flex justify-between items-center">
//                       <span className="font-semibold">Total Commissions:</span>
//                       <span className="text-xl font-bold text-primary">
//                         {formatCurrency(orderCommissions.reduce((total: number, commission: any) => 
//                           total + parseFloat(commission.commission_amount), 0
//                         ))}
//                       </span>
//                     </div>
//                     <p className="text-xs text-muted-foreground mt-2">
//                       Calculated on subtotal: {formatCurrency(order.subtotal || 0)}
//                     </p>
//                   </div>
//                 </div>
//               )}
//             </div>
//           </TabsContent>

//           <TabsContent value="notes" className="space-y-6 mt-6">
//             <OrderNotes orderId={orderId} />
//           </TabsContent>
//         </Tabs>

//         {/* Dialogs for affiliate change flow */}
//         {pendingAffiliateChange && customer && orderCommissions && orderCommissions.length > 0 && (
//           <>
//             <EnrollingAffiliateChangeDialog
//               open={showAffiliateChangeDialog}
//               onOpenChange={setShowAffiliateChangeDialog}
//               oldAffiliateName={`${orderCommissions.find((c: any) => c.level === 1)?.affiliate.first_name} ${orderCommissions.find((c: any) => c.level === 1)?.affiliate.last_name}`}
//               oldAffiliateId={orderCommissions.find((c: any) => c.level === 1)?.affiliate.affiliate_id}
//               newAffiliateName={pendingAffiliateChange.newName}
//               newAffiliateId={pendingAffiliateChange.newAffiliateId}
//               onConfirm={handleAffiliateChangeConfirm}
//             />

//             <CommissionAdjustmentDialog
//               open={showCommissionAdjustmentDialog}
//               onOpenChange={setShowCommissionAdjustmentDialog}
//               entityName={`${customer.first_name} ${customer.last_name}`}
//               impacts={commissionImpacts}
//               onConfirm={handleCommissionAdjustmentConfirm}
//               onCancel={handleCommissionAdjustmentCancel}
//               onViewOrder={(orderId) => {
//                 // Already viewing this order, could implement viewing other orders if needed
//                 toast.info("You are currently viewing this order");
//               }}
//             />
//           </>
//         )}
//       </DialogContent>
//     </Dialog>
//   );
// }



import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/use-user-role";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { getOrderStatusBadgeVariant } from "@/lib/badge-variants";
import { format } from "date-fns";
import { toast } from "sonner";
import { Edit2, Save, X, ExternalLink, Pencil } from "lucide-react";
import { OrderNotes } from "./order-notes";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { EnrollingAffiliateChangeDialog } from "../shared/enrolling-affiliate-change-dialog";
import { CommissionAdjustmentDialog } from "../shared/commission-adjustment-dialog";
import { analyzeSingleOrderCommissionImpact, applyCommissionAdjustments, CommissionImpact } from "@/lib/commission-utils";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { getOrderById, updateOrderStatus, getCommissionsByOrder } from "@/api/orders"
import { useShopifyStore } from "@/store/useAuthStore";
import { useDateFormatStore } from "@/store/useDateFormat";
import { getDateFormatString } from "@/utils/resolveDateFormat";


interface OrderDetailDialogProps {
  orderId: string;
  customerType: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}
const ORDER_STATUS_MAP: Record<number, string> = {
  0: "Pending",
  1: "Accepted",
  2: "Paid",
  3: "Fulfilled",
  4: "Refunded",
  5: "Canceled", // note: use consistent casing
  6: "Printed",
  7: "Shipped"

} as const;

const STATUS_OPTIONS = [
  { value: 0, label: "Pending" },
  { value: 1, label: "Accepted" },
  { value: 2, label: "Paid" },
  { value: 3, label: "Fulfilled" },
  { value: 4, label: "Refunded" },
  { value: 5, label: "Canceled" },
  { value: 6, label: "Printed" },
  { value: 7, label: "Shipped" },
];
export function OrderDetailDialog({ orderId, customerType, open, onOpenChange }: OrderDetailDialogProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [showAffiliateSelector, setShowAffiliateSelector] = useState(false);
  const [showAffiliateChangeDialog, setShowAffiliateChangeDialog] = useState(false);
  const [showCommissionAdjustmentDialog, setShowCommissionAdjustmentDialog] = useState(false);
  const [pendingAffiliateChange, setPendingAffiliateChange] = useState<{ newId: string; newName: string; newAffiliateId: string } | null>(null);
  const [commissionImpacts, setCommissionImpacts] = useState<CommissionImpact[]>([]);
  const queryClient = useQueryClient();
  const shopifyUrl = useShopifyStore((state) => state.shopifyUrl);

  const { dateFormatRegion, dateFormatVariant } = useDateFormatStore();
  const formatString = getDateFormatString(dateFormatRegion, dateFormatVariant);

  const { isAdmin, isAffiliate } = useUserRole();
  const {
    data: orderResponse,
    isLoading: orderLoading,
    error,
  } = useQuery({
    queryKey: ["order", orderId],
    queryFn: () => getOrderById(orderId, customerType), // static customer type for now
    enabled: !!orderId, // prevents running if orderId is empty/falsy
  });

  const customer = orderResponse?.customer;
  const order = orderResponse?.order;
  const currentStatusText = ORDER_STATUS_MAP[order?.orderStatus] || "Unknown";


  // Initialize selectedStatus when order loads
  useEffect(() => {
    if (order?.orderStatus !== undefined && !isEditing) {
      setSelectedStatus(order.orderStatus.toString());
    }
  }, [order?.orderStatus, isEditing]);

  const { data: commisionsByOrders, isLoading: commisionIsLoading } = useQuery({
    queryKey: ["commissionOrders", orderId],
    queryFn: () => getCommissionsByOrder(orderId)
  })

  const compensationPlan = commisionsByOrders?.data?.compensationLevels;
  const orderCommissions = commisionsByOrders?.data?.commisionData;


  // Query for all affiliates (for affiliate selector)
  const { data: allAffiliates } = useQuery({
    queryKey: ["all-affiliates-for-selection"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("affiliates")
        .select("id, affiliate_id, first_name, last_name")
        .eq("status", "active")
        .order("first_name");

      if (error) throw error;
      return data;
    },
    enabled: showAffiliateSelector,
  });


  const updateStatusMutation = useMutation({
    mutationFn: (newStatus: number) => updateOrderStatus(orderId, newStatus),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["order", orderId] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["customer-orders-edit-dialog"] });
      queryClient.invalidateQueries({ queryKey: ["customer-orders"] });




      toast.success("Status updated successfully");
      setIsEditing(false);
    },
    onError: () => {
      toast.error("Failed to update status");
    },
  });




  const handleSaveStatus = () => {
    const newStatusNum = parseInt(selectedStatus);
    if (newStatusNum !== order.orderStatus) {
      updateStatusMutation.mutate(newStatusNum);
    } else {
      setIsEditing(false);
    }
  };

  const handleAffiliateSelect = async (affiliateId: string) => {
    if (!customer || !orderCommissions || orderCommissions.length === 0) return;

    const currentLevel1Commission = orderCommissions.find((c: any) => c.level === 1);
    if (!currentLevel1Commission) {
      toast.error("No Level 1 commission found for this order");
      return;
    }

    const currentAffiliateId = currentLevel1Commission.affiliate.id;
    if (affiliateId === currentAffiliateId) {
      toast.info("Selected affiliate is already the enrolling affiliate");
      setShowAffiliateSelector(false);
      return;
    }

    const selectedAffiliate = allAffiliates?.find(a => a.id === affiliateId);
    if (!selectedAffiliate) return;

    setPendingAffiliateChange({
      newId: affiliateId,
      newName: `${selectedAffiliate.first_name} ${selectedAffiliate.last_name}`,
      newAffiliateId: selectedAffiliate.affiliate_id
    });
    setShowAffiliateSelector(false);
    setShowAffiliateChangeDialog(true);
  };

  const handleAffiliateChangeConfirm = async (note?: string) => {
    if (!pendingAffiliateChange) return;

    setShowAffiliateChangeDialog(false);

    const loadingToast = toast.loading("Analyzing commission impact...");

    try {
      // Analyze commission impact for this specific order only
      const impacts = await analyzeSingleOrderCommissionImpact(
        orderId,
        pendingAffiliateChange.newId
      );

      toast.dismiss(loadingToast);

      // Always show commission adjustment dialog to give admin control
      // Even if there are no impacts, admin should be able to choose
      setCommissionImpacts(impacts);
      setShowCommissionAdjustmentDialog(true);
    } catch (error) {
      toast.dismiss(loadingToast);
      toast.error("Failed to analyze commission impact");
      console.error(error);
    }
  };

  const handleCommissionAdjustmentConfirm = async (approvedImpacts: CommissionImpact[], selectedOrderIds: string[], note?: string) => {
    if (!pendingAffiliateChange || !customer) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Not authenticated");
      return;
    }

    setShowCommissionAdjustmentDialog(false);

    const loadingToast = toast.loading("Updating order commissions...");

    try {
      // Step 1: Update customer's enrolled_by to new affiliate
      const { error: customerError } = await supabase
        .from("customers")
        .update({ enrolled_by: pendingAffiliateChange.newId })
        .eq("id", customer.id);

      if (customerError) throw customerError;

      // Step 2: Get new affiliate hierarchy for commission recalculation
      const { data: newAffiliate } = await supabase
        .from("affiliates")
        .select("id, enrolled_by, affiliate_id, first_name, last_name")
        .eq("id", pendingAffiliateChange.newId)
        .single();

      if (!newAffiliate) throw new Error("New affiliate not found");

      // Step 3: Get compensation plan for commission rates
      const { data: compPlan } = await supabase
        .from("compensation_plans")
        .select("level_percentages")
        .limit(1)
        .single();

      const levelPercentages = compPlan?.level_percentages as Record<string, number> || { "1": 25, "2": 12 };

      // Step 4: Delete old commission records for this order
      await supabase
        .from("order_commissions")
        .delete()
        .eq("order_id", orderId);

      // Step 5: Create new commission records based on new hierarchy
      const { data: orderData } = await supabase
        .from("orders")
        .select("amount")
        .eq("id", orderId)
        .single();

      if (!orderData) throw new Error("Order not found");

      const orderAmount = typeof orderData.amount === 'string' ? parseFloat(orderData.amount) : Number(orderData.amount);
      const newCommissions: any[] = [];

      // Level 1 commission
      const level1Rate = levelPercentages["1"] || 25;
      newCommissions.push({
        order_id: orderId,
        affiliate_id: newAffiliate.id,
        level: 1,
        commission_rate: level1Rate,
        commission_amount: (orderAmount * level1Rate) / 100
      });

      // Level 2 commission (if new affiliate has an upline)
      if (newAffiliate.enrolled_by) {
        const level2Rate = levelPercentages["2"] || 12;
        newCommissions.push({
          order_id: orderId,
          affiliate_id: newAffiliate.enrolled_by,
          level: 2,
          commission_rate: level2Rate,
          commission_amount: (orderAmount * level2Rate) / 100
        });
      }

      // Insert new commission records
      const { error: commissionsError } = await supabase
        .from("order_commissions")
        .insert(newCommissions);

      if (commissionsError) throw commissionsError;

      // Step 6: Apply commission adjustments (for notes and clawbacks/credits if needed)
      if (approvedImpacts.length > 0) {
        await applyCommissionAdjustments(
          approvedImpacts,
          note,
          user.id,
          orderId,
          'customer'
        );
      }

      // Step 7: Add note to customer about enrolling affiliate change
      const customerNoteText = `Enrolling affiliate changed to ${pendingAffiliateChange.newName} (${pendingAffiliateChange.newAffiliateId})${note ? `\nReason: ${note}` : ''}`;
      await supabase.from("customer_notes").insert([{
        customer_id: customer.id,
        note_text: customerNoteText,
        note_type: "note",
        created_by: user.id
      }]);

      toast.dismiss(loadingToast);

      setPendingAffiliateChange(null);
      setCommissionImpacts([]);

      // Invalidate and refetch queries to update the UI
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["customer", customer.id] }),
        queryClient.invalidateQueries({ queryKey: ["order-commissions", orderId] }),
        queryClient.invalidateQueries({ queryKey: ["order", orderId] }),
        queryClient.invalidateQueries({ queryKey: ["admin-orders"] }),
        queryClient.invalidateQueries({ queryKey: ["customer-orders"] }),
      ]);

      // Force refetch to ensure the UI updates with new data
      await queryClient.refetchQueries({ queryKey: ["order-commissions", orderId] });

      toast.success("Order enrolling affiliate updated successfully");
    } catch (error) {
      toast.dismiss(loadingToast);
      console.error("Failed to update order commissions:", error);
      toast.error("Failed to update order commissions");
    }
  };

  const handleCommissionAdjustmentCancel = () => {
    setShowCommissionAdjustmentDialog(false);
    setShowAffiliateChangeDialog(false);
    setCommissionImpacts([]);
    setPendingAffiliateChange(null);
  };

  if (orderLoading) {
    return (
      <Dialog open={open}
        onOpenChange={onOpenChange}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="text-center py-8">Loading order details...</div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!order) return null;

  return (
    <Dialog open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between pr-4">
            <DialogTitle className="text-2xl font-bold">
              Order #{order.orderId}
            </DialogTitle>
            <div className="flex items-center gap-2">
              {isEditing ? (
                <>
                  <Button size="sm" variant="outline" onClick={() => setIsEditing(false)}>
                    <X className="h-4 w-4 mr-1" />
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleSaveStatus}>
                    <Save className="h-4 w-4 mr-1" />
                    Save
                  </Button>
                </>
              ) : (
                <>
                  {isAdmin && !isAffiliate && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(`${shopifyUrl}/orders/${order.orderId}`, '_blank')}
                      >
                        <ExternalLink className="h-4 w-4 mr-1" />
                        View in Shopify
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>
                        <Edit2 className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="commissions">Commissions</TabsTrigger>
            <TabsTrigger value="notes">Notes & History</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-6 mt-6">
            {/* Order Status Section */}
            <div className="bg-muted/50 p-6 rounded-lg space-y-4">
              <h3 className="text-lg font-semibold">Order Status</h3>
              <Separator />
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Current Status:</span>
                {isEditing && isAdmin && !isAffiliate ? (
                  <Select value={selectedStatus.toString()} onValueChange={(val) => setSelectedStatus(val)}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value.toString()}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Badge variant={getOrderStatusBadgeVariant(currentStatusText as any)}>
                    {currentStatusText}
                  </Badge>
                )}
              </div>
            </div>

            {/* Order Information */}
            <div className="bg-muted/50 p-6 rounded-lg space-y-4">
              <h3 className="text-lg font-semibold">Order Information</h3>
              <Separator />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Order No.</p>
                  <p className="font-medium">{order.orderId}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Shopify Order #</p>
                  {order.shopifyOrderId ? (
                    <a
                      href={`${shopifyUrl}/orders/${order.orderId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-primary hover:underline cursor-pointer"
                    >
                      {order.shopifyOrderId}
                    </a>
                  ) : (
                    <p className="font-medium">N/A</p>
                  )}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Date</p>
                  <p className="font-medium">
                    {format(new Date(order.orderDate), `${formatString} h:mm a`)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Subscription</p>
                  <p className="font-medium">{order.subscription ? "Yes" : "No"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Shipping Method</p>
                  <p className="font-medium">{order.shoppingMethod || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Sales Tax ID</p>
                  <p className="font-medium">{order.salesTaxId || "N/A"}</p>
                </div>
              </div>
            </div>

            {/* Customer Information */}
            {customer && (
              <div className="bg-muted/50 p-6 rounded-lg space-y-4">
                <h3 className="text-lg font-semibold">Customer Information</h3>
                <Separator />
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Placed By ID</p>
                    <p className="font-medium">
                      {order.orderBy === "customer"
                        ? order.selfCustomerId
                        : order.selfAffiliateId
                      }
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Customer Name</p>
                    <p className="font-medium">
                      {customer.firstName} {customer.lastName}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{customer.email || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Phone</p>
                    <p className="font-medium">{customer.phone || "N/A"}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Shipping and Billing Address */}
            <div className="bg-muted/50 p-6 rounded-lg space-y-4">
              <h3 className="text-lg font-semibold">Address Information</h3>
              <Separator />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Shipping Address */}
                <div>
                  <p className="text-sm text-muted-foreground mb-2 font-semibold">Shipping Address</p>
                  {order.shippingAddress?.line1 ? (
                    <div className="font-medium space-y-1">
                      <p>{order.shippingAddress?.line1}</p>
                      {order.shippingAddress?.line2 && <p>{order.shippingAddress?.line2}</p>}
                      <p>{order.shippingAddress?.city}, {order.shippingAddress?.state} {order.shippingAddress?.postalCode}</p>
                      <p>{order.shippingAddress?.country}</p>
                    </div>
                  ) : (
                    <p className="font-medium text-muted-foreground">No shipping address on file</p>
                  )}
                </div>

                {/* Billing Address */}
                <div>
                  <p className="text-sm text-muted-foreground mb-2 font-semibold">Billing Address</p>
                  {order.billingSameAsShipping ? (
                    <p className="font-medium italic text-muted-foreground">Same as Shipping Address</p>
                  ) : order.billingAddress?.line1 ? (
                    <div className="font-medium space-y-1">
                      <p>{order.billingAddress?.line1}</p>
                      {order.billingAddress?.line2 && <p>{order.billingAddress?.line2}</p>}
                      <p>{order.billingAddress?.city}, {order.billingAddress?.state} {order.billingAddress?.postalCode}</p>
                      <p>{order.billingAddress?.country}</p>
                    </div>
                  ) : (
                    <p className="font-medium text-muted-foreground">No billing address on file</p>
                  )}
                </div>
              </div>
            </div>

            {/* Order Items */}
            <div className="bg-muted/50 p-6 rounded-lg space-y-4">
              <h3 className="text-lg font-semibold">Order Items</h3>
              <Separator />
              {order?.lineItems && order?.lineItems.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-2 text-sm font-semibold">Item ID</th>
                        <th className="text-left py-3 px-2 text-sm font-semibold">Description</th>
                        <th className="text-center py-3 px-2 text-sm font-semibold">Quantity</th>
                        <th className="text-right py-3 px-2 text-sm font-semibold">Price</th>
                        <th className="text-right py-3 px-2 text-sm font-semibold">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {order?.lineItems.map((item) => (
                        <tr key={item.id} className="border-b">
                          <td className="py-3 px-2 text-sm">{item.productId}</td>
                          <td className="py-3 px-2 text-sm">{item.description}</td>
                          <td className="py-3 px-2 text-sm text-center">{item.quantity}</td>
                          <td className="py-3 px-2 text-sm text-right">
                            {formatCurrency(item.unitPrice)}
                          </td>
                          <td className="py-3 px-2 text-sm text-right font-medium">
                            {formatCurrency(item.totalPrice)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No items found for this order
                </div>
              )}
            </div>

            {/* Payment Details */}
            <div className="bg-muted/50 p-6 rounded-lg space-y-4">
              <h3 className="text-lg font-semibold">Payment Details</h3>
              <Separator />
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm text-muted-foreground">Payment Method</p>
                  <p className="font-medium">{order.paymentMethod || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Payment Date</p>
                  <p className="font-medium">
                    {order.paymentDate
                      ? format(new Date(order.paymentDate), `${formatString} h:mm a`)
                      : "N/A"}
                  </p>
                </div>
                {order.cancelledDate && (
                  <div>
                    <p className="text-sm text-muted-foreground">Cancelled Date</p>
                    <p className="font-medium text-destructive">
                      {format(new Date(order.cancelledDate), `${formatString} h:mm a`)}
                    </p>
                  </div>
                )}
                {order.refundedDate && (
                  <div>
                    <p className="text-sm text-muted-foreground">Refunded Date</p>
                    <p className="font-medium text-orange-500">
                      {format(new Date(order.refundedDate), `${formatString} h:mm a`)}
                    </p>
                  </div>
                )}
              </div>
              <Separator />
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal:</span>
                  <span className="font-medium">
                    {formatCurrency(order.subtotal || 0)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Shipping:</span>
                  <span className="font-medium">
                    {formatCurrency(order.shippingCost || 0)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Taxes:</span>
                  <span className="font-medium">
                    {formatCurrency(order.taxAmount || 0)}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between text-base font-bold">
                  <span>Total:</span>
                  <span>{formatCurrency(order.amount)}</span>
                </div>
                <div className="flex justify-between text-base font-bold text-primary">
                  <span>Amount Paid:</span>
                  <span>{formatCurrency(order.amountPaid || 0)}</span>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="commissions" className="space-y-6 mt-6">
            <div className="bg-muted/50 p-6 rounded-lg space-y-4">
              <h3 className="text-lg font-semibold">Commission Breakdown</h3>
              <Separator />

              {!compensationPlan ? (
                <div className="text-center py-8 text-muted-foreground">
                  No compensation plan configured
                </div>
              ) : !orderCommissions || orderCommissions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No commission data available for this order
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-background p-4 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-2">Compensation Plan</p>
                    <p className="font-medium">{compensationPlan}-Level Program</p>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-2 text-sm font-semibold">Level</th>
                          <th className="text-left py-3 px-2 text-sm font-semibold">Affiliate</th>
                          <th className="text-left py-3 px-2 text-sm font-semibold">Customer ID</th>
                          <th className="text-right py-3 px-2 text-sm font-semibold">Rate</th>
                          <th className="text-right py-3 px-2 text-sm font-semibold">Commission</th>
                          {/* <th className="text-center py-3 px-2 text-sm font-semibold">Actions</th> */}
                        </tr>
                      </thead>
                      <tbody>
                        {orderCommissions.map((commission: any) => (
                          <tr key={commission.id} className="border-b">
                            <td className="py-3 px-2 text-sm">Level {commission.level}</td>
                            <td className="py-3 px-2 text-sm">
                              {commission.firstName} {commission.lastName}
                            </td>
                            <td className="py-3 px-2 text-sm">{commission.selfAffiliateId}</td>
                            <td className="py-3 px-2 text-sm text-right">
                              {`${commission?.commissionRate?.toFixed(2)}%`}
                            </td>
                            <td className="py-3 px-2 text-sm text-right font-medium text-primary">
                              {formatCurrency(commission.commissionAmount)}
                            </td>
                            {/* <td className="py-3 px-2 text-center">
                              {commission.level === 1 && isAdmin && !isAffiliate && (
                                <Popover open={showAffiliateSelector}
                                  onOpenChange={setShowAffiliateSelector}
                                >
                                  <PopoverTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-8 w-8 p-0"
                                    >
                                      <Pencil className="h-4 w-4" />
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-[300px] p-0" align="end">
                                    <Command>
                                      <CommandInput placeholder="Search affiliates..." />
                                      <CommandList>
                                        <CommandEmpty>No affiliates found.</CommandEmpty>
                                        <CommandGroup>
                                          {allAffiliates?.map((affiliate) => (
                                            <CommandItem
                                              key={affiliate.id}
                                              value={`${affiliate.first_name} ${affiliate.last_name} ${affiliate.affiliate_id}`}
                                              onSelect={() => handleAffiliateSelect(affiliate.id)}
                                            >
                                              <div className="flex flex-col">
                                                <span>{affiliate.first_name} {affiliate.last_name}</span>
                                                <span className="text-xs text-muted-foreground">{affiliate.affiliate_id}</span>
                                              </div>
                                            </CommandItem>
                                          ))}
                                        </CommandGroup>
                                      </CommandList>
                                    </Command>
                                  </PopoverContent>
                                </Popover>
                              )}
                            </td> */}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="bg-primary/10 p-4 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold">Total Commissions:</span>
                      <span className="text-xl font-bold text-primary">
                        {formatCurrency(commisionsByOrders?.data?.totalCommission)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Calculated on subtotal: {formatCurrency(order.subtotal || 0)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="notes" className="space-y-6 mt-6">
            <OrderNotes orderId={orderId} />
          </TabsContent>
        </Tabs>

        {/* Dialogs for affiliate change flow */}
        {pendingAffiliateChange && customer && orderCommissions && orderCommissions.length > 0 && (
          <>
            <EnrollingAffiliateChangeDialog
              open={showAffiliateChangeDialog}
              onOpenChange={setShowAffiliateChangeDialog}
              oldAffiliateName={`${orderCommissions.find((c: any) => c.level === 1)?.affiliate.first_name} ${orderCommissions.find((c: any) => c.level === 1)?.affiliate.last_name}`}
              oldAffiliateId={orderCommissions.find((c: any) => c.level === 1)?.affiliate.affiliate_id}
              newAffiliateName={pendingAffiliateChange.newName}
              newAffiliateId={pendingAffiliateChange.newAffiliateId}
              onConfirm={handleAffiliateChangeConfirm}
            />

            <CommissionAdjustmentDialog
              open={showCommissionAdjustmentDialog}
              onOpenChange={setShowCommissionAdjustmentDialog}
              entityName={`${customer.firstName} ${customer.lastName}`}
              impacts={commissionImpacts}
              onConfirm={handleCommissionAdjustmentConfirm}
              onCancel={handleCommissionAdjustmentCancel}
              onViewOrder={(orderId) => {
                // Already viewing this order, could implement viewing other orders if needed
                toast.info("You are currently viewing this order");
              }}
            />
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
