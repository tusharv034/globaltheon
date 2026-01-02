// import { MetricCard } from "@/components/ui/metric-card";
// import { DollarSign, Users, UserCheck, ShoppingCart, TrendingUp, ArrowUpRight, ArrowDownRight } from "lucide-react";
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// import { useState, useMemo } from "react";
// import { useQuery } from "@tanstack/react-query";
// import { supabase } from "@/integrations/supabase/client";
// import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, subDays, subWeeks, subMonths, subYears } from "date-fns";
// import { formatCurrency } from "@/lib/utils";
// import {getPerformanceOverview} from "@/api/dashboard"

// export function AffiliateKpiCards() {
//   const [timePeriod, setTimePeriod] = useState("this-month");


//  const {data: perData, isLoading:perLoading}=useQuery({
//   queryKey:["performace-overview",timePeriod],
//   queryFn:async()=>{
//     const response=await getPerformanceOverview(timePeriod);
//     return response;
//   }
//  })

//  console.log("performance data : ",perData);

//   // Get current affiliate
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

//   // Calculate date ranges
//   const { currentStart, currentEnd, previousStart, previousEnd } = useMemo(() => {
//     const now = new Date();
//     let currStart: Date, currEnd: Date, prevStart: Date, prevEnd: Date;

//     switch (timePeriod) {
//       case "today":
//         currStart = startOfDay(now);
//         currEnd = endOfDay(now);
//         prevStart = startOfDay(subDays(now, 1));
//         prevEnd = endOfDay(subDays(now, 1));
//         break;
//       case "yesterday":
//         currStart = startOfDay(subDays(now, 1));
//         currEnd = endOfDay(subDays(now, 1));
//         prevStart = startOfDay(subDays(now, 2));
//         prevEnd = endOfDay(subDays(now, 2));
//         break;
//       case "this-week":
//         currStart = startOfWeek(now);
//         currEnd = endOfWeek(now);
//         prevStart = startOfWeek(subWeeks(now, 1));
//         prevEnd = endOfWeek(subWeeks(now, 1));
//         break;
//       case "last-week":
//         currStart = startOfWeek(subWeeks(now, 1));
//         currEnd = endOfWeek(subWeeks(now, 1));
//         prevStart = startOfWeek(subWeeks(now, 2));
//         prevEnd = endOfWeek(subWeeks(now, 2));
//         break;
//       case "this-month":
//         currStart = startOfMonth(now);
//         currEnd = endOfMonth(now);
//         prevStart = startOfMonth(subMonths(now, 1));
//         prevEnd = endOfMonth(subMonths(now, 1));
//         break;
//       case "last-month":
//         currStart = startOfMonth(subMonths(now, 1));
//         currEnd = endOfMonth(subMonths(now, 1));
//         prevStart = startOfMonth(subMonths(now, 2));
//         prevEnd = endOfMonth(subMonths(now, 2));
//         break;
//       case "this-year":
//         currStart = startOfYear(now);
//         currEnd = endOfYear(now);
//         prevStart = startOfYear(subYears(now, 1));
//         prevEnd = endOfYear(subYears(now, 1));
//         break;
//       case "last-year":
//         currStart = startOfYear(subYears(now, 1));
//         currEnd = endOfYear(subYears(now, 1));
//         prevStart = startOfYear(subYears(now, 2));
//         prevEnd = endOfYear(subYears(now, 2));
//         break;
//       default:
//         currStart = startOfMonth(now);
//         currEnd = endOfMonth(now);
//         prevStart = startOfMonth(subMonths(now, 1));
//         prevEnd = endOfMonth(subMonths(now, 1));
//     }

//     return {
//       currentStart: currStart,
//       currentEnd: currEnd,
//       previousStart: prevStart,
//       previousEnd: prevEnd,
//     };
//   }, [timePeriod]);

//   // Fetch Level 1 affiliates
//   const { data: level1Affiliates = [] } = useQuery({
//     queryKey: ["level1-affiliates", currentAffiliate?.id, currentStart, currentEnd],
//     queryFn: async () => {
//       if (!currentAffiliate) return [];
//       const { data } = await supabase
//         .from("affiliates")
//         .select("*")
//         .eq("enrolled_by", currentAffiliate.id)
//         .gte("created_at", currentStart.toISOString())
//         .lte("created_at", currentEnd.toISOString());
//       return data || [];
//     },
//     enabled: !!currentAffiliate,
//   });

