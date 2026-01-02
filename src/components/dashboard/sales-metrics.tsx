import { MetricCard, PeriodMetric } from "@/components/ui/metric-card";
import { DollarSign, HelpCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, subWeeks, subMonths, subYears } from "date-fns";
import { readSalesMetrics } from "@/api/affiliate";

export function SalesMetrics() {

  // state to toggle LifeTime Sales Modal
  const [isLifetimeSalesModalOpen, setIsLifetimeSalesModalOpen] = useState(false);

  // state to toggle LifeTime Commission Modal
  const [isLifetimeCommissionsModalOpen, setIsLifetimeCommissionsModalOpen] = useState(false);

  // Fetch all orders
  const { data: allOrders = [] } = useQuery({
    queryKey: ['all-orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*, order_items(*)');
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch all commissions
  const { data: allCommissions = [] } = useQuery({
    queryKey: ['all-commissions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('order_commissions')
        .select('*');
      if (error) throw error;
      return data || [];
    },
  });

  const { data: salesMetrics, isLoading: salesMetricsLoading } = useQuery({
  queryKey: ["sales-metrics"],
  queryFn: async () => {

    const payload = {}

    const response = await readSalesMetrics(payload);

    // console.log("salesMetrics response is ", response);

    return response.data.data;
  }
 })

  // Calculate sales by period
  const salesByPeriod = useMemo(() => {
    const now = new Date();
    const periods = {
      currentWeek: { start: startOfWeek(now), end: endOfWeek(now) },
      lastWeek: { start: startOfWeek(subWeeks(now, 1)), end: endOfWeek(subWeeks(now, 1)) },
      thisMonth: { start: startOfMonth(now), end: endOfMonth(now) },
      lastMonth: { start: startOfMonth(subMonths(now, 1)), end: endOfMonth(subMonths(now, 1)) },
      thisYear: { start: startOfYear(now), end: endOfYear(now) },
      lastYear: { start: startOfYear(subYears(now, 1)), end: endOfYear(subYears(now, 1)) },
    };

    const result: any = {};
    
    Object.entries(periods).forEach(([key, { start, end }]) => {
      const periodOrders = allOrders.filter(order => {
        const orderDate = new Date(order.order_date);
        return orderDate >= start && orderDate <= end;
      });
      
      const total = periodOrders.reduce((sum, order) => sum + (Number(order.amount) || 0), 0);
      
      // Group by product
      const productMap = new Map();
      periodOrders.forEach(order => {
        order.order_items?.forEach((item: any) => {
          const current = productMap.get(item.description) || 0;
          productMap.set(item.description, current + (Number(item.total) || 0));
        });
      });
      
      const products = Array.from(productMap.entries())
        .map(([name, total]) => ({ name, total }))
        .sort((a, b) => b.total - a.total);
      
      result[key] = { total, products };
    });
    
    return result;
  }, [allOrders]);

  // Calculate commissions by period
  const commissionsByPeriod = useMemo(() => {
    const now = new Date();
    const periods = {
      currentWeek: { start: startOfWeek(now), end: endOfWeek(now) },
      lastWeek: { start: startOfWeek(subWeeks(now, 1)), end: endOfWeek(subWeeks(now, 1)) },
      thisMonth: { start: startOfMonth(now), end: endOfMonth(now) },
      lastMonth: { start: startOfMonth(subMonths(now, 1)), end: endOfMonth(subMonths(now, 1)) },
      thisYear: { start: startOfYear(now), end: endOfYear(now) },
      lastYear: { start: startOfYear(subYears(now, 1)), end: endOfYear(subYears(now, 1)) },
    };

    const result: any = {};
    
    Object.entries(periods).forEach(([key, { start, end }]) => {
      const periodCommissions = allCommissions.filter(comm => {
        const commDate = new Date(comm.created_at);
        return commDate >= start && commDate <= end;
      });
      
      const total = periodCommissions.reduce((sum, comm) => sum + (Number(comm.commission_amount) || 0), 0);
      result[key] = { total };
    });
    
    return result;
  }, [allCommissions]);

  // Calculate lifetime sales
  const lifetimeSales = useMemo(() => {
    return allOrders.reduce((sum, order) => sum + (Number(order.amount) || 0), 0);
  }, [allOrders]);

  // Calculate lifetime commissions
  const lifetimeCommissions = useMemo(() => {
    return allCommissions.reduce((sum, comm) => sum + (Number(comm.commission_amount) || 0), 0);
  }, [allCommissions]);

  // Calculate trends
  const salesTrend = useMemo(() => {
    const current = salesMetrics?.salesByPeriod.currentWeek?.total || 0;
    const last = salesMetrics?.salesByPeriod.lastWeek?.total || 0;
    return last > 0 ? ((current - last) / last * 100) : 0;
  }, [salesMetrics]);

  const monthlyTrend = useMemo(() => {
    const current = salesMetrics?.salesByPeriod.thisMonth?.total || 0;
    const last = salesMetrics?.salesByPeriod.lastMonth?.total || 0;
    return last > 0 ? ((current - last) / last * 100) : 0;
  }, [salesMetrics]);

  const yearlyTrend = useMemo(() => {
    const current = salesMetrics?.salesByPeriod.thisYear?.total || 0;
    const last = salesMetrics?.salesByPeriod.lastYear?.total || 0;
    return last > 0 ? ((current - last) / last * 100) : 0;
  }, [salesMetrics]);

  const commissionsTrend = useMemo(() => {
    const current = salesMetrics?.commissionsByPeriod.currentWeek?.total || 0;
    const last = salesMetrics?.commissionsByPeriod.lastWeek?.total || 0;
    return last > 0 ? ((current - last) / last * 100) : 0;
  }, [salesMetrics]);
  
  const commissionsMonthlyTrend = useMemo(() => {
    const current = salesMetrics?.commissionsByPeriod.thisMonth?.total || 0;
    const last = salesMetrics?.commissionsByPeriod.lastMonth?.total || 0;
    return last > 0 ? ((current - last) / last * 100) : 0;
  }, [salesMetrics]);

  const commissionsYearlyTrend = useMemo(() => {
    const current = salesMetrics?.commissionsByPeriod.thisYear?.total || 0;
    const last = salesMetrics?.commissionsByPeriod.lastYear?.total || 0;
    return last > 0 ? ((current - last) / last * 100) : 0;
  }, [salesMetrics]);
 

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mb-6 md:mb-8">

      {/* Lifetime sales */}
      <MetricCard 
        title="Lifetime Sales" 
        value={`$${salesMetrics?.lifetimeSales?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || 0}`} 
        className="border-l-4 border-l-primary"
      >
        <div className="space-y-1">

          {/* Weekly Comparison */}
          <div className="border-b border-border pb-2 mb-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-metric-value">Weekly Comparison</h4>
              <Dialog 
              // open={isLifetimeSalesModalOpen} 
              open={false} 
              onOpenChange={setIsLifetimeSalesModalOpen}>
                <DialogTrigger asChild>
                  <HelpCircle className="h-4 w-4 text-muted-foreground cursor-pointer hover:text-foreground transition-colors" />
                </DialogTrigger>
                <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="text-lg md:text-xl">Sales Breakdown by Period</DialogTitle>
                  </DialogHeader>
                  <Tabs defaultValue="current-week" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 mb-3 md:mb-4 h-auto gap-1">
                      <TabsTrigger value="current-week" className="text-xs md:text-sm py-2">Current Week</TabsTrigger>
                      <TabsTrigger value="last-week" className="text-xs md:text-sm py-2">Last Week</TabsTrigger>
                      <TabsTrigger value="this-month" className="text-xs md:text-sm py-2">This Month</TabsTrigger>
                    </TabsList>
                    <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 mb-3 md:mb-4 h-auto gap-1">
                      <TabsTrigger value="last-month" className="text-xs md:text-sm py-2">Last Month</TabsTrigger>
                      <TabsTrigger value="this-year" className="text-xs md:text-sm py-2">This Year</TabsTrigger>
                      <TabsTrigger value="last-year" className="text-xs md:text-sm py-2">Last Year</TabsTrigger>
                    </TabsList>

                    {['currentWeek', 'lastWeek', 'thisMonth', 'lastMonth', 'thisYear', 'lastYear'].map((period) => {
                      const periodData = salesByPeriod[period];
                      const tabValue = period.replace(/([A-Z])/g, '-$1').toLowerCase();
                      
                      return (
                        <TabsContent key={period} value={tabValue} className="space-y-2 md:space-y-3">
                          {periodData?.products?.map((product: any) => (
                            <div key={product.name} className="flex items-center justify-between p-3 border rounded-lg">
                              <span className="text-sm font-medium">{product.name}</span>
                              <span className="text-lg font-bold text-metric-value">
                                ${product.total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                            </div>
                          ))}
                          <div className="flex items-center justify-between p-3 border-t-2 font-bold">
                            <span>Total</span>
                            <span className="text-lg text-metric-value">
                              ${(periodData?.total || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </div>
                        </TabsContent>
                      );
                    })}
                  </Tabs>
                </DialogContent>
              </Dialog>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <PeriodMetric 
                label="Current Week" 
                value={`$${(salesMetrics?.salesByPeriod.currentWeek?.total || 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`} 
                trend={salesTrend} 
              />
              <PeriodMetric 
                label="Last Week" 
                value={`$${(salesMetrics?.salesByPeriod.lastWeek?.total || 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`} 
              />
            </div>
          </div>
          
          {/* Monthly Comparison */}
          <div className="border-b border-border pb-2 mb-4">
            <h4 className="text-sm font-medium text-metric-value mb-2">Monthly Comparison</h4>
            <div className="grid grid-cols-2 gap-4">
              <PeriodMetric 
                label="This Month" 
                value={`$${(salesMetrics?.salesByPeriod.thisMonth?.total || 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`} 
                trend={monthlyTrend} 
              />
              <PeriodMetric 
                label="Last Month" 
                value={`$${(salesMetrics?.salesByPeriod.lastMonth?.total || 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`} 
              />
            </div>
          </div>
          
          {/* Yearly Comparison */}
          <div className="border-b border-border pb-2 mb-4">
            <h4 className="text-sm font-medium text-metric-value mb-2">Yearly Comparison</h4>
            <div className="grid grid-cols-2 gap-4">
              <PeriodMetric 
                label="This Year" 
                value={`$${(salesMetrics?.salesByPeriod.thisYear?.total || 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`} 
                trend={yearlyTrend} 
              />
              <PeriodMetric 
                label="Last Year" 
                value={`$${(salesMetrics?.salesByPeriod.lastYear?.total || 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`} 
              />
            </div>
          </div>
        </div>
      </MetricCard>

      {/* Lifetime commissions */}
      <MetricCard 
        title="Lifetime Commissions" 
        value={`$${salesMetrics?.lifetimeCommissions.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || 0}`} 
        className="border-l-4 border-l-success"
      >
        <div className="space-y-1">
          <div className="border-b border-border pb-2 mb-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-metric-value">Weekly Comparison</h4>
              <Dialog open={isLifetimeCommissionsModalOpen} onOpenChange={setIsLifetimeCommissionsModalOpen}>
                <DialogTrigger asChild>
                  <HelpCircle className="h-4 w-4 text-muted-foreground cursor-pointer hover:text-foreground transition-colors" />
                </DialogTrigger>
                <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="text-lg md:text-xl">Commissions Breakdown by Period</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <span className="text-sm font-medium">Current Week</span>
                      <span className="text-lg font-bold text-metric-value">
                        ${(salesMetrics?.commissionsByPeriod.currentWeek?.total || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <span className="text-sm font-medium">Last Week</span>
                      <span className="text-lg font-bold text-metric-value">
                        ${(salesMetrics?.commissionsByPeriod.lastWeek?.total || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <span className="text-sm font-medium">This Month</span>
                      <span className="text-lg font-bold text-metric-value">
                        ${(salesMetrics?.commissionsByPeriod.thisMonth?.total || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <span className="text-sm font-medium">Last Month</span>
                      <span className="text-lg font-bold text-metric-value">
                        ${(salesMetrics?.commissionsByPeriod.lastMonth?.total || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <span className="text-sm font-medium">This Year</span>
                      <span className="text-lg font-bold text-metric-value">
                        ${(salesMetrics?.commissionsByPeriod.thisYear?.total || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <span className="text-sm font-medium">Last Year</span>
                      <span className="text-lg font-bold text-metric-value">
                        ${(salesMetrics?.commissionsByPeriod.lastYear?.total || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <PeriodMetric 
                label="Current Week" 
                value={`$${(salesMetrics?.commissionsByPeriod.currentWeek?.total || 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`} 
                trend={commissionsTrend} 
              />
              <PeriodMetric 
                label="Last Week" 
                value={`$${(salesMetrics?.commissionsByPeriod.lastWeek?.total || 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`} 
              />
            </div>
          </div>
          
          <div className="border-b border-border pb-2 mb-4">
            <h4 className="text-sm font-medium text-metric-value mb-2">Monthly Comparison</h4>
            <div className="grid grid-cols-2 gap-4">
              <PeriodMetric 
                label="This Month" 
                value={`$${(salesMetrics?.commissionsByPeriod.thisMonth?.total || 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`} 
                trend={commissionsMonthlyTrend}
              />
              <PeriodMetric 
                label="Last Month" 
                value={`$${(salesMetrics?.commissionsByPeriod.lastMonth?.total || 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`} 
              />
            </div>
          </div>
          
          <div className="border-b border-border pb-2 mb-4">
            <h4 className="text-sm font-medium text-metric-value mb-2">Yearly Comparison</h4>
            <div className="grid grid-cols-2 gap-4">
              <PeriodMetric 
                label="This Year" 
                value={`$${(salesMetrics?.commissionsByPeriod.thisYear?.total || 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`} 
                trend={commissionsYearlyTrend}
              />
              <PeriodMetric 
                label="Last Year" 
                value={`$${(salesMetrics?.commissionsByPeriod.lastYear?.total || 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`} 
              />
            </div>
          </div>
        </div>
      </MetricCard>
    </div>
  );
}
