// import { useState, useEffect } from "react";
// import { useQuery } from "@tanstack/react-query";
// import { supabase } from "@/integrations/supabase/client";
// import { Card, CardContent } from "@/components/ui/card";
// import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
// import { Badge } from "@/components/ui/badge";
// import { Input } from "@/components/ui/input";
// import { Users, Search } from "lucide-react";
// import { format } from "date-fns";
// import { formatCurrency } from "@/lib/utils";
// import  {getAffiliateCustomers} from "@/api/affiliate"
// interface AffiliateCustomersListProps {
//   affiliateId: string;
//   onCustomerClick?: (customerId: string) => void;
//   onViewOrders?: (customerId: string) => void;
//   onViewLastOrder?: (orderId: string) => void;
// }

// interface Customer {
//   id: string;
//   customer_id: string;
//   first_name: string;
//   last_name: string;
//   email: string;
//   phone: string | null;
//   orderCount: number;
//   totalPurchased: number;
//   lastOrderDate: string | null;
//   lastOrderId: string | null;
// }

// export function AffiliateCustomersList({ affiliateId, onCustomerClick, onViewOrders, onViewLastOrder }: AffiliateCustomersListProps) {
//   const [searchTerm, setSearchTerm] = useState("");
//   const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");

//   useEffect(() => {
//     const timer = setTimeout(() => {
//       setDebouncedSearchTerm(searchTerm);
//     }, 300);
//     return () => clearTimeout(timer);
//   }, [searchTerm]);

//   const { data: customers, isLoading } = useQuery({
//     queryKey: ["affiliate-customers", affiliateId, debouncedSearchTerm],
//     queryFn: async () => {
//       // Fetch customers enrolled by this affiliate
//       const { data: customersData, error: customersError } = await supabase
//         .from("customers")
//         .select("id, customer_id, first_name, last_name, email, phone")
//         .eq("enrolled_by", affiliateId)
//         .order("first_name");

//       if (customersError) throw customersError;

//       // For each customer, count their orders, calculate total spent, and get last order date
//       const customerIds = customersData?.map(c => c.id) || [];

//       const { data: orders, error: ordersError } = await supabase
//         .from("orders")
//         .select("id, customer_id, amount, order_date")
//         .in("customer_id", customerIds)
//         .order("order_date", { ascending: false });

//       if (ordersError) throw ordersError;

//       // Count orders, sum totals, and get last order date and ID per customer
//       const orderCounts = new Map<string, number>();
//       const orderTotals = new Map<string, number>();
//       const lastOrderDates = new Map<string, string>();
//       const lastOrderIds = new Map<string, string>();

//       orders?.forEach(order => {
//         const count = orderCounts.get(order.customer_id) || 0;
//         orderCounts.set(order.customer_id, count + 1);

//         const total = orderTotals.get(order.customer_id) || 0;
//         orderTotals.set(order.customer_id, total + Number(order.amount));

//         // Only set last order date and ID if not already set (since we ordered by date desc, first one is the latest)
//         if (!lastOrderDates.has(order.customer_id)) {
//           lastOrderDates.set(order.customer_id, order.order_date);
//           lastOrderIds.set(order.customer_id, order.id);
//         }
//       });

//       // Map customers with order counts, totals, last order dates, and IDs
//       let customersWithOrders: Customer[] = customersData?.map(customer => ({
//         ...customer,
//         orderCount: orderCounts.get(customer.id) || 0,
//         totalPurchased: orderTotals.get(customer.id) || 0,
//         lastOrderDate: lastOrderDates.get(customer.id) || null,
//         lastOrderId: lastOrderIds.get(customer.id) || null,
//       })) || [];

//       // Filter by search term
//       if (debouncedSearchTerm) {
//         const searchLower = debouncedSearchTerm.toLowerCase();
//         customersWithOrders = customersWithOrders.filter(customer => {
//           const fullName = `${customer.first_name} ${customer.last_name}`.toLowerCase();
//           const customerId = customer.customer_id.toLowerCase();
//           const email = customer.email.toLowerCase();
//           return fullName.includes(searchLower) || 
//                  customerId.includes(searchLower) || 
//                  email.includes(searchLower);
//         });
//       }

//       return customersWithOrders;
//     },
//   });