//   const { data: prevLevel1Affiliates = [] } = useQuery({
//     queryKey: ["prev-level1-affiliates", currentAffiliate?.id, previousStart, previousEnd],
//     queryFn: async () => {
//       if (!currentAffiliate) return [];
//       const { data } = await supabase
//         .from("affiliates")
//         .select("*")
//         .eq("enrolled_by", currentAffiliate.id)
//         .gte("created_at", previousStart.toISOString())
//         .lte("created_at", previousEnd.toISOString());
//       return data || [];
//     },
//     enabled: !!currentAffiliate,
//   });

//   // Fetch all Level 1 affiliates (for Level 2 calculation)
//   const { data: allLevel1Affiliates = [] } = useQuery({
//     queryKey: ["all-level1-affiliates", currentAffiliate?.id],
//     queryFn: async () => {
//       if (!currentAffiliate) return [];
//       const { data } = await supabase
//         .from("affiliates")
//         .select("id")
//         .eq("enrolled_by", currentAffiliate.id);
//       return data || [];
//     },
//     enabled: !!currentAffiliate,
//   });

//   // Fetch Level 2 affiliates
//   const { data: level2Affiliates = [] } = useQuery({
//     queryKey: ["level2-affiliates", allLevel1Affiliates, currentStart, currentEnd],
//     queryFn: async () => {
//       if (!allLevel1Affiliates.length) return [];
//       const level1Ids = allLevel1Affiliates.map(a => a.id);
//       const { data } = await supabase
//         .from("affiliates")
//         .select("*")
//         .in("enrolled_by", level1Ids)
//         .gte("created_at", currentStart.toISOString())
//         .lte("created_at", currentEnd.toISOString());
//       return data || [];
//     },
//     enabled: allLevel1Affiliates.length > 0,
//   });

//   const { data: prevLevel2Affiliates = [] } = useQuery({
//     queryKey: ["prev-level2-affiliates", allLevel1Affiliates, previousStart, previousEnd],
//     queryFn: async () => {
//       if (!allLevel1Affiliates.length) return [];
//       const level1Ids = allLevel1Affiliates.map(a => a.id);
//       const { data } = await supabase
//         .from("affiliates")
//         .select("*")
//         .in("enrolled_by", level1Ids)
//         .gte("created_at", previousStart.toISOString())
//         .lte("created_at", previousEnd.toISOString());
//       return data || [];
//     },
//     enabled: allLevel1Affiliates.length > 0,
//   });

//   // Fetch Level 1 customers
//   const { data: level1Customers = [] } = useQuery({
//     queryKey: ["level1-customers", currentAffiliate?.id, currentStart, currentEnd],
//     queryFn: async () => {
//       if (!currentAffiliate) return [];
//       const { data } = await supabase
//         .from("customers")
//         .select("*")
//         .eq("enrolled_by", currentAffiliate.id)
//         .gte("created_at", currentStart.toISOString())
//         .lte("created_at", currentEnd.toISOString());
//       return data || [];
//     },
//     enabled: !!currentAffiliate,
//   });

//   const { data: prevLevel1Customers = [] } = useQuery({
//     queryKey: ["prev-level1-customers", currentAffiliate?.id, previousStart, previousEnd],
//     queryFn: async () => {
//       if (!currentAffiliate) return [];
//       const { data } = await supabase
//         .from("customers")
//         .select("*")
//         .eq("enrolled_by", currentAffiliate.id)
//         .gte("created_at", previousStart.toISOString())
//         .lte("created_at", previousEnd.toISOString());
//       return data || [];
//     },
//     enabled: !!currentAffiliate,
//   });

