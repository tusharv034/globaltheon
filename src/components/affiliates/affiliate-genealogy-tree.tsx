import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronRight, ChevronDown, Users, TrendingUp, ShoppingCart, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";
import { getAffiliateCustomers, readAllAffiliates } from "@/api/affiliate";
import { readCustomersEnrolledBy } from "@/api/customer";
import { readOrdersByCustomerIds } from "@/api/orders";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Affiliate {
  id: string;
  affiliate_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  phone_numbers: any;
  enrolled_by: string | null;
  total_commissions: number;
  total_sales: number;
  status: string;
}

interface AffiliateNode extends Affiliate {
  children: AffiliateNode[];
  directEnrolleeCount: number;
  customerCount: number;
}

interface Customer {
  id: string;
  customer_id: string;
  first_name: string;
  last_name: string;
  email: string;
  total_purchases: number;
}

export function AffiliateGenealogyTree() {

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [totalOrders, setTotalOrders] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCustomers, setTotalCustomers] = useState(0);

  // state to store affiliateId's which has been expanded
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  // state to store affiliates whose customers are to be shown
  const [selectedAffiliateForCustomers, setSelectedAffiliateForCustomers] = useState<string | null>(null);

 
  // state to store the searchQuery
  const [searchQuery, setSearchQuery] = useState("");

  // Query to fetch the affiliates
  const { data: affiliates, isLoading } = useQuery({
    queryKey: ["genealogy-affiliates"],
    queryFn: async () => {
      const response = await readAllAffiliates();

      return response.data.data as Affiliate[];
    },
  });

  // query to fetch the customer counts
  const { data: customerCounts, isLoading:customerCountLo } = useQuery({
    queryKey: ["affiliate-customer-counts"],
    queryFn: async () => {

      const response = await readCustomersEnrolledBy();

      const counts = new Map<string, number>();
      response.data.data.forEach((customer: any) => {
        if (customer.enrolledBy) {
          counts.set(customer.enrolledBy, (counts.get(customer.enrolledBy) || 0) + 1);
        }
      });

      return counts;
    },
  });

  // query to fetch customers list for selectedAffiliate
  const { data: customers, isLoading: isCustomersLoading } = useQuery({
    queryKey: ["affiliate-customers", selectedAffiliateForCustomers, currentPage, itemsPerPage],
    queryFn: async () => {
      if (!selectedAffiliateForCustomers) return [];

      const responseCustomer = await getAffiliateCustomers(selectedAffiliateForCustomers, "", currentPage, itemsPerPage);

      setCurrentPage(responseCustomer.data.pagination.currentPage);
      setTotalPages(responseCustomer.data.pagination.totalPages);
      setTotalCustomers(responseCustomer.data.pagination.totalCustomers);

      const customerIds = responseCustomer.data.data.customers.map((c) => c.selfCustomerId);

      const payload = {
        customerIds
      }

      const ordersResponse = await readOrdersByCustomerIds(payload);

      const purchaseTotals = new Map<string, number>();

      ordersResponse.data.data?.forEach((order: any) => {
        const current = purchaseTotals.get(order.selfCustomerAffiliateId) || 0;
        purchaseTotals.set(order.selfCustomerAffiliateId, current + Number(order.amount));
      });

      return responseCustomer?.data?.data?.customers?.map((customer) => ({
        ...customer,
        totalPurchases: purchaseTotals.get(customer.selfCustomerId) || 0,
      })) as Customer[];
    },
    enabled: !!selectedAffiliateForCustomers,
  });


  // Build tree structure - memoized to avoid rebuilding on every render
  // this identifier stores the entire tree, and needs affiliates and customerCount to build it
  const buildTree = useMemo(() => {
    if (!affiliates) return [];

    const affiliateMap = new Map<string, AffiliateNode>();

    // Initialize all nodes
    affiliates.forEach((affiliate) => {
      affiliateMap.set(affiliate.selfAffiliateId, {
        ...affiliate,
        children: [],
        directEnrolleeCount: 0,
        customerCount: customerCounts?.get(affiliate?.selfAffiliateId) || 0,
      });
    });

    const roots: AffiliateNode[] = [];

    // Build parent-child relationships
    affiliates.forEach((affiliate) => {
      const node = affiliateMap.get(affiliate.selfAffiliateId)!;

      if (!affiliate.enrolledBy) {
        // Top level affiliate
        roots.push(node);
      } else {
        const parent = affiliateMap.get(affiliate.enrolledBy);
        if (parent) {
          parent.children.push(node);
          parent.directEnrolleeCount++;
        } else {
          // Parent not found, treat as root
          roots.push(node);
        }
      }
    });
    
    // Sort children by name
    const sortChildren = (node: AffiliateNode) => {
      node.children.sort((a, b) =>
        parseInt(a.selfAffiliateId) - parseInt(b.selfAffiliateId)
        // `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`)
      );
      node.children.forEach(sortChildren);
    };

    roots.forEach(sortChildren);
    // `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`)
    return roots.sort((a, b) =>
      {
        return parseInt(a.selfAffiliateId) - parseInt(b.selfAffiliateId)
      }
    );
  }, [affiliates, customerCounts]);

  // function to toggle node
  const toggleNode = (nodeId: string) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  };

  // function to trigger expansion of all nodes
  const expandAll = () => {
    // pushes all the affiliateId's in affiliates to the expanded nodes
    if (affiliates) {
      setExpandedNodes(new Set(affiliates.map((a) => a.selfAffiliateId)));
    }
  };

  // function to collapse all nodes
  const collapseAll = () => {
    // Make expanded node empty signinying no node is open
    setExpandedNodes(new Set());
  };

  // Auto-expand nodes when search matches are found
  useEffect(() => {
    if (!searchQuery.trim() || buildTree.length === 0) return;

    // Take the current Build Tree and pass it into the filterTree function
    const { toExpand } = filterTree(buildTree);

    if (toExpand.size > 0) {
      const currentIds = Array.from(expandedNodes).sort().join(',');
      const newIds = Array.from(toExpand).sort().join(',');
      if (currentIds !== newIds) {
        setExpandedNodes(toExpand);
      }
    }
  }, [searchQuery, buildTree]);

  const renderNode = (node: AffiliateNode, level: number = 0) => {
    const isExpanded = expandedNodes.has(node.selfAffiliateId);
    const hasChildren = node.children.length > 0;
    const indent = level * 24;

    return (
      <div key={node.selfAffiliateId} className="w-full">
        <div
          className="flex items-center gap-2 p-3 hover:bg-accent/50 border-l-2 border-transparent hover:border-primary transition-colors"
          style={{ paddingLeft: `${indent + 12}px` }}
        >
          {hasChildren ? (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => toggleNode(node.selfAffiliateId)}
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
          ) : (
            <div className="h-6 w-6" />
          )}

          <div className="flex-1 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div>
                <p className="font-medium text-sm">
                  {node.firstName} {node.lastName}
                </p>
                <p className="text-xs text-muted-foreground">
                  {node.selfAffiliateId}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {node.email}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              {hasChildren && (
                <div className="flex items-center gap-1 whitespace-nowrap">
                  <Users className="h-3 w-3 flex-shrink-0" />
                  <span>{node.directEnrolleeCount} direct</span>
                </div>
              )}
              {node.customerCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-1 flex items-center gap-1 hover:text-primary whitespace-nowrap"
                  onClick={() => setSelectedAffiliateForCustomers(node._id)}
                >
                  <ShoppingCart className="h-3 w-3 flex-shrink-0" />
                  <span>{node.customerCount} customers</span>
                </Button>
              )}
              <div className="flex items-center gap-1 whitespace-nowrap">
                <TrendingUp className="h-3 w-3 flex-shrink-0" />
                <span>{formatCurrency(node.totalCommission)}</span>
              </div>
              <div
                className={`px-2 py-1 rounded-full text-xs whitespace-nowrap ${node.status === 1
                  ? "bg-green-100 text-green-800"
                  : "bg-gray-100 text-gray-800"
                  }`}
              >
                {node.status === 1 && "Active"}
                {node.status === 2 && "Inactive"}
                {node.status === 3 && "Pending KYC"}
                {node.status === 4 && "Rejected"}
                {node.status === 5 && "Terminated"}
                {node.status === 6 && "Cancelled"}
              </div>
            </div>
          </div>
        </div>

        {isExpanded && hasChildren && (
          <div className="border-l ml-3" style={{ marginLeft: `${indent + 12}px` }}>
            {node.children.map((child) => renderNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  // Component to render on loading
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Organization Genealogy</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </CardContent>
      </Card>
    );
  }

  // Component to render when no Affiliates exist
  if (!isLoading && !affiliates || affiliates.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Organization Genealogy</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No affiliates found.</p>
        </CardContent>
      </Card>
    );
  }

  // Filter affiliates based on search query
  const getPhoneNumbers = (affiliate: Affiliate): string[] => {
    const phones: string[] = [];
    if (affiliate.phone) phones.push(affiliate.phone);
    if (affiliate.phoneNumbers && Array.isArray(affiliate.phoneNumbers)) {
      affiliate.phoneNumbers.forEach((pn: any) => {
        if (pn.number) phones.push(pn.number);
      });
    }
    return phones;
  };

  const matchesSearch = (affiliate: Affiliate): boolean => {
    if (!searchQuery.trim()) return true;

    const query = searchQuery.toLowerCase();
    const fullName = `${affiliate?.firstName} ${affiliate?.lastName}`.toLowerCase();
    const selfAffiliateId = affiliate?.selfAffiliateId.toString();
    const email = affiliate?.email?.toLowerCase();
    const phones = getPhoneNumbers(affiliate);

    return (
      fullName.includes(query) ||
      selfAffiliateId.includes(query) ||
      email.includes(query) ||
      phones.some(phone => phone.includes(query))
    );
  };

  const filterTree = (nodes: AffiliateNode[], nodesToExpand: Set<string> = new Set()): { filtered: AffiliateNode[], toExpand: Set<string> } => {
    if (!searchQuery.trim()) return { filtered: nodes, toExpand: nodesToExpand };

    const filtered: AffiliateNode[] = [];

    for (const node of nodes) {
      const nodeMatches = matchesSearch(node);
      const { filtered: filteredChildren, toExpand: childExpansions } = filterTree(node.children, nodesToExpand);

      if (nodeMatches || filteredChildren.length > 0) {
        filtered.push({
          ...node,
          children: filteredChildren,
        });

        // Mark nodes with matching descendants for expansion
        if (filteredChildren.length > 0) {
          nodesToExpand.add(node.selfAffiliateId);
          childExpansions.forEach(id => nodesToExpand.add(id));
        }
      }
    }

    return { filtered, toExpand: nodesToExpand };
  };

  const { filtered: filteredTree } = filterTree(buildTree);

  const selectedAffiliate = affiliates?.find((a: any) => a._id === selectedAffiliateForCustomers);

  return (
    <>
      <Card>

        <CardHeader>
          <div className="flex flex-col gap-4">

            <div className="flex items-center justify-between">
              <CardTitle>Organization Genealogy</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={expandAll}>
                  Expand All
                </Button>
                <Button variant="outline" size="sm" onClick={collapseAll}>
                  Collapse All
                </Button>
              </div>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search by name, affiliate ID, phone, or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

          </div>
        </CardHeader>

        <CardContent>
          <div className="space-y-1">
            {/* No affiliates */}
            {filteredTree?.length === 0 && (
              <p className="text-muted-foreground text-center py-8">
                No affiliates found matching your search.
              </p>
            )}

            {filteredTree.length !== 0 && (
              filteredTree.sort((a, b) => parseInt(a.selfAffiliateId) - parseInt(b.selfAffiliateId)).map((node) => renderNode(node, 0))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Dialog to view custoemrs of a selected affiliate */}
      <Dialog open={!!selectedAffiliateForCustomers} onOpenChange={(open) => {
        setCurrentPage(1);
        setItemsPerPage(5);
        setTotalOrders(0);
        setTotalPages(0);
        setTotalCustomers(0);
        setSelectedAffiliateForCustomers(null)
        return !open
        }}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Customers Enrolled by {selectedAffiliate?.firstName} {selectedAffiliate?.lastName}
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            {isCustomersLoading && (
              <>
                <p className="text-muted-foreground text-center py-8">Loading...</p>
              </>
            )}

            {!isCustomersLoading && customers && customers.length === 0 && (
              <>
                <p className="text-muted-foreground text-center py-8">No Customers...</p>
              </>
            )}
            {customers && customers.length > 0 && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead className="text-right">Total Purchases</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customers.map((customer) => (
                    <TableRow key={customer._id}>
                      <TableCell className="font-medium">{customer.selfCustomerId}</TableCell>
                      <TableCell>
                        {customer.firstName} {customer.lastName}
                      </TableCell>
                      <TableCell>{customer.email}</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(customer.totalOrderAmount)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
          {/* Pagination */}
          {customers?.length !== 0 && (
            <div className="flex items-center justify-between mt-6">
              <div className="flex items-center gap-6">
                <div className="text-sm text-muted-foreground">
                  Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                  {Math.min(currentPage * itemsPerPage, totalCustomers)} of {totalCustomers} order{totalCustomers !== 1 ? "s" : ""}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Per page:</span>
                  <Select
                    value={itemsPerPage?.toString()}
                    onValueChange={(v) => {
                      setItemsPerPage(Number(v));
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

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
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
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
