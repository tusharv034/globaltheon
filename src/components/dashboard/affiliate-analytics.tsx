import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MetricCard } from "@/components/ui/metric-card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Users, TrendingUp, DollarSign, UserPlus, ShoppingCart, UserCheck, Calendar as CalendarIcon, Loader2 } from "lucide-react";
import { useState, useMemo } from "react";
import { format, startOfWeek, isValid, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, subWeeks, subMonths, subYears } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useModulePermissions } from "@/hooks/use-module-permissions";
import { useDateFormatStore } from "@/store/useDateFormat";
import { getDateFormatString } from "@/utils/resolveDateFormat";
import { readAffiliateAnalytics, readAffiliateLeaderboard } from "@/api/affiliate";

export function AffiliateAnalytics() {

  // state to check whether the current user has permissions or not
  const { hasPermission } = useModulePermissions();

  // state to store date range filter in Affiliate Leaderboard
  const [dateRange, setDateRange] = useState("this-week");

  // state to store the Custom Date From
  const [customDateFrom, setCustomDateFrom] = useState<Date>();
  // state to store the Custom Date To
  const [customDateTo, setCustomDateTo] = useState<Date>();

  // state to toggle Custom Date Range selector
  const [isCustomRangeOpen, setIsCustomRangeOpen] = useState(false);

  // state to store the limit
  const [topLimit, setTopLimit] = useState("5");

  // state to store the date format region and variant
  const { dateFormatRegion, dateFormatVariant } = useDateFormatStore();

  // state to store the formatted date
  const formatString = getDateFormatString(dateFormatRegion, dateFormatVariant);

  // function to handle the event of changing date range
  const handleDateRangeChange = (value: string) => {
    setDateRange(value);
    if (value !== "custom") {
      setIsCustomRangeOpen(false);
    } else {
      setIsCustomRangeOpen(true);
    }
  };

  const [metric, setMetric] = useState("sales");

  // Calculate date range for filtering

  const { startDate, endDate } = useMemo(() => {
    const now = new Date();

    let year: number, month: number, day: number;

    switch (dateRange) {
      case 'this-week': {
        const dayOfWeek = now.getDay();
        const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        const monday = new Date(now);
        monday.setDate(now.getDate() - daysToMonday);

        year = monday.getFullYear();
        month = monday.getMonth();
        day = monday.getDate();

        const start = new Date(Date.UTC(year, month, day, 0, 0, 0, 0));

        const sunday = new Date(start);
        sunday.setUTCDate(sunday.getUTCDate() + 6);

        const end = new Date(Date.UTC(
          sunday.getUTCFullYear(),
          sunday.getUTCMonth(),
          sunday.getUTCDate(),
          23, 59, 59, 999
        ));

        return { startDate: start.toISOString(), endDate: end.toISOString() };
      }

      case 'last-week': {
        const dayOfWeek = now.getDay();
        const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        const thisMonday = new Date(now);
        thisMonday.setDate(now.getDate() - daysToMonday);

        const lastMonday = new Date(thisMonday);
        lastMonday.setDate(thisMonday.getDate() - 7);

        year = lastMonday.getFullYear();
        month = lastMonday.getMonth();
        day = lastMonday.getDate();

        const start = new Date(Date.UTC(year, month, day, 0, 0, 0, 0));

        const lastSunday = new Date(start);
        lastSunday.setUTCDate(lastSunday.getUTCDate() + 6);

        const end = new Date(Date.UTC(
          lastSunday.getUTCFullYear(),
          lastSunday.getUTCMonth(),
          lastSunday.getUTCDate(),
          23, 59, 59, 999
        ));

        return { startDate: start.toISOString(), endDate: end.toISOString() };
      }

      case 'this-month': {
        year = now.getFullYear();
        month = now.getMonth();
        const start = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0));

        const nextMonth = new Date(Date.UTC(year, month + 1, 1, 0, 0, 0, 0));
        const end = new Date(nextMonth.getTime() - 1);
        end.setUTCHours(23, 59, 59, 999);

        return { startDate: start.toISOString(), endDate: end.toISOString() };
      }

      case 'last-month': {
        year = now.getFullYear();
        month = now.getMonth() - 1;
        if (month < 0) {
          month = 11;
          year--;
        }
        const start = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0));

        const nextMonth = new Date(Date.UTC(year, month + 1, 1, 0, 0, 0, 0));
        const end = new Date(nextMonth.getTime() - 1);
        end.setUTCHours(23, 59, 59, 999);

        return { startDate: start.toISOString(), endDate: end.toISOString() };
      }

      case 'this-year': {
        year = now.getFullYear();
        const start = new Date(Date.UTC(year, 0, 1, 0, 0, 0, 0));
        const end = new Date(Date.UTC(year + 1, 0, 1, 0, 0, 0, 0));
        end.setTime(end.getTime() - 1);
        end.setUTCHours(23, 59, 59, 999);

        return { startDate: start.toISOString(), endDate: end.toISOString() };
      }

      case 'last-year': {
        year = now.getFullYear() - 1;
        const start = new Date(Date.UTC(year, 0, 1, 0, 0, 0, 0));
        const end = new Date(Date.UTC(year + 1, 0, 1, 0, 0, 0, 0));
        end.setTime(end.getTime() - 1);
        end.setUTCHours(23, 59, 59, 999);

        return { startDate: start.toISOString(), endDate: end.toISOString() };
      }

      case 'custom': {
        const from = customDateFrom ? new Date(customDateFrom) : now;
        const to = customDateTo ? new Date(customDateTo) : now;

        const start = new Date(Date.UTC(
          from.getFullYear(),
          from.getMonth(),
          from.getDate(),
          0, 0, 0, 0
        ));

        const end = new Date(Date.UTC(
          to.getFullYear(),
          to.getMonth(),
          to.getDate(),
          23, 59, 59, 999
        ));

        return { startDate: start.toISOString(), endDate: end.toISOString() };
      }

      default:
        return (() => {
          const dayOfWeek = now.getDay();
          const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
          const monday = new Date(now);
          monday.setDate(now.getDate() - daysToMonday);

          year = monday.getFullYear();
          month = monday.getMonth();
          day = monday.getDate();

          const start = new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
          const sunday = new Date(start);
          sunday.setUTCDate(sunday.getUTCDate() + 6);

          const end = new Date(Date.UTC(
            sunday.getUTCFullYear(),
            sunday.getUTCMonth(),
            sunday.getUTCDate(),
            23, 59, 59, 999
          ));

          return { startDate: start.toISOString(), endDate: end.toISOString() };
        })();
    }
  }, [dateRange, customDateFrom, customDateTo]);

  // Safe date formatter to prevent "Invalid time value" errors
  const safeFormatDate = (dateString: string | null | undefined, formatStr: string = "MMM d, yyyy"): string => {
    console.log('date string before check is ', dateString);
    if (!dateString) return "-";

    console.log('date string after check is ', dateString);
  
    const date = new Date(dateString);
    if (!isValid(date)) return "-";
  
    try {
      return format(date, formatStr);
    } catch (error) {
      console.error("Error formatting date:", error);
      return "-";
    }
  };

  // Fetch affiliates data
  const { data: affiliates = [] } = useQuery({
    queryKey: ['affiliates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('affiliates')
        .select('*');

      if (error) throw error;
      return data || [];
    },
  });

  // Fetch commissions data with date filtering
  const { data: commissions = [] } = useQuery({
    queryKey: ['commissions', startDate, endDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('order_commissions')
        .select('affiliate_id, commission_amount, created_at')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (error) throw error;
      return data || [];
    },
  });

  // Fetch customers data with date filtering
  const { data: customers = [] } = useQuery({
    queryKey: ['customers', startDate, endDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customers')
        .select('enrolled_by, created_at')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (error) throw error;
      return data || [];
    },
  });

  // Fetch downline affiliates with date filtering
  const { data: downlineAffiliates = [] } = useQuery({
    queryKey: ['downline-affiliates', startDate, endDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('affiliates')
        .select('enrolled_by, created_at')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (error) throw error;
      return data || [];
    },
  });

  // Fetch orders to calculate actual sales
  const { data: orders = [] } = useQuery({
    queryKey: ['orders', startDate, endDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*, customers!inner(enrolled_by)')
        .gte('order_date', startDate.toISOString())
        .lte('order_date', endDate.toISOString());

      if (error) throw error;
      return data || [];
    },
  });

  const { data: affiliateAnalytics, isLoading: affiliateAnalyticsLoading } = useQuery({
    queryKey: ["affiliate-analytics", metric, topLimit, startDate, endDate],
    queryFn: async () => {

      const payload = {
        metric,
        startDate,
        endDate,
        limit: topLimit
      };

      // console.log("leaderboard payload is ", payload);


      const response = await readAffiliateLeaderboard(payload);

      // console.log("readAffiliateLeaderboard response is ", response);
      // console.log("readAffiliateLeaderboard response is ", response.data.data);

      return response.data.data;
    }
  })

  const { data: affiliateCards, isLoading: affiliateCardsLoading } = useQuery({
    queryKey: ["affiliate-cards"],
    queryFn: async () => {

      const response = await readAffiliateAnalytics();

      console.log("affiliateCards response is ", response);

      return response.data.data;
    }
  })


  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex items-center gap-2">
        <Users className="h-5 w-5 md:h-6 md:w-6 text-primary" />
        <h2 className="text-xl md:text-2xl font-bold text-foreground">Affiliate Program Analytics</h2>
      </div>

      {/* Commission Breakdown */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="New Affiliates"
          value={affiliateCards?.affiliateCountThisMonth || 0}
          className="border-l-4 border-l-primary"
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <UserPlus className="h-4 w-4 text-primary" />
              <span className="text-sm text-muted-foreground">Last week {affiliateCards?.affiliateCountThisWeek || 0}</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              <span className="text-sm text-muted-foreground">Last month {affiliateCards?.affiliateCountLastMonth || 0}</span>
            </div>
          </div>
        </MetricCard>

        <MetricCard
          title="Active Affiliate Rate"
          value={`${affiliateCards?.activePercentageThisMonth.toFixed(2) || 0}%`}
          className="border-l-4 border-l-secondary"
          tooltipText="Percentage of affiliates with at least 1 sale in the last 30 days"
        >
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-success" />
              <span className="text-sm text-muted-foreground">+{affiliateCards?.percentageDifference.toFixed(2) || 0}% vs prior period</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Active: {affiliateCards?.activeAffiliatesThisMonth.toFixed(2) || 0}</span>
              <span className="text-muted-foreground">Inactive: {affiliateCards?.inactiveAffiliatesThisMonth.toFixed(2) || 0}</span>
            </div>
          </div>
        </MetricCard>

        <MetricCard
          title="Affiliate Sales Revenue"
          // value={`$${affiliateCards?.affiliateSalesThisMonth.toFixed(2) || 0}`}
          value={`$${affiliateCards?.affiliateSalesThisMonth.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || 0}`} 
          className="border-l-4 border-l-success"
        >
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-success" />
              <span className="text-sm text-muted-foreground">+{affiliateCards?.salesPercentageDifference.toFixed(2) || 0}% vs last month</span>
            </div>
            <div className="text-sm text-muted-foreground">
              Total affiliate-attributed sales
            </div>
          </div>
        </MetricCard>

        <MetricCard
          title="Pending Payouts"
          value={`$${affiliateCards?.closedNoPayoutAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || 0}`} 
          className="border-l-4 border-l-warning"
        >
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-warning" />
                <span className="text-sm text-muted-foreground">Due in {affiliateCards?.daysRemainingForNextPayout || 0} days</span>
              </div>
              <TrendingUp className="h-4 w-4 text-success" />
            </div>
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-success" />
              <span className="text-sm text-muted-foreground">${affiliateCards?.paidCommissionsAmount.toFixed(2) || 0} Last Week</span>
            </div>
          </div>
        </MetricCard>
      </div>

      {/* Affiliate Leaderboard */}
      {hasPermission("dashboard_module_permissions", "view_affiliate_leaderboard", "view") && (
        <Card>
          <CardHeader className="p-4 md:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                <TrendingUp className="h-4 w-4 md:h-5 md:w-5" />
                Affiliate Leaderboard
              </CardTitle>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <Select value={topLimit} onValueChange={setTopLimit}>
                  <SelectTrigger className="w-full sm:w-[140px] h-10 md:h-9">
                    <SelectValue placeholder="Show top" />
                  </SelectTrigger>
                  <SelectContent className="z-50 bg-background">
                    <SelectItem value="5">Top 5</SelectItem>
                    <SelectItem value="10">Top 10</SelectItem>
                    <SelectItem value="15">Top 15</SelectItem>
                    <SelectItem value="20">Top 20</SelectItem>
                    <SelectItem value="25">Top 25</SelectItem>
                    <SelectItem value="all">All</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={dateRange} onValueChange={handleDateRangeChange}>
                  <SelectTrigger className="w-full sm:w-[180px] h-10 md:h-9">
                    <SelectValue placeholder="Select period" />
                  </SelectTrigger>
                  <SelectContent className="z-50 bg-background">
                    <SelectItem value="this-week">This Week</SelectItem>
                    <SelectItem value="last-week">Last Week</SelectItem>
                    <SelectItem value="this-month">This Month</SelectItem>
                    <SelectItem value="last-month">Last Month</SelectItem>
                    <SelectItem value="this-year">This Year</SelectItem>
                    <SelectItem value="last-year">Last Year</SelectItem>
                    <SelectItem value="custom">Custom Range</SelectItem>
                  </SelectContent>
                </Select>

                {dateRange === "custom" && (
                  <Popover open={isCustomRangeOpen} onOpenChange={setIsCustomRangeOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full sm:w-[240px] h-10 md:h-9 justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {customDateFrom && customDateTo ? (
                          <>
                            {format(customDateFrom, formatString)} - {format(customDateTo, formatString)}
                          </>
                        ) : (
                          <span>Pick date range</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 z-50 bg-background" align="end">
                      <div className="p-3 space-y-3">
                        <div>
                          <p className="text-sm font-medium mb-2">From</p>
                          <Calendar
                            mode="single"
                            selected={customDateFrom}
                            onSelect={setCustomDateFrom}
                            initialFocus
                          />
                        </div>
                        <div>
                          <p className="text-sm font-medium mb-2">To</p>
                          <Calendar
                            mode="single"
                            selected={customDateTo}
                            onSelect={setCustomDateTo}
                            initialFocus
                          />
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 md:p-6">
            <Tabs defaultValue="sales" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-4 md:mb-6 h-auto">

                <TabsTrigger value="sales" className="flex items-center gap-1 md:gap-2 text-xs md:text-sm py-2 md:py-1.5" onClick={() => setMetric("sales")}>
                  <DollarSign className="h-3 w-3 md:h-4 md:w-4" />
                  <span className="hidden sm:inline">Sales</span>
                  <span className="sm:hidden">$</span>
                </TabsTrigger>

                <TabsTrigger value="customers" className="flex items-center gap-1 md:gap-2 text-xs md:text-sm py-2 md:py-1.5" onClick={() => setMetric("customers")}>
                  <UserCheck className="h-3 w-3 md:h-4 md:w-4" />
                  <span className="hidden sm:inline">Customers</span>
                  <span className="sm:hidden">👥</span>
                </TabsTrigger>

                <TabsTrigger value="affiliates" className="flex items-center gap-1 md:gap-2 text-xs md:text-sm py-2 md:py-1.5" onClick={() => setMetric("affiliates")}>
                  <UserPlus className="h-3 w-3 md:h-4 md:w-4" />
                  <span className="hidden sm:inline">Affiliates</span>
                  <span className="sm:hidden">+</span>
                </TabsTrigger>

              </TabsList>

              <TabsContent value="sales" className="space-y-3 md:space-y-4">
                {affiliateAnalyticsLoading && (
                  <div className="w-full flex justify-center items-center">
                    <Loader2 />
                  </div>
                )}
                {!affiliateAnalyticsLoading && !affiliateAnalytics?.leaderboard?.length && (
                  <>
                    <div className="w-full text-center">No Affiliates found</div>
                  </>
                )}
                {!affiliateAnalyticsLoading && affiliateAnalytics?.leaderboard?.map((affiliate: any, index: number) => (
                    <div key={affiliate.name} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 md:p-4 border rounded-lg hover:bg-muted/50 transition-colors gap-3 sm:gap-4">
                      <div className="flex items-start gap-3 md:gap-4 flex-1 min-w-0">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm md:text-base truncate">{affiliate.name}</div>
                          <div className="flex flex-wrap items-center gap-2 md:gap-3 text-xs md:text-sm text-muted-foreground mt-1">
                            <span className="flex items-center gap-1">
                              <Badge variant="outline" className="text-xs">{affiliate.state}</Badge>
                            </span>
                            {/* <span className="whitespace-nowrap">Enrolled: {affiliate?.enrolledDate}</span> */}
                            <span className="whitespace-nowrap">Enrolled: {safeFormatDate(affiliate?.enrolledDate, formatString)}</span>
                            <span className="truncate">By: {affiliate.enrollerName}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-left sm:text-right flex-shrink-0">
                        <div className="font-semibold text-base md:text-lg">{affiliate.sales}</div>
                        <div className="text-xs md:text-sm text-muted-foreground">Total sales</div>
                      </div>
                    </div>
                  ))}
              </TabsContent>

              <TabsContent value="customers" className="space-y-3 md:space-y-4">
                {affiliateAnalyticsLoading && (
                  <div className="w-full flex justify-center items-center">
                    <Loader2 />
                  </div>
                )}
                {!affiliateAnalyticsLoading && !affiliateAnalytics?.leaderboard?.length && (
                  <>
                    <div className="w-full text-center">No Affiliates found</div>
                  </>
                )}
                {!affiliateAnalyticsLoading && affiliateAnalytics?.leaderboard?.map((affiliate: any, index: number) => (
                    <div key={affiliate.name} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 md:p-4 border rounded-lg hover:bg-muted/50 transition-colors gap-3 sm:gap-4">
                      <div className="flex items-start gap-3 md:gap-4 flex-1 min-w-0">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm md:text-base truncate">{affiliate.name}</div>
                          <div className="flex flex-wrap items-center gap-2 md:gap-3 text-xs md:text-sm text-muted-foreground mt-1">
                            <span className="flex items-center gap-1">
                              <Badge variant="outline" className="text-xs">{affiliate.state}</Badge>
                            </span>
                            <span className="whitespace-nowrap">Enrolled: {safeFormatDate(affiliate?.enrolledDate, formatString)}</span>
                            <span className="truncate">By: {affiliate.enrollerName}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-left sm:text-right flex-shrink-0">
                        <div className="font-semibold text-base md:text-lg">{affiliate.customers}</div>
                        <div className="text-xs md:text-sm text-muted-foreground">New customers</div>
                      </div>
                    </div>
                  ))}
              </TabsContent>

              <TabsContent value="affiliates" className="space-y-3 md:space-y-4">
                {affiliateAnalyticsLoading && (
                  <div className="w-full flex justify-center items-center">
                    <Loader2 />
                  </div>
                )}
                {!affiliateAnalyticsLoading && !affiliateAnalytics?.leaderboard?.length && (
                  <>
                    <div className="w-full text-center">No Affiliates found</div>
                  </>
                )}
                {!affiliateAnalyticsLoading && affiliateAnalytics?.leaderboard?.map((affiliate: any, index: number) => (
                    <div key={affiliate?.name} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 md:p-4 border rounded-lg hover:bg-muted/50 transition-colors gap-3 sm:gap-4">
                      <div className="flex items-start gap-3 md:gap-4 flex-1 min-w-0">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm md:text-base truncate">{affiliate.name}</div>
                          <div className="flex flex-wrap items-center gap-2 md:gap-3 text-xs md:text-sm text-muted-foreground mt-1">
                            <span className="flex items-center gap-1">
                              <Badge variant="outline" className="text-xs">{affiliate.state}</Badge>
                            </span>
                            <span className="whitespace-nowrap">Enrolled: {safeFormatDate(affiliate?.enrolledDate, formatString)}</span>
                            <span className="truncate">By: {affiliate.enrollerName}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-left sm:text-right flex-shrink-0">
                        <div className="font-semibold text-base md:text-lg">{affiliate.affiliates}</div>
                        <div className="text-xs md:text-sm text-muted-foreground">New affiliates</div>
                      </div>
                    </div>
                  ))}
              </TabsContent>

            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
}