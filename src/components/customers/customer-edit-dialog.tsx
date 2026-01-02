// import { useForm } from "react-hook-form";
// import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
// import { supabase } from "@/integrations/supabase/client";
// import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
// import { Input } from "@/components/ui/input";
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// import { Button } from "@/components/ui/button";
// import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
// import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
// import { Badge } from "@/components/ui/badge";
// import { Check, Search, ArrowLeft, MoreVertical, Trash2, StickyNote, Pencil, ShoppingCart, Eye, EyeOff } from "lucide-react";
// import { cn, formatCurrency } from "@/lib/utils";
// import { toast } from "sonner";
// import { useState, useMemo, useEffect } from "react";
// import { getOrderStatusBadgeVariant } from "@/lib/badge-variants";
// import { format } from "date-fns";
// import { CustomerNotes } from "./customer-notes";
// import { OrderDetailDialog } from "./order-detail-dialog";
// import { NotesDialog } from "../shared/notes-dialog";
// import { EnrollingAffiliateChangeDialog } from "../shared/enrolling-affiliate-change-dialog";
// import { PhoneNumbersCompactManager, PhoneNumber } from "../shared/phone-numbers-compact-manager";
// import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
// import { Mail, MailX } from "lucide-react";
// import { ShopifyUpdateDialog } from "../shared/shopify-update-dialog";
// import { ShopifyMetadataUpdateDialog } from "../shared/shopify-metadata-update-dialog";
// import { CommissionAdjustmentDialog } from "../shared/commission-adjustment-dialog";
// import { analyzeCustomerCommissionImpact, applyCommissionAdjustments, CommissionImpact } from "@/lib/commission-utils";
// import { useUserRole } from "@/hooks/use-user-role";
// import { Customer } from "@/types";
// // interface Customer {
// //   id: string;
// //   customer_id: string;
// //   first_name: string;
// //   last_name: string;
// //   email: string;
// //   phone: string | null;
// //   phone_numbers?: PhoneNumber[];
// //   addressLineOne: string | null;
// //   addressLineTwo?: string | null;
// //   city: string | null;
// //   state_province: string | null;
// //   postal_code: string | null;
// //   country: string;
// //   status: string;
// //   enrolled_by: string | null;
// //   email_opted_out?: boolean;
// //   email_opted_out_at?: string | null;
// // }

// interface CustomerEditDialogProps {
//   customer: Customer;
//   open: boolean;
//   onOpenChange: (open: boolean) => void;
//   viewingContext?: {
//     affiliateName: string;
//   } | null;
//   onBack?: () => void;
//   readOnly?: boolean;
// }

// export function CustomerEditDialog({ customer, open, onOpenChange, viewingContext, onBack, readOnly = false }: CustomerEditDialogProps) {
//   console.log(customer);
//   const queryClient = useQueryClient();
//   const { isAffiliate } = useUserRole();
//   const [affiliateSearch, setAffiliateSearch] = useState("");
//   const [currentEnrollingAffiliate, setCurrentEnrollingAffiliate] = useState<{ id: string; name: string; affiliateId: string } | null>(null);
//   const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
//   const [searchTerm, setSearchTerm] = useState("");
//   const [startDate, setStartDate] = useState("");
//   const [endDate, setEndDate] = useState("");
//   const [showAffiliateChangeDialog, setShowAffiliateChangeDialog] = useState(false);
//   const [pendingAffiliateChange, setPendingAffiliateChange] = useState<{ newId: string; newName: string; newAffiliateId: string; oldId: string; oldName: string; oldAffiliateId: string } | null>(null);
//   const [emailOptedOut, setEmailOptedOut] = useState(customer.email_opted_out || false);
//   const [phoneNumbers, setPhoneNumbers] = useState<PhoneNumber[]>(customer.phone_numbers || []);
//   const [notesOrderId, setNotesOrderId] = useState<string | null>(null);
//   const [notesOrderNumber, setNotesOrderNumber] = useState<string>("");
//   const [showShopifyDialog, setShowShopifyDialog] = useState(false);
//   const [pendingFormData, setPendingFormData] = useState<any>(null);
//   const [showCommissionAdjustmentDialog, setShowCommissionAdjustmentDialog] = useState(false);
//   const [commissionImpacts, setCommissionImpacts] = useState<CommissionImpact[]>([]);
//   const [showShopifyMetadataDialog, setShowShopifyMetadataDialog] = useState(false);
//   const [shopifyMetadataSiteNames, setShopifyMetadataSiteNames] = useState<{ oldSiteName: string; newSiteName: string } | null>(null);
//   const [enrollingAffiliateChanged, setEnrollingAffiliateChanged] = useState(false);
//   const [showPasswordChangeDialog, setShowPasswordChangeDialog] = useState(false);
//   const [pendingPassword, setPendingPassword] = useState<string>("");
//   const [passwordChangeNote, setPasswordChangeNote] = useState<string>("");
//   const [isSendingTempPassword, setIsSendingTempPassword] = useState(false);
//   const [showPassword, setShowPassword] = useState(false);

//   const { data: affiliates } = useQuery({
//     queryKey: ["affiliates"],
//     queryFn: async () => {
//       const { data, error } = await supabase
//         .from("affiliates" as any)
//         .select("id, affiliate_id, first_name, last_name")
//         .eq("status", "active")
//         .order("first_name");

//       if (error) throw error;
//       return data as any;
//     },
//   });

//   // Get current enrolling affiliate details
//   useEffect(() => {
//     const fetchEnrollingAffiliate = async () => {
//       if (customer.enrolled_by && affiliates) {
//         const affiliate = affiliates.find(a => a.id === customer.enrolled_by);
//         if (affiliate) {
//           setCurrentEnrollingAffiliate({
//             id: affiliate.id,
//             name: `${affiliate.first_name} ${affiliate.last_name}`,
//             affiliateId: affiliate.affiliate_id
//           });
//         }
//       } else {
//         setCurrentEnrollingAffiliate(null);
//       }
//     };
//     fetchEnrollingAffiliate();
//   }, [customer.enrolled_by, affiliates, open]);

//   const filteredAffiliates = useMemo(() => {
//     if (!affiliateSearch.trim()) return [];

//     return affiliates?.filter((affiliate) => {
//       const fullName = `${affiliate.first_name} ${affiliate.last_name}`.toLowerCase();
//       return fullName.includes(affiliateSearch.toLowerCase());
//     }) || [];
//   }, [affiliates, affiliateSearch]);

//   const { data: orders, isLoading: ordersLoading } = useQuery({
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

//   const form = useForm({
//     defaultValues: {
//       first_name: customer.first_name,
//       last_name: customer.last_name,
//       email: customer.email,
//       phone: customer.phone || "",
//       address: customer.addressLineOne || "",
//       address2: customer.addressLineTwo || "",
//       city: customer.city || "",
//       state_province: customer.state_province || "",
//       postal_code: customer.postal_code || "",
//       country: customer.country,
//       status: customer.status,
//       enrolled_by: customer.enrolled_by || "",
//       password: "",
//     },
//   });

//   const updateMutation = useMutation({
//     mutationFn: async (data: any & { affiliateChangeNote?: string; updateShopify?: boolean; passwordChangeNote?: string }) => {
//       const { data: { user } } = await supabase.auth.getUser();
//       if (!user) throw new Error("Not authenticated");

//       // Check if enrolling affiliate changed
//       const affiliateChanged = data.enrolled_by !== customer.enrolled_by;
//       setEnrollingAffiliateChanged(affiliateChanged);
//       const emailOptOutChanged = data.email_opted_out !== customer.email_opted_out;
//       const passwordChanged = data.password && data.password.length > 0;

//       // Prepare update data
//       const updateData: any = { ...data };
//       delete updateData.affiliateChangeNote;
//       delete updateData.updateShopify;
//       delete updateData.password;
//       delete updateData.passwordChangeNote;

//       if (emailOptOutChanged) {
//         updateData.email_opted_out_at = data.email_opted_out ? new Date().toISOString() : null;
//       }

//       // Add phone numbers to update data
//       updateData.phone_numbers = phoneNumbers;

//       // Store updateShopify flag in metadata for developers to use
//       if (data.updateShopify !== undefined) {
//         console.log('Shopify update requested:', data.updateShopify);
//         // Developers can implement Shopify API integration here
//       }

//       // Update customer
//       const { error } = await supabase
//         .from("customers")
//         .update(updateData)
//         .eq("id", customer.id);

//       if (error) throw error;

//       // Handle password change
//       if (passwordChanged) {
//         try {
//           // First, find the auth user by email
//           const { data: listData, error: listError } = await supabase.functions.invoke('admin-user-management', {
//             body: { action: 'listUsers' }
//           });

//           if (listError) {
//             console.error("Failed to list users:", listError);
//             throw new Error(`Failed to find user account: ${listError.message}`);
//           }

//           const authUser = listData?.users?.find((u: any) => u.email === customer.email);

//           if (!authUser) {
//             throw new Error("No authentication account found for this customer. They may need to sign up first.");
//           }

//           // Update the password using the edge function
//           const { data: updateData, error: updateError } = await supabase.functions.invoke('admin-user-management', {
//             body: {
//               action: 'updatePassword',
//               userId: authUser.id,
//               password: data.password
//             }
//           });

//           if (updateError) {
//             console.error("Failed to update password:", updateError);
//             throw new Error(`Failed to update password: ${updateError.message}`);
//           }

//           console.log("Password updated successfully:", updateData);
//         } catch (passwordError: any) {
//           console.error("Password change error:", passwordError);
//           throw new Error(passwordError.message || "Failed to update password");
//         }

//         const { data: profile } = await supabase
//           .from("profiles")
//           .select("first_name, last_name")
//           .eq("id", user.id)
//           .single();

//         const adminName = profile 
//           ? `${profile.first_name} ${profile.last_name}`.trim() || "Admin"
//           : "Admin";

//         const noteText = `Password updated by ${adminName} on ${format(new Date(), "MMM d, yyyy h:mm a")}${data.passwordChangeNote ? `\nReason: ${data.passwordChangeNote}` : ''}`;

//         const { error: noteError } = await supabase
//           .from("customer_notes")
//           .insert({
//             customer_id: customer.id,
//             note_text: noteText,
//             note_type: "note",
//             created_by: user.id,
//           });

//         if (noteError) {
//           console.error("Failed to create password change note:", noteError);
//           toast.error("Password updated but failed to create note in history");
//         }
//       }

//       // If enrolling affiliate changed, create a note
//       if (affiliateChanged && pendingAffiliateChange) {
//         let noteText = `Enrolling affiliate changed from ${pendingAffiliateChange.oldName} to ${pendingAffiliateChange.newName}`;
//         if (data.affiliateChangeNote) {
//           noteText += `\nReason: ${data.affiliateChangeNote}`;
//         }

//         const { error: noteError } = await supabase
//           .from("customer_notes")
//           .insert({
//             customer_id: customer.id,
//             note_text: noteText,
//             note_type: "note",
//             created_by: user.id,
//           });

//         if (noteError) console.error("Failed to create affiliate change note:", noteError);
//       }

//       // If email opt-out status changed, create a note
//       if (emailOptOutChanged) {
//         const { data: profile } = await supabase
//           .from("profiles")
//           .select("first_name, last_name")
//           .eq("id", user.id)
//           .single();

//         const adminName = profile 
//           ? `${profile.first_name} ${profile.last_name}`.trim() || "Admin"
//           : "Admin";

//         const noteText = data.email_opted_out
//           ? `Manually opted out of emails by ${adminName}`
//           : `Manually opted in to emails by ${adminName}`;

//         const { error: noteError } = await supabase
//           .from("customer_notes")
//           .insert({
//             customer_id: customer.id,
//             note_text: noteText,
//             note_type: "note",
//             created_by: user.id,
//           });

//         if (noteError) console.error("Failed to create opt-out change note:", noteError);
//       }
//     },
//     onSuccess: async () => {
//       queryClient.invalidateQueries({ queryKey: ["customers"] });
//       queryClient.invalidateQueries({ queryKey: ["customer-notes", customer.id] });
//       toast.success("Customer updated successfully");

//       // If enrolling affiliate changed, show Shopify metadata dialog
//       if (enrollingAffiliateChanged && pendingAffiliateChange) {
//         // Fetch old and new affiliate site names
//         const { data: affiliateData } = await supabase
//           .from("affiliates")
//           .select("id, site_name")
//           .in("id", [customer.enrolled_by!, pendingAffiliateChange.newId]);

//         if (affiliateData) {
//           const oldAffiliate = affiliateData.find(a => a.id === customer.enrolled_by);
//           const newAffiliate = affiliateData.find(a => a.id === pendingAffiliateChange.newId);

//           setShopifyMetadataSiteNames({
//             oldSiteName: oldAffiliate?.site_name || "None",
//             newSiteName: newAffiliate?.site_name || "None"
//           });
//           setShowShopifyMetadataDialog(true);
//           return;
//         }
//       }

//       onOpenChange(false);
//     },
//     onError: () => {
//       toast.error("Failed to update customer");
//     },
//   });

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

//   const handleAffiliateChangeConfirm = async (note?: string) => {
//     if (pendingAffiliateChange) {
//       setShowAffiliateChangeDialog(false);

//       // Show loading dialog while analyzing
//       const loadingToast = toast.loading("Analyzing commission impact...");

//       try {
//         // Analyze commission impact
//         const impacts = await analyzeCustomerCommissionImpact(
//           customer.id,
//           customer.enrolled_by!,
//           pendingAffiliateChange.newId
//         );

//         toast.dismiss(loadingToast);

//         if (impacts.length > 0) {
//           // Show commission adjustment dialog
//           setCommissionImpacts(impacts);
//           setShowCommissionAdjustmentDialog(true);
//           return;
//         }

