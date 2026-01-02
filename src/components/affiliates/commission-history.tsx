// import { useState, useEffect } from "react";
// import { useQuery } from "@tanstack/react-query";
// import { supabase } from "@/integrations/supabase/client";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Badge } from "@/components/ui/badge";
// import { Button } from "@/components/ui/button";
// import { ChevronDown, ChevronRight, DollarSign } from "lucide-react";
// import { format, startOfWeek, endOfWeek } from "date-fns";
// import { OrderDetailDialog } from "@/components/customers/order-detail-dialog";
// import { formatCurrency, formatNumber } from "@/lib/utils";
// import { getAffiliateCommission } from "@/api/affiliate";
// import { Construction } from "lucide-react";
// interface CommissionHistoryProps {
//   affiliateId: string;
//   initialExpandedWeek?: string;
//   initialExpandedLevel?: 1 | 2;
//   filterStartDate?: string;
//   filterEndDate?: string;
// }

// interface WeeklyCommission {
//   weekStart: Date;
//   weekEnd: Date;
//   totalEarnings: number;
//   level1Earnings: number;
//   level2Earnings: number;
//   status: "open" | "closed" | "paid";
//   level1Details: Array<{
//     customerId: string;
//     customerName: string;
//     orderDate: Date;
//     orderAmount: number;
//     orderId: string;
//     orderNumber: string;
//   }>;
//   level2Details: Array<{
//     affiliateId: string;
//     affiliateName: string;
//     salesCount: number;
//     salesTotal: number;
//   }>;
// }

// export function CommissionHistory({ affiliateId, initialExpandedWeek, initialExpandedLevel, filterStartDate, filterEndDate }: CommissionHistoryProps) {
//   const [expandedWeek, setExpandedWeek] = useState<string | null>(initialExpandedWeek || null);
//   const [expandedLevel, setExpandedLevel] = useState<{ [key: string]: 1 | 2 | null }>({});
//   const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
//   const [showOrderDialog, setShowOrderDialog] = useState(false);
//   const [showAllCommissions, setShowAllCommissions] = useState(false);

//   console.log("Affiliate Id for commission : ",affiliateId);
//   // Set expanded level when initialExpandedWeek is provided
//   useEffect(() => {
//     if (initialExpandedWeek) {
//       setExpandedWeek(initialExpandedWeek);
//       // Auto-expand the specified level or default to Level 1
//       setExpandedLevel({ [initialExpandedWeek]: initialExpandedLevel || 1 });
//     }
//   }, [initialExpandedWeek, initialExpandedLevel]);

//   const { data: commissionData, isLoading } = useQuery({
//     queryKey: ["affiliate-commissions", affiliateId, showAllCommissions ? null : filterStartDate, showAllCommissions ? null : filterEndDate],
//     queryFn: async () => {
//       // Pull live commission records for this affiliate directly from order_commissions
//       const baseSelect = `
//         commission_amount,
//         level,
//         order_id,
//         order:orders!order_commissions_order_id_fkey (
//           id,
//           order_date,
//           subtotal,
//           amount,
//           order_number,
//           customer:customers!orders_customer_id_fkey (
//             id,
//             first_name,
//             last_name,
//             enrolled_by
//           )
//         )
//       `;

//       let query = supabase
//         .from("order_commissions")
//         .select(baseSelect)
//         .eq("affiliate_id", affiliateId);

//       // Apply filters only if not showing all commissions
//       if (!showAllCommissions && filterStartDate && filterEndDate) {
//         // Use order IDs within the period to avoid nested filter edge-cases
//         const endExclusive = new Date(filterEndDate);
//         endExclusive.setDate(endExclusive.getDate() + 1);

//         const { data: ordersInRange, error: ordErr } = await supabase
//           .from("orders")
//           .select("id")
//           .gte("order_date", filterStartDate)
//           .lt("order_date", endExclusive.toISOString());
//         if (ordErr) throw ordErr;

