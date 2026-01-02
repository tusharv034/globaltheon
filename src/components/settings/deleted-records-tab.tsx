import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Trash2, RotateCcw, Users, ShoppingCart, UserCheck, FolderX, FileText } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { DeletionLogsDialog } from "./deletion-logs-dialog";
import { useModulePermissions } from "@/hooks/use-module-permissions";
import { emptyPermanentDeleteAffiliate, getDeletedAffiliates, permanentDeleteAffiliate, restoreAffiliate } from "@/api/affiliate";
import { emptyPermanentDeleteCustomer, getDeletedCustomer, permanentDeleteCustomer, restoreCustomer } from "@/api/customer";
import { useDateFormatStore } from "@/store/useDateFormat";
import { getDateFormatString } from "@/utils/resolveDateFormat";
import { getDeletedOrders, restoreOrder, permanentDeleteOrder,emptyPermanentDeleteOrders } from "@/api/orders";
type EntityType = "customers" | "affiliates" | "orders";

interface DeletedRecord {
  id: string;
  deleted_at: string;
  deleted_by?: string;
  deleted_by_profile?: {
    first_name: string;
    last_name: string;
  };
  [key: string]: any;
}

const orderStatusMap = (status: number) => {
  const statusText = {
    0: "Pending",
    1: "Accepted",
    2: "Paid",
    3: "Fulfilled",
    4: "Refunded",
    5: "Canceled",
    6: "Printed",
    7 : "Shipped"
  }
  return statusText[status];
}


