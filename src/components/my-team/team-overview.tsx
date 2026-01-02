import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Users, Briefcase, ChevronDown, ChevronUp, Search, Filter, X, ArrowUpDown, MoreVertical, Eye } from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CalculateCommissionsButton } from "@/components/commissions/calculate-commissions-button";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUserRole } from "@/hooks/use-user-role";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AffiliateEditDialog } from "@/components/affiliates/affiliate-edit-dialog";
import { readLevelOneAffiliate, readLevelTwoInsights, readTeamOverview } from "@/api/affiliate";
import { readLevelOneCustomer } from "@/api/customer";
import { useDateFormatStore } from "@/store/useDateFormat";
import { getDateFormatString } from "@/utils/resolveDateFormat";
import { useAuthStore } from "@/store/useAuthStore";
export const TeamOverview = () => {
  const [expandedSections, setExpandedSections] = useState({
    level1Customers: false,
    level1Affiliates: false,
    level2: false,
  });

  // Filter and search states for Level 1 Customers
  const [l1CustomerSearch, setL1CustomerSearch] = useState("");
  const [debouncedL1CustomerSearch, setDebouncedL1CustomerSearch] = useState("");
  const [l1CustomerActivityFilter, setL1CustomerActivityFilter] = useState("all");
  const [l1CustomerSortBy, setL1CustomerSortBy] = useState<"name" | "enrolled" | "purchases" | "commissions">("enrolled");
  const [l1CustomerSortOrder, setL1CustomerSortOrder] = useState<"asc" | "desc">("desc");
  const [l1CustomerPage, setL1CustomerPage] = useState(1);
  const [l1CustomerItemsPerPage, setL1CustomerItemsPerPage] = useState(25);

  // Filter and search states for Level 1 Affiliates
  const [l1AffiliateSearch, setL1AffiliateSearch] = useState("");
  const [debouncedL1AffiliateSearch, setDebouncedL1AffiliateSearch] = useState("");
  const [l1AffiliateActivityFilter, setL1AffiliateActivityFilter] = useState("all");
  const [l1AffiliateSortBy, setL1AffiliateSortBy] = useState<"name" | "enrolled" | "purchases" | "commissions">("enrolled");
  const [l1AffiliateSortOrder, setL1AffiliateSortOrder] = useState<"asc" | "desc">("desc");
  const [l1AffiliatePage, setL1AffiliatePage] = useState(1);
  const [l1AffiliateItemsPerPage, setL1AffiliateItemsPerPage] = useState(25);

  // Filter and search states for Level 2
  const [l2Search, setL2Search] = useState("");
  const [debouncedL2Search, setDebouncedL2Search] = useState("");
  const [l2TypeFilter, setL2TypeFilter] = useState("all"); // all, customers, affiliates
  const [l2SponsorFilter, setL2SponsorFilter] = useState("all");
  const [l2SortBy, setL2SortBy] = useState<"name" | "enrolled" | "sponsor" | "purchases">("enrolled");
  const [l2SortOrder, setL2SortOrder] = useState<"asc" | "desc">("desc");
  const [l2Page, setL2Page] = useState(1);
  const [l2ItemsPerPage, setL2ItemsPerPage] = useState(25);
  const [viewingAffiliate, setViewingAffiliate] = useState<any>(null);
  const { isAdmin } = useUserRole();

  const { dateFormatRegion, dateFormatVariant } = useDateFormatStore();
  const formatString = getDateFormatString(dateFormatRegion, dateFormatVariant);


  const { data: teamData, isLoading } = useQuery({
    queryKey: ["team-overview"],
    staleTime: 0, // Always fetch fresh data
    refetchOnMount: true,
    queryFn: async () => {

      const response = await readTeamOverview();

      return response.data.data;
    },
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // Reset page to 1 when filters change
  useEffect(() => {
    setL1CustomerPage(1);
  }, [l1CustomerSearch, l1CustomerActivityFilter, l1CustomerSortBy, l1CustomerSortOrder]);

  useEffect(() => {
    setL1AffiliatePage(1);
  }, [l1AffiliateSearch, l1AffiliateActivityFilter, l1AffiliateSortBy, l1AffiliateSortOrder]);

  useEffect(() => {
    setL2Page(1);
  }, [l2Search, l2TypeFilter, l2SponsorFilter, l2SortBy, l2SortOrder]);

  const level1CustomerLastOrder = teamData?.level1CustomerOrders[0];
  const level1CustomerLastEnrolled = teamData?.level1Customers.sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )[0];

  // Filtered and sorted Level 1 Customers
  const filteredL1Customers = useMemo(() => {
    let filtered = [...(teamData?.level1CustomersWithDetails || [])];

    // Search filter
    if (l1CustomerSearch) {
      const search = l1CustomerSearch.toLowerCase();
      filtered = filtered.filter(c =>
        c.firstName.toLowerCase().includes(search) ||
        c.lastName.toLowerCase().includes(search) ||
        c.email.toLowerCase().includes(search) ||
        (c.cityTown && c.cityTown.toLowerCase().includes(search)) ||
        (c.stateProvince && c.stateProvince.toLowerCase().includes(search))
      );
    }

    // Activity filter
    if (l1CustomerActivityFilter === "has_orders") {
      filtered = filtered.filter(c => c.totalPurchases > 0);
    } else if (l1CustomerActivityFilter === "no_orders") {
      filtered = filtered.filter(c => c.totalPurchases === 0);
    }

    // Sort
    filtered.sort((a, b) => {
      let aVal: any, bVal: any;
      switch (l1CustomerSortBy) {
        case "name":
          aVal = `${a.firstName} ${a.lastName} `.toLowerCase();
          bVal = `${b.firstName} ${b.lastName} `.toLowerCase();
          break;
        case "enrolled":
          aVal = new Date(a.createdAt).getTime();
          bVal = new Date(b.createdAt).getTime();
          break;
        case "purchases":
          aVal = a.totalPurchases;
          bVal = b.totalPurchases;
          break;
        case "commissions":
          aVal = a.totalCommissions;
          bVal = b.totalCommissions;
          break;
      }
      return l1CustomerSortOrder === "asc" ? (aVal > bVal ? 1 : -1) : (aVal < bVal ? 1 : -1);
    });

    return filtered;
  }, [teamData?.level1CustomersWithDetails, l1CustomerSearch, l1CustomerActivityFilter, l1CustomerSortBy, l1CustomerSortOrder]);

  const l1CustomerTotalPages = Math.ceil(filteredL1Customers.length / l1CustomerItemsPerPage);

  // Filtered and sorted Level 1 Affiliates
  const filteredL1Affiliates = useMemo(() => {
    let filtered = [...(teamData?.level1AffiliatesWithDetails || [])];

    // Search filter
    if (l1AffiliateSearch) {
      const search = l1AffiliateSearch.toLowerCase();
      filtered = filtered.filter(a =>
        a.firstName.toLowerCase().includes(search) ||
        a.lastName.toLowerCase().includes(search) ||
        a.email.toLowerCase().includes(search) ||
        (a.cityTown && a.cityTown.toLowerCase().includes(search)) ||
        (a.stateProvince && a.stateProvince.toLowerCase().includes(search))
      );
    }

    // Activity filter
    if (l1AffiliateActivityFilter === "has_sales") {
      filtered = filtered.filter(a => a.totalPurchases > 0);
    } else if (l1AffiliateActivityFilter === "no_sales") {
      filtered = filtered.filter(a => a.totalPurchases === 0);
    }

    // Sort
    filtered.sort((a, b) => {
      let aVal: any, bVal: any;
      switch (l1AffiliateSortBy) {
        case "name":
          aVal = `${a.firstName} ${a.lastName} `.toLowerCase();
          bVal = `${b.firstName} ${b.lastName} `.toLowerCase();
          break;
        case "enrolled":
          aVal = new Date(a.createdAt).getTime();
          bVal = new Date(b.createdAt).getTime();
          break;
        case "purchases":
          aVal = a.totalPurchases;
          bVal = b.totalPurchases;
          break;
        case "commissions":
          aVal = a.totalCommissions;
          bVal = b.totalCommissions;
          break;
      }
      return l1AffiliateSortOrder === "asc" ? (aVal > bVal ? 1 : -1) : (aVal < bVal ? 1 : -1);
    });

    return filtered;
  }, [teamData?.level1AffiliatesWithDetails, l1AffiliateSearch, l1AffiliateActivityFilter, l1AffiliateSortBy, l1AffiliateSortOrder]);

  const l1AffiliateTotalPages = Math.ceil(filteredL1Affiliates.length / l1AffiliateItemsPerPage);

  // Combined and filtered Level 2
  const filteredL2Data = useMemo(() => {
    const customers = (teamData?.level2CustomersWithDetails || []).map(c => ({ ...c, type: 'customer' as const }));
    const affiliates = (teamData?.level2AffiliatesWithDetails || []).map(a => ({ ...a, type: 'affiliate' as const }));
    let combined = [...customers, ...affiliates];

    // Type filter
    if (l2TypeFilter === "customers") {
      combined = combined.filter(item => item.type === 'customer');
    } else if (l2TypeFilter === "affiliates") {
      combined = combined.filter(item => item.type === 'affiliate');
    }

    // Sponsor filter
    if (l2SponsorFilter !== "all") {
      combined = combined.filter(item => item.sponsorName === l2SponsorFilter);
    }

    // Search filter
    if (l2Search) {
      const search = l2Search.toLowerCase();
      combined = combined.filter(item => {

        return item.firstName.toLowerCase().includes(search) ||
          item.lastName.toLowerCase().includes(search) ||
          item.sponsorName.toString().toLowerCase().includes(search) ||
          (item.cityTown && item.cityTown.toLowerCase().includes(search)) ||
          (item.stateProvince && item.stateProvince.toLowerCase().includes(search))
      });
    }

    // Sort
    combined.sort((a, b) => {
      let aVal: any, bVal: any;
      switch (l2SortBy) {
        case "name":
          aVal = `${a.firstName} ${a.lastName} `.toLowerCase();
          bVal = `${b.firstName} ${b.lastName} `.toLowerCase();
          break;
        case "enrolled":
          aVal = new Date(a.createdAt).getTime();
          bVal = new Date(b.createdAt).getTime();
          break;
        case "sponsor":
          aVal = a.sponsorName.toLowerCase();
          bVal = b.sponsorName.toLowerCase();
          break;
        case "purchases":
          aVal = a.totalPurchases || 0;
          bVal = b.totalPurchases || 0;
          break;
      }
      return l2SortOrder === "asc" ? (aVal > bVal ? 1 : -1) : (aVal < bVal ? 1 : -1);
    });

    return combined;
  }, [teamData?.level2CustomersWithDetails, teamData?.level2AffiliatesWithDetails, l2Search, l2TypeFilter, l2SponsorFilter, l2SortBy, l2SortOrder]);

  const l2TotalPages = Math.ceil(filteredL2Data.length / l2ItemsPerPage);



  // Below is the restructured Code

  const { impersonating } = useAuthStore();

  const { data: levelOneCustomer, isLoading: levelOneCustomerLoading } = useQuery({
    queryKey: ["levelOneCustomer", l1CustomerItemsPerPage, l1CustomerPage, l1CustomerSearch, l1CustomerActivityFilter, l1CustomerSortOrder, l1CustomerSortBy],
    queryFn: async () => {

      const payload = {
        limit: l1CustomerItemsPerPage,
        page: l1CustomerPage,
        ...(l1CustomerSearch && l1CustomerSearch.toString().trim() !== "" && { searchTerm: l1CustomerSearch }),
        ...(l1CustomerActivityFilter && l1CustomerActivityFilter.toString().trim() !== "" && { order: l1CustomerActivityFilter }),
        ...(l1CustomerSortOrder && l1CustomerSortOrder.toString().trim() !== "" && { sortOrder: l1CustomerSortOrder }),
        ...(l1CustomerSortBy && l1CustomerSortBy.toString().trim() !== "" && { sortBy: l1CustomerSortBy }),
      }

      const response = await readLevelOneCustomer(payload);

      // console.log("levelOneCustomer response is ", response.data.data);

      return response.data.data;
    }
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setL1CustomerSearch(debouncedL1CustomerSearch);
    }, 400); // 400ms delay

    // Cleanup the timeout if the effect is re-run before the timeout completes
    return () => clearTimeout(timer);
  }, [debouncedL1CustomerSearch]); // This effect will run whenever debouncedL1CustomerSearch changes

  const { data: levelOneAffiliate, isLoading: levelOneAffiliateLoading } = useQuery({
    queryKey: ["levelOneAffiliate", l1AffiliateItemsPerPage, l1AffiliatePage, l1AffiliateSearch, l1AffiliateActivityFilter, l1AffiliateSortOrder, l1AffiliateSortBy],
    queryFn: async () => {

      const payload = {
        limit: l1AffiliateItemsPerPage,
        page: l1AffiliatePage,
        ...(l1AffiliateSearch && l1AffiliateSearch.toString().trim() !== "" && { searchTerm: l1AffiliateSearch }),
        ...(l1AffiliateActivityFilter && l1AffiliateActivityFilter.toString().trim() !== "" && { order: l1AffiliateActivityFilter }),
        ...(l1AffiliateSortOrder && l1AffiliateSortOrder.toString().trim() !== "" && { sortOrder: l1AffiliateSortOrder }),
        ...(l1AffiliateSortBy && l1AffiliateSortBy.toString().trim() !== "" && { sortBy: l1AffiliateSortBy }),
      }

      const response = await readLevelOneAffiliate(payload);

      // console.log("levelOneAffiliate response is ", response.data.data);

      return response.data.data;
    },
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setL1AffiliateSearch(debouncedL1AffiliateSearch);
    }, 400); // 400ms delay

    // Cleanup the timeout if the effect is re-run before the timeout completes
    return () => clearTimeout(timer);
  }, [debouncedL1AffiliateSearch]); // This effect will run whenever debouncedL1AffiliateSearch changes

  const { data: levelTwoInsights, isLoading: levelTwoInsightsLoading } = useQuery({
    queryKey: ['levelTwoInsights', l2Page, l2ItemsPerPage, l2Search, l2TypeFilter, l2SponsorFilter, l2SortBy, l2SortOrder],
    queryFn: async () => {

      try {

        const payload = {
          page: l2Page,
          limit: l2ItemsPerPage,
          ...(l2Search && l2Search.trim() !== "" && { searchTerm: l2Search }),
          ...(l2TypeFilter && l2TypeFilter.trim() !== "" && { roleFilter: l2TypeFilter }),
          ...(l2SponsorFilter && { selfAffiliateId: l2SponsorFilter }),
          ...(l2SortBy && { sortBy: l2SortBy }),
          ...(l2SortOrder && { sortOrder: l2SortOrder }),
        }


        const response = await readLevelTwoInsights(payload);


        return response.data.data;

      } catch (error) {
        console.error("Error is ", error);
      }
    }
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setL2Search(debouncedL2Search);
    }, 400); // 400ms delay

    // Cleanup the timeout if the effect is re-run before the timeout completes
    return () => clearTimeout(timer);
  }, [debouncedL2Search]);

  return (
    <div className="space-y-6">
      {/* Calculate Commissions Button - Admin Only */}
      {impersonating && (
        <div className="flex justify-end">
          <CalculateCommissionsButton onSuccess={() => {}} />
        </div>
      )}

      {/* Top Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6 border-green-200 bg-green-50">
          <div className="flex items-center gap-3">
            <Users className="h-8 w-8 text-green-600" />
            <div>
              <p className="text-sm text-muted-foreground">Level 1 Customers</p>
              <p className="text-3xl font-bold text-green-600">{!levelOneCustomerLoading && levelOneCustomer?.totalCustomers}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 border-purple-200 bg-purple-50">
          <div className="flex items-center gap-3">
            <Briefcase className="h-8 w-8 text-purple-600" />
            <div>
              <p className="text-sm text-muted-foreground">Level 1 Affiliates</p>
              <p className="text-3xl font-bold text-purple-600">{!levelOneAffiliateLoading && levelOneAffiliate?.totalAffiliates}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 border-blue-200 bg-blue-50">
          <div className="flex items-center gap-3">
            <Users className="h-8 w-8 text-blue-600" />
            <div>
              <p className="text-sm text-muted-foreground">Level 2 Customers</p>
              <p className="text-3xl font-bold text-blue-600">{!levelTwoInsightsLoading && levelTwoInsights?.levelTwoCustomerCount}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 border-orange-200 bg-orange-50">
          <div className="flex items-center gap-3">
            <Briefcase className="h-8 w-8 text-orange-600" />
            <div>
              <p className="text-sm text-muted-foreground">Level 2 Affiliates</p>
              <p className="text-3xl font-bold text-orange-600">{!levelTwoInsightsLoading && levelTwoInsights?.levelTwoAffiliateCount}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Level 1 Customers Overview */}
      <Card className="border-green-200 bg-green-50/50">
        <div
          className="p-6 cursor-pointer"
          onClick={() => toggleSection("level1Customers")}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Users className="h-6 w-6 text-green-600" />
              <div>
                <h2 className="text-xl font-bold text-green-800">Level 1 - Customers Overview</h2>
                <p className="text-sm text-muted-foreground">Your directly referred customers</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="border-green-600 text-green-600 hover:bg-green-50 hover:text-green-700"
              onClick={(e) => {
                e.stopPropagation();
                toggleSection('level1Customers');
              }}
            >
              {expandedSections.level1Customers ? (
                <>
                  <ChevronUp className="h-4 w-4 mr-1" />
                  Hide Details
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4 mr-1" />
                  View Details
                </>
              )}
            </Button>
          </div>
        </div>

        {!expandedSections.level1Customers && (
          <div className="px-6 pb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
              <div className="bg-white p-4 rounded-lg border">
                <p className="text-sm text-muted-foreground">Total Customers</p>
                <p className="text-2xl font-bold text-green-600">{!levelOneCustomerLoading && levelOneCustomer?.totalCustomers}</p>
              </div>
              {!levelOneCustomerLoading && levelOneCustomer?.lastEnrolledCustomer && (
                <div className="bg-white p-4 rounded-lg border">
                  <p className="text-sm text-muted-foreground">Last Enrolled</p>
                  <p className="text-lg font-semibold text-green-600">{format(new Date(levelOneCustomer?.lastEnrolledCustomer?.enrollmentDate), formatString)}</p>
                  <p className="text-xs text-muted-foreground mt-1">{levelOneCustomer?.lastEnrolledCustomer?.firstName} {levelOneCustomer?.lastEnrolledCustomer?.lastName}</p>
                </div>
              )}
              <div className="bg-white p-4 rounded-lg border">
                <p className="text-sm text-muted-foreground">Total Purchases</p>
                <p className="text-lg font-semibold text-orange-600">{formatCurrency(levelOneCustomer?.totalPurchases)}</p>
                {!levelOneCustomerLoading && level1CustomerLastOrder && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Last: {formatCurrency(levelOneCustomer?.lastOrder?.amount)} on {format(new Date(levelOneCustomer?.lastOrder?.orderDate), formatString).split("-").join("/")}
                  </p>
                )}
              </div>
              <div className="bg-white p-4 rounded-lg border">
                <p className="text-sm text-muted-foreground">Lifetime Commissions</p>
                <p className="text-lg font-semibold text-green-600">{formatCurrency(levelOneCustomer?.lifeTimeCommissions)}</p>
                {!levelOneCustomerLoading && levelOneCustomer?.lastCommission && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Last: {formatCurrency(levelOneCustomer?.lastCommission.commissionAmount)} on {format(new Date(levelOneCustomer?.lastCommission.createdAt), formatString)}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {expandedSections.level1Customers && (
          <div className="px-6 pb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
              <div className="bg-white p-4 rounded-lg border">
                <p className="text-sm text-muted-foreground">Total Customers</p>
                <p className="text-2xl font-bold text-green-600">{!levelOneCustomerLoading && levelOneCustomer?.totalCustomers}</p>
              </div>
              {!levelOneCustomerLoading && level1CustomerLastEnrolled && (
                <div className="bg-white p-4 rounded-lg border">
                  <p className="text-sm text-muted-foreground">Last Enrolled</p>
                  <p className="text-2xl font-bold text-green-600">{format(new Date(levelOneCustomer?.lastEnrolledCustomer?.enrollmentDate), formatString)}</p>
                  <p className="text-sm text-muted-foreground">{levelOneCustomer?.lastEnrolledCustomer?.firstName} {levelOneCustomer?.lastEnrolledCustomer?.lastName}</p>
                </div>
              )}
              <div className="bg-white p-4 rounded-lg border">
                <p className="text-sm text-muted-foreground">Total Purchases</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(levelOneCustomer?.totalPurchases)}</p>
                {!levelOneCustomerLoading && level1CustomerLastOrder && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Last: {formatCurrency(levelOneCustomer?.lastOrder?.amount)} on {format(new Date(levelOneCustomer?.lastOrder?.orderDate), formatString)}
                  </p>
                )}
              </div>
              <div className="bg-white p-4 rounded-lg border">
                <p className="text-sm text-muted-foreground">Lifetime Commissions</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(levelOneCustomer?.lifeTimeCommissions)}</p>
                {!levelOneCustomerLoading && levelOneCustomer?.lastCommission && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Last: {formatCurrency(levelOneCustomer?.lastCommission.commissionAmount)} on {format(new Date(levelOneCustomer?.lastCommission.createdAt), formatString).split("-").join("/")}
                  </p>
                )}
              </div>
            </div>

            {/* Customer Details Table */}
            <div className="mt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-green-800">Customer Details</h3>
                <span className="text-sm text-muted-foreground">
                  Showing {levelOneCustomer?.customers?.length} of {levelOneCustomer?.totalCustomers} customers
                </span>
              </div>

              {/* Filters */}
              <div className="bg-white p-4 rounded-lg border mb-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by name, email, city..."
                      value={debouncedL1CustomerSearch}
                      onChange={(e) => setDebouncedL1CustomerSearch(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <Select value={l1CustomerActivityFilter} onValueChange={setL1CustomerActivityFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Activity Filter" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Customers</SelectItem>
                      <SelectItem value="hasOrders">Has Orders</SelectItem>
                      <SelectItem value="hasNoOrders">No Orders</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={`${l1CustomerSortBy}-${l1CustomerSortOrder}`} onValueChange={(val) => {
                    const [sortBy, sortOrder] = val.split('-');
                    setL1CustomerSortBy(sortBy as any);
                    setL1CustomerSortOrder(sortOrder as any);
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sort By" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="enrolled-desc">Latest Enrolled</SelectItem>
                      <SelectItem value="enrolled-asc">Earliest Enrolled</SelectItem>
                      <SelectItem value="name-asc">Name A-Z</SelectItem>
                      <SelectItem value="name-desc">Name Z-A</SelectItem>
                      <SelectItem value="purchases-desc">Highest Purchases</SelectItem>
                      <SelectItem value="purchases-asc">Lowest Purchases</SelectItem>
                      <SelectItem value="commissions-desc">Highest Commissions</SelectItem>
                      <SelectItem value="commissions-asc">Lowest Commissions</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {(l1CustomerSearch || l1CustomerActivityFilter !== "all") && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setL1CustomerSearch("");
                      setL1CustomerActivityFilter("all");
                      setDebouncedL1CustomerSearch("");
                    }}
                    className="text-green-600 hover:text-green-700"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Clear Filters
                  </Button>
                )}
              </div>

              <div className="bg-white rounded-lg border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-green-50">
                      <TableHead>Name</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>City/State</TableHead>
                      <TableHead className="text-right">Total Purchases</TableHead>
                      <TableHead>Last Purchase</TableHead>
                      <TableHead className="text-right">Your Commission</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>

                    {levelOneCustomerLoading && (
                      <TableRow >
                        <TableCell className="font-medium" colSpan={7}>Loading...</TableCell>
                      </TableRow>
                    )}

                    {!levelOneCustomerLoading && !levelOneCustomer?.customers.length && (
                      <TableRow >
                        <TableCell className="font-medium" colSpan={7}>No Customer Found...</TableCell>
                      </TableRow>
                    )}
                    {!levelOneCustomerLoading && !!levelOneCustomer?.customers.length && levelOneCustomer?.customers?.map((customer: any) => (
                      <TableRow key={customer._id}>
                        <TableCell className="font-medium">{customer.firstName} {customer.lastName}</TableCell>
                        <TableCell>{customer.phone || 'N/A'}</TableCell>
                        <TableCell>{customer.email}</TableCell>
                        <TableCell>{customer.cityTown && `${customer.cityTown} `}{customer.cityTown && customer.stateProvince && `, `}{customer.stateProvince && `${customer.stateProvince} `}{!customer.cityTown && !customer.stateProvince && `N / A`}</TableCell>
                        <TableCell className="text-right font-semibold text-green-600">{formatCurrency(customer.totalPurchases)}</TableCell>
                        <TableCell>{customer.lastOrderDate ? format(new Date(customer.lastOrderDate), formatString).split("-").join("/") : 'N/A'}</TableCell>
                        <TableCell className="text-right font-semibold text-green-600">{formatCurrency(customer.totalCommissions)}</TableCell>
                      </TableRow>
                    ))}
                    {filteredL1Customers.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          No customers found matching your filters
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {!levelOneCustomerLoading && levelOneCustomer?.customers?.length > 0 && (
                <div className="flex items-center justify-between mt-4 px-4">
                  <div className="flex items-center gap-4">
                    <div className="text-sm text-muted-foreground">
                      Showing {((l1CustomerPage - 1) * l1CustomerItemsPerPage) + 1} to {Math.min(l1CustomerPage * l1CustomerItemsPerPage, filteredL1Customers.length)} of {filteredL1Customers.length} customers
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Per page:</span>
                      <Select
                        value={l1CustomerItemsPerPage.toString()}
                        onValueChange={(value) => {
                          setL1CustomerItemsPerPage(Number(value));
                          setL1CustomerPage(1);
                        }}
                      >
                        <SelectTrigger className="w-[80px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {/* <SelectItem value="15">15</SelectItem> */}
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
                      size="sm"
                      onClick={() => setL1CustomerPage((p) => Math.max(1, p - 1))}
                      disabled={l1CustomerPage === 1}
                    >
                      Previous
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      Page {l1CustomerPage} of {l1CustomerTotalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setL1CustomerPage((p) => Math.min(l1CustomerTotalPages, p + 1))}
                      disabled={l1CustomerPage === l1CustomerTotalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </Card>

      {/* Level 1 Affiliates Overview */}
      <Card className="border-purple-200 bg-purple-50/50">
        <div
          className="p-6 cursor-pointer"
          onClick={() => toggleSection("level1Affiliates")}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Briefcase className="h-6 w-6 text-purple-600" />
              <div>
                <h2 className="text-xl font-bold text-purple-800">Level 1 - Affiliates Overview</h2>
                <p className="text-sm text-muted-foreground">Your directly referred affiliates</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="border-purple-600 text-purple-600 hover:bg-purple-50 hover:text-purple-700"
              onClick={(e) => {
                e.stopPropagation();
                toggleSection('level1Affiliates');
              }}
            >
              {expandedSections.level1Affiliates ? (
                <>
                  <ChevronUp className="h-4 w-4 mr-1" />
                  Hide Details
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4 mr-1" />
                  View Details
                </>
              )}
            </Button>
          </div>
        </div>

        {!expandedSections.level1Affiliates && (
          <div className="px-6 pb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
              <div className="bg-white p-4 rounded-lg border">
                <p className="text-sm text-muted-foreground">Total Affiliates</p>
                <p className="text-2xl font-bold text-purple-600">{!levelOneAffiliateLoading && levelOneAffiliate.totalAffiliates}</p>
              </div>
              {!levelOneAffiliateLoading && levelOneAffiliate?.lastEnrolledAffiliate && (
                <div className="bg-white p-4 rounded-lg border">
                  <p className="text-sm text-muted-foreground">Last Enrolled</p>
                  <p className="text-lg font-semibold text-purple-600">{format(new Date(levelOneAffiliate?.lastEnrolledAffiliate.enrollmentDate), formatString)}</p>
                  <p className="text-xs text-muted-foreground mt-1">{levelOneAffiliate?.lastEnrolledAffiliate.firstName} {levelOneAffiliate?.lastEnrolledAffiliate.lastName}</p>
                </div>
              )}
              <div className="bg-white p-4 rounded-lg border">
                <p className="text-sm text-muted-foreground">Total Purchases</p>
                <p className="text-lg font-semibold text-orange-600">{formatCurrency(!levelOneAffiliateLoading && levelOneAffiliate?.totalPurchases)}</p>
                {!levelOneAffiliateLoading && levelOneAffiliate?.lastOrder && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Last: {formatCurrency(levelOneAffiliate?.lastOrder.amount)} on {format(new Date(levelOneAffiliate?.lastOrder.orderDate), formatString).split("-").join("/")}
                  </p>
                )}
              </div>
              <div className="bg-white p-4 rounded-lg border">
                <p className="text-sm text-muted-foreground">Lifetime Commissions</p>
                <p className="text-lg font-semibold text-purple-600">{formatCurrency(!levelOneAffiliateLoading && levelOneAffiliate?.lifeTimeCommissions)}</p>
                {!levelOneAffiliateLoading && levelOneAffiliate?.lastCommission && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Last: {formatCurrency(!levelOneAffiliateLoading && levelOneAffiliate?.lastCommission.commissionAmount)} on {format(new Date(!levelOneAffiliateLoading && levelOneAffiliate?.lastCommission.createdAt), formatString).split("-").join("/")}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {expandedSections.level1Affiliates && (
          <div className="px-6 pb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
              <div className="bg-white p-4 rounded-lg border">
                <p className="text-sm text-muted-foreground">Total Affiliates</p>
                <p className="text-2xl font-bold text-purple-600">{!levelOneAffiliateLoading && levelOneAffiliate.totalAffiliates}</p>
              </div>
              {!levelOneAffiliateLoading && levelOneAffiliate?.lastEnrolledAffiliate && (
                <div className="bg-white p-4 rounded-lg border">
                  <p className="text-sm text-muted-foreground">Last Enrolled</p>
                  <p className="text-2xl font-bold text-purple-600">{format(new Date(levelOneAffiliate?.lastEnrolledAffiliate.enrollmentDate), formatString).split("-").join("/")}</p>
                  <p className="text-sm text-muted-foreground">{levelOneAffiliate?.lastEnrolledAffiliate.firstName} {levelOneAffiliate?.lastEnrolledAffiliate.lastName}</p>
                </div>
              )}
              <div className="bg-white p-4 rounded-lg border">
                <p className="text-sm text-muted-foreground">Total Purchases</p>
                <p className="text-2xl font-bold text-purple-600">{formatCurrency(!levelOneAffiliateLoading && levelOneAffiliate?.totalPurchases)}</p>
                {!levelOneAffiliateLoading && levelOneAffiliate?.lastOrder && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Last: {formatCurrency(levelOneAffiliate?.lastOrder.amount)} on {format(new Date(levelOneAffiliate?.lastOrder.orderDate), formatString).split("-").join("/")}
                  </p>
                )}
              </div>
              <div className="bg-white p-4 rounded-lg border">
                <p className="text-sm text-muted-foreground">Lifetime Commissions</p>
                <p className="text-2xl font-bold text-purple-600">{formatCurrency(!levelOneAffiliateLoading && levelOneAffiliate?.lifeTimeCommissions)}</p>
                {!levelOneAffiliateLoading && levelOneAffiliate?.lastCommission && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Last: {formatCurrency(!levelOneAffiliateLoading && levelOneAffiliate?.lastCommission.commissionAmount)} on {format(new Date(!levelOneAffiliateLoading && levelOneAffiliate?.lastCommission.createdAt), formatString).split("-").join("/")}
                  </p>
                )}
              </div>
            </div>

            {/* Affiliate Details Table */}
            <div className="mt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-purple-800">Affiliate Details</h3>
                <span className="text-sm text-muted-foreground">
                  Showing {!levelOneAffiliateLoading && levelOneAffiliate?.affiliates?.length} of {!levelOneAffiliateLoading && levelOneAffiliate?.totalAffiliates} affiliates
                </span>
              </div>

              {/* Filters */}
              <div className="bg-white p-4 rounded-lg border mb-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by name, email, city..."
                      value={debouncedL1AffiliateSearch}
                      onChange={(e) => setDebouncedL1AffiliateSearch(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <Select value={l1AffiliateActivityFilter} onValueChange={setL1AffiliateActivityFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Activity Filter" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Affiliates</SelectItem>
                      <SelectItem value="hasOrders">Has Downline Sales</SelectItem>
                      <SelectItem value="hasNoOrders">No Downline Sales</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={`${l1AffiliateSortBy}-${l1AffiliateSortOrder}`} onValueChange={(val) => {
                    const [sortBy, sortOrder] = val.split('-');
                    setL1AffiliateSortBy(sortBy as any);
                    setL1AffiliateSortOrder(sortOrder as any);
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sort By" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="enrolled-desc">Latest Enrolled</SelectItem>
                      <SelectItem value="enrolled-asc">Earliest Enrolled</SelectItem>
                      <SelectItem value="name-asc">Name A-Z</SelectItem>
                      <SelectItem value="name-desc">Name Z-A</SelectItem>
                      <SelectItem value="purchases-desc">Highest Sales</SelectItem>
                      <SelectItem value="purchases-asc">Lowest Sales</SelectItem>
                      <SelectItem value="commissions-desc">Highest Commissions</SelectItem>
                      <SelectItem value="commissions-asc">Lowest Commissions</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {(l1AffiliateSearch || l1AffiliateActivityFilter !== "all") && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setL1AffiliateSearch("");
                      setL1AffiliateActivityFilter("all");
                      setDebouncedL1AffiliateSearch("")
                    }}
                    className="text-purple-600 hover:text-purple-700"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Clear Filters
                  </Button>
                )}
              </div>

              <div className="bg-white rounded-lg border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-purple-50">
                      <TableHead>Name</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>City/State</TableHead>
                      <TableHead className="text-right">Total Purchases</TableHead>
                      <TableHead>Last Purchase</TableHead>
                      <TableHead className="text-right">Lifetime Commissions</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {!levelOneAffiliateLoading && levelOneAffiliate?.affiliates.map((affiliate) => (
                      <TableRow key={affiliate._id}>
                        <TableCell className="font-medium">{affiliate.firstName} {affiliate.lastName}</TableCell>
                        <TableCell>{affiliate.phone || 'N/A'}</TableCell>
                        <TableCell>{affiliate.email}</TableCell>
                        <TableCell>{affiliate.cityTown && affiliate.stateProvince ? `${affiliate.cityTown}, ${affiliate.stateProvince} ` : 'N/A'}</TableCell>
                        <TableCell className="text-right font-semibold text-purple-600">{formatCurrency(affiliate.totalPurchases)}</TableCell>
                        <TableCell>{affiliate.lastOrderDate ? format(new Date(affiliate.lastOrderDate), formatString).split("-").join("/") : 'N/A'}</TableCell>
                        <TableCell className="text-right font-semibold text-purple-600">{formatCurrency(affiliate.totalCommissions)}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setViewingAffiliate(affiliate)}>
                                <Eye className="h-4 w-4 mr-2" />
                                View Affiliate
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                    {!levelOneAffiliateLoading && levelOneAffiliate?.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                          No affiliates found matching your filters
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {!levelOneAffiliateLoading && levelOneAffiliate?.affiliates?.length > 0 && (
                <div className="flex items-center justify-between mt-4 px-4">
                  <div className="flex items-center gap-4">
                    <div className="text-sm text-muted-foreground">
                      Showing {((l1AffiliatePage - 1) * l1AffiliateItemsPerPage) + 1} to {Math.min(l1AffiliatePage * l1AffiliateItemsPerPage, levelOneAffiliate?.affiliates?.length)} of {levelOneAffiliate?.affiliates?.length} affiliates
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Per page:</span>
                      <Select
                        value={l1AffiliateItemsPerPage.toString()}
                        onValueChange={(value) => {
                          setL1AffiliateItemsPerPage(Number(value));
                          setL1AffiliatePage(1);
                        }}
                      >
                        <SelectTrigger className="w-[80px]">
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
                      size="sm"
                      onClick={() => setL1AffiliatePage((p) => Math.max(1, p - 1))}
                      disabled={l1AffiliatePage === 1}
                    >
                      Previous
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      Page {l1AffiliatePage} of {l1AffiliateTotalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setL1AffiliatePage((p) => Math.min(l1AffiliateTotalPages, p + 1))}
                      disabled={l1AffiliatePage === l1AffiliateTotalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </Card>

      {/* Level 2 Overview */}
      <Card className="border-blue-200 bg-blue-50/50">
        <div
          className="p-6 cursor-pointer"
          onClick={() => toggleSection("level2")}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Users className="h-6 w-6 text-blue-600" />
              <div>
                <h2 className="text-xl font-bold text-blue-800">Level 2 - Overview</h2>
                <p className="text-sm text-muted-foreground">Customers and affiliates of your Level 1 affiliates (Limited info for privacy)</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="border-orange-600 text-orange-600 hover:bg-orange-50 hover:text-orange-700"
              onClick={(e) => {
                e.stopPropagation();
                toggleSection('level2');
              }}
            >
              {expandedSections.level2 ? (
                <>
                  <ChevronUp className="h-4 w-4 mr-1" />
                  Hide Details
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4 mr-1" />
                  View Details
                </>
              )}
            </Button>
          </div>
        </div>

        {!expandedSections.level2 && (
          <div className="px-6 pb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="bg-white p-4 rounded-lg border">
                <p className="text-sm text-muted-foreground">Level 2 Customers</p>
                <p className="text-2xl font-bold text-orange-600">{!levelTwoInsightsLoading && levelTwoInsights?.levelTwoCustomerCount}</p>
                <p className="text-sm text-muted-foreground mt-2">Commission: <span className="font-semibold text-green-600">{formatCurrency(!levelTwoInsightsLoading && levelTwoInsights?.totalLevelTwoCustomerCommission)}</span></p>
              </div>
              <div className="bg-white p-4 rounded-lg border">
                <p className="text-sm text-muted-foreground">Level 2 Affiliates</p>
                <p className="text-2xl font-bold text-orange-600">{!levelTwoInsightsLoading && levelTwoInsights?.levelTwoAffiliateCount}</p>
                <p className="text-sm text-muted-foreground mt-2">Commission: <span className="font-semibold text-green-600">{formatCurrency(!levelTwoInsightsLoading && levelTwoInsights?.totalLevelTwoAffiliateCommission)}</span></p>
              </div>
            </div>
          </div>
        )}

        {expandedSections.level2 && (
          <div className="px-6 pb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="bg-white p-4 rounded-lg border">
                <p className="text-sm text-muted-foreground">Level 2 Customers</p>
                <p className="text-2xl font-bold text-orange-600">{!levelTwoInsightsLoading && levelTwoInsights?.levelTwoCustomerCount}</p>
                <p className="text-sm text-muted-foreground mt-2">Commission: {formatCurrency(!levelTwoInsightsLoading && levelTwoInsights?.totalLevelTwoCustomerCommission)}</p>
              </div>
              <div className="bg-white p-4 rounded-lg border">
                <p className="text-sm text-muted-foreground">Level 2 Affiliates</p>
                <p className="text-2xl font-bold text-orange-600">{!levelTwoInsightsLoading && levelTwoInsights?.levelTwoAffiliateCount}</p>
                <p className="text-sm text-muted-foreground mt-2">Commission: {formatCurrency(!levelTwoInsightsLoading && levelTwoInsights?.totalLevelTwoAffiliateCommission)}</p>
              </div>
            </div>

            {/* Level 2 Combined Table */}
            <div className="mt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-orange-800">Level 2 Details</h3>
                <span className="text-sm text-muted-foreground">
                  Showing {!levelTwoInsightsLoading && levelTwoInsights?.downlines?.data?.length} of {!levelTwoInsightsLoading && (levelTwoInsights?.levelTwoCustomerCount + levelTwoInsights?.levelTwoAffiliateCount)} records
                </span>
              </div>

              {/* Filters */}
              <div className="bg-white p-4 rounded-lg border mb-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by name, sponsor, city..."
                      value={debouncedL2Search}
                      onChange={(e) => setDebouncedL2Search(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <Select value={l2TypeFilter} onValueChange={setL2TypeFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Type Filter" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All (Customers & Affiliates)</SelectItem>
                      <SelectItem value="customers">Customers Only</SelectItem>
                      <SelectItem value="affiliates">Affiliates Only</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={l2SponsorFilter} onValueChange={setL2SponsorFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sponsor Filter" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Sponsors</SelectItem>
                      {!levelTwoInsightsLoading && levelTwoInsights?.uniqueSponsors?.map(sponsor => (
                        <SelectItem key={sponsor.sponsorSelfId} value={sponsor.sponsorSelfId}>{sponsor.sponsorName}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={`${l2SortBy}-${l2SortOrder}`} onValueChange={(val) => {
                    const [sortBy, sortOrder] = val.split('-');
                    setL2SortBy(sortBy as any);
                    setL2SortOrder(sortOrder as any);
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sort By" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="enrolled-desc">Latest Enrolled</SelectItem>
                      <SelectItem value="enrolled-asc">Earliest Enrolled</SelectItem>
                      <SelectItem value="name-asc">Name A-Z</SelectItem>
                      <SelectItem value="name-desc">Name Z-A</SelectItem>
                      <SelectItem value="sponsor-asc">Sponsor A-Z</SelectItem>
                      <SelectItem value="sponsor-desc">Sponsor Z-A</SelectItem>
                      <SelectItem value="purchases-desc">Highest Purchases</SelectItem>
                      <SelectItem value="purchases-asc">Lowest Purchases</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {(l2Search || l2TypeFilter !== "all" || l2SponsorFilter !== "all") && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setL2Search("");
                      setDebouncedL2Search("");
                      setL2TypeFilter("all");
                      setL2SponsorFilter("all");
                    }}
                    className="text-orange-600 hover:text-orange-700"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Clear Filters
                  </Button>
                )}
              </div>

              <div className="bg-white rounded-lg border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-orange-50">
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>City/State</TableHead>
                      <TableHead>Sponsored By</TableHead>
                      <TableHead className="text-right">Total Purchases</TableHead>
                      <TableHead>Last Purchase</TableHead>
                      <TableHead className="text-right">Your Commission</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {levelTwoInsightsLoading && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          Loading...
                        </TableCell>
                      </TableRow>
                    )}
                    {!levelTwoInsightsLoading && levelTwoInsights?.downlines?.data?.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          No Level 2 records found matching your filters
                        </TableCell>
                      </TableRow>
                    )}
                    {!levelTwoInsightsLoading && levelTwoInsights?.downlines?.data?.length !== 0 && levelTwoInsights?.downlines?.data?.map((item: any) => (
                      <TableRow key={`${item._id} `}>
                        <TableCell className="font-medium">{`${item.firstName} ${item.lastName ? item.lastName.charAt(0) + '.' : ''} `}</TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${item.type === 'customer' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'
                            } `}>
                            {item.type === 'customer' ? 'Customer' : 'Affiliate'}
                          </span>
                        </TableCell>
                        <TableCell>{item.cityTown && item.stateProvince ? `${item.cityTown}, ${item.stateProvince} ` : 'N/A'}</TableCell>
                        <TableCell className="text-muted-foreground">{item.sponsorName}</TableCell>
                        <TableCell className="text-right font-semibold text-orange-600">{formatCurrency(item.totalPurchases || 0)}</TableCell>
                        <TableCell>{item.lastOrderDate ? format(new Date(item.lastOrderDate), formatString).split("-").join("/") : 'N/A'}</TableCell>
                        <TableCell className="text-right font-semibold text-green-600">{formatCurrency(item.totalCommissions || 0)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {!levelTwoInsightsLoading && (
                <div className="flex items-center justify-between mt-4 px-4">
                  <div className="flex items-center gap-4">
                    <div className="text-sm text-muted-foreground">
                      Showing {((l2Page - 1) * l2ItemsPerPage) + 1} to {Math.min(l2Page * l2ItemsPerPage, levelTwoInsights?.downlines?.pagination?.total)} of {levelTwoInsights?.downlines?.pagination?.total} records
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Per page:</span>
                      <Select
                        value={l2ItemsPerPage.toString()}
                        onValueChange={(value) => {
                          setL2ItemsPerPage(Number(value));
                          setL2Page(1);
                        }}
                      >
                        <SelectTrigger className="w-[80px]">
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
                      size="sm"
                      onClick={() => setL2Page((p) => Math.max(1, p - 1))}
                      disabled={l2Page === 1}
                    >
                      Previous
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      Page {l2Page} of {!levelTwoInsightsLoading && levelTwoInsights?.downlines?.pagination?.totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setL2Page((p) => Math.min(l2TotalPages, p + 1))}
                      disabled={l2Page === l2TotalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </Card>

      {viewingAffiliate && (
        <AffiliateEditDialog
          // affiliate={viewingAffiliate}
          affiliateMongoId={viewingAffiliate._id}
          open={!!viewingAffiliate}
          onOpenChange={(open) => !open && setViewingAffiliate(null)}
          readOnly={true}
        />
      )}
    </div>
  );
};