//         const orderIds = (ordersInRange || []).map((o: any) => o.id);
//         if (orderIds.length === 0) {
//           return [] as WeeklyCommission[]; // No orders in this period for this affiliate
//         }
//         query = query.in("order_id", orderIds);
//       } else if (!showAllCommissions && filterStartDate) {
//         query = query.gte("order.order_date", filterStartDate);
//       } else if (!showAllCommissions && filterEndDate) {
//         const endExclusive = new Date(filterEndDate);
//         endExclusive.setDate(endExclusive.getDate() + 1);
//         query = query.lt("order.order_date", endExclusive.toISOString());
//       }

//       const { data: oc, error } = await query.order("order_id", { ascending: false });
//       if (error) throw error;

//       const weeklyData = new Map<string, WeeklyCommission>();

//       // Collect L2 subordinate affiliate ids to resolve names
//       const l2AffiliateIds = Array.from(
//         new Set(
//           (oc || [])
//             .filter((r: any) => r.level === 2 && r.order?.customer?.enrolled_by)
//             .map((r: any) => r.order.customer.enrolled_by)
//         )
//       );

//       let l2AffiliateNameMap = new Map<string, string>();
//       if (l2AffiliateIds.length) {
//         const { data: affs } = await supabase
//           .from("affiliates")
//           .select("id, first_name, last_name")
//           .in("id", l2AffiliateIds);
//         l2AffiliateNameMap = new Map(
//           (affs || []).map((a: any) => [a.id, `${a.first_name} ${a.last_name}`])
//         );
//       }

//       for (const row of oc || []) {
//         const order = row.order;
//         if (!order) continue;
//         const orderDate = new Date(order.order_date);
//         const weekStart = startOfWeek(orderDate, { weekStartsOn: 1 });
//         const weekKey = format(weekStart, "yyyy-MM-dd");

//         if (!weeklyData.has(weekKey)) {
//           weeklyData.set(weekKey, {
//             weekStart,
//             weekEnd: endOfWeek(weekStart, { weekStartsOn: 1 }),
//             totalEarnings: 0,
//             level1Earnings: 0,
//             level2Earnings: 0,
//             status: determineStatus(weekStart),
//             level1Details: [],
//             level2Details: [],
//           });
//         }

//         const week = weeklyData.get(weekKey)!;
//         const commission = Number(row.commission_amount || 0);

//         if (row.level === 1) {
//           week.level1Earnings += commission;
//           week.totalEarnings += commission;
//           week.level1Details.push({
//             customerId: order.customer?.id,
//             customerName: order.customer
//               ? `${order.customer.first_name} ${order.customer.last_name}`
//               : "Unknown",
//             orderDate,
//             orderAmount: Number(order.subtotal ?? order.amount ?? 0),
//             orderId: order.id,
//             orderNumber: order.order_number,
//           });
//         } else if (row.level === 2) {
//           week.level2Earnings += commission;
//           week.totalEarnings += commission;

//           const sponsoredAffiliateId = order.customer?.enrolled_by as string | undefined;
//           if (sponsoredAffiliateId) {
//             const affiliateName = l2AffiliateNameMap.get(sponsoredAffiliateId) || "Team Affiliate";
//             const existing = week.level2Details.find(d => d.affiliateId === sponsoredAffiliateId);
//             const baseAmount = Number(order.subtotal ?? order.amount ?? 0);
//             if (existing) {
//               existing.salesCount += 1;
//               existing.salesTotal += baseAmount;
//             } else {
//               week.level2Details.push({
//                 affiliateId: sponsoredAffiliateId,
//                 affiliateName,
//                 salesCount: 1,
//                 salesTotal: baseAmount,
//               });
//             }
//           }
//         }
//       }

//       return Array.from(weeklyData.values()).sort((a, b) => b.weekStart.getTime() - a.weekStart.getTime());
//     },
//   });


// const { data: affiliateCommisionData, isLoading: isLoadingCommission } = useQuery({
//   queryKey: ['aff-commissions', affiliateId],
//   queryFn: () => getAffiliateCommission({ affiliateId }), // Passing the correct object structure
// });

// console.log("Commission data : ",affiliateCommisionData);

