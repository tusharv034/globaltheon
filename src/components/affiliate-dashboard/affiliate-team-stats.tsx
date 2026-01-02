// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Badge } from "@/components/ui/badge";
// import { Users, UserCheck, DollarSign, ShoppingCart } from "lucide-react";
// import { useQuery } from "@tanstack/react-query";
// import { supabase } from "@/integrations/supabase/client";
// import { useMemo } from "react";
// import { formatCurrency } from "@/lib/utils";

// export function AffiliateTeamStats() {
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

//   // Fetch Level 1 data
//   const { data: level1Affiliates = [] } = useQuery({
//     queryKey: ["level1-affiliates-stats", currentAffiliate?.id],
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

//   const { data: level1Customers = [] } = useQuery({
//     queryKey: ["level1-customers-stats", currentAffiliate?.id],
//     queryFn: async () => {
//       if (!currentAffiliate) return [];
//       const { data } = await supabase
//         .from("customers")
//         .select("*")
//         .eq("enrolled_by", currentAffiliate.id);
//       return data || [];
//     },
//     enabled: !!currentAffiliate,
//   });

//   // Fetch Level 2 data
//   const { data: level2Affiliates = [] } = useQuery({
//     queryKey: ["level2-affiliates-stats", level1Affiliates],
//     queryFn: async () => {
//       if (!level1Affiliates.length) return [];
//       const level1Ids = level1Affiliates.map(a => a.id);
//       const { data } = await supabase
//         .from("affiliates")
//         .select("*")
//         .in("enrolled_by", level1Ids);
//       return data || [];
//     },
//     enabled: level1Affiliates.length > 0,
//   });

//   const { data: level2Customers = [] } = useQuery({
//     queryKey: ["level2-customers-stats", level1Affiliates],
//     queryFn: async () => {
//       if (!level1Affiliates.length) return [];
//       const level1Ids = level1Affiliates.map(a => a.id);
//       const { data } = await supabase
//         .from("customers")
//         .select("*")
//         .in("enrolled_by", level1Ids);
//       return data || [];
//     },
//     enabled: level1Affiliates.length > 0,
//   });

//   // Fetch orders and commissions
//   const { data: allOrders = [] } = useQuery({
//     queryKey: ["all-orders-stats", currentAffiliate?.id],
//     queryFn: async () => {
//       if (!currentAffiliate) return [];
      
//       // Get all customer IDs from both levels
//       const l1CustomerIds = level1Customers.map(c => c.id);
//       const l2CustomerIds = level2Customers.map(c => c.id);
//       const allCustomerIds = [...l1CustomerIds, ...l2CustomerIds];
      
//       if (allCustomerIds.length === 0) return [];
      
//       const { data } = await supabase
//         .from("orders")
//         .select("*, customers!inner(enrolled_by)")
//         .in("customer_id", allCustomerIds);
//       return data || [];
//     },
//     enabled: !!currentAffiliate && (level1Customers.length > 0 || level2Customers.length > 0),
//   });

//   const { data: allCommissions = [] } = useQuery({
//     queryKey: ["all-commissions-stats", currentAffiliate?.id],
//     queryFn: async () => {
//       if (!currentAffiliate) return [];
//       const { data } = await supabase
//         .from("order_commissions")
//         .select("*")
//         .eq("affiliate_id", currentAffiliate.id);
//       return data || [];
//     },
//     enabled: !!currentAffiliate,
//   });

//   // Calculate stats
//   const stats = useMemo(() => {
//     // Level 1 orders and commissions
//     const level1CustomerIds = level1Customers.map(c => c.id);
//     const level1Orders = allOrders.filter(o => level1CustomerIds.includes(o.customer_id));
//     const level1Sales = level1Orders.reduce((sum, o) => sum + (Number(o.amount) || 0), 0);
//     const level1Commissions = allCommissions
//       .filter(c => c.level === 1)
//       .reduce((sum, c) => sum + (Number(c.commission_amount) || 0), 0);