//         // No commission impacts, proceed with change
//         const formData = { ...form.getValues(), email_opted_out: emailOptedOut };
//         formData.enrolled_by = pendingAffiliateChange.newId;
//         if (note) {
//           (formData as any).affiliateChangeNote = note;
//         }

//         // Check if Shopify-relevant fields changed
//         if (hasShopifyFieldsChanged(formData)) {
//           setPendingFormData(formData);
//           setShowShopifyDialog(true);
//           return;
//         }

//         updateMutation.mutate(formData);
//         setPendingAffiliateChange(null);
//       } catch (error) {
//         toast.dismiss(loadingToast);
//         toast.error("Failed to analyze commission impact");
//         console.error(error);
//       }
//     }
//   };

//   const handleCommissionAdjustmentConfirm = async (approvedImpacts: CommissionImpact[], selectedOrderIds: string[], note?: string) => {
//     if (!pendingAffiliateChange) return;

//     const { data: { user } } = await supabase.auth.getUser();
//     if (!user) {
//       toast.error("Not authenticated");
//       return;
//     }

//     try {
//       // Apply commission adjustments
//       await applyCommissionAdjustments(
//         approvedImpacts,
//         note,
//         user.id,
//         customer.id,
//         'customer'
//       );

//       // Ensure the customer is updated to the new enrolling affiliate before recalculation
//       await supabase
//         .from("customers")
//         .update({ enrolled_by: pendingAffiliateChange.newId })
//         .eq("id", customer.id);

//       // Recalculate commissions for selected orders to ensure L1/L2 are correct
//       if (selectedOrderIds && selectedOrderIds.length > 0) {
//         // Fetch plan percentages
//         const { data: compPlan } = await supabase
//           .from("compensation_plans")
//           .select("level_percentages")
//           .limit(1)
//           .single();
//         const levelPercentages = (compPlan?.level_percentages as Record<string, number>) || { "1": 25, "2": 12 };

//         // Fetch new affiliate and upline
//         const { data: newAffiliate } = await supabase
//           .from("affiliates")
//           .select("id, enrolled_by")
//           .eq("id", pendingAffiliateChange.newId)
//           .single();

//         for (const oid of selectedOrderIds) {
//           const { data: orderData } = await supabase
//             .from("orders")
//             .select("amount")
//             .eq("id", oid)
//             .single();
//           if (!orderData) continue;
//           const orderAmount = typeof orderData.amount === 'string' ? parseFloat(orderData.amount) : Number(orderData.amount);

//           // Remove existing commissions and recreate
//           await supabase.from("order_commissions").delete().eq("order_id", oid);

//           const inserts: any[] = [];
//           const l1Rate = levelPercentages["1"] ?? 25;
//           inserts.push({
//             order_id: oid,
//             affiliate_id: newAffiliate!.id,
//             level: 1,
//             commission_rate: l1Rate,
//             commission_amount: (orderAmount * l1Rate) / 100,
//           });

//           if (newAffiliate?.enrolled_by) {
//             const l2Rate = levelPercentages["2"] ?? 12;
//             inserts.push({
//               order_id: oid,
//               affiliate_id: newAffiliate.enrolled_by,
//               level: 2,
//               commission_rate: l2Rate,
//               commission_amount: (orderAmount * l2Rate) / 100,
//             });
//           }

//           if (inserts.length) {
//             await supabase.from("order_commissions").insert(inserts);
//           }
//         }
//       }

//       // Now proceed with the affiliate change form update + UI refresh
//       const formData = { ...form.getValues(), email_opted_out: emailOptedOut };
//       formData.enrolled_by = pendingAffiliateChange.newId;
//       if (note) {
//         (formData as any).affiliateChangeNote = note;
//       }

//       // Check if Shopify-relevant fields changed
//       if (hasShopifyFieldsChanged(formData)) {
//         setPendingFormData(formData);
//         setShowShopifyDialog(true);
//       } else {
//         updateMutation.mutate(formData);
//       }

//       setPendingAffiliateChange(null);
//       toast.success("Commission adjustments applied successfully");
//     } catch (error) {
//       console.error("Failed to apply commission adjustments:", error);
//       toast.error("Failed to apply commission adjustments");
//     }
//   };

//   const handleCommissionAdjustmentCancel = () => {
//     setShowCommissionAdjustmentDialog(false);
//     setCommissionImpacts([]);
//     setPendingAffiliateChange(null);
//   };

//   const hasShopifyFieldsChanged = (data: any) => {
//     const shopifyFields = ['address', 'address2', 'city', 'state_province', 'postal_code', 'phone', 'email'];
//     return shopifyFields.some(field => data[field] !== customer[field as keyof typeof customer]);
//   };

//   const handleShopifyConfirm = (updateShopify: boolean) => {
//     if (pendingFormData) {
//       updateMutation.mutate({ ...pendingFormData, updateShopify });
//       setPendingFormData(null);
//     }
//     setShowShopifyDialog(false);
//   };

//   const handleShopifyMetadataConfirm = (updateMetadata: boolean) => {
//     if (updateMetadata) {
//       console.log('Shopify metadata update requested:', shopifyMetadataSiteNames);
//       // Developers can implement Shopify META data API integration here
//       // Update the "Exigo Referral" field in Shopify
//     }
//     setShowShopifyMetadataDialog(false);
//     setShopifyMetadataSiteNames(null);
//     setEnrollingAffiliateChanged(false);
//     onOpenChange(false);
//   };

//   const handlePasswordChangeConfirm = () => {
//     if (!passwordChangeNote.trim()) {
//       toast.error("Please provide a reason for the password change");
//       return;
//     }

//     const formData: any = { ...form.getValues(), email_opted_out: emailOptedOut };
//     formData.password = pendingPassword;
//     formData.passwordChangeNote = passwordChangeNote;

//     updateMutation.mutate(formData);
//     setShowPasswordChangeDialog(false);
//     setPendingPassword("");
//     setPasswordChangeNote("");
//   };

//   const handleSendTemporaryPassword = async () => {
//     setIsSendingTempPassword(true);

//     try {
//       const { data: { session } } = await supabase.auth.getSession();
//       if (!session) {
//         toast.error("Not authenticated");
//         return;
//       }

//       const { data, error } = await supabase.functions.invoke("send-temporary-password", {
//         body: {
//           entityId: customer.id,
//           entityType: "customer",
//           email: customer.email,
//           firstName: customer.first_name,
//           lastName: customer.last_name,
//         },
//       });

//       if (error) {
//         console.error("Error sending temporary password:", error);
//         toast.error("Failed to send temporary password");
//         return;
//       }

//       toast.success("Temporary password sent successfully");
//       queryClient.invalidateQueries({ queryKey: ["customer-notes", customer.id] });
//     } catch (error) {
//       console.error("Error:", error);
//       toast.error("Failed to send temporary password");
//     } finally {
//       setIsSendingTempPassword(false);
//     }
//   };

//   const onSubmit = (data: any) => {
//     // Check if password is being changed
//     if (data.password && data.password.length > 0) {
//       setPendingPassword(data.password);
//       setShowPasswordChangeDialog(true);
//       return;
//     }

//     // Check if enrolling affiliate changed
//     if (data.enrolled_by !== customer.enrolled_by && currentEnrollingAffiliate) {
//       const newAffiliate = affiliates?.find(a => a.id === data.enrolled_by);
//       if (newAffiliate) {
//         setPendingAffiliateChange({
//           newId: data.enrolled_by,
//           newName: `${newAffiliate.first_name} ${newAffiliate.last_name}`,
//           newAffiliateId: newAffiliate.affiliate_id,
//           oldId: currentEnrollingAffiliate.id,
//           oldName: currentEnrollingAffiliate.name,
//           oldAffiliateId: currentEnrollingAffiliate.affiliateId
//         });
//         setShowAffiliateChangeDialog(true);
//         return;
//       }
//     }

//     const formData = { ...data, email_opted_out: emailOptedOut };

//     // Check if Shopify-relevant fields changed
//     if (hasShopifyFieldsChanged(formData)) {
//       setPendingFormData(formData);
//       setShowShopifyDialog(true);
//       return;
//     }

//     updateMutation.mutate(formData);
//   };

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
//             <DialogTitle>View Customer - {customer.first_name} {customer.last_name}</DialogTitle>
//           </div>
//           {viewingContext && (
//             <p className="text-sm text-muted-foreground mt-2">
//               Viewing customers of {viewingContext.affiliateName}
//             </p>
//           )}
//         </DialogHeader>

//         <Tabs defaultValue="details" className="w-full">
//           <TabsList className="grid w-full grid-cols-3">
//             <TabsTrigger value="details">Customer Details</TabsTrigger>
//             <TabsTrigger value="orders">Orders</TabsTrigger>
//             <TabsTrigger value="notes">Notes & History</TabsTrigger>
//           </TabsList>

//           <TabsContent value="details" className="mt-6">
//             <Form {...form}>
//               <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
//             <div className="grid grid-cols-2 gap-4">
//               <FormField
//                 control={form.control}
//                 name="first_name"
//                 render={({ field }) => (
//                   <FormItem>
//                     <FormLabel>First Name</FormLabel>
//               <FormControl>
//                 <Input {...field} disabled={readOnly} />
//               </FormControl>
//                     <FormMessage />
//                   </FormItem>
//                 )}
//               />
//               <FormField
//                 control={form.control}
//                 name="last_name"
//                 render={({ field }) => (
//                   <FormItem>
//                     <FormLabel>Last Name</FormLabel>
//               <FormControl>
//                 <Input {...field} disabled={readOnly} />
//               </FormControl>
//                     <FormMessage />
//                   </FormItem>
//                 )}
//               />
//             </div>

//             <div className="grid grid-cols-2 gap-4">
//               <FormField
//                 control={form.control}
//                 name="email"
//                 render={({ field }) => (
//                   <FormItem>
//                     <FormLabel>Email</FormLabel>
//               <FormControl>
//                 <Input type="email" {...field} disabled={readOnly} />
//               </FormControl>
//                     <FormMessage />
//                   </FormItem>
//                 )}
//               />

//               <PhoneNumbersCompactManager
//                 phoneNumbers={phoneNumbers}
//                 onChange={setPhoneNumbers}
//                 disabled={readOnly}
//               />
//             </div>

//             <div className="grid grid-cols-2 gap-4">
//               <FormField
//                 control={form.control}
//                 name="address"
//                 render={({ field }) => (
//                   <FormItem>
//                     <FormLabel>Address 1</FormLabel>
//                     <FormControl>
//                       <Input {...field} disabled={readOnly} />
//                     </FormControl>
//                     <FormMessage />
//                   </FormItem>
//                 )}
//               />
//               <FormField
//                 control={form.control}
//                 name="address2"
//                 render={({ field }) => (
//                   <FormItem>
//                     <FormLabel>Address 2</FormLabel>
//                     <FormControl>
//                       <Input {...field} disabled={readOnly} />
//                     </FormControl>
//                     <FormMessage />
//                   </FormItem>
//                 )}
//               />
//             </div>

//             <div className="grid grid-cols-3 gap-4">
//               <FormField
//                 control={form.control}
//                 name="city"
//                 render={({ field }) => (
//                   <FormItem>
//                     <FormLabel>City</FormLabel>
//                     <FormControl>
//                       <Input {...field} disabled={readOnly} />
//                     </FormControl>
//                     <FormMessage />
//                   </FormItem>
//                 )}
//               />
//               <FormField
//                 control={form.control}
//                 name="state_province"
//                 render={({ field }) => (
//                   <FormItem>
//                     <FormLabel>State/Province</FormLabel>
//                     <FormControl>
//                       <Input {...field} disabled={readOnly} />
//                     </FormControl>
//                     <FormMessage />
//                   </FormItem>
//                 )}
//               />
//               <FormField
//                 control={form.control}
//                 name="postal_code"
//                 render={({ field }) => (
//                   <FormItem>
//                     <FormLabel>Postal Code</FormLabel>
//                     <FormControl>
//                       <Input {...field} disabled={readOnly} />
//                     </FormControl>
//                     <FormMessage />
//                   </FormItem>
//                 )}
//               />
//             </div>

//             <div className="grid grid-cols-2 gap-4">
//               <FormField
//                 control={form.control}
//                 name="country"
//                 render={({ field }) => (
//                   <FormItem>
//                     <FormLabel>Country</FormLabel>
//                     <FormControl>
//                       <Input {...field} disabled={readOnly} />
//                     </FormControl>
//                     <FormMessage />
//                   </FormItem>
//                 )}
//               />

//               <FormField
//                 control={form.control}
//                 name="status"
//                 render={({ field }) => (
//                   <FormItem>
//                     <FormLabel>Status</FormLabel>
//                     <Select onValueChange={field.onChange} defaultValue={field.value} disabled={readOnly}>
//                       <FormControl>
//                         <SelectTrigger>
//                           <SelectValue />
//                         </SelectTrigger>
//                       </FormControl>
//                       <SelectContent>
//                         <SelectItem value="active">Active</SelectItem>
//                         <SelectItem value="inactive">Inactive</SelectItem>
//                         <SelectItem value="cancelled">Cancelled</SelectItem>
//                         <SelectItem value="terminated">Terminated</SelectItem>
//                       </SelectContent>
//                     </Select>
//                     <FormMessage />
//                   </FormItem>
//                 )}
//               />
//             </div>