//   if (isLoading) {
//     return (
//       <Card>
//         <CardContent className="pt-6">
//           <div className="text-center py-8">Loading customers...</div>
//         </CardContent>
//       </Card>
//     );
//   }

//   if (!customers || customers.length === 0) {
//     return (
//       <Card>
//         <CardContent className="pt-6">
//           <div className="text-center py-8 text-muted-foreground">
//             <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
//             <p>No customers found for this affiliate</p>
//           </div>
//         </CardContent>
//       </Card>
//     );
//   }

//   return (
//     <Card>
//       <CardContent className="pt-6">
//         <div className="mb-4 flex items-center justify-between gap-4">
//           <div>
//             <h3 className="text-lg font-semibold">Customers</h3>
//             <p className="text-sm text-muted-foreground">
//               Total: {customers.length} customer{customers.length !== 1 ? 's' : ''}
//             </p>
//           </div>
//           <div className="relative w-64">
//             <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
//             <Input
//               placeholder="Search customers..."
//               value={searchTerm}
//               onChange={(e) => setSearchTerm(e.target.value)}
//               className="pl-10"
//             />
//           </div>
//         </div>

//         <div className="border rounded-lg overflow-hidden">
//           <Table>
//             <TableHeader>
//               <TableRow>
//                 <TableHead>Name</TableHead>
//                 <TableHead>Phone</TableHead>
//                 <TableHead>Email</TableHead>
//                 <TableHead className="text-center">Orders</TableHead>
//                 <TableHead className="text-right">Purchased</TableHead>
//                 <TableHead>Last Order</TableHead>
//               </TableRow>
//             </TableHeader>
//             <TableBody>
//               {customers.map((customer) => (
//                 <TableRow key={customer.id}>
//                   <TableCell>
//                     {onCustomerClick ? (
//                       <button
//                         onClick={() => onCustomerClick(customer.id)}
//                         className="text-primary hover:underline text-left font-medium"
//                       >
//                         {customer.first_name} {customer.last_name}
//                       </button>
//                     ) : (
//                       `${customer.first_name} ${customer.last_name}`
//                     )}
//                   </TableCell>
//                   <TableCell>{customer.phone || "-"}</TableCell>
//                   <TableCell>
//                     <a href={`mailto:${customer.email}`} className="text-primary hover:underline">
//                       {customer.email}
//                     </a>
//                   </TableCell>
//                   <TableCell className="text-center">
//                     {onViewOrders && customer.orderCount > 0 ? (
//                       <button
//                         onClick={() => onViewOrders(customer.id)}
//                         className="text-primary hover:underline"
//                       >
//                         <Badge variant="default" className="cursor-pointer">
//                           {customer.orderCount}
//                         </Badge>
//                       </button>
//                     ) : (
//                       <Badge variant={customer.orderCount > 0 ? "default" : "secondary"}>
//                         {customer.orderCount}
//                       </Badge>
//                     )}
//                   </TableCell>
//                   <TableCell className="text-right">
//                     {formatCurrency(customer.totalPurchased)}
//                   </TableCell>
//                   <TableCell>
//                     {customer.lastOrderDate && onViewLastOrder && customer.lastOrderId ? (
//                       <button
//                         onClick={() => onViewLastOrder(customer.lastOrderId!)}
//                         className="text-primary hover:underline"
//                       >
//                         {format(new Date(customer.lastOrderDate), "MMM d, yyyy")}
//                       </button>
//                     ) : customer.lastOrderDate ? (
//                       format(new Date(customer.lastOrderDate), "MMM d, yyyy")
//                     ) : (
//                       "-"
//                     )}
//                   </TableCell>
//                 </TableRow>
//               ))}
//             </TableBody>
//           </Table>
//         </div>
//       </CardContent>
//     </Card>
//   );
// }
import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { getAffiliateCustomers } from "@/api/affiliate";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Users, Search, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useDateFormatStore } from "@/store/useDateFormat";
import { getDateFormatString } from "@/utils/resolveDateFormat";

interface AffiliateCustomersListProps {
  affiliateId: string;
  onCustomerClick?: (customerId: string) => void;
  onViewOrders?: (customerId: string | number) => void;
  onViewLastOrder?: (orderId: string, customerType: string) => void;
}

interface Customer {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  orderCount: number;
  totalPurchased: number;
  lastOrderDate: string | null;
}