//   // Fetch Level 2 customers
//   const { data: level2Customers = [] } = useQuery({
//     queryKey: ["level2-customers", allLevel1Affiliates, currentStart, currentEnd],
//     queryFn: async () => {
//       if (!allLevel1Affiliates.length) return [];
//       const level1Ids = allLevel1Affiliates.map(a => a.id);
//       const { data } = await supabase
//         .from("customers")
//         .select("*")
//         .in("enrolled_by", level1Ids)
//         .gte("created_at", currentStart.toISOString())
//         .lte("created_at", currentEnd.toISOString());
//       return data || [];
//     },
//     enabled: allLevel1Affiliates.length > 0,
//   });

//   const { data: prevLevel2Customers = [] } = useQuery({
//     queryKey: ["prev-level2-customers", allLevel1Affiliates, previousStart, previousEnd],
//     queryFn: async () => {
//       if (!allLevel1Affiliates.length) return [];
//       const level1Ids = allLevel1Affiliates.map(a => a.id);
//       const { data } = await supabase
//         .from("customers")
//         .select("*")
//         .in("enrolled_by", level1Ids)
//         .gte("created_at", previousStart.toISOString())
//         .lte("created_at", previousEnd.toISOString());
//       return data || [];
//     },
//     enabled: allLevel1Affiliates.length > 0,
//   });

//   // Fetch commissions
//   const { data: commissions = [] } = useQuery({
//     queryKey: ["affiliate-commissions", currentAffiliate?.id, currentStart, currentEnd],
//     queryFn: async () => {
//       if (!currentAffiliate) return [];
//       const { data } = await supabase
//         .from("order_commissions")
//         .select("*")
//         .eq("affiliate_id", currentAffiliate.id)
//         .gte("created_at", currentStart.toISOString())
//         .lte("created_at", currentEnd.toISOString());
//       return data || [];
//     },
//     enabled: !!currentAffiliate,
//   });

//   const { data: prevCommissions = [] } = useQuery({
//     queryKey: ["prev-affiliate-commissions", currentAffiliate?.id, previousStart, previousEnd],
//     queryFn: async () => {
//       if (!currentAffiliate) return [];
//       const { data } = await supabase
//         .from("order_commissions")
//         .select("*")
//         .eq("affiliate_id", currentAffiliate.id)
//         .gte("created_at", previousStart.toISOString())
//         .lte("created_at", previousEnd.toISOString());
//       return data || [];
//     },
//     enabled: !!currentAffiliate,
//   });

//   // Fetch sales (orders from all customers)
//   const { data: sales = [] } = useQuery({
//     queryKey: ["affiliate-sales", currentAffiliate?.id, allLevel1Affiliates, currentStart, currentEnd],
//     queryFn: async () => {
//       if (!currentAffiliate) return [];
      
//       // Get all level 1 customer IDs
//       const { data: l1Customers } = await supabase
//         .from("customers")
//         .select("id")
//         .eq("enrolled_by", currentAffiliate.id);
      
//       // Get all level 2 customer IDs
//       let l2CustomerIds: string[] = [];
//       if (allLevel1Affiliates.length > 0) {
//         const level1Ids = allLevel1Affiliates.map(a => a.id);
//         const { data: l2Customers } = await supabase
//           .from("customers")
//           .select("id")
//           .in("enrolled_by", level1Ids);
//         l2CustomerIds = l2Customers?.map(c => c.id) || [];
//       }
      
//       const allCustomerIds = [...(l1Customers?.map(c => c.id) || []), ...l2CustomerIds];
      
//       if (allCustomerIds.length === 0) return [];
      
//       const { data } = await supabase
//         .from("orders")
//         .select("*")
//         .in("customer_id", allCustomerIds)
//         .gte("order_date", currentStart.toISOString())
//         .lte("order_date", currentEnd.toISOString());
//       return data || [];
//     },
//     enabled: !!currentAffiliate,
//   });

//   const { data: prevSales = [] } = useQuery({
//     queryKey: ["prev-affiliate-sales", currentAffiliate?.id, allLevel1Affiliates, previousStart, previousEnd],
//     queryFn: async () => {
//       if (!currentAffiliate) return [];
      
//       const { data: l1Customers } = await supabase
//         .from("customers")
//         .select("id")
//         .eq("enrolled_by", currentAffiliate.id);
      
