import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useUserRole } from "@/hooks/use-user-role";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { formatCurrency } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon, MoreVertical, Pencil, ShoppingCart, FileText, Trash2, Download, ArrowUpDown, ArrowUp, ArrowDown, Construction, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { OrderDetailDialog } from "@/components/customers/order-detail-dialog";
import { NotesDialog } from "@/components/shared/notes-dialog";
import { CustomerEditDialog } from "@/components/customers/customer-edit-dialog";
import { AffiliateEditDialog } from "@/components/affiliates/affiliate-edit-dialog";
import { getAllOrders, deleteOrder, initiateOrderExport, checkExportStatus } from "@/api/orders"
import { useShopifyStore } from "@/store/useAuthStore";
import { useDateFormatStore } from "@/store/useDateFormat";
import { getDateFormatString } from "@/utils/resolveDateFormat";
interface OrderWithDetails {
  id: string;
  order_number: string;
  shopify_order_number: string | null;
  order_date: string;
  amount: number;
  subtotal: number;
  tax_amount: number;
  shipping_cost: number;
  status: string;
  subscription: boolean;
  customer_id: string;
  customer_name: string;
  customer_email: string;
  customer_type: "Customer" | "Affiliate";
  level1_affiliate_id: string | null;
  level1_affiliate_name: string | null;
  level2_affiliate_id: string | null;
  level2_affiliate_name: string | null;
  payment_method: string | null;
}

const statusOptions = [
  "All Statuses",
  "Pending",
  "Accepted",
  "Paid",
  "Fulfilled",
  "Refunded",
  "Canceled",
  "Printed",
  "Shipped"
];


// Map display text → backend number
const statusToNumberMap: Record<string, number> = {
  "All Statuses": -1,
  "Pending": 0,
  "Accepted": 1,
  "Paid": 2,
  "Fulfilled": 3,
  "Refunded": 4,
  "Canceled": 5,
  "Printed": 6,
  "Shipped": 7
};

// Map number → display text (for showing correct label when state is number)
const numberToStatusMap = Object.fromEntries(
  Object.entries(statusToNumberMap).map(([text, num]) => [num, text])
);