//             {!readOnly && (
//               <FormField
//                 control={form.control}
//                 name="password"
//                 render={({ field }) => (
//                   <FormItem>
//                     <FormLabel>Password</FormLabel>
//                     <div className="flex gap-4">
//                       <FormControl>
//                         <div className="relative flex-1">
//                           <Input 
//                             {...field} 
//                             type={showPassword ? "text" : "password"}
//                             placeholder="Enter new password (leave blank to keep current)"
//                             autoComplete="new-password"
//                           />
//                           <Button
//                             type="button"
//                             variant="ghost"
//                             size="sm"
//                             className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
//                             onClick={() => setShowPassword(!showPassword)}
//                           >
//                             {showPassword ? (
//                               <EyeOff className="h-4 w-4 text-muted-foreground" />
//                             ) : (
//                               <Eye className="h-4 w-4 text-muted-foreground" />
//                             )}
//                           </Button>
//                         </div>
//                       </FormControl>
//                       <Button
//                         type="button"
//                         variant="outline"
//                         onClick={handleSendTemporaryPassword}
//                         disabled={updateMutation.isPending || isSendingTempPassword}
//                         className="whitespace-nowrap"
//                       >
//                         {isSendingTempPassword ? "Sending..." : "Send Temporary Password"}
//                       </Button>
//                     </div>
//                     <p className="text-sm text-muted-foreground mt-1 whitespace-nowrap">
//                       Only enter a new password if you want to change it. A note will be required.
//                     </p>
//                     <FormMessage />
//                   </FormItem>
//                 )}
//               />
//             )}

//             <div className="space-y-3 p-4 border rounded-md bg-muted/50">
//               <div className="flex items-center justify-between">
//                 <div className="flex items-center gap-2">
//                   {emailOptedOut ? (
//                     <MailX className="h-5 w-5 text-destructive" />
//                   ) : (
//                     <Mail className="h-5 w-5 text-green-600" />
//                   )}
//                   <div>
//                     <p className="font-medium">Email Preferences</p>
//                     <p className="text-sm text-muted-foreground">
//                       {emailOptedOut ? "Customer has opted out of emails" : "Customer is subscribed to emails"}
//                     </p>
//                   </div>
//                 </div>
//                 {!readOnly && (
//                   <Button
//                     type="button"
//                     variant={emailOptedOut ? "default" : "destructive"}
//                     size="sm"
//                     onClick={() => setEmailOptedOut(!emailOptedOut)}
//                   >
//                     {emailOptedOut ? "Opt In" : "Opt Out"}
//                   </Button>
//                 )}
//               </div>
//               {customer.email_opted_out_at && (
//                 <p className="text-xs text-muted-foreground">
//                   Opted out on: {format(new Date(customer.email_opted_out_at), "MMM d, yyyy h:mm a")}
//                 </p>
//               )}
//             </div>

//             {!readOnly && (
//               <FormField
//                 control={form.control}
//                 name="enrolled_by"
//                 render={({ field }) => (
//                   <FormItem className="flex flex-col">
//                     <FormLabel>Enrolling Affiliate</FormLabel>
//                     <div className="space-y-2">
//                       {currentEnrollingAffiliate && (
//                         <div className="text-sm p-2 bg-muted rounded-md">
//                           Current: <span className="font-medium">{currentEnrollingAffiliate.name}</span>
//                         </div>
//                       )}
//                       <FormControl>
//                         <Command className="rounded-md border bg-popover text-popover-foreground shadow-md">
//                           <CommandInput 
//                             placeholder="Search to change affiliate..." 
//                             value={affiliateSearch}
//                             onValueChange={setAffiliateSearch}
//                           />
//                           {affiliateSearch && (
//                             <CommandList className="max-h-64 overflow-auto">
//                               <CommandEmpty>No affiliate found.</CommandEmpty>
//                               <CommandGroup>
//                                 {filteredAffiliates.map((affiliate) => (
//                                   <CommandItem
//                                     value={`${affiliate.first_name} ${affiliate.last_name}`}
//                                     key={affiliate.id}
//                                     onSelect={() => {
//                                       form.setValue("enrolled_by", affiliate.id);
//                                       setAffiliateSearch(`${affiliate.first_name} ${affiliate.last_name}`);
//                                     }}
//                                   >
//                                     <Check
//                                       className={cn(
//                                         "mr-2 h-4 w-4",
//                                         affiliate.id === field.value ? "opacity-100" : "opacity-0"
//                                       )}
//                                     />
//                                     {affiliate.first_name} {affiliate.last_name}
//                                   </CommandItem>
//                                 ))}
//                               </CommandGroup>
//                             </CommandList>
//                           )}
//                         </Command>
//                       </FormControl>
//                     </div>
//                     <FormMessage />
//                   </FormItem>
//                 )}
//               />
//             )}

//             <div className="flex justify-end gap-2">
//               {readOnly ? (
//                 <Button type="button" onClick={() => onOpenChange(false)}>
//                   Close
//                 </Button>
//               ) : (
//                 <>
//                   <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
//                     Cancel
//                   </Button>
//                   <Button type="submit" disabled={updateMutation.isPending}>
//                     {updateMutation.isPending ? "Saving..." : "Save Changes"}
//                   </Button>
//                 </>
//               )}
//             </div>
//           </form>
//         </Form>
//           </TabsContent>

//           <TabsContent value="orders" className="mt-6">
//             <div className="space-y-4">
//               <div className="flex gap-4 items-end">
//                 <div className="flex-1">
//                   <label className="text-sm font-medium mb-2 block">Search by Order Number</label>
//                   <div className="relative">
//                     <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
//                     <Input
//                       placeholder="Enter order number..."
//                       value={searchTerm}
//                       onChange={(e) => setSearchTerm(e.target.value)}
//                       className="pl-9"
//                     />
//                   </div>
//                 </div>
//                 <div>
//                   <label className="text-sm font-medium mb-2 block">Start Date</label>
//                   <Input
//                     type="date"
//                     value={startDate}
//                     onChange={(e) => setStartDate(e.target.value)}
//                   />
//                 </div>
//                 <div>
//                   <label className="text-sm font-medium mb-2 block">End Date</label>
//                   <Input
//                     type="date"
//                     value={endDate}
//                     onChange={(e) => setEndDate(e.target.value)}
//                   />
//                 </div>
//                 {(searchTerm || startDate || endDate) && (
//                   <Button
//                     variant="outline"
//                     onClick={() => {
//                       setSearchTerm("");
//                       setStartDate("");
//                       setEndDate("");
//                     }}
//                   >
//                     Clear
//                   </Button>
//                 )}
//               </div>

//               {ordersLoading ? (
//                 <div className="text-center py-8">Loading orders...</div>
//               ) : filteredOrders && filteredOrders.length > 0 ? (
//                 <div className="border rounded-lg">
//                   <Table>
//                     <TableHeader>
//                       <TableRow>
//                         <TableHead>Order Number</TableHead>
//                         <TableHead>Date</TableHead>
//                         <TableHead className="text-right">Amount</TableHead>
//                         <TableHead>Status</TableHead>
//                         <TableHead className="text-right">Actions</TableHead>
//                       </TableRow>
//                     </TableHeader>
//                     <TableBody>
//                       {filteredOrders.map((order) => (
//                           <TableRow key={order.id}>
//                             <TableCell className="font-medium">{order.order_number}</TableCell>
//                             <TableCell>{format(new Date(order.order_date), "MMM d, yyyy h:mm a")}</TableCell>
//                             <TableCell className="text-right">{formatCurrency(order.amount)}</TableCell>
//                           <TableCell>{getStatusBadge(order.status)}</TableCell>
//                           <TableCell className="text-right">
//                             <DropdownMenu>
//                               <DropdownMenuTrigger asChild>
//                                 <Button variant="ghost" size="icon">
//                                   <MoreVertical className="h-4 w-4" />
//                                 </Button>
//                               </DropdownMenuTrigger>
//                                 <DropdownMenuContent align="end" className="bg-popover z-50">
//                                   <DropdownMenuItem onClick={() => setSelectedOrderId(order.id)}>
//                                     {isAffiliate ? (
//                                       <>
//                                         <Eye className="h-4 w-4 mr-2" />
//                                         View
//                                       </>
//                                     ) : (
//                                       <>
//                                         <Pencil className="h-4 w-4 mr-2" />
//                                         View / Edit
//                                       </>
//                                     )}
//                                   </DropdownMenuItem>
//                                   {!isAffiliate && (
//                                     <DropdownMenuItem onClick={() => {
//                                       window.open(`https://admin.shopify.com/store/theonglobal/orders/${order.order_number}`, '_blank');
//                                     }}>
//                                       <ShoppingCart className="h-4 w-4 mr-2" />
//                                       View in Shopify
//                                     </DropdownMenuItem>
//                                   )}
//                                 <DropdownMenuItem onClick={() => {
//                                   setNotesOrderId(order.id);
//                                   setNotesOrderNumber(order.order_number);
//                                 }}>
//                                   <StickyNote className="h-4 w-4 mr-2" />
//                                   Notes
//                                 </DropdownMenuItem>
//                                 {!isAffiliate && (
//                                   <DropdownMenuItem
//                                     onClick={() => {
//                                       if (confirm("Are you sure you want to delete this order?")) {
//                                         deleteMutation.mutate(order.id);
//                                       }
//                                     }}
//                                     className="text-destructive"
//                                   >
//                                     <Trash2 className="h-4 w-4 mr-2" />
//                                     Delete
//                                   </DropdownMenuItem>
//                                 )}
//                               </DropdownMenuContent>
//                             </DropdownMenu>
//                           </TableCell>
//                         </TableRow>
//                       ))}
//                     </TableBody>
//                   </Table>
//                 </div>
//               ) : orders && orders.length > 0 ? (
//                 <div className="text-center py-8 text-muted-foreground">
//                   No orders match your search criteria.
//                 </div>
//               ) : (
//                 <div className="text-center py-8 text-muted-foreground">
//                   No orders found for this customer.
//                 </div>
//               )}
//             </div>
//           </TabsContent>

//           <TabsContent value="notes" className="mt-6">
//             <CustomerNotes customerId={customer.id} />
//           </TabsContent>
//         </Tabs>
//       </DialogContent>

//       {selectedOrderId && (
//         <OrderDetailDialog
//           orderId={selectedOrderId}
//           open={!!selectedOrderId}
//           onOpenChange={(open) => !open && setSelectedOrderId(null)}
//         />
//       )}

//       {showAffiliateChangeDialog && pendingAffiliateChange && currentEnrollingAffiliate && (
//         <EnrollingAffiliateChangeDialog
//           open={showAffiliateChangeDialog}
//           onOpenChange={setShowAffiliateChangeDialog}
//           oldAffiliateName={currentEnrollingAffiliate.name}
//           oldAffiliateId={currentEnrollingAffiliate.affiliateId}
//           newAffiliateName={pendingAffiliateChange.newName}
//           newAffiliateId={pendingAffiliateChange.newAffiliateId}
//           onConfirm={handleAffiliateChangeConfirm}
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

//       <ShopifyUpdateDialog
//         open={showShopifyDialog}
//         onOpenChange={setShowShopifyDialog}
//         onConfirm={handleShopifyConfirm}
//         entityType="customer"
//       />

//       {showCommissionAdjustmentDialog && (
//         <CommissionAdjustmentDialog
//           open={showCommissionAdjustmentDialog}
//           onOpenChange={setShowCommissionAdjustmentDialog}
//           entityName={`${customer.first_name} ${customer.last_name}`}
//           impacts={commissionImpacts}
//           onConfirm={handleCommissionAdjustmentConfirm}
//           onCancel={handleCommissionAdjustmentCancel}
//           onViewOrder={setSelectedOrderId}
//         />
//       )}

//       {showShopifyMetadataDialog && shopifyMetadataSiteNames && (
//         <ShopifyMetadataUpdateDialog
//           open={showShopifyMetadataDialog}
//           onOpenChange={setShowShopifyMetadataDialog}
//           onConfirm={handleShopifyMetadataConfirm}
//           oldSiteName={shopifyMetadataSiteNames.oldSiteName}
//           newSiteName={shopifyMetadataSiteNames.newSiteName}
//         />
//       )}

//       <Dialog open={showPasswordChangeDialog} onOpenChange={setShowPasswordChangeDialog}>
//         <DialogContent>
//           <DialogHeader>
//             <DialogTitle>Password Change Note Required</DialogTitle>
//           </DialogHeader>
//           <div className="space-y-4">
//             <p className="text-sm text-muted-foreground">
//               Please provide a reason for changing this customer's password:
//             </p>
//             <textarea
//               className="w-full min-h-[100px] p-3 border rounded-md"
//               placeholder="Enter reason for password change..."
//               value={passwordChangeNote}
//               onChange={(e) => setPasswordChangeNote(e.target.value)}
//             />
//             <div className="flex justify-end gap-2">
//               <Button
//                 type="button"
//                 variant="outline"
//                 onClick={() => {
//                   setShowPasswordChangeDialog(false);
//                   setPendingPassword("");
//                   setPasswordChangeNote("");
//                 }}
//               >
//                 Cancel
//               </Button>
//               <Button type="button" onClick={handlePasswordChangeConfirm}>
//                 Update Password
//               </Button>
//             </div>
//           </div>
//         </DialogContent>
//       </Dialog>
//     </Dialog>
//   );
// }


//remove frome here as this is comment 