//       let l2CustomerIds: string[] = [];
//       if (allLevel1Affiliates.length > 0) {
//         const level1Ids = allLevel1Affiliates.map(a => a.id);
//         const { data: l2Customers } = await supabase
//           .from("customers")
//           .select("id")
//           .in("enrolled_by", level1Ids);
//         l2CustomerIds = l2Customers?.map(c => c.id) || [];
//       }
      
//       const allCustomerIds = [...(l1Customers?.map(c => c.id) || []), ...l2CustomerIds];
      
//       if (allCustomerIds.length === 0) return [];
      
//       const { data } = await supabase
//         .from("orders")
//         .select("*")
//         .in("customer_id", allCustomerIds)
//         .gte("order_date", previousStart.toISOString())
//         .lte("order_date", previousEnd.toISOString());
//       return data || [];
//     },
//     enabled: !!currentAffiliate,
//   });

//   // Calculate metrics
//   const metrics = useMemo(() => {
//     const currentTotalCommissions = commissions.reduce((sum, c) => sum + (Number(c.commission_amount) || 0), 0);
//     const prevTotalCommissions = prevCommissions.reduce((sum, c) => sum + (Number(c.commission_amount) || 0), 0);
//     const commissionsChange = prevTotalCommissions > 0 
//       ? ((currentTotalCommissions - prevTotalCommissions) / prevTotalCommissions) * 100 
//       : 0;

//     const currentTotalSales = sales.reduce((sum, s) => sum + (Number(s.amount) || 0), 0);
//     const prevTotalSales = prevSales.reduce((sum, s) => sum + (Number(s.amount) || 0), 0);
//     const salesChange = prevTotalSales > 0 
//       ? ((currentTotalSales - prevTotalSales) / prevTotalSales) * 100 
//       : 0;

//     const totalAffiliates = level1Affiliates.length + level2Affiliates.length;
//     const prevTotalAffiliates = prevLevel1Affiliates.length + prevLevel2Affiliates.length;
//     const affiliatesChange = prevTotalAffiliates > 0 
//       ? ((totalAffiliates - prevTotalAffiliates) / prevTotalAffiliates) * 100 
//       : 0;

//     const totalCustomers = level1Customers.length + level2Customers.length;
//     const prevTotalCustomers = prevLevel1Customers.length + prevLevel2Customers.length;
//     const customersChange = prevTotalCustomers > 0 
//       ? ((totalCustomers - prevTotalCustomers) / prevTotalCustomers) * 100 
//       : 0;

//     return {
//       commissions: currentTotalCommissions,
//       commissionsChange,
//       sales: currentTotalSales,
//       salesChange,
//       affiliates: totalAffiliates,
//       affiliatesChange,
//       customers: totalCustomers,
//       customersChange,
//       level1Affiliates: level1Affiliates.length,
//       level2Affiliates: level2Affiliates.length,
//       level1Customers: level1Customers.length,
//       level2Customers: level2Customers.length,
//     };
//   }, [commissions, prevCommissions, sales, prevSales, level1Affiliates, level2Affiliates, prevLevel1Affiliates, prevLevel2Affiliates, level1Customers, level2Customers, prevLevel1Customers, prevLevel2Customers]);

//   return (
//     <div className="space-y-4">
//       <div className="flex justify-between items-center">
//         <h2 className="text-2xl font-bold">Performance Overview</h2>
//         <Select value={timePeriod} onValueChange={setTimePeriod}>
//           <SelectTrigger className="w-[180px]">
//             <SelectValue />
//           </SelectTrigger>
//           <SelectContent>
//             <SelectItem value="today">Today</SelectItem>
//             <SelectItem value="yesterday">Yesterday</SelectItem>
//             <SelectItem value="this-week">This Week</SelectItem>
//             <SelectItem value="last-week">Last Week</SelectItem>
//             <SelectItem value="this-month">This Month</SelectItem>
//             <SelectItem value="last-month">Last Month</SelectItem>
//             <SelectItem value="this-year">This Year</SelectItem>
//             <SelectItem value="last-year">Last Year</SelectItem>
//           </SelectContent>
//         </Select>
//       </div>

