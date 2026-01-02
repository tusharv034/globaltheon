// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Badge } from "@/components/ui/badge";
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
// import { Trophy, TrendingUp, Users, ShoppingCart } from "lucide-react";
// import { useState, useMemo } from "react";
// import { useQuery } from "@tanstack/react-query";
// import { supabase } from "@/integrations/supabase/client";
// import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, subDays, subWeeks, subMonths, subYears } from "date-fns";
// import { formatCurrency } from "@/lib/utils";

// export function AffiliateLeaderboards() {
//   const [timePeriod, setTimePeriod] = useState("this-month");

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

//   const { startDate, endDate } = useMemo(() => {
//     const now = new Date();
//     let start: Date, end: Date;

//     switch (timePeriod) {
//       case "today":
//         start = startOfDay(now);
//         end = endOfDay(now);
//         break;
//       case "yesterday":
//         start = startOfDay(subDays(now, 1));
//         end = endOfDay(subDays(now, 1));
//         break;
//       case "this-week":
//         start = startOfWeek(now);
//         end = endOfWeek(now);
//         break;
//       case "last-week":
//         start = startOfWeek(subWeeks(now, 1));
//         end = endOfWeek(subWeeks(now, 1));
//         break;
//       case "this-month":
//         start = startOfMonth(now);
//         end = endOfMonth(now);
//         break;
//       case "last-month":
//         start = startOfMonth(subMonths(now, 1));
//         end = endOfMonth(subMonths(now, 1));
//         break;
//       case "this-year":
//         start = startOfYear(now);
//         end = endOfYear(now);
//         break;
//       case "last-year":
//         start = startOfYear(subYears(now, 1));
//         end = endOfYear(subYears(now, 1));
//         break;
//       case "all-time":
//         start = new Date(0);
//         end = now;
//         break;
//       default:
//         start = startOfMonth(now);
//         end = endOfMonth(now);
//     }

//     return { startDate: start, endDate: end };
//   }, [timePeriod]);

//   // Fetch Level 1 affiliates
//   const { data: level1Affiliates = [] } = useQuery({
//     queryKey: ["level1-affiliates-leaderboard", currentAffiliate?.id],
//     queryFn: async () => {
//       if (!currentAffiliate) return [];
//       const { data } = await supabase
//         .from("affiliates")
//         .select("*")
//         .eq("enrolled_by", currentAffiliate.id);
//       return data || [];
//     },
//     enabled: !!currentAffiliate,
//   });

//   // Fetch orders for sales calculation
//   const { data: orders = [] } = useQuery({
//     queryKey: ["orders-leaderboard", startDate, endDate],
//     queryFn: async () => {
//       const { data } = await supabase
//         .from("orders")
//         .select("*, customers!inner(enrolled_by)")
//         .gte("order_date", startDate.toISOString())
//         .lte("order_date", endDate.toISOString());
//       return data || [];
//     },
//   });

//   // Fetch customers for enrollment calculation
//   const { data: customers = [] } = useQuery({
//     queryKey: ["customers-leaderboard", startDate, endDate],
//     queryFn: async () => {
//       const { data } = await supabase
//         .from("customers")
//         .select("*")
//         .gte("created_at", startDate.toISOString())
//         .lte("created_at", endDate.toISOString());
//       return data || [];
//     },
//   });

//   // Fetch all affiliates for downline calculation
//   const { data: allAffiliates = [] } = useQuery({
//     queryKey: ["all-affiliates-leaderboard", startDate, endDate],
//     queryFn: async () => {
//       const { data } = await supabase
//         .from("affiliates")
//         .select("*")
//         .gte("created_at", startDate.toISOString())
//         .lte("created_at", endDate.toISOString());
//       return data || [];
//     },
//   });

//   // Calculate leaderboard data
//   const leaderboards = useMemo(() => {
//     const affiliateStats = level1Affiliates.map(affiliate => {
//       // Calculate sales from their customers
//       const affiliateSales = orders
//         .filter(order => order.customers?.enrolled_by === affiliate.id)
//         .reduce((sum, order) => sum + (Number(order.amount) || 0), 0);

//       // Count customers enrolled
//       const customersEnrolled = customers.filter(c => c.enrolled_by === affiliate.id).length;

//       // Count affiliates enrolled
//       const affiliatesEnrolled = allAffiliates.filter(a => a.enrolled_by === affiliate.id).length;