// import { useForm } from "react-hook-form";
// import { QueryClientContext, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
// import { supabase } from "@/integrations/supabase/client";
// import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
// import { Input } from "@/components/ui/input";
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// import { Button } from "@/components/ui/button";
// import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
// import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
// import { Badge } from "@/components/ui/badge";
// import { Check, Search, ArrowLeft, MoreVertical, Trash2, StickyNote, Pencil, ShoppingCart, Eye, EyeOff, Construction } from "lucide-react";
// import { cn, formatCurrency } from "@/lib/utils";
// import { toast } from "sonner";
// import { useState, useMemo, useEffect, useCallback } from "react";
// import { getOrderStatusBadgeVariant } from "@/lib/badge-variants";
// import { format } from "date-fns";
// import { CustomerNotes } from "./customer-notes";
// import { OrderDetailDialog } from "./order-detail-dialog";
// import { NotesDialog } from "../shared/notes-dialog";
// import { EnrollingAffiliateChangeDialog } from "../shared/enrolling-affiliate-change-dialog";
// import { PhoneNumbersCompactManager, PhoneNumber } from "../shared/phone-numbers-compact-manager";
// import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
// import { Mail, MailX } from "lucide-react";
// import { ShopifyUpdateDialog } from "../shared/shopify-update-dialog";
// import { ShopifyMetadataUpdateDialog } from "../shared/shopify-metadata-update-dialog";
// import { CommissionAdjustmentDialog } from "../shared/commission-adjustment-dialog";
// import { analyzeCustomerCommissionImpact, applyCommissionAdjustments, CommissionImpact } from "@/lib/commission-utils";
// import { useUserRole } from "@/hooks/use-user-role";
// import { Customer, UpdateCustomerPayload, UpdateCustomerResponse } from "@/types";
// import { getCustomerFromIdAPI, sendTemporaryPassword, updateCustomer } from "@/api/customer";
// import { readActiveAffiliates } from "@/api/affiliate";
// import { useToast } from "@/hooks/use-toast";
// interface CustomerEditDialogProps {
//   customer: Customer;
//   open: boolean;
//   onOpenChange: (open: boolean) => void;
//   viewingContext?: {
//     affiliateName: string;
//   } | null;
//   onBack?: () => void;
//   readOnly?: boolean;
//   customerId?: string;
// }

// export function CustomerEditDialog({ customer, open, onOpenChange, viewingContext, onBack, readOnly = false, customerId }: CustomerEditDialogProps) {

//   const { toast } = useToast();
//   // queryClient used for invalidating queries
//   const queryClient = useQueryClient();
//   // var to store if the current user is affiliate or not
//   const { isAffiliate } = useUserRole();
//   // state to store the affiliates to search
//   const [affiliateSearch, setAffiliateSearch] = useState("");
//   // state to store the current enrolling affiliate
//   const [currentEnrollingAffiliate, setCurrentEnrollingAffiliate] = useState<{ id: string; name: string; affiliateId: string } | null>(null);
//   // state to store the OrderId
//   const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
//   // state to store the search term
//   const [searchTerm, setSearchTerm] = useState("");
//   // state to store the order start date
//   const [startDate, setStartDate] = useState("");
//   // state to store the order end date
//   const [endDate, setEndDate] = useState("");
//   // state to toggle change Affiliate Dialog
//   const [showAffiliateChangeDialog, setShowAffiliateChangeDialog] = useState(false);
//   // 
//   const [pendingAffiliateChange, setPendingAffiliateChange] = useState<{ newId: string; newName: string; newAffiliateId: string; oldId: string; oldName: string; oldAffiliateId: string } | null>(null);
//   // state to store if customer has opted out of email or not
//   const [emailOptedOut, setEmailOptedOut] = useState(false);
//   const [phoneNumbers, setPhoneNumbers] = useState([]);
//   const [notesOrderId, setNotesOrderId] = useState<string | null>(null);
//   const [notesOrderNumber, setNotesOrderNumber] = useState<string>("");
//   const [showShopifyDialog, setShowShopifyDialog] = useState(false);
//   const [pendingFormData, setPendingFormData] = useState<any>(null);

//   const [showCommissionAdjustmentDialog, setShowCommissionAdjustmentDialog] = useState(false);
//   const [commissionImpacts, setCommissionImpacts] = useState<CommissionImpact[]>([]);
//   const [showShopifyMetadataDialog, setShowShopifyMetadataDialog] = useState(false);
//   const [shopifyMetadataSiteNames, setShopifyMetadataSiteNames] = useState<{ oldSiteName: string; newSiteName: string } | null>(null);
//   const [enrollingAffiliateChanged, setEnrollingAffiliateChanged] = useState(false);
//   const [showPasswordChangeDialog, setShowPasswordChangeDialog] = useState(false);
//   const [pendingPassword, setPendingPassword] = useState<string>("");
//   const [passwordChangeNote, setPasswordChangeNote] = useState<string>("");
//   const [isSendingTempPassword, setIsSendingTempPassword] = useState(false);
//   const [showPassword, setShowPassword] = useState(false);
//   const [fullName, setFullName] = useState("");

//   // const form = useForm({
//   //   defaultValues: {
//   //     first_name: customer.first_name,
//   //     last_name: customer.last_name,
//   //     email: customer.email,
//   //     phone: customer.phone || "",
//   //     addressLineOne: customer.addressLineOne || "",
//   //     addressLineTwo: customer.addressLineTwo || "",
//   //     city: customer.city || "",
//   //     state_province: customer.state_province || "",
//   //     postal_code: customer.postal_code || "",
//   //     country: customer.country,
//   //     status: customer.status,
//   //     enrolled_by: customer.enrolled_by || "",
//   //     password: "",
//   //   },
//   // });




//   // fetch active affiliates
//   const { data: affiliates, isLoading, isError, error } = useQuery({
//     queryKey: ["active-affiliates"],

//     queryFn: async () => {
//       try {

//         const response = await readActiveAffiliates();

//         // console.log("affiliaet response is ", response.data.data);

//         return response.data.data;

//       } catch (error) {
//         console.error("error is ", error);
//       }
//     }
//   })

//   /* 
//   const { data: affiliates } = useQuery({
//     queryKey: ["affiliates"],
//     queryFn: async () => {
//       const { data, error } = await supabase
//         .from("affiliates" as any)
//         .select("id, affiliate_id, first_name, last_name")
//         .eq("status", "active")
//         .order("first_name");

//       if (error) throw error;
//       return data as any;
//     },
//   });
//   */

//   /*

//   const { data: customerInfo } = useQuery({
//     queryKey: ["affiliates"],
//     queryFn: async () => {
//       const { data, error } = await supabase
//         .from("affiliates" as any)
//         .select("id, affiliate_id, first_name, last_name")
//         .eq("status", "active")
//         .order("first_name");

//       if (error) throw error;
//       return data as any;
//     },
//   });
//   */


//   // Get current enrolling affiliate details
//   useEffect(() => {
//     const fetchEnrollingAffiliate = async () => {
//       console.log("affiliates is ", affiliates);
//       if (customer?.enrolledBy && affiliates) {
//         console.log("Finding enrolled affiliates")
//         const affiliate = affiliates?.find((a: any) => {

//           console.log("a.selfAffiliateId is ", a.selfAffiliateId);
//           console.log("customer?.enrolledBy is ", customer?.enrolledBy);

//           console.log("condition is ", a?.selfAffiliateId?.toString() === customer?.enrolledBy);
//           return a?.selfAffiliateId?.toString() === customer?.enrolledBy;
//         });
//         console.log("found enrolling affiliate", affiliate);
//         if (affiliate) {
//           setCurrentEnrollingAffiliate({
//             id: affiliate?.selfAffiliateId,
//             name: `${affiliate?.firstName} ${affiliate?.lastName}`,
//             affiliateId: affiliate?._id
//           });
//         }
//       } else {
//         setCurrentEnrollingAffiliate(null);
//       }
//     };
//     fetchEnrollingAffiliate();
//   }, [customer?.enrolledBy, affiliates, open]);

//   const filteredAffiliates = useMemo(() => {
//     if (!affiliateSearch.trim()) return [];

//     return affiliates && affiliates.length !== 0 && affiliates?.filter((affiliate) => {
//       const fullName = `${affiliate.firstName} ${affiliate.lastName}`.toLowerCase();
//       return fullName.includes(affiliateSearch.toLowerCase());
//     }) || [];
//   }, [affiliates, affiliateSearch]);

//   /* 
//   const { data: orders, isLoading: ordersLoading } = useQuery({
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
//   */
//   const orders = [];
//   const ordersLoading = false;

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

//   // const form = useForm({
//   //   defaultValues: {
//   //     first_name: customer.first_name,
//   //     last_name: customer.last_name,
//   //     email: customer.email,
//   //     phone: customer.phone || "",
//   //     addressLineOne: customer.addressLineOne || "",
//   //     addressLineTwo: customer.addressLineTwo || "",
//   //     city: customer.city || "",
//   //     state_province: customer.state_province || "",
//   //     postal_code: customer.postal_code || "",
//   //     country: customer.country,
//   //     status: customer.status,
//   //     enrolled_by: customer.enrolled_by || "",
//   //     password: "",
//   //   },
//   // });

//   const form = useForm({
//     defaultValues: {
//       firstName: "",
//       lastName: "",
//       email: "",
//       phone: "",
//       phoneNumbers: [],
//       addressLineOne: "",
//       addressLineTwo: "",
//       cityTown: "",
//       stateProvince: "",
//       zipPostal: "",
//       country: "",
//       status: 0,
//       enrolledBy: "",
//       password: "",
//     },
//   });

//   const getCustomerFromId = useCallback(async () => {
//     try {
//       // console.log("Customer Id Changed: ", customerId);
//       const response = await getCustomerFromIdAPI(customerId);

//       console.log("======================");
//       console.log("Respomse: ", response);
//       console.log("======================");


//       if (response.data.success) {
//         const apiCustomer = response?.data?.data ?? {};
//         setPhoneNumbers(apiCustomer.phoneNumbers || []);
//         setFullName(`${apiCustomer.firstName} ${apiCustomer.lastName}`);
//         setEmailOptedOut(apiCustomer.emailOptedOut);
//         const dataToSet = {
//           firstName: apiCustomer.firstName,
//           lastName: apiCustomer.lastName,
//           email: apiCustomer.email,
//           phone: apiCustomer.phone || "",
//           phoneNumbers: apiCustomer.phoneNumbers || [],
//           addressLineOne: apiCustomer.addressLineOne || "",
//           addressLineTwo: apiCustomer.addressLineTwo || "",
//           cityTown: apiCustomer.cityTown || "",
//           stateProvince: apiCustomer.stateProvince || "",
//           zipPostal: apiCustomer.zipPostal || "",
//           country: apiCustomer.country,
//           status: apiCustomer.status,
//           enrolledBy: apiCustomer.enrolledBy || "",
//           password: "",
//         }

//         // console.log("data to set is ", dataToSet);

//         form.reset(dataToSet);
//       } else {
//         form.reset();
//       }

//     } catch (error) {
//       // console.log("Error while fetching data: ", error);
//       // toast.error("Something went wrong")
//       toast({
//         title: "Something went wrong",
//         description: "Please try again later",
//         variant: "destructive"
//       })
//     }
//   }, [customerId])

//   useEffect(() => {
//     // console.log("Customer ID is ", customerId);
//     if (customerId) {
//       getCustomerFromId();
//     }

//     return () => {
//       queryClient.invalidateQueries();
//     }
//   }, [customerId])


//   const updateMutation = useMutation({
//     mutationFn: async (payload: any) => {
//       // console.log("updating customer");
//       // return await updateCustomer(customer.id, payload);
//       return await updateCustomer(customerId, payload);

//     },
//     onSuccess: (response) => {
//       queryClient.invalidateQueries({ queryKey: ["customers"] });
//       queryClient.invalidateQueries({ queryKey: ["customer-orders", customer.id] });
//       // toast.success("Customer updated successfully");
//       // console.log("Customer updated successfully");

//       if (enrollingAffiliateChanged && pendingAffiliateChange) {
//         setShopifyMetadataSiteNames({
//           oldSiteName: currentEnrollingAffiliate?.name || "None",
//           newSiteName: pendingAffiliateChange.newName,
//         });
//         setShowShopifyMetadataDialog(true);
//       } else {
//         onOpenChange(false);
//       }
//     },
//     onError: (error: any) => {
//       // console.log("Error is s", error);
//       // toast({
//       //   "title": "Failed to update customer"
//       //   "description": error.response?.data?.message 
//       // });
//     },
//   });

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

//   const handleAffiliateChangeConfirm = async (note?: string) => {
//     // console.log("pendingAffiliateCHange is ", pendingAffiliateChange);
//     // return;
//     if (pendingAffiliateChange) {
//       setShowAffiliateChangeDialog(false);

//       // Show loading dialog while analyzing
//       // const loadingToast = toast.loading("Analyzing commission impact...");
//       toast({
//         title: "Loading",
//         description: "Analyzing Commision Impact"
//       })

//       try {
//         // Analyze commission impact, by calling supabase
//         /* 
//         const impacts = await analyzeCustomerCommissionImpact(
//           customer.id,
//           customer.enrolled_by!,
//           pendingAffiliateChange.newId
//         );

//         */
//       //  toast.dismiss(loadingToast);
//       toast({
//         title: "Analyzed",
//         description: "Commision Impact has been analyzed"
//       })

//         // show commisions impact dialog, if there are any impacts
//         if (false) {
//         // if (impacts.length !== 0) {
//           // Show commission adjustment dialog
//           setCommissionImpacts(impacts);
//           setShowCommissionAdjustmentDialog(true);
//           return;
//         }

//         // No commission impacts, proceed with change
//         const formData = { ...form.getValues(), emailOptedOut: emailOptedOut };
//         formData.enrolledBy = pendingAffiliateChange.newAffiliateId;
//         if (note) {
//           (formData as any).affiliateChangeNote = note;
//         }

//         // Check if Shopify-relevant fields changed
//         if (false) {
//         // if (hasShopifyFieldsChanged(formData)) {
//           setPendingFormData(formData);
//           setShowShopifyDialog(true);
//           return;
//         }

//         // console.log("Form data is ", formData);

//         updateMutation.mutate(formData);
//         setPendingAffiliateChange(null);
//       } catch (error) {
//         toast.dismiss(loadingToast);
//         toast.error("Failed to analyze commission impact");
//         console.error(error);
//       }
//     }
//   };

//   const handleCommissionAdjustmentConfirm = async (approvedImpacts: CommissionImpact[], selectedOrderIds: string[], note?: string) => {
//     if (!pendingAffiliateChange) return;