export function AffiliateCustomersList({ affiliateId, onCustomerClick, onViewOrders, onViewLastOrder }: AffiliateCustomersListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const selectedCustomerRef = useRef<string | null>(null);

  const { dateFormatRegion, dateFormatVariant } = useDateFormatStore();
  const formatString = getDateFormatString(dateFormatRegion, dateFormatVariant);
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      if (searchTerm && searchTerm.trim().length) {
        setCurrentPage(1);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const { data, isLoading } = useQuery({
    queryKey: ["affiliate-customers", affiliateId, debouncedSearchTerm, currentPage, itemsPerPage],
    queryFn: () => getAffiliateCustomers(affiliateId, debouncedSearchTerm, currentPage, itemsPerPage),
  });

  const customers = data?.data?.data.customers || [];
  const pagination = data?.data?.pagination || { totalPages: 1, currentPage: 1 };
  const totalCount = data?.data.pagination.totalCustomers;
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= pagination.totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <Card>
      <CardContent className="pt-6">
        {/* Header with customer count and search bar */}
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold">Customers</h3>
            <p className="text-sm text-muted-foreground">
              Total: {customers.length} customer{customers.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search customers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Table with customer data or message */}
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="text-center">Orders</TableHead>
                <TableHead className="text-right">Purchased</TableHead>
                <TableHead>Last Order</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={10} className="h-64 text-center"> {/* Adjust colSpan to match your columns */}
                    <div className="flex flex-col items-center justify-center space-y-4">
                      <Loader2 className="h-10 w-10 animate-spin text-primary" />
                      <p className="text-muted-foreground">Loading customers...</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
              {!isLoading && customers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No customers found for this affiliate</p>
                  </TableCell>
                </TableRow>
              ) : (
                !isLoading &&
                customers.map((customer) => (
                  <TableRow key={customer._id}>
                    <TableCell>
                      {onCustomerClick ? (
                        <button
                          onClick={() => onCustomerClick(customer._id)}
                          className="text-primary hover:underline text-left font-medium"
                        >
                          {customer.firstName} {customer.lastName}
                        </button>
                      ) : (
                        `${customer.firstName} ${customer.lastName}`
                      )}
                    </TableCell>
                    <TableCell>{customer.phone || "-"}</TableCell>
                    <TableCell>
                      <a href={`mailto:${customer.email}`} className="text-primary hover:underline">
                        {customer.email}
                      </a>
                    </TableCell>
                    <TableCell className="text-center">
                      {onViewOrders && customer.orderCount > 0 ? (
                        <button
                          onClick={() => onViewOrders(customer.selfCustomerId)}
                          className="text-primary hover:underline">
                          <Badge variant="default" className="cursor-pointer">
                            {customer.orderCount}
                          </Badge>
                        </button>
                      ) : (
                        <Badge variant={customer.orderCount > 0 ? "default" : "secondary"}>
                          {customer.orderCount}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(customer.totalOrderAmount)}
                    </TableCell>
                    <TableCell>
                      {customer.lastOrderDate && onViewLastOrder && customer.lastOrderId ? (
                        <button
                          onClick={() => onViewLastOrder(customer.lastOrderId, 'customer')}
                          className="text-primary hover:underline"
                        >
                          {format(new Date(customer.lastOrderDate), formatString)}
                        </button>
                      ) : customer.lastOrderDate ? (
                        format(new Date(customer.lastOrderDate), formatString)
                      ) : (
                        "-"
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination Controls */}
        {(customers.length || 0) > 0 && (
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-4">
              <div className="text-sm text-muted-foreground">
                Showing {((currentPage - 1) * itemsPerPage) + 1} to{" "}
                {Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount} customer{customers.length !== 1 ? 's' : ''}
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Per page:</span>
                <Select
                  value={itemsPerPage.toString()}
                  onValueChange={(value) => {
                    setItemsPerPage(Number(value));
                    setCurrentPage(1); // Reset to first page on items per page change
                  }}
                >
                  <SelectTrigger className="w-[80px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
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
              {pagination.totalPages > 1 && (
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => i + 1).map((page) => (
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
                Page {currentPage} of {pagination.totalPages}
              </span>
              <Button
                variant="outline"
                onClick={() => setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={currentPage === pagination.totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
