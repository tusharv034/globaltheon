// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { MetricCard } from "@/components/ui/metric-card";
// import { DollarSign, TrendingUp, TrendingDown } from "lucide-react";
// import { useQuery } from "@tanstack/react-query";
// import { supabase } from "@/integrations/supabase/client";
// import { useMemo } from "react";
// import { startOfMonth, endOfMonth, startOfYear, endOfYear, subMonths, subYears } from "date-fns";
// import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
// import { formatCurrency } from "@/lib/utils";

// export function AffiliateRevenueMetrics() {
//   const { data: currentAffiliate } = useQuery({
//     queryKey: ["current-affiliate"],
//     queryFn: async () => {
//       const { data: { user } } = await supabase.auth.getUser();
//       if (!user) return null;
//       const { data } = await supabase
//         .from("affiliates")
//         .select("*")
//         .eq("auth_user_id", user.id)
//         .single();
//       return data;
//     },
//   });

//   // Fetch all commissions
//   const { data: allCommissions = [] } = useQuery({
//     queryKey: ["all-affiliate-commissions", currentAffiliate?.id],
//     queryFn: async () => {
//       if (!currentAffiliate) return [];
//       const { data } = await supabase
//         .from("order_commissions")
//         .select("*, orders!inner(order_date, subscription)")
//         .eq("affiliate_id", currentAffiliate.id);
//       return data || [];
//     },
//     enabled: !!currentAffiliate,
//   });

//   // Calculate MRR and ARR
//   const revenueMetrics = useMemo(() => {
//     const now = new Date();
//     const currentMonthStart = startOfMonth(now);
//     const currentMonthEnd = endOfMonth(now);
//     const lastMonthStart = startOfMonth(subMonths(now, 1));
//     const lastMonthEnd = endOfMonth(subMonths(now, 1));
//     const currentYearStart = startOfYear(now);
//     const currentYearEnd = endOfYear(now);
//     const lastYearStart = startOfYear(subYears(now, 1));
//     const lastYearEnd = endOfYear(subYears(now, 1));

//     // Current month recurring commissions
//     const currentMonthRecurring = allCommissions
//       .filter(c => {
//         const date = new Date(c.orders?.order_date);
//         return c.orders?.subscription && date >= currentMonthStart && date <= currentMonthEnd;
//       })
//       .reduce((sum, c) => sum + (Number(c.commission_amount) || 0), 0);

//     // Last month recurring commissions
//     const lastMonthRecurring = allCommissions
//       .filter(c => {
//         const date = new Date(c.orders?.order_date);
//         return c.orders?.subscription && date >= lastMonthStart && date <= lastMonthEnd;
//       })
//       .reduce((sum, c) => sum + (Number(c.commission_amount) || 0), 0);

//     const mrrChange = lastMonthRecurring > 0 
//       ? ((currentMonthRecurring - lastMonthRecurring) / lastMonthRecurring) * 100 
//       : 0;

//     // Current year recurring commissions
//     const currentYearRecurring = allCommissions
//       .filter(c => {
//         const date = new Date(c.orders?.order_date);
//         return c.orders?.subscription && date >= currentYearStart && date <= currentYearEnd;
//       })
//       .reduce((sum, c) => sum + (Number(c.commission_amount) || 0), 0);

//     // Last year recurring commissions
//     const lastYearRecurring = allCommissions
//       .filter(c => {
//         const date = new Date(c.orders?.order_date);
//         return c.orders?.subscription && date >= lastYearStart && date <= lastYearEnd;
//       })
//       .reduce((sum, c) => sum + (Number(c.commission_amount) || 0), 0);

//     const arrChange = lastYearRecurring > 0 
//       ? ((currentYearRecurring - lastYearRecurring) / lastYearRecurring) * 100 
//       : 0;

//     return {
//       mrr: currentMonthRecurring,
//       mrrChange,
//       arr: currentYearRecurring,
//       arrChange,
//     };
//   }, [allCommissions]);