//     const { data: { user } } = await supabase.auth.getUser();
//     if (!user) {
//       toast.error("Not authenticated");
//       return;
//     }

//     try {
//       // Apply commission adjustments
//       await applyCommissionAdjustments(
//         approvedImpacts,
//         note,
//         user.id,
//         customer.id,
//         'customer'
//       );

//       // Ensure the customer is updated to the new enrolling affiliate before recalculation
//       await supabase
//         .from("customers")
//         .update({ enrolled_by: pendingAffiliateChange.newId })
//         .eq("id", customer.id);

//       // Recalculate commissions for selected orders to ensure L1/L2 are correct
//       if (selectedOrderIds && selectedOrderIds.length > 0) {
//         // Fetch plan percentages
//         const { data: compPlan } = await supabase
//           .from("compensation_plans")
//           .select("level_percentages")
//           .limit(1)
//           .single();
//         const levelPercentages = (compPlan?.level_percentages as Record<string, number>) || { "1": 25, "2": 12 };

//         // Fetch new affiliate and upline
//         const { data: newAffiliate } = await supabase
//           .from("affiliates")
//           .select("id, enrolled_by")
//           .eq("id", pendingAffiliateChange.newId)
//           .single();

//         for (const oid of selectedOrderIds) {
//           const { data: orderData } = await supabase
//             .from("orders")
//             .select("amount")
//             .eq("id", oid)
//             .single();
//           if (!orderData) continue;
//           const orderAmount = typeof orderData.amount === 'string' ? parseFloat(orderData.amount) : Number(orderData.amount);

//           // Remove existing commissions and recreate
//           await supabase.from("order_commissions").delete().eq("order_id", oid);

//           const inserts: any[] = [];
//           const l1Rate = levelPercentages["1"] ?? 25;
//           inserts.push({
//             order_id: oid,
//             affiliate_id: newAffiliate!.id,
//             level: 1,
//             commission_rate: l1Rate,
//             commission_amount: (orderAmount * l1Rate) / 100,
//           });

//           if (newAffiliate?.enrolled_by) {
//             const l2Rate = levelPercentages["2"] ?? 12;
//             inserts.push({
//               order_id: oid,
//               affiliate_id: newAffiliate.enrolled_by,
//               level: 2,
//               commission_rate: l2Rate,
//               commission_amount: (orderAmount * l2Rate) / 100,
//             });
//           }

//           if (inserts.length) {
//             await supabase.from("order_commissions").insert(inserts);
//           }
//         }
//       }

//       // Now proceed with the affiliate change form update + UI refresh
//       const formData = { ...form.getValues(), email_opted_out: emailOptedOut };
//       formData.enrolled_by = pendingAffiliateChange.newId;
//       if (note) {
//         (formData as any).affiliateChangeNote = note;
//       }

//       // Check if Shopify-relevant fields changed
//       if (hasShopifyFieldsChanged(formData)) {
//         setPendingFormData(formData);
//         setShowShopifyDialog(true);
//       } else {
//         updateMutation.mutate(formData);
//       }

//       setPendingAffiliateChange(null);
//       toast.success("Commission adjustments applied successfully");
//     } catch (error) {
//       console.error("Failed to apply commission adjustments:", error);
//       toast.error("Failed to apply commission adjustments");
//     }
//   };

//   const handleCommissionAdjustmentCancel = () => {
//     setShowCommissionAdjustmentDialog(false);
//     setCommissionImpacts([]);
//     setPendingAffiliateChange(null);
//   };

//   const hasShopifyFieldsChanged = (data: any) => {
//     const shopifyFields = ['address', 'address2', 'city', 'state_province', 'postal_code', 'phone', 'email'];
//     return shopifyFields.some(field => data[field] !== customer[field as keyof typeof customer]);
//   };

//   const handleShopifyConfirm = (updateShopify: boolean) => {
//     if (pendingFormData) {
//       updateMutation.mutate({ ...pendingFormData, updateShopify });
//       setPendingFormData(null);
//     }
//     setShowShopifyDialog(false);
//   };

//   const handleShopifyMetadataConfirm = (updateMetadata: boolean) => {
//     if (updateMetadata) {
//       // console.log('Shopify metadata update requested:', shopifyMetadataSiteNames);
//       // Developers can implement Shopify META data API integration here
//       // Update the "Exigo Referral" field in Shopify
//     }
//     setShowShopifyMetadataDialog(false);
//     setShopifyMetadataSiteNames(null);
//     setEnrollingAffiliateChanged(false);
//     onOpenChange(false);
//   };

//   const handlePasswordChangeConfirm = () => {
//     if (!passwordChangeNote.trim()) {
//       // toast.error("Please provide a reason for the password change");
//       // console.log("error is ", error);
//       return;
//     }

//     const formData: any = { ...form.getValues(), emailOptedOut: emailOptedOut };
//     formData.password = pendingPassword;
//     formData.passwordChangeNote = passwordChangeNote;

//     // console.log("form data is ", formData);

//     updateMutation.mutate(formData);
//     setShowPasswordChangeDialog(false);
//     setPendingPassword("");
//     setPasswordChangeNote("");
//   };

//   const sendTemporaryPasswordMutation = useMutation({
//     mutationFn: async (payload: any) => await sendTemporaryPassword(payload),

//     onSuccess: (response) => {
//       // console.log("response is ", response)
//     },

//     onError: (error) => {
//       // console.log("Error is ", error);
//     }
//   })

//   const handleSendTemporaryPassword = async (data: any) => {
//     setIsSendingTempPassword(true);

//     // console.log("data is ", customer);

//     const payload = {
//       customerId: customer._id
//     }
//     // console.log("payload is ", payload)

//     await sendTemporaryPasswordMutation.mutateAsync(payload);




//     setIsSendingTempPassword(false);
//   };

//   const onSubmit = (data: any) => {

//     if (data.password?.trim()) {
//       setPendingPassword(data.password);
//       setShowPasswordChangeDialog(true);
//       return;
//     }

//     // console.log("data.emrolledBy is ", data.enrolledBy);
//     // console.log("customer.emrolledBy is ", customer.enrolledBy);

//     if (data.enrolledBy !== customer?.enrolledBy) {
//       const newAff = affiliates?.find(a => a.selfAffiliateId === data.enrolledBy);

//       // console.log("newAff is ", newAff);

//       // console.log("Current enrolling affiliate is ", currentEnrollingAffiliate);
//       if (newAff) {
//         setPendingAffiliateChange({
//           newId: newAff._id,
//           newName: `${newAff.firstName} ${newAff.lastName}`,
//           newAffiliateId: newAff.selfAffiliateId,
//           oldId: currentEnrollingAffiliate?.affiliateId,
//           oldName: currentEnrollingAffiliate?.name,
//           oldAffiliateId: currentEnrollingAffiliate?.id,
//         });
//         setShowAffiliateChangeDialog(true);
//         return;
//       }
//     }
//     return;

//     // const payload = {
//     //   // Map frontend snake_case → backend camelCase
//     //   firstName: data.firstName,
//     //   lastName: data.lastName,
//     //   email: data.email,
//     //   phone: data.phone || null,
//     //   addressLineOne: data.addressLineOne || null,
//     //   addressLineTwo: data.addressLineTwo || null,
//     //   cityTown: data.cityTown || null,
//     //   stateProvince: data.stateProvince || null,
//     //   zipPostal: data.postalCode || null,
//     //   country: data.country || null,
//     //   status: data.status,
//     //   enrolledBy: data.enrolledBy ? Number(data.enrolledBy) : undefined,
//     //   emailOptedOut: emailOptedOut,
//     //   phoneNumbers: phoneNumbers,
//     //   affiliateChangeNote: pendingAffiliateChange ? "Changed via admin panel" : undefined,
//     // };
//     const payload = {};

//     // Helper to add field only if changed and value is not undefined/null (adjust as needed)
//     const addIfChanged = (key, newValue, oldValue) => {
//       if (newValue !== oldValue && newValue !== undefined) {
//         payload[key] = newValue === '' ? null : newValue; // optional: treat empty string as null
//       }
//     };

//     // Personal info
//     addIfChanged('firstName', data.firstName, customer.firstName);
//     addIfChanged('lastName', data.lastName, customer.lastName);
//     addIfChanged('email', data.email, customer.email);
//     addIfChanged('phone', data.phone, customer.phone);
//     addIfChanged('addressLineOne', data.addressLineOne, customer.addressLineOne);
//     addIfChanged('addressLineTwo', data.addressLineTwo, customer.addressLineTwo);
//     addIfChanged('cityTown', data.cityTown, customer.cityTown);
//     addIfChanged('stateProvince', data.stateProvince, customer.stateProvince);
//     addIfChanged('zipPostal', data.postalCode, customer.zipPostal);
//     addIfChanged('country', data.country, customer.country);
//     addIfChanged('status', data.status, customer.status);
//     addIfChanged('enrolledBy', data.enrolledBy ? Number(data.enrolledBy) : null, customer.enrolledBy);

//     // Special cases
//     if (emailOptedOut !== customer.emailOptedOut) {
//       payload.emailOptedOut = emailOptedOut;
//     }

//     if (JSON.stringify(phoneNumbers) !== JSON.stringify(customer.phoneNumbers)) {
//       payload.phoneNumbers = phoneNumbers;
//     }

//     if (pendingAffiliateChange) {
//       payload.affiliateChangeNote = "Changed via admin panel";
//     }

//     // Remove undefined fields
//     Object.keys(payload).forEach(key => payload[key] === undefined && delete payload[key]);

//     payload.status = parseInt(payload.status);
//     // console.log("update Cusotmer payload is ", payload);

//     updateMutation.mutate(payload);
//   };

//   const statusLabels: Record<number, string> = {
//     1: "Active",
//     2: "Inactive",
//     3: "Cancelled",
//     4: "Terminated",
//   };

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
//             <DialogTitle>View Customer - {fullName}</DialogTitle>
//           </div>
//           {viewingContext && (
//             <p className="text-sm text-muted-foreground mt-2">
//               Viewing customers of {viewingContext.affiliateName}
//             </p>
//           )}
//         </DialogHeader>

//         <Tabs defaultValue="details" className="w-full">
//           <TabsList className="grid w-full grid-cols-3">
//             {/* <TabsList className="grid w-full grid-cols-3"> */}
//             <TabsTrigger value="details">Customer Details</TabsTrigger>
//             {/* revert back on order_complete */}
//             <TabsTrigger value="orders">Orders</TabsTrigger>
//             <TabsTrigger value="notes">Notes & History</TabsTrigger>
//           </TabsList>

//           <TabsContent value="details" className="mt-6">
//             <Form {...form}>
//               <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
//                 <div className="grid grid-cols-2 gap-4">
//                   <FormField
//                     control={form.control}
//                     name="firstName"
//                     render={({ field }) => (
//                       <FormItem>
//                         <FormLabel>First Name</FormLabel>
//                         <FormControl>
//                           <Input {...field} disabled={readOnly} />
//                         </FormControl>
//                         <FormMessage />
//                       </FormItem>
//                     )}
//                   />
//                   <FormField
//                     control={form.control}
//                     name="lastName"
//                     render={({ field }) => (
//                       <FormItem>
//                         <FormLabel>Last Name</FormLabel>
//                         <FormControl>
//                           <Input {...field} disabled={readOnly} />
//                         </FormControl>
//                         <FormMessage />
//                       </FormItem>
//                     )}
//                   />
//                 </div>

//                 <div className="grid grid-cols-2 gap-4">
//                   <FormField
//                     control={form.control}
//                     name="email"
//                     render={({ field }) => (
//                       <FormItem>
//                         <FormLabel>Email</FormLabel>
//                         <FormControl>
//                           <Input type="email" {...field} disabled={readOnly} />
//                         </FormControl>
//                         <FormMessage />
//                       </FormItem>
//                     )}
//                   />

//                   <PhoneNumbersCompactManager
//                     customerId={customer?._id || customerId}
//                     phoneNumbers={phoneNumbers}
//                     onChange={setPhoneNumbers}
//                     disabled={readOnly}
//                   />
//                 </div>

//                 <div className="grid grid-cols-2 gap-4">
//                   <FormField
//                     control={form.control}
//                     name="addressLineOne"
//                     render={({ field }) => (
//                       <FormItem>
//                         <FormLabel>Address 1</FormLabel>
//                         <FormControl>
//                           <Input {...field} disabled={readOnly} />
//                         </FormControl>
//                         <FormMessage />
//                       </FormItem>
//                     )}
//                   />
//                   <FormField
//                     control={form.control}
//                     name="addressLineTwo"
//                     render={({ field }) => (
//                       <FormItem>
//                         <FormLabel>Address 2</FormLabel>
//                         <FormControl>
//                           <Input {...field} disabled={readOnly} />
//                         </FormControl>
//                         <FormMessage />
//                       </FormItem>
//                     )}
//                   />
//                 </div>

//                 <div className="grid grid-cols-3 gap-4">
//                   <FormField
//                     control={form.control}
//                     name="cityTown"
//                     render={({ field }) => (
//                       <FormItem>
//                         <FormLabel>City</FormLabel>
//                         <FormControl>
//                           <Input {...field} disabled={readOnly} />
//                         </FormControl>
//                         <FormMessage />
//                       </FormItem>
//                     )}
//                   />
//                   <FormField
//                     control={form.control}
//                     name="stateProvince"
//                     render={({ field }) => (
//                       <FormItem>
//                         <FormLabel>State/Province</FormLabel>
//                         <FormControl>
//                           <Input {...field} disabled={readOnly} />
//                         </FormControl>
//                         <FormMessage />
//                       </FormItem>
//                     )}
//                   />
//                   <FormField
//                     control={form.control}
//                     name="zipPostal"
//                     render={({ field }) => (
//                       <FormItem>
//                         <FormLabel>Postal Code</FormLabel>
//                         <FormControl>
//                           <Input {...field} disabled={readOnly} />
//                         </FormControl>
//                         <FormMessage />
//                       </FormItem>
//                     )}
//                   />
//                 </div>