export const OrderTable = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState(-1);
  const [typeFilter, setTypeFilter] = useState("All Types");
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [notesOrderId, setNotesOrderId] = useState<string | null>(null);
  const [notesOrderNumber, setNotesOrderNumber] = useState<string>("");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [selectedCustomerType, setSelectedCustomerType] = useState<string | null>(null);
  const [selectedAffiliateId, setSelectedAffiliateId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortColumn, setSortColumn] = useState<"date" | "customer" | "type" | "subscription" | "level1" | "level2" | "status" | "amount">("date");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [itemsPerPage, setItemsPerPage] = useState(25);

  const [exportId, setExportId] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [exportStatus, setExportStatus] = useState<"idle" | "processing" | "completed" | "failed">("idle");
  const shopifyUrl = useShopifyStore((state) => state.shopifyUrl);

  const { dateFormatRegion, dateFormatVariant } = useDateFormatStore();
  const formatString = getDateFormatString(dateFormatRegion, dateFormatVariant);


  const initiateExportMutation = useMutation({
    mutationFn: initiateOrderExport,
    onSuccess: (data) => {
      if (data.success && data.data.exportId) {
        setExportId(data.data.exportId);
        setExportStatus("processing");
        setDownloadUrl(null);
        toast.success("Export started! Preparing your file...", { duration: 5000 });
      }
    },
    onError: () => {
      toast.error("Failed to start export");
      setExportStatus("idle");
    },
  });
  // Poll export status only when processing
  const { data: exportStatusData } = useQuery({
    queryKey: ["exportStatus", exportId],
    queryFn: () => checkExportStatus(exportId!),
    enabled: exportStatus === "processing" && !!exportId,
    refetchInterval: (query) => {
      // Stop polling if we have a final status
      const data = query.state.data as any;
      if (data?.success && (data.data.status === "completed" || data.data.status === "failed")) {
        return false; // Stops refetching
      }
      return 1000; // Poll every 3 seconds otherwise
    },
    staleTime: Infinity, // Prevent unnecessary refetching
  });

  // Handle status updates manually when data changes
  // Auto-trigger download when export completes, then reset state
  useEffect(() => {
    if (exportStatusData?.success && exportStatusData.data.status === "completed") {
      const url = exportStatusData.data.downloadUrl;
      const filename = exportStatusData.data.filename || `orders_export_${format(new Date(), `${formatString}_HH-mm-ss`)}.csv`;

      // Create invisible link and click it to trigger download
      const a = document.createElement("a");
      a.href = url;
      a.download = filename; // Suggest filename
      a.style.display = "none";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      // Show success toast
      toast.success(
        `Export completed! Downloading ${exportStatusData.data.recordCount} records...`,
        { duration: 8000 }
      );

      // Reset state after a short delay to allow download to start
      setTimeout(() => {
        setExportStatus("idle");
        setDownloadUrl(null);
        setExportId(null);
      }, 1000);
    } else if (exportStatusData?.success && exportStatusData.data.status === "failed") {
      toast.error("Export failed. Please try again.");
      setExportStatus("idle");
      setExportId(null);
    }
  }, [exportStatusData]);

  useEffect(() => {
    setCurrentPage(1);
  }, [
    searchTerm,
    statusFilter,
    typeFilter,
    startDate,
    endDate,
    // Optional: also reset on sort change? Usually no — users expect sort to keep current page
    // sortColumn,
    // sortDirection,
  ]);

  //debounced Search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const { isAdmin } = useUserRole();

  // Using useQuery directly with queryKey and queryFn
  const { data: orderData, isLoading, isError } = useQuery({
    queryKey: [
      "orders",
      typeFilter,
      debouncedSearchTerm,
      startDate?.toISOString().split("T")[0],
      endDate?.toISOString().split("T")[0],
      currentPage,
      itemsPerPage,
      statusFilter,
      sortColumn,        // ← Add these
      sortDirection,     // ← for cache busting
    ],
    queryFn: async () => {
      const result = await getAllOrders({
        orderType: typeFilter === "All Types" ? "all" : typeFilter,
        startDate: startDate ? format(startDate, formatString) : undefined,
        endDate: endDate ? format(endDate, formatString) : undefined,
        search: debouncedSearchTerm || undefined,
        page: currentPage,
        limit: itemsPerPage,
        statusFilter: statusFilter === -1 ? undefined : statusFilter,
        sortBy: sortColumn,           // ← Pass sort column
        sortOrder: sortDirection,     // ← Pass sort direction
      });
      return result;
    },
  });
  const orders = orderData?.data?.orders;
  const paginationData = orderData?.data.pagination;

  const hasActiveFilters =
    searchTerm !== "" ||
    statusFilter !== -1 ||
    typeFilter !== "All Types" ||
    startDate !== undefined ||
    endDate !== undefined;

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter(-1);
    setTypeFilter("All Types");
    setStartDate(undefined);
    setEndDate(undefined);
    // Optional: reset pagination if you want fresh page 1
    setCurrentPage(1);
  };

  const deleteOrderMutation = useMutation({
    mutationFn: (orderId: string) => deleteOrder(orderId),
    onSuccess: () => {
      // Invalidate relevant queries so lists and detail view refresh

      queryClient.invalidateQueries({ queryKey: ["orders"] }); // or ["admin-orders"], ["customer-orders"], etc.
      toast.success("Order deleted successfully");

    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message || "Failed to delete order"
      );
      console.error("Delete order error:", error);
    },
  });



  const handleSort = (column: "date" | "customer" | "type" | "subscription" | "level1" | "level2" | "status" | "amount") => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("desc");
    }
  };

  const getSortIcon = (column: "date" | "customer" | "type" | "subscription" | "level1" | "level2" | "status" | "amount") => {
    if (sortColumn !== column) {
      return <ArrowUpDown className="h-4 w-4 ml-1" />;
    }
    return sortDirection === "asc" ? <ArrowUp className="h-4 w-4 ml-1" /> : <ArrowDown className="h-4 w-4 ml-1" />;
  };



  const getStatusBadge = (status: number) => {
    const statusColors: Record<number, string> = {
      0: "bg-yellow-100 text-yellow-800 border-yellow-300",
      1: "bg-blue-100 text-blue-800 border-blue-300",
      2: "bg-green-100 text-green-800 border-green-300",
      3: "bg-emerald-100 text-emerald-800 border-emerald-300",
      4: "bg-orange-100 text-orange-800 border-orange-300",
      5: "bg-red-100 text-red-800 border-red-300",
    };

    const statusLabels: Record<number, string> = {
      0: "Pending",
      1: "Accepted",
      2: "Paid",
      3: "Fulfilled",
      4: "Refunded",
      5: "Canceled",
      6: "Printed",
      7: "Shipped"
    };



    return (
      <Badge variant="outline" className={statusColors[status] || ""}>
        {statusLabels[status] || "Unknown"} {/* Show the status label */}
      </Badge>
    );
  };


  return (
    <div className="space-y-4">

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <Input
          placeholder="Search by Internal/Shopify order #, customers, affiliates..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="md:w-96 focus-visible:ring-0 focus-visible:ring-offset-0"
        />

        <Select
          value={numberToStatusMap[statusFilter] || "All Statuses"}
          onValueChange={(value) => setStatusFilter(statusToNumberMap[value])}
        >
          <SelectTrigger className="w-full md:w-48 focus:outline-none focus:ring-0 focus:ring-offset-0 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 border-gray-300">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map((status) => (
              <SelectItem key={status} value={status}>
                {status}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full md:w-48 focus:outline-none focus:ring-0 focus:ring-offset-0 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 border-gray-300">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All Types">All Types</SelectItem>
            <SelectItem value="customer">Customer</SelectItem>
            <SelectItem value="affiliate">Affiliate</SelectItem>
          </SelectContent>
        </Select>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className={cn("w-full md:w-48 justify-start text-left font-normal", !startDate && "text-muted-foreground")}>
              <CalendarIcon className="mr-2 h-4 w-4" />
              {startDate ? format(startDate, formatString) : "Start date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar formatString={formatString} mode="single" selected={startDate} onSelect={setStartDate} initialFocus />
          </PopoverContent>
        </Popover>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className={cn("w-full md:w-48 justify-start text-left font-normal", !endDate && "text-muted-foreground")}>
              <CalendarIcon className="mr-2 h-4 w-4" />
              {endDate ? format(endDate, formatString) : "End date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar formatString={formatString} mode="single" selected={endDate} onSelect={setEndDate} initialFocus />
          </PopoverContent>
        </Popover>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            disabled={initiateExportMutation.isPending || exportStatus === "processing"}
            className="w-full md:w-auto"
            onClick={() => {
              initiateExportMutation.mutate({
                orderType: typeFilter === "All Types" ? "all" : typeFilter,
                startDate: startDate ? format(startDate, formatString) : undefined,
                endDate: endDate ? format(endDate, formatString) : undefined,
                search: searchTerm || undefined,
                statusFilter: statusFilter === -1 ? undefined : statusFilter,
                sortBy: sortColumn,
                sortOrder: sortDirection,
              });
            }}
          >
            {initiateExportMutation.isPending || exportStatus === "processing" ? (
              <>
                <Construction className="mr-2 h-4 w-4 animate-spin" />
                Processing Export...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Export All to CSV
              </>
            )}
          </Button>
        </div>

        {hasActiveFilters && (
          <Button variant="ghost" onClick={clearFilters}>
            <X className="h-4 w-4 mr-2" />
            Clear Filters
          </Button>
        )}

      </div>

      {/* Results count */}
      <div className="text-sm text-muted-foreground">
        {isLoading ? (
          <>Loading orders...</>
        ) : paginationData?.totalFiltered == null ? (
          <>—</>
        ) : (
          <>
            Showing{" "}
            <strong>
              {paginationData?.totalFiltered === 0
                ? 0
                : (paginationData?.page - 1) * paginationData?.limit + 1}
            </strong>{" "}
            to{" "}
            <strong>
              {paginationData?.totalFiltered === 0
                ? 0
                : Math.min(paginationData?.page * paginationData?.limit, paginationData?.totalFiltered)}
            </strong>{" "}
            of <strong>{paginationData?.totalFiltered}</strong> order
            {paginationData?.totalFiltered !== 1 ? "s" : ""}
          </>
        )}
      </div>


      {/* 
      <div className="text-sm text-muted-foreground">
        Showing 1 of 7 orders
      </div> */}


      {/* Mobile Card View */}
      <div className="lg:hidden space-y-4">
        {!isLoading && orders.map((order) => (
          <div key={order._id} className="bg-card border rounded-lg p-4 space-y-3">
            <div className="flex justify-between items-start">
              <div className="flex flex-col items-start">
                <button
                  onClick={() => {
                    setSelectedOrderId(order._id)
                    setSelectedCustomerType(order.orderBy)
                  }}
                  className="font-medium text-primary hover:underline text-left"
                >
                  {order.orderId}
                </button>
                {order.shopifyOrderId && (
                  <a
                    href={`${shopifyUrl}/orders/${order.orderId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline mt-1"
                  >
                    Shopify #: {order.shopifyOrderId}
                  </a>
                )}
              </div>
              <div className="flex items-center gap-2">
                {getStatusBadge(order.orderStatus)}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => {
                      setSelectedOrderId(order._id)
                      setSelectedCustomerType(order.orderBy)
                    }}>
                      <Pencil className="mr-2 h-4 w-4" />
                      View/Edit
                    </DropdownMenuItem>
                    {isAdmin && (
                      <DropdownMenuItem
                        onClick={() =>
                          window.open(
                            `${shopifyUrl}/orders/${order.orderId}`,
                            "_blank"
                          )
                        }
                      >
                        <ShoppingCart className="mr-2 h-4 w-4" />
                        View in Shopify
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={() => {
                      setNotesOrderId(order._id);
                      setNotesOrderNumber(order.orderId);
                    }}>
                      <FileText className="mr-2 h-4 w-4" />
                      Notes
                    </DropdownMenuItem>
                    {isAdmin && (
                      <DropdownMenuItem
                        onClick={() => {
                          if (confirm("Are you sure you want to delete this order?")) {
                            deleteOrderMutation.mutate(order._id);
                          }
                        }}
                        className="text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">Date:</span>
                <p className="font-medium">{format(new Date(order.orderDate), formatString)}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Amount:</span>
                <p className="font-medium">{formatCurrency(order.amount)}</p>
              </div>
            </div>

            <div className="border-t pt-2">
              <button
                onClick={() => {
                  setSelectedCustomerId(order.selfCustomerAffiliateId)
                  setSelectedCustomerType(order.orderBy)
                }}
                className="font-medium text-primary hover:underline text-left"
              >
                {order.customerFirstName} {order.customerLastName}
              </button>
              <div className="text-xs text-muted-foreground">
                {order.orderBy === 'customer'
                  ? order.selfCustomerId
                  : order.selfAffiliateId}
              </div>
              <a
                href={`mailto:${order.customerEmail}`}
                className="text-sm text-primary hover:underline block"
              >
                {order.customerEmail}
              </a>
            </div>

            <div className="flex gap-2 flex-wrap">
              <Badge variant={order.orderBy === "affiliate" ? "default" : "secondary"}>
                {order.orderBy}
              </Badge>
              {order.subscription && (
                <Badge className="bg-purple-100 text-purple-800 border-purple-300">Subscription</Badge>
              )}
            </div>

            {(order.level1AffiliateName || order.level2AffiliateName) && (
              <div className="text-sm space-y-1">
                {order.level1AffiliateName && (
                  <div>
                    <span className="text-muted-foreground">Level 1: </span>
                    <button
                      onClick={() => setSelectedAffiliateId(order.level1AffiliateId)}
                      className="text-primary hover:underline"
                    >
                      {order.level1AffiliateName}
                    </button>
                  </div>
                )}
                {order.level2AffiliateName && (
                  <div>
                    <span className="text-muted-foreground">Level 2: </span>
                    <button
                      onClick={() => setSelectedAffiliateId(order.level2AffiliateId)}
                      className="text-primary hover:underline"
                    >
                      {order.level2AffiliateName}
                    </button>
                  </div>
                )}
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
              <TableHead className="w-[180px]">Order #</TableHead>
              <TableHead>
                <button onClick={() => handleSort("date")} className="flex items-center hover:text-foreground transition-colors">
                  Date{getSortIcon("date")}
                </button>
              </TableHead>
              <TableHead>
                <button onClick={() => handleSort("customer")} className="flex items-center hover:text-foreground transition-colors">
                  Customer{getSortIcon("customer")}
                </button>
              </TableHead>
              <TableHead>
                <button onClick={() => handleSort("type")} className="flex items-center hover:text-foreground transition-colors">
                  Type{getSortIcon("type")}
                </button>
              </TableHead>
              <TableHead>
                <button onClick={() => handleSort("subscription")} className="flex items-center hover:text-foreground transition-colors">
                  Subscription{getSortIcon("subscription")}
                </button>
              </TableHead>
              <TableHead>
                <button onClick={() => handleSort("level1")} className="flex items-center hover:text-foreground transition-colors">
                  Level 1 (25%){getSortIcon("level1")}
                </button>
              </TableHead>
              <TableHead>
                <button onClick={() => handleSort("level2")} className="flex items-center hover:text-foreground transition-colors">
                  Level 2 (12%){getSortIcon("level2")}
                </button>
              </TableHead>
              <TableHead>
                <button onClick={() => handleSort("status")} className="flex items-center hover:text-foreground transition-colors">
                  Status{getSortIcon("status")}
                </button>
              </TableHead>
              <TableHead className="text-right">
                <button onClick={() => handleSort("amount")} className="flex items-center ml-auto hover:text-foreground transition-colors">
                  Amount{getSortIcon("amount")}
                </button>
              </TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={10} className="h-64 text-center"> {/* Adjust colSpan to match your columns */}
                  <div className="flex flex-col items-center justify-center space-y-4">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    <p className="text-muted-foreground">Loading orders...</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
            {!isLoading && !orders.length && (
              <TableRow>
                <TableCell colSpan={10} className="h-64 text-center"> {/* Adjust colSpan to match your columns */}
                  <div className="flex flex-col items-center justify-center space-y-4">
                    <p className="text-muted-foreground">No orders found ...</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
            {!isLoading && orders.map((order) => (
              <TableRow key={order._id}>
                <TableCell className="font-medium text-left w-[180px]">
                  <div className="flex flex-col items-start">
                    <button
                      onClick={() => {
                        setSelectedOrderId(order._id)
                        setSelectedCustomerType(order.orderBy)
                      }}
                      className="text-primary hover:underline text-left"
                    >
                      {order.orderId}
                    </button>
                    {order.shopifyOrderId && (
                      <a
                        href={`${shopifyUrl}/orders/${order.orderId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline mt-1"
                      >
                        Shopify #: {order.shopifyOrderId}
                      </a>
                    )}
                  </div>
                </TableCell>
                <TableCell>{format(new Date(order.orderDate), formatString)}</TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <button
                      onClick={() => {
                        setSelectedCustomerId(order.personId);
                        setSelectedCustomerType(order.orderBy);
                      }}
                      className="font-medium text-primary hover:underline text-left"
                    >
                      {order.customerFirstName} {order.customerLastName}
                      {/* Display the correct ID in parentheses */}


                    </button>
                    <div className="text-xs text-muted-foreground">
                      {order.orderBy === 'customer'
                        ? order.selfCustomerId
                        : order.selfAffiliateId}
                    </div>
                    <a
                      href={`mailto:${order.customerEmail}`}
                      className="text-sm text-primary hover:underline"
                    >
                      {order.customerEmail}
                    </a>
                  </div>
                </TableCell>
                {/* <TableCell>
                  <Badge variant={order.orderBy === "affiliate" ? "default" : "secondary"}>
                    {order.orderBy.charAt(0).toUpperCase() + order.orderBy.slice(1)}
                  </Badge>
                </TableCell> */}
                <TableCell>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${order.orderBy === 'customer' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'
                    }`}>
                    {order.orderBy === 'customer' ? 'Customer' : 'Affiliate'}
                  </span>
                </TableCell>
                <TableCell>
                  {order.subscription ? (
                    <Badge className="bg-purple-100 text-purple-800 border-purple-300 hover:bg-purple-300 hover:text-white cursor-default">Yes</Badge>
                  ) : (
                    <Badge className="bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-500 hover:text-white cursor-default">No</Badge>
                    // <span className="text-muted-foreground">No</span>
                  )}
                </TableCell>
                <TableCell>
                  {order.level1AffiliateName ? (
                    <button
                      onClick={() => setSelectedAffiliateId(order.level1AffiliateId)}
                      className="text-sm text-primary hover:underline text-left"
                    >
                      {order.level1AffiliateName}
                    </button>
                  ) : (
                    <span className="text-sm text-muted-foreground">N/A</span>
                  )}
                </TableCell>
                <TableCell>
                  {order.level2AffiliateName ? (
                    <button
                      onClick={() => setSelectedAffiliateId(order.level2AffiliateId)}
                      className="text-sm text-primary hover:underline text-left"
                    >
                      {order.level2AffiliateName}
                    </button>
                  ) : (
                    <span className="text-sm text-muted-foreground">N/A</span>
                  )}
                </TableCell>
                <TableCell>{getStatusBadge(order.orderStatus)}</TableCell>
                <TableCell className="text-right font-medium">
                  {formatCurrency(order.amount)}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => {
                        setSelectedOrderId(order._id)
                        setSelectedCustomerType(order.orderBy)
                      }}>
                        <Pencil className="mr-2 h-4 w-4" />
                        View/Edit
                      </DropdownMenuItem>
                      {isAdmin && (
                        <DropdownMenuItem
                          onClick={() =>
                            window.open(
                              `${shopifyUrl}/orders/${order.orderId}`,
                              "_blank"
                            )
                          }
                        >
                          <ShoppingCart className="mr-2 h-4 w-4" />
                          View in Shopify
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={() => {
                        setNotesOrderId(order._id);
                        setNotesOrderNumber(order.orderId);
                      }}>
                        <FileText className="mr-2 h-4 w-4" />
                        Notes
                      </DropdownMenuItem>
                      {isAdmin && (
                        <DropdownMenuItem
                          onClick={() => {
                            if (confirm("Are you sure you want to delete this order?")) {
                              deleteOrderMutation.mutate(order._id);
                            }
                          }}
                          className="text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
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



      {/* Pagination - Smart pagination with ellipsis */}
      {paginationData && paginationData.totalPages > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            {/* Showing X to Y of Z */}
            <div className="text-sm text-muted-foreground">
              Showing{" "}
              <strong>
                {paginationData.totalFiltered === 0
                  ? 0
                  : (paginationData.page - 1) * paginationData.limit + 1}
              </strong>{" "}
              to{" "}
              <strong>
                {paginationData.totalFiltered === 0
                  ? 0
                  : Math.min(paginationData.page * paginationData.limit, paginationData.totalFiltered)}
              </strong>{" "}
              of <strong>{paginationData.totalFiltered}</strong> orders
            </div>

            {/* Items per page selector */}
            <div className="flex items-center gap-2 focus-visible:ring-0 focus-visible:ring-offset-0">
              <span>Per page:</span>
              <Select
                value={itemsPerPage.toString()}
                onValueChange={(value) => {
                  setItemsPerPage(Number(value));
                  setCurrentPage(1); // Reset to first page when changing limit
                }}
              >
                <SelectTrigger className="w-20 focus:outline-none focus:ring-0 focus:ring-offset-0 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 border-gray-300">
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

          {/* Navigation Buttons */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={!paginationData.hasPrev}
            >
              Previous
            </Button>

            {/* Smart pagination with ellipsis */}
            <div className="flex items-center gap-1">
              {(() => {
                const pages: (number | string)[] = [];
                const totalPages = paginationData.totalPages;
                const currentPage = paginationData.page;

                if (totalPages <= 7) {
                  // Show all pages when there are 7 or fewer
                  for (let i = 1; i <= totalPages; i++) {
                    pages.push(i);
                  }
                } else {
                  // Always show first page
                  pages.push(1);

                  // Left ellipsis
                  if (currentPage > 4) {
                    pages.push("...");
                  }

                  // Pages near start (1-4)
                  if (currentPage <= 4) {
                    for (let i = 2; i <= 5; i++) {
                      pages.push(i);
                    }
                  }
                  // Pages near end
                  else if (currentPage >= totalPages - 3) {
                    for (let i = totalPages - 4; i <= totalPages - 1; i++) {
                      pages.push(i);
                    }
                  }
                  // Pages in middle
                  else {
                    pages.push(currentPage - 1);
                    pages.push(currentPage);
                    pages.push(currentPage + 1);
                  }

                  // Right ellipsis
                  if (currentPage < totalPages - 3) {
                    pages.push("...");
                  }

                  // Always show last page
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
                      className="min-w-9"
                    >
                      {p}
                    </Button>
                  )
                );
              })()}
            </div>

            <span className="text-sm text-muted-foreground px-2">
              Page {paginationData.page} of {paginationData.totalPages}
            </span>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(paginationData.totalPages, p + 1))}
              disabled={!paginationData.hasNext}
            >
              Next
            </Button>
          </div>
        </div>
      )}




      {/* Dialogs */}
      {selectedOrderId && (
        <OrderDetailDialog
          orderId={selectedOrderId}
          customerType={selectedCustomerType}
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

      {selectedCustomerId && selectedCustomerType === "customer" && (
        <CustomerEditDialog
          customerId={selectedCustomerId}
          open={!!selectedCustomerId}
          customer={null}
          onOpenChange={(open) => {
            if (!open) setSelectedCustomerId(null);
          }}
        />
      )}

      {selectedCustomerId && selectedCustomerType === "affiliate" && (
        <AffiliateEditDialog
          affiliateMongoId={selectedCustomerId}
          open={!!selectedCustomerId}
          onOpenChange={(open) => {
            if (!open) setSelectedCustomerId(null);
          }}
        />
      )}


      {selectedAffiliateId && (
        <AffiliateEditDialog
          affiliateMongoId={selectedAffiliateId}
          open={!!selectedAffiliateId}
          onOpenChange={(open) => {
            if (!open) setSelectedAffiliateId(null);
          }}
        />
      )}
    </div>
  );
};