//   // Calculate commission trends by month (last 12 months)
//   const commissionTrends = useMemo(() => {
//     const now = new Date();
//     const last12Months = [];

//     for (let i = 11; i >= 0; i--) {
//       const monthDate = subMonths(now, i);
//       const monthStart = startOfMonth(monthDate);
//       const monthEnd = endOfMonth(monthDate);

//       const monthCommissions = allCommissions
//         .filter(c => {
//           const date = new Date(c.created_at);
//           return date >= monthStart && date <= monthEnd;
//         })
//         .reduce((sum, c) => sum + (Number(c.commission_amount) || 0), 0);

//       const level1Commissions = allCommissions
//         .filter(c => {
//           const date = new Date(c.created_at);
//           return c.level === 1 && date >= monthStart && date <= monthEnd;
//         })
//         .reduce((sum, c) => sum + (Number(c.commission_amount) || 0), 0);

//       const level2Commissions = allCommissions
//         .filter(c => {
//           const date = new Date(c.created_at);
//           return c.level === 2 && date >= monthStart && date <= monthEnd;
//         })
//         .reduce((sum, c) => sum + (Number(c.commission_amount) || 0), 0);

//       last12Months.push({
//         month: monthDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
//         total: monthCommissions,
//         level1: level1Commissions,
//         level2: level2Commissions,
//       });
//     }

//     return last12Months;
//   }, [allCommissions]);

//   return (
//     <div className="space-y-6">
//       <h2 className="text-2xl font-bold">Revenue Metrics</h2>

//       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//         <MetricCard
//           title={
//             <div className="flex items-center gap-2">
//               <DollarSign className="h-4 w-4" />
//               <span>Monthly Recurring Revenue (MRR)</span>
//             </div>
//           }
//           value={formatCurrency(revenueMetrics.mrr)}
//         >
//           <div className="flex items-center gap-2 text-sm">
//             {revenueMetrics.mrrChange >= 0 ? (
//               <TrendingUp className="h-4 w-4 text-green-500" />
//             ) : (
//               <TrendingDown className="h-4 w-4 text-red-500" />
//             )}
//             <span className={revenueMetrics.mrrChange >= 0 ? "text-green-500" : "text-red-500"}>
//               {Math.abs(revenueMetrics.mrrChange).toFixed(1)}%
//             </span>
//             <span className="text-muted-foreground">From subscription orders</span>
//           </div>
//         </MetricCard>

//         <MetricCard
//           title={
//             <div className="flex items-center gap-2">
//               <TrendingUp className="h-4 w-4" />
//               <span>Annual Recurring Revenue (ARR)</span>
//             </div>
//           }
//           value={formatCurrency(revenueMetrics.arr)}
//         >
//           <div className="flex items-center gap-2 text-sm">
//             {revenueMetrics.arrChange >= 0 ? (
//               <TrendingUp className="h-4 w-4 text-green-500" />
//             ) : (
//               <TrendingDown className="h-4 w-4 text-red-500" />
//             )}
//             <span className={revenueMetrics.arrChange >= 0 ? "text-green-500" : "text-red-500"}>
//               {Math.abs(revenueMetrics.arrChange).toFixed(1)}%
//             </span>
//             <span className="text-muted-foreground">Projected yearly from subscriptions</span>
//           </div>
//         </MetricCard>
//       </div>

//       <Card>
//         <CardHeader>
//           <CardTitle>Commission Trends (Last 12 Months)</CardTitle>
//         </CardHeader>
//         <CardContent>
//           <ResponsiveContainer width="100%" height={300}>
//             <LineChart data={commissionTrends}>
//               <CartesianGrid strokeDasharray="3 3" />
//               <XAxis dataKey="month" />
//               <YAxis />
//               <Tooltip 
//                 formatter={(value: number) => formatCurrency(value)}
//               />
//               <Legend />
//               <Line 
//                 type="monotone" 
//                 dataKey="total" 
//                 stroke="hsl(var(--primary))" 
//                 strokeWidth={2}
//                 name="Total Commissions"
//               />
//               <Line 
//                 type="monotone" 
//                 dataKey="level1" 
//                 stroke="hsl(var(--chart-1))" 
//                 strokeWidth={2}
//                 name="Level 1"
//               />
//               <Line 
//                 type="monotone" 
//                 dataKey="level2" 
//                 stroke="hsl(var(--chart-2))" 
//                 strokeWidth={2}
//                 name="Level 2"
//               />
//             </LineChart>
//           </ResponsiveContainer>
//         </CardContent>
//       </Card>