//                 <div className="grid grid-cols-2 gap-4">
//                   <FormField
//                     control={form.control}
//                     name="country"
//                     render={({ field }) => (
//                       <FormItem>
//                         <FormLabel>Country</FormLabel>
//                         <FormControl>
//                           <Input {...field} disabled={readOnly} />
//                         </FormControl>
//                         <FormMessage />
//                       </FormItem>
//                     )}
//                   />

//                   <FormField
//                     control={form.control}
//                     name="status"
//                     render={({ field }) => (
//                       <FormItem>
//                         <FormLabel>Status</FormLabel>
//                         <Select onValueChange={field.onChange} value={field.value} disabled={readOnly}>
//                           <FormControl>
//                             <SelectTrigger>
//                               {/* <SelectValue /> */}
//                               <SelectValue>
//                                 {field.value != null ? statusLabels[field.value] ?? "Unknown" : "Select a status"}
//                               </SelectValue>
//                             </SelectTrigger>
//                           </FormControl>
//                           <SelectContent>
//                             <SelectItem value={1}>Active</SelectItem>
//                             <SelectItem value={2}>Inactive</SelectItem>
//                             <SelectItem value={3}>Cancelled</SelectItem>
//                             <SelectItem value={4}>Terminated</SelectItem>
//                           </SelectContent>
//                         </Select>
//                         <FormMessage />
//                       </FormItem>
//                     )}
//                   />
//                 </div>

//                 {!readOnly && (
//                   <FormField
//                     control={form.control}
//                     name="password"
//                     render={({ field }) => (
//                       <FormItem>
//                         <FormLabel>Password</FormLabel>
//                         <div className="flex gap-4">
//                           <FormControl>
//                             <div className="relative flex-1">
//                               <Input
//                                 {...field}
//                                 type={showPassword ? "text" : "password"}
//                                 placeholder="Enter new password (leave blank to keep current)"
//                                 autoComplete="new-password"
//                               />
//                               <Button
//                                 type="button"
//                                 variant="ghost"
//                                 size="sm"
//                                 className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
//                                 onClick={() => setShowPassword(!showPassword)}
//                               >
//                                 {showPassword ? (
//                                   <EyeOff className="h-4 w-4 text-muted-foreground" />
//                                 ) : (
//                                   <Eye className="h-4 w-4 text-muted-foreground" />
//                                 )}
//                               </Button>
//                             </div>
//                           </FormControl>
//                           <Button
//                             type="button"
//                             variant="outline"
//                             onClick={handleSendTemporaryPassword}
//                             disabled={updateMutation.isPending || isSendingTempPassword}
//                             className="whitespace-nowrap"
//                           >
//                             {isSendingTempPassword ? "Sending..." : "Send Temporary Password"}
//                           </Button>
//                         </div>
//                         <p className="text-sm text-muted-foreground mt-1 whitespace-nowrap">
//                           Only enter a new password if you want to change it. A note will be required.
//                         </p>
//                         <FormMessage />
//                       </FormItem>
//                     )}
//                   />
//                 )}

//                 <div className="space-y-3 p-4 border rounded-md bg-muted/50">
//                   <div className="flex items-center justify-between">
//                     <div className="flex items-center gap-2">
//                       {emailOptedOut ? (
//                         <MailX className="h-5 w-5 text-destructive" />
//                       ) : (
//                         <Mail className="h-5 w-5 text-green-600" />
//                       )}
//                       <div>
//                         <p className="font-medium">Email Preferences</p>
//                         <p className="text-sm text-muted-foreground">
//                           {emailOptedOut ? "Customer has opted out of emails" : "Customer is subscribed to emails"}
//                         </p>
//                       </div>
//                     </div>
//                     {!readOnly && (
//                       <Button
//                         type="button"
//                         variant={emailOptedOut ? "default" : "destructive"}
//                         size="sm"
//                         onClick={() => setEmailOptedOut(!emailOptedOut)}
//                       >
//                         {emailOptedOut ? "Opt In" : "Opt Out"}
//                       </Button>
//                     )}
//                   </div>
//                   {emailOptedOut && (
//                     <p className="text-xs text-muted-foreground">
//                       Opted out on: {format(new Date(customer.emailOptedOutAt), "MMM d, yyyy h:mm a")}
//                     </p>
//                   )}
//                 </div>

//                 {!readOnly && (
//                   <FormField
//                     control={form.control}
//                     name="enrolledBy"
//                     render={({ field }) => (
//                       <FormItem className="flex flex-col">
//                         <FormLabel>Enrolling Affiliate</FormLabel>
//                         <div className="space-y-2">
//                           {currentEnrollingAffiliate && (
//                             <div className="text-sm p-2 bg-muted rounded-md">
//                               Current: <span className="font-medium">{currentEnrollingAffiliate.name}</span>
//                             </div>
//                           )}
//                           <FormControl>
//                             <Command className="rounded-md border bg-popover text-popover-foreground shadow-md">
//                               <CommandInput
//                                 placeholder="Search to change affiliate..."
//                                 value={affiliateSearch}
//                                 onValueChange={setAffiliateSearch}
//                               />
//                               {affiliateSearch && (
//                                 <CommandList className="max-h-64 overflow-auto">
//                                   <CommandEmpty>No affiliate found.</CommandEmpty>
//                                   <CommandGroup>
//                                     {filteredAffiliates.map((affiliate) => (
//                                       <CommandItem
//                                         value={`${affiliate.firstName} ${affiliate.lastName}`}
//                                         key={affiliate._id}
//                                         onSelect={() => {
//                                           form.setValue("enrolledBy", affiliate.selfAffiliateId);
//                                           setAffiliateSearch(`${affiliate.firstName} ${affiliate.lastName}`);
//                                         }}
//                                       >
//                                         <Check
//                                           className={cn(
//                                             "mr-2 h-4 w-4",
//                                             affiliate.selfAffiliateId.toString() === field.value ? "opacity-100" : "opacity-0"
//                                           )}
//                                         />
//                                         {affiliate.firstName} {affiliate.lastName} {affiliate.selfAffiliateId}
//                                       </CommandItem>
//                                     ))}
//                                   </CommandGroup>
//                                 </CommandList>
//                               )}
//                             </Command>
//                           </FormControl>
//                         </div>
//                         <FormMessage />
//                       </FormItem>
//                     )}
//                   />
//                 )}

//                 <div className="flex justify-end gap-2">
//                   {readOnly ? (
//                     <Button type="button" onClick={() => onOpenChange(false)}>
//                       Close
//                     </Button>
//                   ) : (
//                     <>
//                       <Button type="button" variant="outline" onClick={() => {
//                         form.reset();
//                         onOpenChange(false)
//                       }}>
//                         Cancel
//                       </Button>
//                       <Button type="submit" disabled={updateMutation.isPending}>
//                         {updateMutation.isPending ? "Saving..." : "Save Changes"}
//                       </Button>
//                     </>
//                   )}
//                 </div>
//               </form>
//             </Form>
//           </TabsContent>

//           <TabsContent value="orders" className="mt-6">
//             <div>
//               <div className=" h-full w-full">
//                 {/* Construction */}
//                 <div className="flex items-center justify-center p-12 bg-white  ">
//                   <div className="text-center space-y-4">
//                     <Construction className="h-20 w-20 text-muted-foreground mx-auto" />
//                     <h3 className="text-2xl font-bold text-foreground">Coming Soon</h3>
//                     <p className="text-muted-foreground max-w-md">
//                       Orders is currently under development. Check back soon for updates.
//                     </p>
//                   </div>
//                 </div>
//               </div>
//               {false && (
//                 <>
//               <div className="flex gap-4 items-end">
//                 <div className="flex-1">
//                   <label className="text-sm font-medium mb-2 block">Search by Order Number</label>
//                   <div className="relative">
//                     <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
//                     <Input
//                       placeholder="Enter order number..."
//                       value={searchTerm}
//                       onChange={(e) => setSearchTerm(e.target.value)}
//                       className="pl-9"
//                     />
//                   </div>
//                 </div>
//                 <div>
//                   <label className="text-sm font-medium mb-2 block">Start Date</label>
//                   <Input
//                     type="date"
//                     value={startDate}
//                     onChange={(e) => setStartDate(e.target.value)}
//                   />
//                 </div>
//                 <div>
//                   <label className="text-sm font-medium mb-2 block">End Date</label>
//                   <Input
//                     type="date"
//                     value={endDate}
//                     onChange={(e) => setEndDate(e.target.value)}
//                   />
//                 </div>
//                 {(searchTerm || startDate || endDate) && (
//                   <Button
//                     variant="outline"
//                     onClick={() => {
//                       setSearchTerm("");
//                       setStartDate("");
//                       setEndDate("");
//                     }}
//                   >
//                     Clear
//                   </Button>
//                 )}
//               </div>

//               {ordersLoading ? (
//                 <div className="text-center py-8">Loading orders...</div>
//               ) : filteredOrders && filteredOrders.length > 0 ? (
//                 <div className="border rounded-lg">
//                   <Table>
//                     <TableHeader>
//                       <TableRow>
//                         <TableHead>Order Number</TableHead>
//                         <TableHead>Date</TableHead>
//                         <TableHead className="text-right">Amount</TableHead>
//                         <TableHead>Status</TableHead>
//                         <TableHead className="text-right">Actions</TableHead>
//                       </TableRow>
//                     </TableHeader>
//                     <TableBody>
//                       {filteredOrders.map((order) => (
//                         <TableRow key={order.id}>
//                           <TableCell className="font-medium">{order.order_number}</TableCell>
//                           <TableCell>{format(new Date(order.order_date), "MMM d, yyyy h:mm a")}</TableCell>
//                           <TableCell className="text-right">{formatCurrency(order.amount)}</TableCell>
//                           <TableCell>{getStatusBadge(order.status)}</TableCell>
//                           <TableCell className="text-right">
//                             <DropdownMenu>
//                               <DropdownMenuTrigger asChild>
//                                 <Button variant="ghost" size="icon">
//                                   <MoreVertical className="h-4 w-4" />
//                                 </Button>
//                               </DropdownMenuTrigger>
//                               <DropdownMenuContent align="end" className="bg-popover z-50">
//                                 <DropdownMenuItem onClick={() => setSelectedOrderId(order.id)}>
//                                   {isAffiliate ? (
//                                     <>
//                                       <Eye className="h-4 w-4 mr-2" />
//                                       View
//                                     </>
//                                   ) : (
//                                     <>
//                                       <Pencil className="h-4 w-4 mr-2" />
//                                       View / Edit
//                                     </>
//                                   )}
//                                 </DropdownMenuItem>
//                                 {!isAffiliate && (
//                                   <DropdownMenuItem onClick={() => {
//                                     window.open(`https://admin.shopify.com/store/theonglobal/orders/${order.order_number}`, '_blank');
//                                   }}>
//                                     <ShoppingCart className="h-4 w-4 mr-2" />
//                                     View in Shopify
//                                   </DropdownMenuItem>
//                                 )}
//                                 <DropdownMenuItem onClick={() => {
//                                   setNotesOrderId(order.id);
//                                   setNotesOrderNumber(order.order_number);
//                                 }}>
//                                   <StickyNote className="h-4 w-4 mr-2" />
//                                   Notes
//                                 </DropdownMenuItem>
//                                 {!isAffiliate && (
//                                   <DropdownMenuItem
//                                     onClick={() => {
//                                       if (confirm("Are you sure you want to delete this order?")) {
//                                         deleteMutation.mutate(order.id);
//                                       }
//                                     }}
//                                     className="text-destructive"
//                                   >
//                                     <Trash2 className="h-4 w-4 mr-2" />
//                                     Delete
//                                   </DropdownMenuItem>
//                                 )}
//                               </DropdownMenuContent>
//                             </DropdownMenu>
//                           </TableCell>
//                         </TableRow>
//                       ))}
//                     </TableBody>
//                   </Table>
//                 </div>
//               ) : orders && orders.length > 0 ? (
//                 <div className="text-center py-8 text-muted-foreground">
//                   No orders match your search criteria.
//                 </div>
//               ) : (
//                 <div className="text-center py-8 text-muted-foreground">
//                   No orders found for this customer.
//                 </div>
//               )}
//               </>
//               )}
//             </div>
//           </TabsContent>

//           <TabsContent value="notes" className="mt-6">
//             <CustomerNotes customerId={customer?._id || customerId} />
//           </TabsContent>
//         </Tabs>
//       </DialogContent>

//       {selectedOrderId && (
//         <OrderDetailDialog
//           orderId={selectedOrderId}
//           open={!!selectedOrderId}
//           onOpenChange={(open) => !open && setSelectedOrderId(null)}
//         />
//       )}

//       {showAffiliateChangeDialog && pendingAffiliateChange && currentEnrollingAffiliate && (
//         <EnrollingAffiliateChangeDialog
//           open={showAffiliateChangeDialog}
//           onOpenChange={setShowAffiliateChangeDialog}
//           oldAffiliateName={currentEnrollingAffiliate.name}
//           oldAffiliateId={currentEnrollingAffiliate.affiliateId}
//           newAffiliateName={pendingAffiliateChange.newName}
//           newAffiliateId={pendingAffiliateChange.newAffiliateId}
//           onConfirm={handleAffiliateChangeConfirm}
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

//       <ShopifyUpdateDialog
//         open={showShopifyDialog}
//         onOpenChange={setShowShopifyDialog}
//         onConfirm={handleShopifyConfirm}
//         entityType="customer"
//       />