//   const determineStatus = (weekStart: Date): "open" | "closed" | "paid" => {
//     const now = new Date();
//     const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
//     const daysSinceWeekEnd = Math.floor((now.getTime() - weekEnd.getTime()) / (1000 * 60 * 60 * 24));

//     if (now < weekEnd) return "open";
//     if (daysSinceWeekEnd < 7) return "closed";
//     return "paid";
//   };

//   const toggleWeek = (weekKey: string) => {
//     if (expandedWeek === weekKey) {
//       setExpandedWeek(null);
//       const newExpandedLevel = { ...expandedLevel };
//       delete newExpandedLevel[weekKey];
//       setExpandedLevel(newExpandedLevel);
//     } else {
//       setExpandedWeek(weekKey);
//       // Clear expanded level for all other weeks
//       setExpandedLevel({});
//     }
//   };

//   const toggleLevel = (weekKey: string, level: 1 | 2) => {
//     setExpandedLevel({
//       ...expandedLevel,
//       [weekKey]: expandedLevel[weekKey] === level ? null : level,
//     });
//   };

//   const getStatusBadge = (status: "open" | "closed" | "paid") => {
//     const variants: Record<string, "default" | "secondary" | "outline"> = {
//       open: "outline",
//       closed: "secondary",
//       paid: "default",
//     };
//     return (
//       <Badge variant={variants[status]}>
//         {status.charAt(0).toUpperCase() + status.slice(1)}
//       </Badge>
//     );
//   };

//   const handleOrderClick = (orderId: string) => {
//     setSelectedOrderId(orderId);
//     setShowOrderDialog(true);
//   };
//  {/* Take Note :  should remove return below */}

//   if (isLoading) {
//     return <div className="text-center py-8">Loading commission history...</div>;
//   }

//   if (!commissionData || commissionData.length === 0) {
//     return (
//       <Card>
//         <CardContent className="pt-6">
//           <div className="text-center py-8 text-muted-foreground">
//             No commission history found
//           </div>
//         </CardContent>
//       </Card>
//     );
//   }

//   // Calculate total earnings
//   const level1Total = commissionData.reduce((sum, week) => sum + week.level1Earnings, 0);
//   const level2Total = commissionData.reduce((sum, week) => sum + week.level2Earnings, 0);
//   const grandTotal = level1Total + level2Total;
//   const isFiltered = !showAllCommissions && !!(filterStartDate && filterEndDate);

//   return (
//     <>
//       <Card>
//         <CardHeader>
//           <div className="flex items-start justify-between">
//             <div className="flex-1">
//               <CardTitle className="flex items-center gap-2">
//                 <DollarSign className="h-5 w-5" />
//                 Commission History
//               </CardTitle>
//               <div className="text-sm text-muted-foreground">
//                 Weekly commission breakdown (Level 1: 25% | Level 2: 12%)
//               </div>
//               {!showAllCommissions && filterStartDate && filterEndDate && (
//                 <Button
//                   variant="link"
//                   className="h-auto p-0 mt-2 text-primary"
//                   onClick={() => setShowAllCommissions(true)}
//                 >
//                   View All Commissions
//                 </Button>
//               )}
//               {showAllCommissions && filterStartDate && filterEndDate && (
//                 <Button
//                   variant="link"
//                   className="h-auto p-0 mt-2 text-primary"
//                   onClick={() => setShowAllCommissions(false)}
//                 >
//                   Show Period Only ({format(new Date(filterStartDate), "MMM d")} - {format(new Date(filterEndDate), "MMM d, yyyy")})
//                 </Button>
//               )}
//             </div>
//             <div className="text-right space-y-2 min-w-[200px] pl-4">
//               <div className="text-sm font-medium text-muted-foreground">{isFiltered ? "Period Totals" : "Total Earnings"}</div>
//               <div className="space-y-1">
//                 <div className="flex items-center justify-between gap-3">
//                   <span className="text-sm text-blue-700 dark:text-blue-300">Level 1:</span>
//                   <span className="font-semibold text-blue-700 dark:text-blue-300">{formatCurrency(level1Total)}</span>
//                 </div>
//                 <div className="flex items-center justify-between gap-3">
//                   <span className="text-sm text-green-700 dark:text-green-300">Level 2:</span>
//                   <span className="font-semibold text-green-700 dark:text-green-300">{formatCurrency(level2Total)}</span>
//                 </div>
//                 <div className="pt-2 border-t">
//                   <div className="flex items-center justify-between gap-3">
//                     <span className="text-sm font-medium">Total:</span>
//                     <span className="font-bold text-lg">{formatCurrency(grandTotal)}</span>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </CardHeader>
//         <CardContent className="space-y-3">
//           {commissionData.map((week) => {
//             const weekKey = format(week.weekStart, "yyyy-MM-dd");
//             const isExpanded = expandedWeek === weekKey;
//             const expandedLevelForWeek = expandedLevel[weekKey];