//       return {
//         id: affiliate.id,
//         name: `${affiliate.first_name} ${affiliate.last_name}`,
//         affiliateId: affiliate.affiliate_id,
//         sales: affiliateSales,
//         customersEnrolled,
//         affiliatesEnrolled,
//         joinedDate: affiliate.created_at,
//       };
//     });

//     return {
//       bySales: [...affiliateStats].sort((a, b) => b.sales - a.sales).slice(0, 10),
//       byCustomers: [...affiliateStats].sort((a, b) => b.customersEnrolled - a.customersEnrolled).slice(0, 10),
//       byAffiliates: [...affiliateStats].sort((a, b) => b.affiliatesEnrolled - a.affiliatesEnrolled).slice(0, 10),
//     };
//   }, [level1Affiliates, orders, customers, allAffiliates]);

//   const renderLeaderboardItem = (item: any, index: number, metric: "sales" | "customersEnrolled" | "affiliatesEnrolled") => {
//     const value = metric === "sales" 
//       ? formatCurrency(item.sales)
//       : item[metric];

//     const medalColors = ["text-yellow-500", "text-gray-400", "text-amber-600"];
//     const medalColor = index < 3 ? medalColors[index] : "text-muted-foreground";

//     return (
//       <div key={item.id} className="flex items-center justify-between p-3 border-b last:border-b-0 hover:bg-muted/50 transition-colors">
//         <div className="flex items-center gap-3">
//           <div className={`font-bold text-lg ${medalColor} min-w-[30px]`}>
//             {index === 0 && <Trophy className="h-5 w-5" />}
//             {index !== 0 && `#${index + 1}`}
//           </div>
//           <div>
//             <div className="font-medium">{item.name}</div>
//             <div className="text-sm text-muted-foreground">ID: {item.affiliateId}</div>
//           </div>
//         </div>
//         <Badge variant="secondary" className="font-semibold">
//           {value}
//         </Badge>
//       </div>
//     );
//   };

//   return (
//     <div className="space-y-4">
//       <div className="flex justify-between items-center">
//         <h2 className="text-2xl font-bold flex items-center gap-2">
//           <Trophy className="h-6 w-6" />
//           Team Leaderboards
//         </h2>
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
//             <SelectItem value="all-time">All Time</SelectItem>
//           </SelectContent>
//         </Select>
//       </div>

//       <Tabs defaultValue="sales" className="w-full">
//         <TabsList className="grid w-full grid-cols-3">
//           <TabsTrigger value="sales" className="flex items-center gap-2">
//             <TrendingUp className="h-4 w-4" />
//             Top by Sales
//           </TabsTrigger>
//           <TabsTrigger value="customers" className="flex items-center gap-2">
//             <Users className="h-4 w-4" />
//             Top by Customers
//           </TabsTrigger>
//           <TabsTrigger value="affiliates" className="flex items-center gap-2">
//             <ShoppingCart className="h-4 w-4" />
//             Top by Affiliates
//           </TabsTrigger>
//         </TabsList>

//         <TabsContent value="sales">
//           <Card>
//             <CardHeader>
//               <CardTitle className="text-lg">Top Performers by Sales Volume</CardTitle>
//             </CardHeader>
//             <CardContent className="p-0">
//               {leaderboards.bySales.length > 0 ? (
//                 <div>
//                   {leaderboards.bySales.map((item, index) => renderLeaderboardItem(item, index, "sales"))}
//                 </div>
//               ) : (
//                 <div className="p-8 text-center text-muted-foreground">
//                   No sales data available for this period
//                 </div>
//               )}
//             </CardContent>
//           </Card>
//         </TabsContent>

//         <TabsContent value="customers">
//           <Card>
//             <CardHeader>
//               <CardTitle className="text-lg">Top Recruiters by Customer Enrollments</CardTitle>
//             </CardHeader>
//             <CardContent className="p-0">
//               {leaderboards.byCustomers.length > 0 ? (
//                 <div>
//                   {leaderboards.byCustomers.map((item, index) => renderLeaderboardItem(item, index, "customersEnrolled"))}
//                 </div>
//               ) : (
//                 <div className="p-8 text-center text-muted-foreground">
//                   No customer enrollment data available for this period
//                 </div>
//               )}
//             </CardContent>
//           </Card>
//         </TabsContent>