export function DeletedRecordsTab() {

  const [selectedEntity, setSelectedEntity] = useState<{
    type: EntityType;
    id: string;
    name: string;
  } | null>(null);
  const [actionType, setActionType] = useState<"restore" | "permanent" | "empty-folder" | null>(null);
  const [emptyFolderType, setEmptyFolderType] = useState<EntityType | null>(null);
  const [showLogsDialog, setShowLogsDialog] = useState(false);
  const queryClient = useQueryClient();
  const { hasPermission } = useModulePermissions();
  const canEdit = true;

  const { dateFormatRegion, dateFormatVariant } = useDateFormatStore();
  const formatString = getDateFormatString(dateFormatRegion, dateFormatVariant);


  const [activeTab, setActiveTab] = useState<"customers" | "affiliates" | "orders">("customers");

  const [pagination, setPagination] = useState({
    customers: { page: 1, limit: 25 },
    affiliates: { page: 1, limit: 25 },
    orders: { page: 1, limit: 25 }, // orders doesn't paginate yet, but we keep it for consistency
  });

  //fetch deleted customers
  const { data: deletedCustomers, isLoading: loadingCustomers } = useQuery({
    queryKey: ["deleted-customers", pagination.customers],
    queryFn: async () => {

      const payload = {
        page: pagination.customers.page,
        limit: pagination.customers.limit,
      }

   

      const response = await getDeletedCustomer(payload);

     

      return response.data.data;
    }
  });

  // Fetch deleted affiliates
  const { data: deletedAffiliates, isLoading: loadingAffiliates } = useQuery({
    queryKey: ["deleted-affiliates", pagination.affiliates],
    queryFn: async () => {

      const payload = {
        page: pagination.affiliates.page,
        limit: pagination.affiliates.limit,
      }

   

      const response = await getDeletedAffiliates(payload);

     

      return response.data.data;
    }
  });

  const { data: deletedOrders, isLoading: loadingOrders } = useQuery({
    queryKey: ["deleted-orders", pagination.orders],
    queryFn: async () => {
      const payload = {
        page: pagination.orders.page,
        limit: pagination.orders.limit,
      }
      
      const response = await getDeletedOrders(payload);

      return response?.data;
    }

  })


  // Restore mutation
  const restoreMutation = useMutation({
    mutationFn: async ({ type, id }: { type: EntityType; id: string }) => {
      const { error } = await supabase
        .from(type)
        .update({ deleted_at: null })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      toast.success(`Successfully restored ${variables.type.slice(0, -1)}`);
      queryClient.invalidateQueries({ queryKey: [`deleted-${variables.type}`] });
      queryClient.invalidateQueries({ queryKey: [variables.type] });
      setSelectedEntity(null);
      setActionType(null);
    },
    onError: (error) => {
      toast.error("Failed to restore record: " + error.message);
    },
  });

  // Define the mutation to restore a customer
  const restoreCustomerMutation = useMutation({
    mutationFn: async (customerId: string) => {
      // console.log("Requesting restore customer restore for ID:", customerId);

      const response = await restoreCustomer(customerId);

      // Throw if backend reports failure
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to restore customer');
      }

      // Optionally return data if you want to use it in onSuccess
      return response.data.data;
    },
    onSuccess: (data, customerId) => {
      toast.success(`Customer restored successfully`);

      // Invalidate both deleted and active customer lists
      queryClient.invalidateQueries({ queryKey: ['deleted-customers'] });
      queryClient.invalidateQueries({ queryKey: ['customers'] }); // if you have this query
    },
    onError: (error: Error) => {
      console.error("Restore customer error:", error);
      toast.error(error.message || "Failed to restore customer");
    },
  });
  // Define the mutation to restore an affiliate
  const restoreAffiliateMutation = useMutation({
    mutationFn: async (affiliateId: string) => {
      // Call the restoreAffiliate API function, passing the affiliateId
      // console.log("Requesting restore id : ", affiliateId);
      const response = await restoreAffiliate(affiliateId);

      // Ensure the API call is successful before proceeding
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to restore affiliate');
      }
    },
    onSuccess: (_, affiliateId) => {
      toast.success(`Successfully restored the affiliate`);

      // Invalidate relevant queries to refresh the state
      queryClient.invalidateQueries({ queryKey: ['deleted-affiliates'] });
      queryClient.invalidateQueries({ queryKey: ['affiliates'] });
    },
    onError: (error) => {
      // console.log("erorr is : ", error);
      toast.error("Failed to restore affiliate: " + error.message);
    },
  });

  const restoreOrderMutation = useMutation({
    mutationFn: async (orderId: string) => {
      // Call the restoreOrder API function, passing the orderId
      const response = await restoreOrder(orderId);
     
      // Ensure the API call is successful before proceeding
      if (!response.success) {
        throw new Error(response.data.message || 'Failed to restore order');
      }
    },
    onSuccess: (_, orderId) => {
      toast.success(`Successfully restored order`);

      // Invalidate relevant queries to refresh the state
      queryClient.invalidateQueries({ queryKey: ['deleted-orders'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
    onError: (error) => {
      toast.error("Failed to restore order: " + error.message);
    },
  });

  // Permanent delete mutation with logging
  const permanentDeleteMutation = useMutation({
    mutationFn: async ({ type, id, identifier, name }: {
      type: EntityType;
      id: string;
      identifier: string;
      name: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      // Create deletion log
      const { error: logError } = await supabase
        .from("deletion_logs")
        .insert({
          entity_type: type.slice(0, -1), // Remove 's' from plural
          entity_id: id,
          entity_identifier: identifier,
          entity_name: name,
          deleted_by: user.id,
          deletion_type: "single",
          deletion_date: new Date().toISOString(),
        });

      if (logError) throw logError;

      // Permanently delete the record
      const { error } = await supabase
        .from(type)
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      toast.success(`Permanently deleted ${variables.type.slice(0, -1)}`);
      queryClient.invalidateQueries({ queryKey: [`deleted-${variables.type}`] });
      setSelectedEntity(null);
      setActionType(null);
    },
    onError: (error) => {
      toast.error("Failed to delete record: " + error.message);
    },
  });

  const permanentDeleteCustomerMutation = useMutation({
    mutationFn: async ({ id, entityType }: any) => await permanentDeleteCustomer({ id, entityType }),
    onSuccess: (_, variables) => {
     
      toast.success(`Permanently deleted ${selectedEntity?.type?.slice(0, -1)}`);
      queryClient.invalidateQueries({ queryKey: [`deleted-customers`] });
      setSelectedEntity(null);
      setActionType(null);
    },
    onError: (error) => {
      console.log("error is ", error);
      toast.error("Failed to delete record: " + error.message);
    },
  });

  const permanentDeleteAffiliateMutation = useMutation({
    mutationFn: async ({ id, entityType }: any) => await permanentDeleteAffiliate({ id, entityType }),
    onSuccess: (_, variables) => {
      toast.success(`Permanently deleted affiliates`);
      queryClient.invalidateQueries({ queryKey: [`deleted-affiliates`] });
      setSelectedEntity(null);
      setActionType(null);
    },
    onError: (error) => {
      toast.error("Failed to delete record: " + error.message);
    },
  });

  const permanentDeleteOrderMutation = useMutation({
  mutationFn: async ({ orderId }: { orderId: string }) => {
    // Call the permanentDeleteOrder API function, passing the orderId
    return await permanentDeleteOrder(orderId);
  },
  onSuccess: (_, variables) => {
    // Success handling, notify the user and invalidate queries
    toast.success(`Permanently deleted order`);

    // Invalidate relevant queries to refresh the state
    queryClient.invalidateQueries({ queryKey: ['deleted-orders'] });
    queryClient.invalidateQueries({ queryKey: ['orders'] });

    // Reset any UI state (if necessary)
    setSelectedEntity(null); // Reset the selected entity if required
    setActionType(null); // Reset the action type if required
  },
  onError: (error) => {
    // Error handling, show an error toast
    toast.error("Failed to permanently delete order: " + error.message);
  },
});


  // Empty folder mutation with logging
  const emptyFolderMutation = useMutation({
    mutationFn: async (type: EntityType) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      // Get all deleted records for this type
      const { data: records, error: fetchError } = await supabase
        .from(type)
        .select("*")
        .not("deleted_at", "is", null);

      if (fetchError) throw fetchError;
      if (!records || records.length === 0) return;

      // Create logs for each record
      const logs = records.map((record: any) => {
        const identifier = type === "customers"
          ? record.customer_id
          : type === "affiliates"
            ? record.affiliate_id
            : record.order_number;

        const name = type === "orders"
          ? `Order ${record.order_number}`
          : `${record.first_name} ${record.last_name}`;

        return {
          entity_type: type.slice(0, -1),
          entity_id: record.id,
          entity_identifier: identifier,
          entity_name: name,
          deleted_by: user.id,
          deletion_type: "bulk_empty_folder",
          deletion_date: new Date().toISOString(),
          additional_info: { bulk_count: records.length }
        };
      });

      const { error: logError } = await supabase
        .from("deletion_logs")
        .insert(logs);

      if (logError) throw logError;

      // Permanently delete all records
      const { error: deleteError } = await supabase
        .from(type)
        .delete()
        .not("deleted_at", "is", null);

      if (deleteError) throw deleteError;

      return records.length;
    },
    onSuccess: (count, type) => {
      toast.success(`Permanently deleted ${count} ${type} from folder`);
      queryClient.invalidateQueries({ queryKey: [`deleted-${type}`] });
      setEmptyFolderType(null);
      setActionType(null);
    },
    onError: (error) => {
      toast.error("Failed to empty folder: " + error.message);
    },
  });

  const emptyCustomerFolderMutation = useMutation({
    mutationFn: async () => await emptyPermanentDeleteCustomer(),
    onSuccess: (count, type) => {
      toast.success(`Permanently deleted ${count} customers from folder`);
      queryClient.invalidateQueries({ queryKey: [`deleted-customers`] });
      setEmptyFolderType(null);
      setActionType(null);
    },
    onError: (error) => {
      toast.error("Failed to empty folder: " + error.message);
    },
  });

  const emptyAffiliateFolderMutation = useMutation({
    mutationFn: async () => await emptyPermanentDeleteAffiliate(),
    onSuccess: (count, type) => {
      toast.success(`Permanently deleted ${count} affiliates from folder`);
      queryClient.invalidateQueries({ queryKey: [`deleted-affiliates`] });
      setEmptyFolderType(null);
      setActionType(null);
    },
    onError: (error) => {
      toast.error("Failed to empty folder: " + error.message);
    },
  });

  const emptyOrderFolderMutation = useMutation({
  mutationFn: async () => await emptyPermanentDeleteOrders(),
  onSuccess: (data) => {
    // Assuming the API returns a success message or count, use that in the success toast
    toast.success("Permanently deleted orders from folder");

    // Optionally, invalidate queries to refresh the state
    queryClient.invalidateQueries({ queryKey: ['orders'] });
    queryClient.invalidateQueries({ queryKey: ['deleted-orders'] });

    // Reset any UI-related state if needed
    setEmptyFolderType(null);  // Adjust if you have folder types to clear
    setActionType(null);       // Adjust based on your UI state reset logic
  },
  onError: (error) => {
    toast.error("Failed to empty order folder: " + error.message);
  },
});


  const handleAction = (type: EntityType, id: string, name: string, action: "restore" | "permanent") => {
 
    if (action === "restore") {
      if (!canEdit) {
        toast.error("You need edit permissions to restore records");
        return;
      }
    }
    if (action === "permanent") {
      if (!canEdit) {
        toast.error("You need edit permissions to delete records");
        return;
      }
    }

    // return;

    setSelectedEntity({ type, id, name });
    setActionType(action);
  };

  const confirmAction = async () => {
    if (actionType === "empty-folder" && emptyFolderType) {
    
    
      if (emptyFolderType === "customers") {
       

        await emptyCustomerFolderMutation.mutateAsync();
      }
      if (emptyFolderType === "affiliates") {

        await emptyAffiliateFolderMutation.mutateAsync();
      }
      if (emptyFolderType === "orders") {
        await emptyOrderFolderMutation.mutateAsync();

      }
    }

    if (!selectedEntity || !actionType) {
      return;
    }

    if (actionType === "restore") {

      if (selectedEntity.type === "customers") {
       
        restoreCustomerMutation.mutate(selectedEntity.id)
      }

      if (selectedEntity.type === "affiliates") {
       
        restoreAffiliateMutation.mutate(selectedEntity.id)
      }

      if (selectedEntity.type === "orders") {

        restoreOrderMutation.mutate(selectedEntity.id);
      }
    }

    if (actionType === "permanent") {

      // Get the identifier based on entity type
      let identifier = "";

      if (selectedEntity.type === "customers") {

        const customer = deletedCustomers?.customers?.find((c: any) => c._id === selectedEntity.id);

        identifier = customer?._id || "";

        await permanentDeleteCustomerMutation.mutateAsync({
          id: selectedEntity.id,
          entityType: selectedEntity?.type?.slice(0, -1).trim()
        });
      }

      if (selectedEntity.type === "affiliates") {

        const affiliate = deletedAffiliates.affiliates?.find((a: any) => a._id === selectedEntity.id);

        identifier = affiliate?._id || "";

       

        permanentDeleteAffiliateMutation.mutate({
          id: selectedEntity.id,
          entityType: selectedEntity?.type?.slice(0, -1).trim()
        });
      }

      if (selectedEntity.type === "orders") {
        
        permanentDeleteOrderMutation.mutate({
          orderId: selectedEntity.id
        });
      }

   

      // permanentDeleteMutation.mutate({
      //   type: selectedEntity.type,
      //   id: selectedEntity.id,
      //   identifier,
      //   name: selectedEntity.name
      // });
    }
  };

  const handleRestore = (type: EntityType, id: string, name: string) => {
    if (!canEdit) {
      toast.error("You need edit permissions to restore records");
      return;
    }
    setSelectedEntity({ type, id, name });
    setActionType("restore");
  };

  const handlePermanentDelete = (type: EntityType, id: string, name: string) => {
    if (!canEdit) {
      toast.error("You need edit permissions to permanently delete records");
      return;
    }
    setSelectedEntity({ type, id, name });
    setActionType("permanent");
  };

  const handleEmptyFolder = (type: EntityType) => {
    if (!canEdit) {
      toast.error("You need edit permissions to empty folders");
      return;
    }
    setEmptyFolderType(type);
    setActionType("empty-folder");
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">Deleted Records</h2>
            <p className="text-sm text-muted-foreground">
              Manage deleted customers, affiliates, and orders. You can restore them or permanently delete them.
            </p>
          </div>
          <Button variant="outline" onClick={() => setShowLogsDialog(true)}>
            <FileText className="h-4 w-4 mr-2" />
            View Deletion Logs
          </Button>
        </div>

        <Tabs defaultValue="customers" onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="customers" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Customers ({deletedCustomers?.customers?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="affiliates" className="flex items-center gap-2">
              <UserCheck className="h-4 w-4" />
              Affiliates ({deletedAffiliates?.affiliates?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="orders" className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              Orders ({deletedOrders?.orders?.length || 0})
            </TabsTrigger>
          </TabsList>

          {/* Customers Tab */}
          <TabsContent value="customers" className="mt-6">
            <div className="flex justify-between items-center mb-4">
              <p className="text-sm text-muted-foreground">
                {deletedCustomers?.customers?.length || 0} deleted customer{deletedCustomers?.customers?.length !== 1 ? 's' : ''}
              </p>
              {deletedCustomers?.customers && deletedCustomers?.customers?.length > 1 && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleEmptyFolder("customers")}
                >
                  <FolderX className="h-4 w-4 mr-2" />
                  Empty Folder
                </Button>
              )}
            </div>
            {loadingCustomers ? (
              <div className="text-center py-8">Loading deleted customers...</div>
            ) : !deletedCustomers?.customers?.length ? (
              <div className="text-center py-8 text-muted-foreground">
                No deleted customers found
              </div>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Deleted On</TableHead>
                      <TableHead>Deleted By</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {deletedCustomers?.customers?.map((customer: any) => (
                      <TableRow key={customer._id}>
                        <TableCell className="font-medium">{customer.selfCustomerId}</TableCell>
                        <TableCell>{customer.firstName} {customer.lastName}</TableCell>
                        <TableCell>{customer.email}</TableCell>
                        <TableCell>{customer.phone || "N/A"}</TableCell>
                        <TableCell>
                          {format(new Date(customer.deletedAt), `${formatString} h:mm a`)}
                        </TableCell>
                        <TableCell>
                          {customer.deletedBy
                            ? `${customer.deletedBy.firstName} ${customer.deletedBy.lastName}`
                            : "Unknown"}
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              handleAction(
                                "customers",
                                customer._id,
                                `${customer.firstName} ${customer.lastName}`,
                                "restore"
                              )
                            }
                          >
                            <RotateCcw className="h-4 w-4 mr-1" />
                            Restore
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() =>
                              handleAction(
                                "customers",
                                customer._id,
                                `${customer.firstName} ${customer.lastName}`,
                                "permanent"
                              )
                            }
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Delete
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>

          {/* Affiliates Tab */}
          <TabsContent value="affiliates" className="mt-6">
            <div className="flex justify-between items-center mb-4">
              <p className="text-sm text-muted-foreground">
                {deletedAffiliates?.affiliates?.length || 0} deleted affiliate{deletedAffiliates?.affiliates?.length !== 1 ? 's' : ''}
              </p>
              {deletedAffiliates?.affiliates && deletedAffiliates?.affiliates?.length > 1 && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleEmptyFolder("affiliates")}
                >
                  <FolderX className="h-4 w-4 mr-2" />
                  Empty Folder
                </Button>
              )}
            </div>
            {loadingAffiliates ? (
              <div className="text-center py-8">Loading deleted affiliates...</div>
            ) : !deletedAffiliates?.affiliates?.length ? (
              <div className="text-center py-8 text-muted-foreground">
                No deleted affiliates found
              </div>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Affiliate ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Site Name</TableHead>
                      <TableHead>Deleted On</TableHead>
                      <TableHead>Deleted By</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {deletedAffiliates?.affiliates?.map((affiliate: any) => (
                      <TableRow key={affiliate._id}>
                        <TableCell className="font-medium">{affiliate.selfAffiliateId}</TableCell>
                        <TableCell>{affiliate.first_name} {affiliate.firstName}</TableCell>
                        <TableCell>{affiliate.email}</TableCell>
                        <TableCell>{affiliate.siteName || "N/A"}</TableCell>
                        <TableCell>
                          {format(new Date(affiliate.deletedAt), `${formatString} h:mm a`)}
                        </TableCell>
                        <TableCell>
                          {affiliate.deletedBy
                            ? `${affiliate.deletedBy.firstName} ${affiliate.deletedBy.lastName}`
                            : "Unknown"}
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              handleAction(
                                "affiliates",
                                affiliate._id,
                                `${affiliate.firstName} ${affiliate.lastName}`,
                                "restore"
                              )
                            }
                          >
                            <RotateCcw className="h-4 w-4 mr-1" />
                            Restore
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() =>
                              handleAction(
                                "affiliates",
                                affiliate._id,
                                `${affiliate.firstName} ${affiliate.lastName}`,
                                "permanent"
                              )
                            }
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Delete
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders" className="mt-6">
            <div className="flex justify-between items-center mb-4">
              <p className="text-sm text-muted-foreground">
                {deletedOrders?.orders?.length || 0} deleted order{deletedOrders?.orders?.length !== 1 ? 's' : ''}
              </p>
              {deletedOrders?.orders && deletedOrders?.orders?.length > 1 && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleEmptyFolder("orders")}
                >
                  <FolderX className="h-4 w-4 mr-2" />
                  Empty Folder
                </Button>
              )}
            </div>
            {loadingOrders ? (
              <div className="text-center py-8">Loading deleted orders...</div>
            ) : !deletedOrders?.orders?.length ? (
              <div className="text-center py-8 text-muted-foreground">
                No deleted orders found
              </div>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order #</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Deleted On</TableHead>
                      <TableHead>Deleted By</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {deletedOrders?.orders?.map((order) => (
                      <TableRow key={order._id}>
                        <TableCell className="font-medium">{order.orderId}</TableCell>
                        <TableCell>
                          {order?.customerName}
                        </TableCell>
                        <TableCell>{formatCurrency(Number(order.amount || 0))}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{orderStatusMap(order.status)}</Badge>
                        </TableCell>
                        <TableCell>
                          {format(new Date(order.deletedAt), `${formatString} h:mm a`)}
                        </TableCell>
                        <TableCell>
                          {order.deletedBy
                            ? `${order.deletedBy}`
                            : "Unknown"}
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              handleAction("orders", order._id, order.orderId, "restore")
                            }
                          >
                            <RotateCcw className="h-4 w-4 mr-1" />
                            Restore
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() =>
                              handleAction("orders", order._id, order.orderId, "permanent")
                            }
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Delete
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Pagination */}

        {/* Ultra-Safe Pagination – works even if pagination is null/undefined */}

        {(() => {
          const current = pagination[activeTab];

          // Safely get data and pagination meta
          let items: any[] = [];
          let meta: { total: number; page: number; limit: number; totalPages: number } | null = null;

          if (activeTab === "customers") {
            items = deletedCustomers?.customers || [];
            meta = deletedCustomers?.pagination || null;
          } else if (activeTab === "affiliates") {
            items = deletedAffiliates?.affiliates || [];
            meta = deletedAffiliates?.pagination || null;
          } else if (activeTab === "orders") {
            items = deletedOrders || [];
            meta = items.length > 0
              ? { total: items.length, page: 1, limit: items.length, totalPages: 1 }
              : null;
          }

          // If no items at all → hide pagination
          if (items.length === 0 || !meta) return null;

          const isOrdersTab = activeTab === "orders";

          return (
            <div className="flex items-center justify-between mt-6">
              <div className="flex items-center gap-6">
                <p className="text-sm text-muted-foreground">
                  Showing {(current.page - 1) * current.limit + 1} to{" "}
                  {Math.min(current.page * current.limit, meta.total)} of {meta.total}{" "}
                  {activeTab}
                </p>

                {/* Only show per-page selector if backend supports pagination */}
                {!isOrdersTab && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Per page:</span>
                    <Select
                      value={current.limit.toString()}
                      onValueChange={(val) => {
                        setPagination(prev => ({
                          ...prev,
                          [activeTab]: { page: 1, limit: Number(val) },
                        }));
                      }}
                    >
                      <SelectTrigger className="w-20">
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
                )}
              </div>

              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={current.page <= 1 || isOrdersTab}
                  onClick={() =>
                    setPagination(prev => ({
                      ...prev,
                      [activeTab]: { ...prev[activeTab], page: Math.max(1, prev[activeTab].page - 1) },
                    }))
                  }
                >
                  Previous
                </Button>

                <span className="text-sm text-muted-foreground">
                  Page {current.page} of {meta.totalPages}
                </span>

                <Button
                  variant="outline"
                  size="sm"
                  disabled={current.page >= meta.totalPages || isOrdersTab}
                  onClick={() =>
                    setPagination(prev => ({
                      ...prev,
                      [activeTab]: { ...prev[activeTab], page: prev[activeTab].page + 1 },
                    }))
                  }
                >
                  Next
                </Button>
              </div>
            </div>
          );
        })()}
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog
        open={(!!selectedEntity && !!actionType) || (!!emptyFolderType && actionType === "empty-folder")}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedEntity(null);
            setActionType(null);
            setEmptyFolderType(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actionType === "restore"
                ? "Restore Record"
                : actionType === "empty-folder"
                  ? "Empty Folder"
                  : "Permanently Delete Record"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {actionType === "restore" ? (
                <>
                  Are you sure you want to restore <strong>{selectedEntity?.name}</strong>?
                  This will make the record visible and accessible again.
                </>
              ) : actionType === "empty-folder" ? (
                <>
                  Are you sure you want to <strong className="text-destructive">permanently delete ALL</strong>{" "}
                  {emptyFolderType === "customers"
                    ? `${deletedCustomers?.customers?.length} customers`
                    : emptyFolderType === "affiliates"
                      ? `${deletedAffiliates?.affiliates?.length} affiliates`
                      : `${deletedOrders?.length} orders`
                  } in this folder? This action cannot be undone and all data will be lost forever.
                  A log will be created for each deleted record.
                </>
              ) : (
                <>
                  Are you sure you want to <strong className="text-destructive">permanently delete</strong>{" "}
                  <strong>{selectedEntity?.name}</strong>? This action cannot be undone and all
                  associated data will be lost forever. A deletion log will be created for audit purposes.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmAction}
              className={actionType !== "restore" ? "bg-destructive hover:bg-destructive/90" : ""}
            >
              {actionType === "restore" ? "Restore" : actionType === "empty-folder" ? "Empty Folder" : "Delete Permanently"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Deletion Logs Dialog */}
      <DeletionLogsDialog
        open={showLogsDialog}
        onOpenChange={setShowLogsDialog}
      />
    </Card>
  );
}