//             return (
//               <div key={weekKey} className="border rounded-lg overflow-hidden">
//                 <div
//                   className="p-4 bg-muted/50 cursor-pointer hover:bg-muted transition-colors"
//                   onClick={() => toggleWeek(weekKey)}
//                 >
//                   <div className="flex items-center justify-between">
//                     <div className="flex items-center gap-3">
//                       {isExpanded ? (
//                         <ChevronDown className="h-4 w-4" />
//                       ) : (
//                         <ChevronRight className="h-4 w-4" />
//                       )}
//                       <div>
//                         <div className="font-semibold">
//                           Week of {format(week.weekStart, "MMM d, yyyy")} - {format(week.weekEnd, "MMM d, yyyy")}
//                         </div>
//                         <div className="text-sm text-muted-foreground">
//                           Total: {formatCurrency(week.totalEarnings)}
//                         </div>
//                       </div>
//                     </div>
//                     {getStatusBadge(week.status)}
//                   </div>
//                 </div>

//                 {isExpanded && (
//                   <div className="p-4 space-y-3">
//                     {/* Level 1 Earnings */}
//                     <div className="border rounded-lg overflow-hidden">
//                       <div
//                         className="p-3 bg-blue-50 dark:bg-blue-950/20 cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-950/30 transition-colors"
//                         onClick={() => toggleLevel(weekKey, 1)}
//                       >
//                         <div className="flex items-center justify-between">
//                           <div className="flex items-center gap-2">
//                             {expandedLevelForWeek === 1 ? (
//                               <ChevronDown className="h-4 w-4" />
//                             ) : (
//                               <ChevronRight className="h-4 w-4" />
//                             )}
//                             <span className="font-medium">Level 1 Earnings (Personal Sales)</span>
//                           </div>
//                           <span className="font-semibold text-blue-700 dark:text-blue-300">
//                             {formatCurrency(week.level1Earnings)}
//                           </span>
//                         </div>
//                       </div>

//                       {expandedLevelForWeek === 1 && week.level1Details.length > 0 && (
//                         <div className="p-3 space-y-2">
//                           {week.level1Details.map((detail, idx) => (
//                             <div key={idx} className="flex items-center justify-between p-2 border rounded">
//                               <div className="flex-1">
//                                 <div className="font-medium">{detail.customerName}</div>
//                                 <div className="text-sm text-muted-foreground">
//                                   {format(detail.orderDate, "MMM d, yyyy")} •
//                                   <button
//                                     onClick={() => handleOrderClick(detail.orderId)}
//                                     className="ml-1 text-primary hover:underline"
//                                   >
//                                     Invoice #{detail.orderNumber}
//                                   </button>
//                                 </div>
//                               </div>
//                               <div className="text-right">
//                                 <div className="font-medium">{formatCurrency(detail.orderAmount)}</div>
//                                 <div className="text-sm text-muted-foreground">
//                                   Commission: {formatCurrency(detail.orderAmount * 0.25)}
//                                 </div>
//                               </div>
//                             </div>
//                           ))}
//                         </div>
//                       )}
//                     </div>