//       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
//         <MetricCard
//           title={
//             <div className="flex items-center gap-2">
//               <DollarSign className="h-4 w-4" />
//               <span>Total Commissions</span>
//             </div>
//           }
//           value={formatCurrency(metrics.commissions)}
//         >
//           <div className="flex items-center gap-2 text-sm">
//             {metrics.commissionsChange >= 0 ? (
//               <ArrowUpRight className="h-4 w-4 text-green-500" />
//             ) : (
//               <ArrowDownRight className="h-4 w-4 text-red-500" />
//             )}
//             <span className={metrics.commissionsChange >= 0 ? "text-green-500" : "text-red-500"}>
//               {Math.abs(metrics.commissionsChange).toFixed(1)}%
//             </span>
//             <span className="text-muted-foreground">vs previous period</span>
//           </div>
//         </MetricCard>

//         <MetricCard
//           title={
//             <div className="flex items-center gap-2">
//               <ShoppingCart className="h-4 w-4" />
//               <span>Total Sales</span>
//             </div>
//           }
//           value={formatCurrency(metrics.sales)}
//         >
//           <div className="flex items-center gap-2 text-sm">
//             {metrics.salesChange >= 0 ? (
//               <ArrowUpRight className="h-4 w-4 text-green-500" />
//             ) : (
//               <ArrowDownRight className="h-4 w-4 text-red-500" />
//             )}
//             <span className={metrics.salesChange >= 0 ? "text-green-500" : "text-red-500"}>
//               {Math.abs(metrics.salesChange).toFixed(1)}%
//             </span>
//             <span className="text-muted-foreground">vs previous period</span>
//           </div>
//         </MetricCard>

//         <MetricCard
//           title={
//             <div className="flex items-center gap-2">
//               <Users className="h-4 w-4" />
//               <span>Team Affiliates</span>
//             </div>
//           }
//           value={metrics.affiliates.toString()}
//         >
//           <div className="space-y-1">
//             <div className="flex items-center gap-2 text-sm">
//               {metrics.affiliatesChange >= 0 ? (
//                 <ArrowUpRight className="h-4 w-4 text-green-500" />
//               ) : (
//                 <ArrowDownRight className="h-4 w-4 text-red-500" />
//               )}
//               <span className={metrics.affiliatesChange >= 0 ? "text-green-500" : "text-red-500"}>
//                 {Math.abs(metrics.affiliatesChange).toFixed(1)}%
//               </span>
//               <span className="text-muted-foreground">vs previous period</span>
//             </div>
//             <div className="text-xs text-muted-foreground">
//               L1: {metrics.level1Affiliates} | L2: {metrics.level2Affiliates}
//             </div>
//           </div>
//         </MetricCard>

//         <MetricCard
//           title={
//             <div className="flex items-center gap-2">
//               <UserCheck className="h-4 w-4" />
//               <span>Team Customers</span>
//             </div>
//           }
//           value={metrics.customers.toString()}
//         >
//           <div className="space-y-1">
//             <div className="flex items-center gap-2 text-sm">
//               {metrics.customersChange >= 0 ? (
//                 <ArrowUpRight className="h-4 w-4 text-green-500" />
//               ) : (
//                 <ArrowDownRight className="h-4 w-4 text-red-500" />
//               )}
//               <span className={metrics.customersChange >= 0 ? "text-green-500" : "text-red-500"}>
//                 {Math.abs(metrics.customersChange).toFixed(1)}%
//               </span>
//               <span className="text-muted-foreground">vs previous period</span>
//             </div>
//             <div className="text-xs text-muted-foreground">
//               L1: {metrics.level1Customers} | L2: {metrics.level2Customers}
//             </div>
//           </div>
//         </MetricCard>
//       </div>
//     </div>
//   );
// }


import { MetricCard } from "@/components/ui/metric-card";
import { DollarSign, Users, UserCheck, ShoppingCart, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getPerformanceOverview } from "@/api/dashboard";
import { formatCurrency } from "@/lib/utils";