//       {showCommissionAdjustmentDialog && (
//         <CommissionAdjustmentDialog
//           open={showCommissionAdjustmentDialog}
//           onOpenChange={setShowCommissionAdjustmentDialog}
//           entityName={`${customer.first_name} ${customer.last_name}`}
//           impacts={commissionImpacts}
//           onConfirm={handleCommissionAdjustmentConfirm}
//           onCancel={handleCommissionAdjustmentCancel}
//           onViewOrder={setSelectedOrderId}
//         />
//       )}

//       {showShopifyMetadataDialog && shopifyMetadataSiteNames && (
//         <ShopifyMetadataUpdateDialog
//           open={showShopifyMetadataDialog}
//           onOpenChange={setShowShopifyMetadataDialog}
//           onConfirm={handleShopifyMetadataConfirm}
//           oldSiteName={shopifyMetadataSiteNames.oldSiteName}
//           newSiteName={shopifyMetadataSiteNames.newSiteName}
//         />
//       )}

//       <Dialog open={showPasswordChangeDialog} onOpenChange={setShowPasswordChangeDialog}>
//         <DialogContent>
//           <DialogHeader>
//             <DialogTitle>Password Change Note Required</DialogTitle>
//           </DialogHeader>
//           <div className="space-y-4">
//             <p className="text-sm text-muted-foreground">
//               Please provide a reason for changing this customer's password:
//             </p>
//             <textarea
//               className="w-full min-h-[100px] p-3 border rounded-md"
//               placeholder="Enter reason for password change..."
//               value={passwordChangeNote}
//               onChange={(e) => setPasswordChangeNote(e.target.value)}
//             />
//             <div className="flex justify-end gap-2">
//               <Button
//                 type="button"
//                 variant="outline"
//                 onClick={() => {
//                   setShowPasswordChangeDialog(false);
//                   setPendingPassword("");
//                   setPasswordChangeNote("");
//                 }}
//               >
//                 Cancel
//               </Button>
//               <Button type="button" onClick={handlePasswordChangeConfirm}>
//                 Update Password
//               </Button>
//             </div>
//           </div>
//         </DialogContent>
//       </Dialog>
//     </Dialog>
//   );
// }


import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { Check, Search, ArrowLeft, Mail, MailX, Eye, EyeOff, MoreVertical, ShoppingCart, StickyNote, Trash2 } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import { useState, useMemo, useEffect } from "react";
import { format } from "date-fns";
import { CustomerNotes } from "./customer-notes";
import { OrderDetailDialog } from "./order-detail-dialog";
import { NotesDialog } from "../shared/notes-dialog";
import { EnrollingAffiliateChangeDialog } from "../shared/enrolling-affiliate-change-dialog";
import { PhoneNumbersCompactManager } from "../shared/phone-numbers-compact-manager";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ShopifyUpdateDialog } from "../shared/shopify-update-dialog";
import { ShopifyMetadataUpdateDialog } from "../shared/shopify-metadata-update-dialog";
import { useUserRole } from "@/hooks/use-user-role";
import { getCustomerFromIdAPI, sendTemporaryPassword, updateCustomer } from "@/api/customer";
import { readActiveAffiliates } from "@/api/affiliate";
import { useToast } from "@/hooks/use-toast";
import { deleteOrder, getCustomerOrders } from "@/api/orders";
import { TableBody, TableCell, TableHead, TableHeader, TableRow, Table } from "../ui/table";
import { getOrderStatusBadgeVariant } from "@/lib/badge-variants";
import { useShopifyStore } from "@/store/useAuthStore";
import { useDateFormatStore } from "@/store/useDateFormat";
import { getDateFormatString } from "@/utils/resolveDateFormat";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";

interface CustomerEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  viewingContext?: { affiliateName: string } | null;
  onBack?: () => void;
  readOnly?: boolean;
  customerId: string;
}

const ORDER_STATUS_MAP: Record<number, string> = {
  0: "Pending",
  1: "Accepted",
  2: "Paid",
  3: "Fulfilled",
  4: "Refunded",
  5: "Canceled",
};