//                     {/* Level 2 Earnings */}
//                     <div className="border rounded-lg overflow-hidden">
//                       <div
//                         className="p-3 bg-green-50 dark:bg-green-950/20 cursor-pointer hover:bg-green-100 dark:hover:bg-green-950/30 transition-colors"
//                         onClick={() => toggleLevel(weekKey, 2)}
//                       >
//                         <div className="flex items-center justify-between">
//                           <div className="flex items-center gap-2">
//                             {expandedLevelForWeek === 2 ? (
//                               <ChevronDown className="h-4 w-4" />
//                             ) : (
//                               <ChevronRight className="h-4 w-4" />
//                             )}
//                             <span className="font-medium">Level 2 Earnings (Personal Affiliate Sales)</span>
//                           </div>
//                           <span className="font-semibold text-green-700 dark:text-green-300">
//                             {formatCurrency(week.level2Earnings)}
//                           </span>
//                         </div>
//                       </div>

//                       {expandedLevelForWeek === 2 && week.level2Details.length > 0 && (
//                         <div className="p-3 space-y-2">
//                           {week.level2Details.map((detail, idx) => (
//                             <div key={idx} className="flex items-center justify-between p-2 border rounded">
//                               <div className="flex-1">
//                                 <div className="font-medium">{detail.affiliateName}</div>
//                                 <div className="text-sm text-muted-foreground">
//                                   {detail.salesCount} sale{detail.salesCount !== 1 ? 's' : ''}
//                                 </div>
//                               </div>
//                               <div className="text-right">
//                                 <div className="font-medium">{formatCurrency(detail.salesTotal)}</div>
//                                 <div className="text-sm text-muted-foreground">
//                                   Commission: {formatCurrency(detail.salesTotal * 0.12)}
//                                 </div>
//                               </div>
//                             </div>
//                           ))}
//                         </div>
//                       )}
//                     </div>
//                   </div>
//                 )}
//               </div>
//             );
//           })}
//         </CardContent>
//       </Card>

//       {selectedOrderId && (
//         <OrderDetailDialog
//           orderId={selectedOrderId}
//           open={showOrderDialog}
//           onOpenChange={setShowOrderDialog}
//         />
//       )}
//     </>
//   );
// }

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight, DollarSign } from "lucide-react";
import { format } from "date-fns";
import { OrderDetailDialog } from "@/components/customers/order-detail-dialog";
import { formatCurrency } from "@/lib/utils";
import { getAffiliateCommission } from "@/api/affiliate";
import { useDateFormatStore } from "@/store/useDateFormat";
import { getDateFormatString } from "@/utils/resolveDateFormat";

interface CommissionHistoryProps {
  affiliateId: string;
  initialExpandedPeriod?: string;
  initialExpandedLevel?: 1 | 2;
  filterStartDate?: string;
  filterEndDate?: string;
}