export function AffiliateKpiCards() {
  const [timePeriod, setTimePeriod] = useState("this-month");

  const { data: performanceData, isLoading } = useQuery({
    queryKey: ["performance-overview", timePeriod],
    queryFn: async () => {
      const response = await getPerformanceOverview(timePeriod);
      return response.data; // This is the clean data object from backend
    },
  });
  // Show loading state
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Performance Overview</h2>
          <div className="w-[180px] h-10 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  // Fallback if no data
  if (!performanceData) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No performance data available.
      </div>
    );
  }

  const {
    commissions,
    commissionsChange,
    sales,
    salesChange,
    affiliates,
    affiliatesChange,
    customers,
    customersChange,
    level1Affiliates,
    level2Affiliates,
    level1Customers,
    level2Customers,
  } = performanceData?.data;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Performance Overview</h2>
        <Select value={timePeriod} onValueChange={setTimePeriod}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="yesterday">Yesterday</SelectItem>
            <SelectItem value="this-week">This Week</SelectItem>
            <SelectItem value="last-week">Last Week</SelectItem>
            <SelectItem value="this-month">This Month</SelectItem>
            <SelectItem value="last-month">Last Month</SelectItem>
            <SelectItem value="this-year">This Year</SelectItem>
            <SelectItem value="last-year">Last Year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Commissions */}
        <MetricCard
          title={
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              <span>Total Commissions</span>
            </div>
          }
          value={formatCurrency(commissions)}
        >
          <div className="flex items-center gap-2 text-sm">
            {commissionsChange >= 0 ? (
              <ArrowUpRight className="h-4 w-4 text-green-500" />
            ) : (
              <ArrowDownRight className="h-4 w-4 text-red-500" />
            )}
            <span className={commissionsChange >= 0 ? "text-green-500" : "text-red-500"}>
              {Math.abs(commissionsChange).toFixed(1)}%
            </span>
            <span className="text-muted-foreground">vs previous period</span>
          </div>
        </MetricCard>

        {/* Total Sales */}
        <MetricCard
          title={
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              <span>Total Sales</span>
            </div>
          }
          value={formatCurrency(sales)}
        >
          <div className="flex items-center gap-2 text-sm">
            {salesChange >= 0 ? (
              <ArrowUpRight className="h-4 w-4 text-green-500" />
            ) : (
              <ArrowDownRight className="h-4 w-4 text-red-500" />
            )}
            <span className={salesChange >= 0 ? "text-green-500" : "text-red-500"}>
              {Math.abs(salesChange).toFixed(1)}%
            </span>
            <span className="text-muted-foreground">vs previous period</span>
          </div>
        </MetricCard>

        {/* Team Affiliates */}
        <MetricCard
          title={
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span>Team Affiliates</span>
            </div>
          }
          value={affiliates?.toString()}
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm">
              {affiliatesChange >= 0 ? (
                <ArrowUpRight className="h-4 w-4 text-green-500" />
              ) : (
                <ArrowDownRight className="h-4 w-4 text-red-500" />
              )}
              <span className={affiliatesChange >= 0 ? "text-green-500" : "text-red-500"}>
                {Math.abs(affiliatesChange).toFixed(1)}%
              </span>
              <span className="text-muted-foreground">vs previous period</span>
            </div>
            <div className="text-xs text-muted-foreground">
              L1: {level1Affiliates} | L2: {level2Affiliates}
            </div>
          </div>
        </MetricCard>

        {/* Team Customers */}
        <MetricCard
          title={
            <div className="flex items-center gap-2">
              <UserCheck className="h-4 w-4" />
              <span>Team Customers</span>
            </div>
          }
          value={customers?.toString()}
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm">
              {customersChange >= 0 ? (
                <ArrowUpRight className="h-4 w-4 text-green-500" />
              ) : (
                <ArrowDownRight className="h-4 w-4 text-red-500" />
              )}
              <span className={customersChange >= 0 ? "text-green-500" : "text-red-500"}>
                {Math.abs(customersChange).toFixed(1)}%
              </span>
              <span className="text-muted-foreground">vs previous period</span>
            </div>
            <div className="text-xs text-muted-foreground">
              L1: {level1Customers} | L2: {level2Customers}
            </div>
          </div>
        </MetricCard>
      </div>
    </div>
  );
}