export function CustomerEditDialog({
  open,
  onOpenChange,
  viewingContext,
  onBack,
  readOnly = false,
  customerId,
}: CustomerEditDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isAffiliate, isAdmin } = useUserRole();

  // === Shared State ===
  const [affiliateSearch, setAffiliateSearch] = useState("");
  const [currentEnrollingAffiliate, setCurrentEnrollingAffiliate] = useState<{
    id: string;
    name: string;
    affiliateId: string;
  } | null>(null);
  const [emailOptedOut, setEmailOptedOut] = useState(false);
  const [phoneNumbers, setPhoneNumbers] = useState<any[]>([]);
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSendingTempPassword, setIsSendingTempPassword] = useState(false);

  const { dateFormatRegion, dateFormatVariant } = useDateFormatStore();
  const formatString = getDateFormatString(dateFormatRegion, dateFormatVariant);

  // Dialog states
  const [showAffiliateChangeDialog, setShowAffiliateChangeDialog] = useState(false);
  const [pendingAffiliateChange, setPendingAffiliateChange] = useState<{
    newId: string;
    newName: string;
    newAffiliateId: string;
    oldId?: string;
    oldName?: string;
    oldAffiliateId?: string;
  } | null>(null);
  const [showShopifyDialog, setShowShopifyDialog] = useState(false);
  const [pendingFormData, setPendingFormData] = useState<any>(null);
  const [showShopifyMetadataDialog, setShowShopifyMetadataDialog] = useState(false);
  const [shopifyMetadataSiteNames, setShopifyMetadataSiteNames] = useState<{
    oldSiteName: string;
    newSiteName: string;
  } | null>(null);
  const [showPasswordChangeDialog, setShowPasswordChangeDialog] = useState(false);
  const [pendingPassword, setPendingPassword] = useState("");
  const [passwordChangeNote, setPasswordChangeNote] = useState("");

  // === Orders Tab State (Declared at top, as requested) ===
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [notesOrderId, setNotesOrderId] = useState<string | null>(null);
  const [notesOrderNumber, setNotesOrderNumber] = useState("");
  const [orderSearchTerm, setOrderSearchTerm] = useState("");
  const [debouncedOrderSearchTerm, setDebouncedOrderSearchTerm] = useState("");
  const [orderStartDate, setOrderStartDate] = useState("");
  const [orderEndDate, setOrderEndDate] = useState("");
  const [orderCurrentPage, setOrderCurrentPage] = useState(1);
  const [orderItemsPerPage, setOrderItemsPerPage] = useState(5);
  const shopifyUrl = useShopifyStore((state) => state.shopifyUrl);

  // === Form Setup ===
  const form = useForm({
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      addressLineOne: "",
      addressLineTwo: "",
      cityTown: "",
      stateProvince: "",
      zipPostal: "",
      country: "",
      status: 0,
      enrolledBy: "",
      password: "",
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (orderId: string) => deleteOrder(orderId),
    onSuccess: () => {
      // Invalidate relevant queries so lists and detail view refresh
      setOrderCurrentPage(1)
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["customer-orders"] });
      queryClient.invalidateQueries({ queryKey: ["customer-orders-edit-dialog"] });
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
  // === Fetch Customer Data ===
  const { data: customerData, isLoading: customerLoading } = useQuery({
    queryKey: ["customer", customerId],
    queryFn: () => getCustomerFromIdAPI(customerId),
    enabled: open && !!customerId,
    select: (res) => res.data?.data,
  });

  // === Fetch Active Affiliates ===
  const { data: affiliates = [] } = useQuery({
    queryKey: ["active-affiliates"],
    queryFn: async () => {
      const response = await readActiveAffiliates();
      return response.data.data;
    },
  });

  // === Set current enrolling affiliate when data loads ===
  useEffect(() => {
    if (customerData && affiliates.length > 0) {
      const affiliate = affiliates.find(
        (a: any) => a.selfAffiliateId?.toString() === customerData.enrolledBy?.toString()
      );
      if (affiliate) {
        setCurrentEnrollingAffiliate({
          id: affiliate.selfAffiliateId,
          name: `${affiliate.firstName} ${affiliate.lastName}`,
          affiliateId: affiliate._id,
        });
      } else {
        setCurrentEnrollingAffiliate(null);
      }

      // Populate form & local state
      const dataToSet = {
        firstName: customerData.firstName || "",
        lastName: customerData.lastName || "",
        email: customerData.email || "",
        phone: customerData.phone || "",
        addressLineOne: customerData.addressLineOne || "",
        addressLineTwo: customerData.addressLineTwo || "",
        cityTown: customerData.cityTown || "",
        stateProvince: customerData.stateProvince || "",
        zipPostal: customerData.zipPostal || "",
        country: customerData.country || "",
        status: customerData.status || 0,
        enrolledBy: customerData.enrolledBy || "",
        password: "",
      };

      form.reset(dataToSet);
      setFullName(`${customerData.firstName} ${customerData.lastName}`);
      setEmailOptedOut(!!customerData.emailOptedOut);
      setPhoneNumbers(customerData.phoneNumbers || []);
    }
  }, [customerData, affiliates, form]);

  // === Filtered Affiliates for Search ===
  const filteredAffiliates = useMemo(() => {
    if (!affiliateSearch.trim()) return [];
    return affiliates.filter((aff: any) =>
      `${aff.firstName} ${aff.lastName}`.toLowerCase().includes(affiliateSearch.toLowerCase())
    );
  }, [affiliates, affiliateSearch]);

  // === Orders Query ===
  const {
    data: orderData,
    isLoading: ordersLoading,
  } = useQuery({
    queryKey: [
      "customer-orders-edit-dialog",
      customerId,
      debouncedOrderSearchTerm,
      orderStartDate,
      orderEndDate,
      orderCurrentPage,
      orderItemsPerPage,
    ],
    queryFn: async () => {
      return await getCustomerOrders(customerData.selfCustomerId, {
        orderId: debouncedOrderSearchTerm || undefined,
        startDate: orderStartDate || undefined,
        endDate: orderEndDate || undefined,
        page: orderCurrentPage,
        limit: orderItemsPerPage,
      });
    },
    enabled: open && !!customerId,

  });

  const orders = orderData?.data?.orders || [];
  const pagination = orderData?.data?.pagination || {};
  const totalOrders = pagination.total || 0;
  const totalPages = pagination.totalPages || 1;

  const getStatusText = (status: number) => ORDER_STATUS_MAP[status] || "Unknown";
  const getStatusBadge = (status: number) => (
    <Badge variant={getOrderStatusBadgeVariant(getStatusText(status) as any)}>
      {getStatusText(status)}
    </Badge>
  );

  // === Mutations ===
  const updateMutation = useMutation({
    mutationFn: (payload: any) => updateCustomer(customerId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["customer", customerId] });

      if (pendingAffiliateChange && currentEnrollingAffiliate) {
        setShopifyMetadataSiteNames({
          oldSiteName: currentEnrollingAffiliate.name || "None",
          newSiteName: pendingAffiliateChange.newName,
        });
        setShowShopifyMetadataDialog(true);
      } else {
        onOpenChange(false);
      }
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update customer",
        description: error.response?.data?.message || "Please try again",
        variant: "destructive",
      });
    },
  });

  const sendTempPasswordMutation = useMutation({
    mutationFn: async (payload: any) => await sendTemporaryPassword({ customerId, domainName: payload.domainName }),
    onSuccess: () => {
      toast({ title: "Temporary password sent!" });
    },
    onError: () => {
      toast({ title: "Failed to send password", variant: "destructive" });
    },
  });

  // === Handlers ===
  const handleAffiliateChange = (newAffiliateId: string) => {
    const newAff = affiliates.find((a: any) => a.selfAffiliateId === newAffiliateId);
    if (newAff) {
      setPendingAffiliateChange({
        newId: newAff._id,
        newName: `${newAff.firstName} ${newAff.lastName}`,
        newAffiliateId: newAff.selfAffiliateId,
        oldId: currentEnrollingAffiliate?.affiliateId,
        oldName: currentEnrollingAffiliate?.name,
        oldAffiliateId: currentEnrollingAffiliate?.id,
      });
      setShowAffiliateChangeDialog(true);
    }
  };

  //For debounced Search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedOrderSearchTerm(orderSearchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [orderSearchTerm])

  const handleAffiliateChangeConfirm = (note?: string) => {
    if (!pendingAffiliateChange) return;

    const data = form.getValues();
    const payload: any = {
      ...data,
      enrolledBy: pendingAffiliateChange.newAffiliateId,
      emailOptedOut,
      phoneNumbers,
    };

    if (note) payload.affiliateChangeNote = note;

    // Here you could add Shopify field diff check + commission impact logic
    setPendingFormData(payload);
    setShowShopifyDialog(true); // or directly mutate if no Shopify fields changed
  };

  const handleShopifyConfirm = (updateShopify: boolean) => {
    if (pendingFormData) {
      updateMutation.mutate({ ...pendingFormData, updateShopify });
      setPendingFormData(null);
    }
    setShowShopifyDialog(false);
  };

  const handleShopifyMetadataConfirm = (updateMetadata: boolean) => {
    setShowShopifyMetadataDialog(false);
    setShopifyMetadataSiteNames(null);
    onOpenChange(false);
  };

  const handlePasswordChangeConfirm = () => {
    if (!passwordChangeNote.trim()) {
      toast({ title: "Note required", variant: "destructive" });
      return;
    }
    updateMutation.mutate({
      ...form.getValues(),
      password: pendingPassword,
      passwordChangeNote,
      emailOptedOut,
      phoneNumbers,
    });
    setShowPasswordChangeDialog(false);
    setPendingPassword("");
    setPasswordChangeNote("");
  };

  const onSubmit = (data: any) => {
    // Password change flow
    if (data.password?.trim()) {
      setPendingPassword(data.password);
      setShowPasswordChangeDialog(true);
      return;
    }

    // Enrolling affiliate change
    if (data.enrolledBy !== customerData?.enrolledBy) {
      handleAffiliateChange(data.enrolledBy);
      return;
    }

    // Normal update
    const payload: any = {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone || null,
      addressLineOne: data.addressLineOne || null,
      addressLineTwo: data.addressLineTwo || null,
      cityTown: data.cityTown || null,
      stateProvince: data.stateProvince || null,
      zipPostal: data.zipPostal || null,
      country: data.country || null,
      status: parseInt(data.status),
      emailOptedOut,
      phoneNumbers,
    };

    // Only send changed fields
    Object.keys(payload).forEach((key) => {
      if (payload[key] === customerData?.[key] || payload[key] === undefined) {
        delete payload[key];
      }
    });

    updateMutation.mutate(payload);
  };

  const statusLabels: Record<number, string> = {
    1: "Active",
    2: "Inactive",
    3: "Cancelled",
    4: "Terminated",
  };

  if (customerLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <div className="flex items-center justify-center py-12">
            <p>Loading customer data...</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

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
            <DialogTitle>View Customer - {fullName || "Loading..."}</DialogTitle>
          </div>
          {viewingContext && (
            <p className="text-sm text-muted-foreground mt-2">
              Viewing customers of {viewingContext.affiliateName}
            </p>
          )}
        </DialogHeader>

        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="details">Customer Details</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="notes">Notes & History</TabsTrigger>
          </TabsList>

          {/* === Details Tab === */}
          <TabsContent value="details" className="mt-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Name */}
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="firstName" render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl><Input {...field} disabled={readOnly} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="lastName" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl><Input {...field} disabled={readOnly} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>

                {/* Email + Phone */}
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="email" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl><Input type="email" {...field} disabled={readOnly} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <PhoneNumbersCompactManager
                    customerId={customerId}
                    phoneNumbers={phoneNumbers}
                    onChange={setPhoneNumbers}
                    disabled={readOnly}
                  />
                </div>

                {/* Address */}
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="addressLineOne" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address 1</FormLabel>
                      <FormControl><Input {...field} disabled={readOnly} /></FormControl>
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="addressLineTwo" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address 2</FormLabel>
                      <FormControl><Input {...field} disabled={readOnly} /></FormControl>
                    </FormItem>
                  )} />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <FormField control={form.control} name="cityTown" render={({ field }) => (
                    <FormItem><FormLabel>City</FormLabel><FormControl><Input {...field} disabled={readOnly} /></FormControl></FormItem>
                  )} />
                  <FormField control={form.control} name="stateProvince" render={({ field }) => (
                    <FormItem><FormLabel>State/Province</FormLabel><FormControl><Input {...field} disabled={readOnly} /></FormControl></FormItem>
                  )} />
                  <FormField control={form.control} name="zipPostal" render={({ field }) => (
                    <FormItem><FormLabel>Postal Code</FormLabel><FormControl><Input {...field} disabled={readOnly} /></FormControl></FormItem>
                  )} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="country" render={({ field }) => (
                    <FormItem><FormLabel>Country</FormLabel><FormControl><Input {...field} disabled={readOnly} /></FormControl></FormItem>
                  )} />
                  <FormField control={form.control} name="status" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} value={String(field.value)} disabled={readOnly}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status">
                              {field.value ? statusLabels[Number(field.value)] : "Select status"}
                            </SelectValue>
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.entries(statusLabels).map(([value, label]) => (
                            <SelectItem key={value} value={value}>{label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )} />
                </div>

                {/* Password Field */}
                {!readOnly && (
                  <FormField control={form.control} name="password" render={({ field }) => (
                    <FormItem>
                      <FormLabel>New Password</FormLabel>
                      <div className="flex gap-3">
                        <div className="relative flex-1">
                          <FormControl>
                            <Input
                              {...field}
                              type={showPassword ? "text" : "password"}
                              placeholder="Leave blank to keep current"
                            />
                          </FormControl>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            const domainName = window.location.origin;
                            setIsSendingTempPassword(true);
                            sendTempPasswordMutation.mutate({ domainName});
                            setIsSendingTempPassword(false);
                          }}
                          disabled={isSendingTempPassword}
                        >
                          {sendTempPasswordMutation.isPending ? "Sending..." : "Send Temporary Password"}
                        </Button>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        Only fill if you want to change the password. A note will be required.
                      </p>
                    </FormItem>
                  )} />
                )}

                {/* Email Opt-out */}
                {/* Email Opt-out - PENDING CHANGES STYLE */}
                <div className="p-4 border rounded-lg bg-muted/30 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {emailOptedOut ? (
                      <MailX className="h-5 w-5 text-destructive" />
                    ) : (
                      <Mail className="h-5 w-5 text-green-600" />
                    )}
                    <div>
                      <p className="font-medium">Email Preferences</p>
                      <p className="text-sm text-muted-foreground">
                        {emailOptedOut ? "Will opt out of emails" : "Will receive emails"}
                        {!form.formState.isDirty && emailOptedOut === !!customerData?.emailOptedOut && (
                          <span className="ml-2 text-xs text-muted-foreground italic">(no change)</span>
                        )}
                      </p>
                    </div>
                  </div>

                  {!readOnly && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setEmailOptedOut(!emailOptedOut)}
                      className={cn(
                        emailOptedOut
                          ? "border-green-600 text-green-600 hover:bg-green-50"
                          : "border-destructive text-destructive hover:bg-destructive/10"
                      )}
                    >
                      {emailOptedOut ? "Opt In" : "Opt Out"}
                    </Button>
                  )}
                </div>

                {/* Enrolling Affiliate */}
                {!readOnly && (
                  <FormField control={form.control} name="enrolledBy" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Enrolling Affiliate</FormLabel>
                      {currentEnrollingAffiliate && (
                        <div className="text-sm p-2 bg-muted rounded mb-2">
                          Current: <strong>{currentEnrollingAffiliate.name}</strong>
                        </div>
                      )}
                      <Command>
                        <CommandInput
                          placeholder="Search affiliates..."
                          value={affiliateSearch}
                          onValueChange={setAffiliateSearch}
                        />
                        {affiliateSearch && (
                          <CommandList>
                            <CommandEmpty>No affiliate found.</CommandEmpty>
                            <CommandGroup>
                              {filteredAffiliates.map((aff: any) => (
                                <CommandItem
                                  key={aff._id}
                                  onSelect={() => {
                                    field.onChange(aff.selfAffiliateId);
                                    setAffiliateSearch(`${aff.firstName} ${aff.lastName}`);
                                  }}
                                >
                                  <Check className={cn("mr-2 h-4 w-4", aff.selfAffiliateId === field.value ? "opacity-100" : "opacity-0")} />
                                  {aff.firstName} {aff.lastName} ({aff.selfAffiliateId})
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        )}
                      </Command>
                    </FormItem>
                  )} />
                )}

                {/* Submit Buttons */}
                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                    {readOnly ? "Close" : "Cancel"}
                  </Button>
                  {!readOnly && (
                    <Button type="submit" disabled={updateMutation.isPending}>
                      {updateMutation.isPending ? "Saving..." : "Save Changes"}
                    </Button>
                  )}
                </div>
              </form>
            </Form>
          </TabsContent>

          {/* === Orders Tab (Under Construction) === */}
          {/* <TabsContent value="orders">
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Construction className="h-20 w-20 text-muted-foreground mb-4" />
              <h3 className="text-2xl font-bold">Coming Soon</h3>
              <p className="text-muted-foreground max-w-md">
                The orders section is currently under development.
              </p>
            </div>
          </TabsContent> */}


          <TabsContent value="orders" className="mt-6">
            <div className="space-y-6">
              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-4 items-end">
                <div className="flex-1">
                  <label className="text-sm font-medium">Search Order ID</label>
                  <div className="relative mt-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="e.g. IWHA8NEJILHV"
                      value={orderSearchTerm}
                      onChange={(e) => {
                        setOrderSearchTerm(e.target.value);
                        setOrderCurrentPage(1);
                      }}
                      className="pl-10"
                    />
                  </div>
                </div>
                {/* From Date - Calendar Popover */}
                <div>
                  <label className="text-sm font-medium">From Date</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "mt-1 justify-start text-left font-normal w-full",
                          !orderStartDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {orderStartDate ? format(orderStartDate, formatString) : "Select date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={orderStartDate}
                        onSelect={(date) => {
                          setOrderStartDate(date);
                          setOrderCurrentPage(1);
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                {/* To Date - Calendar Popover */}
                <div>
                  <label className="text-sm font-medium">To Date</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "mt-1 justify-start text-left font-normal w-full",
                          !orderEndDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {orderEndDate ? format(orderEndDate, formatString) : "Select date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={orderEndDate}
                        onSelect={(date) => {
                          setOrderEndDate(date);
                          setOrderCurrentPage(1);
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                {(orderSearchTerm || orderStartDate || orderEndDate) && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setOrderSearchTerm("");
                      setOrderStartDate("");
                      setOrderEndDate("");
                      setOrderCurrentPage(1);
                    }}
                  >
                    Clear
                  </Button>
                )}
              </div>

              {ordersLoading ? (
                <div className="text-center py-16">
                  <p className="text-muted-foreground">Loading orders...</p>
                </div>
              ) : orders.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                  No orders found.
                </div>
              ) : (
                <>
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
                                  {isAdmin && order.shopifyOrderId && (
                                    <DropdownMenuItem
                                      onClick={() => {
                                        if (confirm("Are you sure you want to delete this order?")) {
                                          // deleteMutation.mutate(order.id);
                                          deleteMutation.mutate(order._id);
                                        }
                                      }}
                                      className="text-destructive"
                                    >
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      Delete
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
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Pagination */}
                  {totalOrders > 0 && (
                    <div className="flex items-center justify-between mt-6">
                      <div className="flex items-center gap-6">
                        <div className="text-sm text-muted-foreground">
                          Showing {(orderCurrentPage - 1) * orderItemsPerPage + 1} to{" "}
                          {Math.min(orderCurrentPage * orderItemsPerPage, totalOrders)} of {totalOrders} order{totalOrders !== 1 ? "s" : ""}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">Per page:</span>
                          <Select
                            value={orderItemsPerPage.toString()}
                            onValueChange={(v) => {
                              setOrderItemsPerPage(Number(v));
                              setOrderCurrentPage(1);
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

                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          onClick={() => setOrderCurrentPage(p => Math.max(1, p - 1))}
                          disabled={orderCurrentPage === 1}
                        >
                          Previous
                        </Button>

                        {totalPages > 1 && (
                          <div className="flex items-center gap-1">
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1).map((page) => (
                              <Button
                                key={page}
                                variant={orderCurrentPage === page ? "default" : "outline"}
                                size="sm"
                                onClick={() => setOrderCurrentPage(page)}
                                className="min-w-[2.5rem]"
                              >
                                {page}
                              </Button>
                            ))}
                          </div>
                        )}

                        <span className="text-sm text-muted-foreground">
                          Page {orderCurrentPage} of {totalPages}
                        </span>

                        <Button
                          variant="outline"
                          onClick={() => setOrderCurrentPage(p => Math.min(totalPages, p + 1))}
                          disabled={orderCurrentPage === totalPages}
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </TabsContent>

          {/* === Notes Tab === */}
          <TabsContent value="notes">
            <CustomerNotes customerId={customerId} />
          </TabsContent>
        </Tabs>
      </DialogContent>

      {/* === Supporting Dialogs === */}
      {showAffiliateChangeDialog && pendingAffiliateChange && currentEnrollingAffiliate && (
        <EnrollingAffiliateChangeDialog
          open={showAffiliateChangeDialog}
          onOpenChange={setShowAffiliateChangeDialog}
          oldAffiliateName={currentEnrollingAffiliate.name}
          oldAffiliateId={currentEnrollingAffiliate.affiliateId}
          newAffiliateName={pendingAffiliateChange.newName}
          newAffiliateId={pendingAffiliateChange.newAffiliateId}
          onConfirm={handleAffiliateChangeConfirm}
        />
      )}

      <ShopifyUpdateDialog
        open={showShopifyDialog}
        onOpenChange={setShowShopifyDialog}
        onConfirm={handleShopifyConfirm}
        entityType="customer"
      />

      {showShopifyMetadataDialog && shopifyMetadataSiteNames && (
        <ShopifyMetadataUpdateDialog
          open={showShopifyMetadataDialog}
          onOpenChange={setShowShopifyMetadataDialog}
          onConfirm={handleShopifyMetadataConfirm}
          oldSiteName={shopifyMetadataSiteNames.oldSiteName}
          newSiteName={shopifyMetadataSiteNames.newSiteName}
        />
      )}

      <Dialog open={showPasswordChangeDialog} onOpenChange={setShowPasswordChangeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Password Change Reason</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <textarea
              className="w-full min-h-32 p-3 border rounded-md"
              placeholder="Enter reason for changing password..."
              value={passwordChangeNote}
              onChange={(e) => setPasswordChangeNote(e.target.value)}
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowPasswordChangeDialog(false)}>Cancel</Button>
              <Button onClick={handlePasswordChangeConfirm}>Update Password</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>


      {/* View Order Details - THIS IS WHAT YOU NEEDED */}
      {selectedOrderId && (
        <OrderDetailDialog
          orderId={selectedOrderId}
          customerType="customer"
          open={!!selectedOrderId}
          onOpenChange={(open) => !open && setSelectedOrderId(null)}
        />
      )}

      {/* Notes Dialog */}
      {notesOrderId && (
        <NotesDialog
          open={!!notesOrderId}
          onOpenChange={(open) => !open && setNotesOrderId(null)}
          entityId={notesOrderId}
          entityType="order"
          entityName={`Order ${notesOrderNumber}`}
        />
      )}
    </Dialog>
  );
}