//     // Level 2 orders and commissions
//     const level2CustomerIds = level2Customers.map(c => c.id);
//     const level2Orders = allOrders.filter(o => level2CustomerIds.includes(o.customer_id));
//     const level2Sales = level2Orders.reduce((sum, o) => sum + (Number(o.amount) || 0), 0);
//     const level2Commissions = allCommissions
//       .filter(c => c.level === 2)
//       .reduce((sum, c) => sum + (Number(c.commission_amount) || 0), 0);

//     return {
//       level1: {
//         affiliates: level1Affiliates.length,
//         customers: level1Customers.length,
//         orders: level1Orders.length,
//         sales: level1Sales,
//         commissions: level1Commissions,
//       },
//       level2: {
//         affiliates: level2Affiliates.length,
//         customers: level2Customers.length,
//         orders: level2Orders.length,
//         sales: level2Sales,
//         commissions: level2Commissions,
//       },
//     };
//   }, [level1Affiliates, level1Customers, level2Affiliates, level2Customers, allOrders, allCommissions]);

//   const renderLevelCard = (level: 1 | 2, data: typeof stats.level1) => (
//     <Card>
//       <CardHeader>
//         <CardTitle className="flex items-center justify-between">
//           <span>Level {level} Organization</span>
//           <Badge variant="outline">{level === 1 ? "Direct" : "Indirect"}</Badge>
//         </CardTitle>
//       </CardHeader>
//       <CardContent className="space-y-4">
//         <div className="grid grid-cols-2 gap-4">
//           <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
//             <div className="p-2 bg-primary/10 rounded-full">
//               <Users className="h-5 w-5 text-primary" />
//             </div>
//             <div>
//               <p className="text-sm text-muted-foreground">Affiliates</p>
//               <p className="text-2xl font-bold">{data.affiliates}</p>
//             </div>
//           </div>

//           <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
//             <div className="p-2 bg-primary/10 rounded-full">
//               <UserCheck className="h-5 w-5 text-primary" />
//             </div>
//             <div>
//               <p className="text-sm text-muted-foreground">Customers</p>
//               <p className="text-2xl font-bold">{data.customers}</p>
//             </div>
//           </div>

//           <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
//             <div className="p-2 bg-primary/10 rounded-full">
//               <ShoppingCart className="h-5 w-5 text-primary" />
//             </div>
//             <div>
//               <p className="text-sm text-muted-foreground">Orders</p>
//               <p className="text-2xl font-bold">{data.orders}</p>
//             </div>
//           </div>

//           <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
//             <div className="p-2 bg-primary/10 rounded-full">
//               <DollarSign className="h-5 w-5 text-primary" />
//             </div>
//             <div>
//               <p className="text-sm text-muted-foreground">Sales Volume</p>
//               <p className="text-2xl font-bold">{formatCurrency(data.sales)}</p>
//             </div>
//           </div>
//         </div>

//         <div className="pt-4 border-t">
//           <div className="flex justify-between items-center">
//             <span className="text-sm font-medium">Your Commissions</span>
//             <span className="text-lg font-bold text-primary">{formatCurrency(data.commissions)}</span>
//           </div>
//         </div>
//       </CardContent>
//     </Card>
//   );

//   return (
//     <div className="space-y-6">
//       <h2 className="text-2xl font-bold">Team Structure & Performance</h2>
      
//       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//         {renderLevelCard(1, stats.level1)}
//         {renderLevelCard(2, stats.level2)}
//       </div>

//       <Card>
//         <CardHeader>
//           <CardTitle>Total Organization Summary</CardTitle>
//         </CardHeader>
//         <CardContent>
//           <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
//             <div className="text-center p-4 bg-muted rounded-lg">
//               <p className="text-sm text-muted-foreground mb-2">Total Team</p>
//               <p className="text-3xl font-bold">{stats.level1.affiliates + stats.level2.affiliates}</p>
//               <p className="text-xs text-muted-foreground mt-1">Affiliates</p>
//             </div>