//       <Card>
//         <CardHeader>
//           <CardTitle>Commission Breakdown by Level</CardTitle>
//         </CardHeader>
//         <CardContent>
//           <ResponsiveContainer width="100%" height={300}>
//             <BarChart data={commissionTrends}>
//               <CartesianGrid strokeDasharray="3 3" />
//               <XAxis dataKey="month" />
//               <YAxis />
//               <Tooltip 
//                 formatter={(value: number) => formatCurrency(value)}
//               />
//               <Legend />
//               <Bar dataKey="level1" fill="hsl(var(--chart-1))" name="Level 1" />
//               <Bar dataKey="level2" fill="hsl(var(--chart-2))" name="Level 2" />
//             </BarChart>
//           </ResponsiveContainer>
//         </CardContent>
//       </Card>
//     </div>
//   );
// }


import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricCard } from "@/components/ui/metric-card";
import { DollarSign, TrendingUp, TrendingDown } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getRevenueMetrics } from "@/api/dashboard";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { formatCurrency } from "@/lib/utils";

export function AffiliateRevenueMetrics() {
  const { data: revenueData, isLoading } = useQuery({
    queryKey: ["revenue-metrics"],
    queryFn: async () => {
      const response = await getRevenueMetrics();
      return response.data.data;
    },
  });

  if (isLoading) {
    return <div>Loading revenue metrics...</div>;
  }

  if (!revenueData) {
    return <div>No revenue data available</div>;
  }

  const { mrr, mrrChange, arr, arrChange, commissionTrends } = revenueData;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Revenue Metrics</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <MetricCard
          title={
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              <span>Monthly Recurring Revenue (MRR)</span>
            </div>
          }
          value={formatCurrency(mrr)}
        >
          <div className="flex items-center gap-2 text-sm">
            {mrrChange >= 0 ? (
              <TrendingUp className="h-4 w-4 text-green-500" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-500" />
            )}
            <span className={mrrChange >= 0 ? "text-green-500" : "text-red-500"}>
              {Math.abs(mrrChange).toFixed(1)}%
            </span>
            <span className="text-muted-foreground">From subscription orders</span>
          </div>
        </MetricCard>

        <MetricCard
          title={
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              <span>Annual Recurring Revenue (ARR)</span>
            </div>
          }
          value={formatCurrency(arr)}
        >
          <div className="flex items-center gap-2 text-sm">
            {arrChange >= 0 ? (
              <TrendingUp className="h-4 w-4 text-green-500" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-500" />
            )}
            <span className={arrChange >= 0 ? "text-green-500" : "text-red-500"}>
              {Math.abs(arrChange).toFixed(1)}%
            </span>
            <span className="text-muted-foreground">Projected yearly from subscriptions</span>
          </div>
        </MetricCard>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Commission Trends (Last 12 Months)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={commissionTrends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Legend />
              <Line type="monotone" dataKey="total" stroke="hsl(var(--primary))" strokeWidth={2} name="Total Commissions" />
              <Line type="monotone" dataKey="level1" stroke="hsl(var(--chart-1))" strokeWidth={2} name="Level 1" />
              <Line type="monotone" dataKey="level2" stroke="hsl(var(--chart-2))" strokeWidth={2} name="Level 2" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Commission Breakdown by Level</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={commissionTrends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Legend />
              <Bar dataKey="level1" fill="hsl(var(--chart-1))" name="Level 1" />
              <Bar dataKey="level2" fill="hsl(var(--chart-2))" name="Level 2" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}