import { MetricCard } from "@/components/ui/metric-card";
import { Users, UserCheck, UserX, Trophy, HelpCircle, ShoppingCart, DollarSign, UserPlus, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { subDays } from "date-fns";
import { useUserRole } from "@/hooks/use-user-role";
import { formatCurrency } from "@/lib/utils";
import { readOverview } from "@/api/affiliate";

export function OverviewCards() {

  // state to toggle Active Affiliate Dialog
  const [isActiveAffiliatesModalOpen, setIsActiveAffiliatesModalOpen] = useState(false);

  // state to toggle Monthly Sales Dialog
  const [isMonthlySalesModalOpen, setIsMonthlySalesModalOpen] = useState(false);

  // state to store the Affiliate Period
  const [affiliatePeriod, setAffiliatePeriod] = useState("90");

  // state to store the Customer Period
  const [customerPeriod, setCustomerPeriod] = useState("90");

  // state to store if the current user is affiliate or not
  const { isAffiliate } = useUserRole();


  // Fetch orders for current month
  // Query to fetch the Orders of the Current Month
  const { data: currentMonthOrders = [] } = useQuery({
    queryKey: ['orders-current-month'],
    queryFn: async () => {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);  

      const { data, error } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .gte('order_date', startOfMonth.toISOString());

      if (error) throw error;
      return data || [];
    },
  });

  // Fetch orders for last month
  // Query to fetch the orders of last month
  const { data: lastMonthOrders = [] } = useQuery({
    queryKey: ['orders-last-month'],
    queryFn: async () => {
      const startOfLastMonth = new Date();
      startOfLastMonth.setMonth(startOfLastMonth.getMonth() - 1);
      startOfLastMonth.setDate(1);
      startOfLastMonth.setHours(0, 0, 0, 0);

      const endOfLastMonth = new Date();
      endOfLastMonth.setDate(0);
      endOfLastMonth.setHours(23, 59, 59, 999);

      const { data, error } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .gte('order_date', startOfLastMonth.toISOString())
        .lte('order_date', endOfLastMonth.toISOString());

      if (error) throw error;
      return data || [];
    },
  });

  // Calculate monthly sales
  const monthlySales = useMemo(() => {
    const currentTotal = currentMonthOrders.reduce((sum, order) => sum + (Number(order.amount) || 0), 0);
    const lastTotal = lastMonthOrders.reduce((sum, order) => sum + (Number(order.amount) || 0), 0);
    const change = lastTotal > 0 ? ((currentTotal - lastTotal) / lastTotal * 100) : 0;

    return {
      current: currentTotal,
      last: lastTotal,
      change
    };
  }, [currentMonthOrders, lastMonthOrders]);

  // Calculate product breakdown
  const productSales = useMemo(() => {
    const productMap = new Map();

    [...currentMonthOrders, ...lastMonthOrders].forEach(order => {
      const isCurrentMonth = currentMonthOrders.includes(order);
      order.order_items?.forEach((item: any) => {
        if (!productMap.has(item.description)) {
          productMap.set(item.description, { current: 0, last: 0 });
        }
        const data = productMap.get(item.description);
        if (isCurrentMonth) {
          data.current += Number(item.total) || 0;
        } else {
          data.last += Number(item.total) || 0;
        }
      });
    });

    return Array.from(productMap.entries())
      .map(([name, data]) => ({
        name,
        current: data.current,
        last: data.last
      }))
      .sort((a, b) => b.current - a.current);
  }, [currentMonthOrders, lastMonthOrders]);

  const { 
  data: overviewCardsData = {}, // default to empty object
  isLoading: isInitialLoading,
  isFetching: isBackgroundFetching,
} = useQuery({
  queryKey: ["overview-cards", affiliatePeriod, customerPeriod], // include BOTH periods!
  queryFn: async () => {
    const response = await readOverview({ affiliatePeriod, customerPeriod });
    return response.data.data;
  },
  keepPreviousData: true,
  placeholderData: previous => previous, // ensures data never becomes undefined
});

  // Create a useQuery
  /*
  Should return sales data
  */

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">

      {/* Affiliate Metric Card */}
      <MetricCard
        title={
          <div className="flex items-center justify-between gap-2 w-full">
            <span>{isAffiliate ? "My Affiliates" : "Total Affiliates"}</span>
            <Select value={affiliatePeriod} onValueChange={setAffiliatePeriod}>
              <SelectTrigger className="w-[110px] h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="z-50 bg-background">
                <SelectItem value="30">30 Days</SelectItem>
                <SelectItem value="60">60 Days</SelectItem>
                <SelectItem value="90">90 Days</SelectItem>
                <SelectItem value="120">120 Days</SelectItem>
                <SelectItem value="150">150 Days</SelectItem>
                <SelectItem value="180">180 Days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        }
        value={`${overviewCardsData?.totalAffiliateCount || 0}`}
        className="border-l-4 border-l-success"
      >
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Trophy className="h-4 w-4 text-success" />
            <span className="text-metric-label">Active:</span>
            <span className="font-medium text-metric-value">{overviewCardsData?.affiliateActivityData?.active || 0}</span>
            <Dialog open={isActiveAffiliatesModalOpen} onOpenChange={setIsActiveAffiliatesModalOpen}>
              <DialogTrigger asChild>
                <HelpCircle className="h-4 w-4 text-muted-foreground cursor-pointer hover:text-foreground transition-colors ml-1" />
              </DialogTrigger>
              <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-lg md:text-xl">{`Active Affiliates (Past ${affiliatePeriod} Days)`}</DialogTitle>
                </DialogHeader>
                <div className="space-y-3 pt-4">
                  <div className="flex items-center justify-between p-3 border rounded-lg touch-manipulation">
                    <div className="flex items-center gap-2 md:gap-3">
                      <ShoppingCart className="h-4 w-4 md:h-5 md:w-5 text-primary flex-shrink-0" />
                      <span className="text-xs md:text-sm font-medium">Made a purchase</span>
                    </div>
                    <span className="text-base md:text-lg font-bold text-metric-value">{overviewCardsData?.affiliateActivityData?.breakdown?.madePurchase || 0}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg touch-manipulation">
                    <div className="flex items-center gap-2 md:gap-3">
                      <Users className="h-4 w-4 md:h-5 md:w-5 text-success flex-shrink-0" />
                      <span className="text-xs md:text-sm font-medium">Made a sale</span>
                    </div>
                    <span className="text-base md:text-lg font-bold text-metric-value">{overviewCardsData?.affiliateActivityData?.breakdown?.madeSale || 0}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg touch-manipulation">
                    <div className="flex items-center gap-2 md:gap-3">
                      <DollarSign className="h-4 w-4 md:h-5 md:w-5 text-warning flex-shrink-0" />
                      <span className="text-xs md:text-sm font-medium">Earned a commission</span>
                    </div>
                    <span className="text-base md:text-lg font-bold text-metric-value">{overviewCardsData?.affiliateActivityData?.breakdown?.earnedCommission || 0}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg touch-manipulation">
                    <div className="flex items-center gap-2 md:gap-3">
                      <UserPlus className="h-4 w-4 md:h-5 md:w-5 text-secondary flex-shrink-0" />
                      <span className="text-xs md:text-sm font-medium">Enrolled an affiliate</span>
                    </div>
                    <span className="text-base md:text-lg font-bold text-metric-value">{overviewCardsData?.affiliateActivityData?.breakdown?.enrolledAffiliate || 0}</span>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <UserX className="h-4 w-4 text-muted-foreground" />
            <span className="text-metric-label">Inactive:</span>
            <span className="font-medium text-metric-value">{overviewCardsData?.affiliateActivityData?.inactive || 0}</span>
          </div>
        </div>
      </MetricCard>

      {/* Customer Metric Card  */}
      <MetricCard
        title={
          <div className="flex items-center justify-between gap-2 w-full">
            <span>Total Customers</span>
            <Select value={customerPeriod} onValueChange={setCustomerPeriod}>
              <SelectTrigger className="w-[110px] h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="z-50 bg-background">
                <SelectItem value="30">30 Days</SelectItem>
                <SelectItem value="60">60 Days</SelectItem>
                <SelectItem value="90">90 Days</SelectItem>
                <SelectItem value="120">120 Days</SelectItem>
                <SelectItem value="150">150 Days</SelectItem>
                <SelectItem value="180">180 Days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        }
        value={`${overviewCardsData?.totalCustomerCount || 0}`}
        className="border-l-4 border-l-primary"
      >
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <UserCheck className="h-4 w-4 text-success" />
            <span className="text-metric-label">Active:</span>
            <span className="font-medium text-metric-value">{overviewCardsData?.customerActivityData?.active?.toLocaleString() || 0}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <UserX className="h-4 w-4 text-muted-foreground" />
            <span className="text-metric-label">Inactive:</span>
            <span className="font-medium text-metric-value">{overviewCardsData?.customerActivityData?.inactive?.toLocaleString() || 0}</span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">Inactive Customers are those that have not made a purchase in the past {customerPeriod} days</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </MetricCard>

      {/* Sales Metric Card */}
      <MetricCard
        title="Monthly Sales"
        value={formatCurrency(overviewCardsData?.monthlySales?.current || 0)}
        className="border-l-4 border-l-warning"
      >
        <div className="flex items-center justify-between">
          <div className="text-sm text-metric-label">
            vs last month: <span className={(overviewCardsData?.monthlySales?.change || 0) >= 0 ? "text-success font-medium" : "text-destructive font-medium"}>
              {(overviewCardsData?.monthlySales?.change || 0) >= 0 ? '+' : ''}{overviewCardsData?.monthlySales?.change.toFixed(2)}%
            </span>
          </div>
          <Dialog 
          // open={isMonthlySalesModalOpen} 
          open={false} 
          onOpenChange={setIsMonthlySalesModalOpen}>
            <DialogTrigger asChild>
              <HelpCircle className="h-4 w-4 text-muted-foreground cursor-pointer hover:text-foreground transition-colors" />
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-lg md:text-xl">Monthly Sales Breakdown</DialogTitle>
              </DialogHeader>
              <div className="space-y-2 md:space-y-3 pt-4">
                {/* Header - Hidden on mobile, shown on tablet+ */}
                <div className="hidden sm:grid grid-cols-[1fr_100px_100px_auto] md:grid-cols-[1fr_120px_120px_auto] gap-2 md:gap-3 p-3 border rounded-lg font-medium text-xs md:text-sm text-muted-foreground">
                  <span className="text-left">Product</span>
                  <span className="text-left">Last Month</span>
                  <span className="text-left">This Month</span>
                  <span className="text-center">Trend</span>
                </div>
                {productSales.map((product) => {
                  const trend = product.last > 0 ? ((product.current - product.last) / product.last) : 0;
                  return (
                    <div key={product.name} className="p-3 border rounded-lg">
                      {/* Mobile Layout - Stacked */}
                      <div className="sm:hidden space-y-2">
                        <div className="font-medium text-sm">{product.name}</div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <div className="text-xs text-muted-foreground">Last Month</div>
                            <div className="font-medium text-metric-value">
                              ${product.last.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground">This Month</div>
                            <div className="font-bold text-base text-metric-value">
                              ${product.current.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">Trend:</span>
                          {trend >= 0 ? (
                            <ArrowUpRight className="h-4 w-4 text-success" />
                          ) : (
                            <ArrowDownRight className="h-4 w-4 text-destructive" />
                          )}
                        </div>
                      </div>
                      {/* Tablet+ Layout - Grid */}
                      <div className="hidden sm:grid grid-cols-[1fr_100px_100px_auto] md:grid-cols-[1fr_120px_120px_auto] gap-2 md:gap-3 items-center">
                        <span className="text-sm font-medium">{product.name}</span>
                        <span className="text-sm text-metric-value text-left">
                          ${product.last.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                        </span>
                        <span className="text-base md:text-lg font-bold text-metric-value text-left">
                          ${product.current.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                        </span>
                        {trend >= 0 ? (
                          <ArrowUpRight className="h-4 w-4 text-success mx-auto" />
                        ) : (
                          <ArrowDownRight className="h-4 w-4 text-destructive mx-auto" />
                        )}
                      </div>
                    </div>
                  );
                })}
                <div className="p-3 border-t-2 font-bold">
                  {/* Mobile Total - Stacked */}
                  <div className="sm:hidden space-y-2">
                    <div className="text-base">Total</div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <div className="text-xs text-muted-foreground">Last Month</div>
                        <div className="text-sm">
                          {/* ${!overviewCardsDataLoading && overviewCardsData?.monthlySales.last.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} */}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">This Month</div>
                        <div className="text-lg text-metric-value">
                          ${overviewCardsData?.monthlySales?.current?.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {overviewCardsData?.monthlySales?.change >= 0 ? (
                        <ArrowUpRight className="h-5 w-5 text-success" />
                      ) : (
                        <ArrowDownRight className="h-5 w-5 text-destructive" />
                      )}
                    </div>
                  </div>
                  {/* Tablet+ Total - Grid */}
                  <div className="hidden sm:grid grid-cols-[1fr_100px_100px_auto] md:grid-cols-[1fr_120px_120px_auto] gap-2 md:gap-3 items-center">
                    <span>Total</span>
                    <span className="text-sm text-left">
                      ${overviewCardsData?.monthlySales?.last?.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </span>
                    <span className="text-lg text-metric-value text-left">
                      ${overviewCardsData?.monthlySales?.current?.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </span>
                    {overviewCardsData?.monthlySales?.change >= 0 ? (
                      <ArrowUpRight className="h-5 w-5 text-success mx-auto" />
                    ) : (
                      <ArrowDownRight className="h-5 w-5 text-destructive mx-auto" />
                    )}
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </MetricCard>

      {/* Commissions Metric Card */}
      <MetricCard
        title="Commissions Paid"
        value={`$${overviewCardsData?.totalCommissionsPaid?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || 0.00}`}
        className="border-l-4 border-l-destructive"
      >
        <div className="text-sm text-metric-label">
          This month
        </div>
      </MetricCard>
    </div>
  );
}