//         <TabsContent value="affiliates">
//           <Card>
//             <CardHeader>
//               <CardTitle className="text-lg">Top Builders by Affiliate Enrollments</CardTitle>
//             </CardHeader>
//             <CardContent className="p-0">
//               {leaderboards.byAffiliates.length > 0 ? (
//                 <div>
//                   {leaderboards.byAffiliates.map((item, index) => renderLeaderboardItem(item, index, "affiliatesEnrolled"))}
//                 </div>
//               ) : (
//                 <div className="p-8 text-center text-muted-foreground">
//                   No affiliate enrollment data available for this period
//                 </div>
//               )}
//             </CardContent>
//           </Card>
//         </TabsContent>
//       </Tabs>
//     </div>
//   );
// }



import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Trophy, TrendingUp, Users, ShoppingCart } from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getLeaderboards } from "@/api/dashboard";
import { formatCurrency } from "@/lib/utils";

export function AffiliateLeaderboards() {
  const [timePeriod, setTimePeriod] = useState("this-month");

  const { data: leaderboards, isLoading } = useQuery({
    queryKey: ["leaderboards", timePeriod],
    queryFn: async () => {
      const response = await getLeaderboards(timePeriod);
      return response?.data?.data; // { bySales, byCustomers, byAffiliates }
    },
  });

  console.log("leaderboards : ",leaderboards);

  if (isLoading) {
    return <div className="text-center py-8">Loading leaderboards...</div>;
  }

  if (!leaderboards || (!leaderboards.bySales.length && !leaderboards.byCustomers.length && !leaderboards.byAffiliates.length)) {
    return <div className="text-center py-8 text-muted-foreground">No data available for this period</div>;
  }

  const renderLeaderboardItem = (item: any, index: number, metric: "sales" | "customersEnrolled" | "affiliatesEnrolled") => {
    const value = metric === "sales" ? formatCurrency(item.sales) : item[metric];
    const medalColors = ["text-yellow-500", "text-gray-400", "text-amber-600"];
    const medalColor = index < 3 ? medalColors[index] : "text-muted-foreground";

    return (
      <div key={item.id} className="flex items-center justify-between p-3 border-b last:border-b-0 hover:bg-muted/50">
        <div className="flex items-center gap-3">
          <div className={`font-bold text-lg ${medalColor} min-w-[30px]`}>
            {index === 0 && <Trophy className="h-5 w-5" />}
            {index !== 0 && `#${index + 1}`}
          </div>
          <div>
            <div className="font-medium">{item.name}</div>
            <div className="text-sm text-muted-foreground">ID: {item.affiliateId}</div>
          </div>
        </div>
        <Badge variant="secondary" className="font-semibold">{value}</Badge>
      </div>
    );
  };

  const emptyMessage = "No data available for this period";

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Trophy className="h-6 w-6" />
          Team Leaderboards
        </h2>
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
            <SelectItem value="all-time">All Time</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="sales" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="sales"><TrendingUp className="h-4 w-4 mr-2" /> Top by Sales</TabsTrigger>
          <TabsTrigger value="customers"><Users className="h-4 w-4 mr-2" /> Top by Customers</TabsTrigger>
          <TabsTrigger value="affiliates"><ShoppingCart className="h-4 w-4 mr-2" /> Top by Affiliates</TabsTrigger>
        </TabsList>

        <TabsContent value="sales">
          <Card>
            <CardHeader><CardTitle className="text-lg">Top Performers by Sales Volume</CardTitle></CardHeader>
            <CardContent className="p-0">
              {leaderboards.bySales.length > 0 ? (
                leaderboards.bySales.map((item, i) => renderLeaderboardItem(item, i, "sales"))
              ) : (
                <div className="p-8 text-center text-muted-foreground">{emptyMessage}</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="customers">
          <Card>
            <CardHeader><CardTitle className="text-lg">Top Recruiters by Customer Enrollments</CardTitle></CardHeader>
            <CardContent className="p-0">
              {leaderboards.byCustomers.length > 0 ? (
                leaderboards.byCustomers.map((item, i) => renderLeaderboardItem(item, i, "customersEnrolled"))
              ) : (
                <div className="p-8 text-center text-muted-foreground">{emptyMessage}</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="affiliates">
          <Card>
            <CardHeader><CardTitle className="text-lg">Top Builders by Affiliate Enrollments</CardTitle></CardHeader>
            <CardContent className="p-0">
              {leaderboards.byAffiliates.length > 0 ? (
                leaderboards.byAffiliates.map((item, i) => renderLeaderboardItem(item, i, "affiliatesEnrolled"))
              ) : (
                <div className="p-8 text-center text-muted-foreground">{emptyMessage}</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}