//             <div className="text-center p-4 bg-muted rounded-lg">
//               <p className="text-sm text-muted-foreground mb-2">Customer Base</p>
//               <p className="text-3xl font-bold">{stats.level1.customers + stats.level2.customers}</p>
//               <p className="text-xs text-muted-foreground mt-1">Customers</p>
//             </div>

//             <div className="text-center p-4 bg-muted rounded-lg">
//               <p className="text-sm text-muted-foreground mb-2">Total Volume</p>
//               <p className="text-3xl font-bold">{formatCurrency(stats.level1.sales + stats.level2.sales, 0)}</p>
//               <p className="text-xs text-muted-foreground mt-1">in Sales</p>
//             </div>

//             <div className="text-center p-4 bg-muted rounded-lg">
//               <p className="text-sm text-muted-foreground mb-2">Your Earnings</p>
//               <p className="text-3xl font-bold text-primary">{formatCurrency(stats.level1.commissions + stats.level2.commissions, 0)}</p>
//               <p className="text-xs text-muted-foreground mt-1">Commissions</p>
//             </div>
//           </div>
//         </CardContent>
//       </Card>
//     </div>
//   );
// }

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, UserCheck, DollarSign, ShoppingCart } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getTeamStats } from "@/api/dashboard";
import { formatCurrency } from "@/lib/utils";

export function AffiliateTeamStats() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["team-stats"],
    queryFn: async () => {
      const response = await getTeamStats();
      return response?.data?.data; // This is directly { level1: {...}, level2: {...} }
    },
  });


  if (isLoading) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Team Structure & Performance</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-64 bg-gray-200 rounded-lg animate-pulse" />
          <div className="h-64 bg-gray-200 rounded-lg animate-pulse" />
        </div>
        <div className="h-32 bg-gray-200 rounded-lg animate-pulse" />
      </div>
    );
  }

  if (!stats || !stats.level1 || !stats.level2) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No team stats available.
      </div>
    );
  }

  const { level1, level2 } = stats;

  const renderLevelCard = (level: 1 | 2, data: typeof level1) => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Level {level} Organization</span>
          <Badge variant="outline">{level === 1 ? "Direct" : "Indirect"}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
            <div className="p-2 bg-primary/10 rounded-full">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Affiliates</p>
              <p className="text-2xl font-bold">{data.affiliates ?? 0}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
            <div className="p-2 bg-primary/10 rounded-full">
              <UserCheck className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Customers</p>
              <p className="text-2xl font-bold">{data.customers ?? 0}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
            <div className="p-2 bg-primary/10 rounded-full">
              <ShoppingCart className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Orders</p>
              <p className="text-2xl font-bold">{data.orders ?? 0}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
            <div className="p-2 bg-primary/10 rounded-full">
              <DollarSign className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Sales Volume</p>
              <p className="text-2xl font-bold">{formatCurrency(data.sales ?? 0)}</p>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Your Commissions</span>
            <span className="text-lg font-bold text-primary">
              {formatCurrency(data.commissions ?? 0)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Team Structure & Performance</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {renderLevelCard(1, level1)}
        {renderLevelCard(2, level2)}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Total Organization Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">Total Team</p>
              <p className="text-3xl font-bold">
                {(level1.affiliates ?? 0) + (level2.affiliates ?? 0)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Affiliates</p>
            </div>

            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">Customer Base</p>
              <p className="text-3xl font-bold">
                {(level1.customers ?? 0) + (level2.customers ?? 0)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Customers</p>
            </div>

            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">Total Volume</p>
              <p className="text-3xl font-bold">
                {formatCurrency((level1.sales ?? 0) + (level2.sales ?? 0))}
              </p>
              <p className="text-xs text-muted-foreground mt-1">in Sales</p>
            </div>

            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">Your Earnings</p>
              <p className="text-3xl font-bold text-primary">
                {formatCurrency((level1.commissions ?? 0) + (level2.commissions ?? 0))}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Commissions</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}