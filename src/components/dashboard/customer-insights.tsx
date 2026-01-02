import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricCard, PeriodMetric } from "@/components/ui/metric-card";
import { Badge } from "@/components/ui/badge";
import { BarChart3, Globe, RefreshCcw, DollarSign, TrendingDown, Clock } from "lucide-react";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { readStateDistribution } from "@/api/affiliate";
import { readCustomerAnalytics } from "@/api/customer";

export function CustomerInsights() {
  // Fetch all customers
  const { data: customers = [] } = useQuery({
    queryKey: ['all-customers'],
    queryFn: async () => {
      const { data, error } = await supabase.from('customers').select('*');
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch all orders
  const { data: orders = [] } = useQuery({
    queryKey: ['all-orders-insights'],
    queryFn: async () => {
      const { data, error } = await supabase.from('orders').select('*');
      if (error) throw error;
      return data || [];
    },
  });

  // Calculate average customer revenue
  const avgCustomerRevenue = useMemo(() => {
    if (customers.length === 0) return 0;
    const totalRevenue = orders.reduce((sum, order) => sum + (Number(order.amount) || 0), 0);
    return totalRevenue / customers.length;
  }, [customers, orders]);

  // Calculate repeat purchase rate
  const repeatPurchaseRate = useMemo(() => {
    const customerPurchases = new Map();
    orders.forEach(order => {
      const count = customerPurchases.get(order.customer_id) || 0;
      customerPurchases.set(order.customer_id, count + 1);
    });
    
    const repeatCustomers = Array.from(customerPurchases.values()).filter(count => count > 1).length;
    return customers.length > 0 ? (repeatCustomers / customers.length) * 100 : 0;
  }, [customers, orders]);

  // Calculate average time between purchases
  const avgTimeBetweenPurchases = useMemo(() => {
    const customerOrders = new Map();
    orders.forEach(order => {
      if (!customerOrders.has(order.customer_id)) {
        customerOrders.set(order.customer_id, []);
      }
      customerOrders.get(order.customer_id).push(new Date(order.order_date));
    });

    let totalDays = 0;
    let count = 0;

    customerOrders.forEach(dates => {
      if (dates.length > 1) {
        dates.sort((a: Date, b: Date) => a.getTime() - b.getTime());
        for (let i = 1; i < dates.length; i++) {
          const diff = (dates[i].getTime() - dates[i - 1].getTime()) / (1000 * 60 * 60 * 24);
          totalDays += diff;
          count++;
        }

      }
    });

    return count > 0 ? Math.round(totalDays / count) : 0;
  }, [orders]);

  // Calculate churn rate (customers inactive for 90+ days)
  const churnRate = useMemo(() => {
    const now = new Date();
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    
    const recentCustomers = new Set();
    orders.forEach(order => {
      if (new Date(order.order_date) >= ninetyDaysAgo) {
        recentCustomers.add(order.customer_id);
      }
    });
    
    const churned = customers.length - recentCustomers.size;
    return customers.length > 0 ? (churned / customers.length) * 100 : 0;
  }, [customers, orders]);

  const { data: stateDistribution, isLoading: stateDistributionLoading } = useQuery({
    queryKey: ["state-distribution"],
    queryFn: async () => {

      const response = await readStateDistribution();

      console.log("readStateDistribution response is ", response);

      return response.data.data;
    }
  });

  const { data: customerAnalytics, isLoading: customerAnalyticsLoading } = useQuery({
    queryKey: ["customer-analytics"],
    queryFn: async () => {

      const response = await readCustomerAnalytics();

      console.log("readCustomerAnalytics response is ", response);

      return response.data.data;
    }
  });

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex items-center gap-2">
        <BarChart3 className="h-5 w-5 md:h-6 md:w-6 text-primary" />
        <h2 className="text-xl md:text-2xl font-bold text-foreground">Customer Insights</h2>
      </div>

      {/* Key Customer Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard 
          title="Average Customer Revenue" 
          value={`$${customerAnalytics?.averageCustomerRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} 
          className="border-l-4 border-l-primary"
        >
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="h-4 w-4 text-primary" />
            <span className="text-sm text-muted-foreground">Per customer</span>
          </div>
        </MetricCard>

        <MetricCard 
          title="Repeat Purchase Rate" 
          value={`${customerAnalytics?.repeatPurchases}%`} 
          className="border-l-4 border-l-success"
        >
          <div className="flex items-center gap-2 mb-2">
            <RefreshCcw className="h-4 w-4 text-success" />
            <span className="text-sm text-muted-foreground">Multiple purchases</span>
          </div>
        </MetricCard>

        <MetricCard 
          title="Time between purchases" 
          value={`${customerAnalytics?.averageTimeBetweenPurchases} days`} 
          className="border-l-4 border-l-warning"
        >
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-4 w-4 text-warning" />
            <span className="text-sm text-muted-foreground">Average</span>
          </div>
        </MetricCard>

        <MetricCard 
          title="Churn Rate" 
          value={`${customerAnalytics?.churnRate.toFixed(1)}%`} 
          className="border-l-4 border-l-destructive"
        >
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown className="h-4 w-4 text-destructive" />
            <span className="text-sm text-muted-foreground">0+ days inactive</span>
          </div>
        </MetricCard>
      </div>

      {/* Geographic Distribution */}
      <Card>
        <CardHeader className="p-4 md:p-6">
          <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
            <Globe className="h-4 w-4 md:h-5 md:w-5" />
            Distribution by State
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 md:p-6">
          <div className="space-y-3 md:space-y-4">
            {!stateDistributionLoading && stateDistribution.map((region: any) => (
              <div key={region.region} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-0">
                <div className="flex-1">
                  {/* left hand side above progress bar */}
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs md:text-sm font-medium">{region.region}</span>
                    <span className="text-xs md:text-sm text-muted-foreground">
                      {region.customers} customers
                    </span>
                  </div>

                  {/* progress bar */}
                  <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary transition-all duration-300"
                      style={{ width: region.percentage }}
                    />
                  </div>
                </div>
                {/* Below is percentage */}
                <Badge variant="outline" className="ml-0 sm:ml-4 self-start sm:self-auto text-xs">
                  {region.percentage || "0.00%"}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