export function CommissionHistory({
  affiliateId,
  initialExpandedPeriod,
  initialExpandedLevel,
  filterStartDate,
  filterEndDate,
}: CommissionHistoryProps) {
  const [expandedPeriod, setExpandedPeriod] = useState<string | null>(
    initialExpandedPeriod || null
  );
  const [expandedLevel, setExpandedLevel] = useState<{ [key: string]: 1 | 2 | null }>({});
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [selectedOrderBy, setSelectedOrderBy] = useState(null);
  const [showOrderDialog, setShowOrderDialog] = useState(false);
  const [showAllCommissions, setShowAllCommissions] = useState(false);

  const { dateFormatRegion, dateFormatVariant } = useDateFormatStore();
  const formatString = getDateFormatString(dateFormatRegion, dateFormatVariant);
  useEffect(() => {
    if (initialExpandedPeriod) {
      setExpandedPeriod(initialExpandedPeriod);
      setExpandedLevel({ [initialExpandedPeriod]: initialExpandedLevel || 1 });
    }
  }, [initialExpandedPeriod, initialExpandedLevel]);

  const { data: response, isLoading } = useQuery({
    queryKey: ["affiliate-commissions", affiliateId, initialExpandedPeriod, showAllCommissions],
    queryFn: () => getAffiliateCommission({
      affiliateId,
      periodId: showAllCommissions? undefined : initialExpandedPeriod
    }),
  });

  const commissionData = response?.data?.data;

  const togglePeriod = (periodId: string) => {
    if (expandedPeriod === periodId) {
      setExpandedPeriod(null);
      const newExpandedLevel = { ...expandedLevel };
      delete newExpandedLevel[periodId];
      setExpandedLevel(newExpandedLevel);
    } else {
      setExpandedPeriod(periodId);
      setExpandedLevel({});
    }
  };

  const toggleLevel = (periodId: string, level: 1 | 2) => {
    setExpandedLevel((prev) => ({
      ...prev,
      [periodId]: prev[periodId] === level ? null : level,
    }));
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "outline"> = {
      Open: "outline",
      Closed: "secondary",
      Paid: "default",
    };
    return (
      <Badge variant={variants[status] || "outline"}>
        {status}
      </Badge>
    );
  };

  const handleOrderClick = (orderId: string, orderBy: string) => {
    setSelectedOrderBy(orderBy);
    setSelectedOrderId(orderId);
    setShowOrderDialog(true);
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading commission history...</div>;
  }

  if (!commissionData || !commissionData.periods || commissionData.periods.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8 text-muted-foreground">
            No commission history found
          </div>
        </CardContent>
      </Card>
    );
  }

  const { totals, periods } = commissionData;
  const isFiltered = !showAllCommissions && !!(filterStartDate && filterEndDate);

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Commission History
              </CardTitle>
              <div className="text-sm text-muted-foreground">
                Weekly commission breakdown (Level 1: 25% | Level 2: 12%)
              </div>

              {!showAllCommissions && filterStartDate && filterEndDate && (
                <Button
                  variant="link"
                  className="h-auto p-0 mt-2 text-primary"
                  onClick={() => setShowAllCommissions(true)}
                >
                  View All Commissions
                </Button>
              )}
              {showAllCommissions && filterStartDate && filterEndDate && (
                <Button
                  variant="link"
                  className="h-auto p-0 mt-2 text-primary"
                  onClick={() => setShowAllCommissions(false)}
                >
                  Show Period Only ({format(new Date(filterStartDate),formatString)} -{" "}
                  {format(new Date(filterEndDate),formatString)})
                </Button>
              )}
            </div>

            <div className="text-right space-y-2 min-w-[200px] pl-4">
              <div className="text-sm font-medium text-muted-foreground">
                {isFiltered ? "Period Totals" : "Total Earnings"}
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm text-blue-700 dark:text-blue-300">Level 1:</span>
                  <span className="font-semibold text-blue-700 dark:text-blue-300">
                    {formatCurrency(totals.level1Total)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm text-green-700 dark:text-green-300">Level 2:</span>
                  <span className="font-semibold text-green-700 dark:text-green-300">
                    {formatCurrency(totals.level2Total)}
                  </span>
                </div>
                <div className="pt-2 border-t">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-medium">Total:</span>
                    <span className="font-bold text-lg">
                      {formatCurrency(totals.grandTotal)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          {periods.map((period) => {
            const periodId = period.periodId;
            const isExpanded = expandedPeriod === periodId;
            const expandedLevelForPeriod = expandedLevel[periodId];

            const start = period.startDate ? new Date(period.startDate) : null;
            const end = period.endDate ? new Date(period.endDate) : null;

          

            // Safely get level data with defaults
            const level1 = period.level1 || { totalCommission: 0, totalAmount: 0, orders: [] };
            const level2 = period.level2 || { totalCommission: 0, totalAmount: 0, orders: [] };

            return (
              <div key={periodId} className="border rounded-lg overflow-hidden">
                <div
                  className="p-4 bg-muted/50 cursor-pointer hover:bg-muted transition-colors"
                  onClick={() => togglePeriod(periodId)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                      <div>
                        <div className="font-semibold">
                          Week of{" "}
                          {period.startDate ? format(new Date(`${period.startDate.split("T")[0]}`), formatString) : "Unknown"} -{" "}
                          {period.endDate ? format(new Date(`${period.endDate.split("T")[0]}`), formatString) : "Unknown"}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Total: {formatCurrency(period.periodTotal || 0)}
                        </div>
                      </div>
                    </div>
                    {getStatusBadge(period.status || "Unknown")}
                  </div>
                </div>

                {isExpanded && (
                  <div className="p-4 space-y-3">
                    {/* Always show Level 1 */}
                    <div className="border rounded-lg overflow-hidden">
                      <div
                        className="p-3 bg-blue-50 dark:bg-blue-950/20 cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-950/30 transition-colors"
                        onClick={() => toggleLevel(periodId, 1)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {expandedLevelForPeriod === 1 ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                            <span className="font-medium">Level 1 Earnings (Personal Sales)</span>
                          </div>
                          <span className="font-semibold text-blue-700 dark:text-blue-300">
                            {formatCurrency(level1.totalCommission)}
                          </span>
                        </div>
                      </div>

                      {expandedLevelForPeriod === 1 && (
                        <div className="p-3">
                          {level1.orders.length > 0 ? (
                            <div className="space-y-2">
                              {level1.orders.map((order, idx) => (
                                <div key={idx} className="flex items-center justify-between p-2 border rounded">
                                  <div className="flex-1">
                                    <div className="font-medium">{order.buyerName || "Unknown"}</div>
                                    <div className="text-sm text-muted-foreground">
                                      {order.orderDate
                                        ? format(new Date(order.orderDate), formatString)
                                        : "Unknown date"}{" "}
                                      •
                                      <button
                                        onClick={() => handleOrderClick(order.orderId, order.orderBy)}
                                        className="ml-1 text-primary hover:underline"
                                      >
                                        Invoice #{order.orderNumber}
                                      </button>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <div className="font-medium">{formatCurrency(order.totalAmount)}</div>
                                    <div className="text-sm text-muted-foreground">
                                      Commission: {formatCurrency(order.commissionAmount)}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-4 text-muted-foreground">
                              No personal sales in this period
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Always show Level 2 */}
                    <div className="border rounded-lg overflow-hidden">
                      <div
                        className="p-3 bg-green-50 dark:bg-green-950/20 cursor-pointer hover:bg-green-100 dark:hover:bg-green-950/30 transition-colors"
                        onClick={() => toggleLevel(periodId, 2)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {expandedLevelForPeriod === 2 ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                            <span className="font-medium">Level 2 Earnings (Team Sales)</span>
                          </div>
                          <span className="font-semibold text-green-700 dark:text-green-300">
                            {formatCurrency(level2.totalCommission)}
                          </span>
                        </div>
                      </div>

                      {expandedLevelForPeriod === 2 && (
                        <div className="p-3">
                          {level2.orders.length > 0 ? (
                            <div className="space-y-2">
                              {level2.orders.map((order, idx) => (
                                <div key={idx} className="flex items-center justify-between p-2 border rounded">
                                  <div className="flex-1">
                                    <div className="font-medium">{order.buyerName || "Unknown"}</div>
                                    <div className="text-sm text-muted-foreground">
                                      {order.orderDate
                                        ? format(new Date(order.orderDate), formatString)
                                        : "Unknown date"}{" "}
                                      <button
                                        onClick={() => handleOrderClick(order.orderId, order.orderBy)}
                                        className="ml-1 text-primary hover:underline"
                                      >
                                        Invoice #{order.orderNumber}
                                      </button>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <div className="font-medium">{formatCurrency(order.totalAmount)}</div>
                                    <div className="text-sm text-muted-foreground">
                                      Commission: {formatCurrency(order.commissionAmount)}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-4 text-muted-foreground">
                              No team sales in this period
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      {selectedOrderId && (
        <OrderDetailDialog
          orderId={selectedOrderId}
          customerType={selectedOrderBy}
          open={showOrderDialog}
          onOpenChange={setShowOrderDialog}
        />
      )}
    </>
  );
}