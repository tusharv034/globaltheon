import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, ArrowUpDown, ArrowUp, ArrowDown, Loader2 } from "lucide-react";
import { AdjustmentsDialog } from "./adjustments-dialog";
import { readCommissionDetails } from "@/api/commission";
import { useUserRole } from "@/hooks/use-user-role";

interface PeriodBreakdownRowProps {
  periodId: string;
  startDate: string;
  endDate: string;
  periodNumber?: number;
  status?: string;
  onAffiliateCommissionClick?: (affiliateId: string, level: 1 | 2, weekStart: string) => void;
  onAffiliateClick?: (affiliateId: string) => void;
}

export function PeriodBreakdownRow({ periodId, startDate, endDate, periodNumber, status, onAffiliateCommissionClick, onAffiliateClick }: PeriodBreakdownRowProps) {

  // cpnst
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [adjustmentsOpen, setAdjustmentsOpen] = useState(false);
  const [selectedAffiliateId, setSelectedAffiliateId] = useState<string | undefined>();
  const [sortColumn, setSortColumn] = useState<"affiliateName" | "enrolledByName" | "levelOneCommission" | "levelTwoCommission" | "grossCommissions" | "adjustments" | "netCommissions">("affiliateName");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

const { isAffiliate } = useUserRole();

  const handleAdjustmentsClick = (affiliateId: string) => {
    setSelectedAffiliateId(affiliateId);
    setAdjustmentsOpen(true);
  };

  const handleAdjustmentsClose = (open: boolean) => {
    setAdjustmentsOpen(open);
    if (!open) {
      setSelectedAffiliateId(undefined);
    }
  };

  const { data: breakdown, isLoading } = useQuery({
    queryKey: ["period-breakdown", periodId, sortDirection, sortColumn, debouncedSearchTerm],
    queryFn: async () => {

      const payload = {
        periodId,
        searchTerm: debouncedSearchTerm,
        sortBy: sortColumn,
        sortOrder: sortDirection
      }

 

      const response = await readCommissionDetails(payload);

  

      return response.data.data;
    },
  });

  const handleSort = (column: typeof sortColumn) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const getSortIcon = (column: typeof sortColumn) => {
    if (sortColumn !== column) {
      return <ArrowUpDown className="h-4 w-4 ml-1" />;
    }
    return sortDirection === "asc" ? (
      <ArrowUp className="h-4 w-4 ml-1" />
    ) : (
      <ArrowDown className="h-4 w-4 ml-1" />
    );
  };

  const totals = breakdown?.reduce(
    (acc, item) => {
      // Safely get the level array (default to empty if missing)
      const levels = item.level ?? [];

      // Find level 1
      const levelOneItem = levels.find((lvl) => lvl.level === 1);
      const levelOneAmount = levelOneItem?.amount ?? 0;

      // Find level 2
      const levelTwoItem = levels.find((lvl) => lvl.level === 2);
      const levelTwoAmount = levelTwoItem?.amount ?? 0;

      return {
        levelOneCommission: acc.levelOneCommission + levelOneAmount,
        levelTwoCommission: acc.levelTwoCommission + levelTwoAmount,
        grossCommissions: acc.grossCommissions + (item.grossCommissions ?? 0),
        adjustments: acc.adjustments + (item.adjustments ?? 0),
        netCommissions: acc.netCommissions + (item.netCommissions ?? 0),
      };
    },
    {
      levelOneCommission: 0,
      levelTwoCommission: 0,
      grossCommissions: 0,
      adjustments: 0,
      netCommissions: 0,
    }
  );

  // Debounce the search term update
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500); // Delay of 500ms before updating the debounced search term

    return () => clearTimeout(timer); // Clear the timer when searchTerm changes before the timeout is complete
  }, [searchTerm]);

  return (
    <TableRow>
      <TableCell colSpan={9} className="p-0">
        <div className="bg-muted/50 p-4 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, affiliate ID, or enroller..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-background"
            />
          </div>

          {isLoading && (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-8">
                Loading breakdown...
              </TableCell>
            </TableRow>
          )}

          {!isLoading && (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block border rounded-lg bg-background overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>
                        <Button
                          variant="ghost"
                          className="h-auto p-0 font-semibold hover:bg-transparent"
                          onClick={() => handleSort("affiliateName")}
                        >
                          Name {getSortIcon("affiliateName")}
                        </Button>
                      </TableHead>
                      <TableHead>
                        <Button
                          variant="ghost"
                          className="h-auto p-0 font-semibold hover:bg-transparent"
                          onClick={() => handleSort("enrolledByName")}
                        >
                          Enroller {getSortIcon("enrolledByName")}
                        </Button>
                      </TableHead>
                      <TableHead className="text-right">
                        <Button
                          variant="ghost"
                          className="h-auto p-0 font-semibold hover:bg-transparent"
                          onClick={() => handleSort("levelOneCommission")}
                        >
                          Level 1 Commissions {getSortIcon("levelOneCommission")}
                        </Button>
                      </TableHead>
                      <TableHead className="text-right">
                        <Button
                          variant="ghost"
                          className="h-auto p-0 font-semibold hover:bg-transparent"
                          onClick={() => handleSort("levelTwoCommission")}
                        >
                          Level 2 Commissions {getSortIcon("levelTwoCommission")}
                        </Button>
                      </TableHead>
                      <TableHead className="text-right">
                        <Button
                          variant="ghost"
                          className="h-auto p-0 font-semibold hover:bg-transparent"
                          onClick={() => handleSort("grossCommissions")}
                        >
                          Gross Commissions {getSortIcon("grossCommissions")}
                        </Button>
                      </TableHead>
                      <TableHead className="text-right">
                        <Button
                          variant="ghost"
                          className="h-auto p-0 font-semibold hover:bg-transparent"
                          onClick={() => handleSort("adjustments")}
                        >
                          Adjustments {getSortIcon("adjustments")}
                        </Button>
                      </TableHead>
                      <TableHead className="text-right">
                        <Button
                          variant="ghost"
                          className="h-auto p-0 font-semibold hover:bg-transparent"
                          onClick={() => handleSort("netCommissions")}
                        >
                          Net Commissions {getSortIcon("netCommissions")}
                        </Button>
                      </TableHead>
                      <TableHead className="text-center">Tipalti</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {breakdown?.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                          No commissions found for this period.
                        </TableCell>
                      </TableRow>
                    ) : (
                      <>
                        {breakdown?.map((item: any) => (
                          <TableRow
                            key={item.affiliateId}
                            className={!item.tipaltiEnabled ? "bg-destructive/10" : ""}
                          >
                            <TableCell>
                              {onAffiliateClick ? (
                                <Button
                                  variant="link"
                                  className="h-auto p-0 font-normal text-foreground hover:text-primary"
                                  onClick={() => onAffiliateClick(item.affiliateId)}
                                >
                                  {item.affiliateName}
                                </Button>
                              ) : (
                                `${item.affiliateName}`
                              )}
                            </TableCell>
                            <TableCell>
                              {onAffiliateClick && item.enrolledBy ? (
                                <Button
                                  variant="link"
                                  className={`h-auto p-0 font-normal text-foreground hover:text-primary ${isAffiliate && "text-foreground"}`}
                                  // disabled={isAffiliate}
                                  onClick={() => {
                                    if(isAffiliate) return;
                                    onAffiliateClick(item.enrolledBy)
                                  }}
                                >
                                  {item.enrolledByName}
                                </Button>
                              ) : (
                                item.enrolledByName
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              {onAffiliateCommissionClick ? (
                                <Button
                                  variant="link"
                                  className="h-auto p-0 font-normal text-foreground hover:text-primary"
                                  onClick={() => onAffiliateCommissionClick(item.affiliateId, 1, startDate)}
                                >
                                  {formatCurrency(
                                    item.level.find((levelItem) => levelItem.level === 1)?.amount || 0
                                  )}

                                  {/* {formatCurrency(903740923)} */}
                                </Button>
                              ) : (
                                formatCurrency(
                                  item?.level?.find((levelItem) => levelItem.level === 1)?.amount || 0
                                )
                              )}


                            </TableCell>
                            <TableCell className="text-right">
                              {onAffiliateCommissionClick ? (
                                <Button
                                  variant="link"
                                  className="h-auto p-0 font-normal text-foreground hover:text-primary"
                                  onClick={() => onAffiliateCommissionClick(item.affiliateId, 2, startDate)}
                                >
                                  {formatCurrency(
                                    item.level.find((levelItem) => levelItem.level === 2)?.amount || 0
                                  )}
                                </Button>
                              ) : (
                                formatCurrency(
                                  item.level.find((levelItem) => levelItem.level === 2)?.amount || 0
                                )
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              {formatCurrency(item.grossCommissions)}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="link"
                                className="h-auto p-0 font-normal text-foreground hover:text-primary"
                                onClick={() => {
                                  if(isAffiliate) return;
                                  handleAdjustmentsClick(item.affiliateId)
                                }}
                              >
                                {formatCurrency(item.adjustments)}
                              </Button>
                            </TableCell>
                            <TableCell className="text-right font-semibold">
                              {formatCurrency(item.netCommissions)}
                            </TableCell>
                            <TableCell className="text-center">
                              {item.tipaltiEnabled ? "Yes" : "No"}
                            </TableCell>
                          </TableRow>
                        ))}
                        {totals && (
                          <TableRow className="font-bold bg-muted/50">
                            <TableCell colSpan={2}>Total</TableCell>
                            <TableCell className="text-right">
                              {formatCurrency(totals.levelOneCommission)}
                            </TableCell>
                            <TableCell className="text-right">
                              {formatCurrency(totals.levelTwoCommission)}
                            </TableCell>
                            <TableCell className="text-right">
                              {formatCurrency(totals.grossCommissions)}
                            </TableCell>
                            <TableCell className="text-right">
                              {formatCurrency(totals.adjustments)}
                            </TableCell>
                            <TableCell className="text-right">
                              {formatCurrency(totals.netCommissions)}
                            </TableCell>
                            <TableCell></TableCell>
                          </TableRow>
                        )}
                      </>
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden space-y-3">
                {breakdown?.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No commissions found for this period.
                  </div>
                ) : (
                  <>
                    {breakdown?.map((item) => (
                      <div
                        key={item.affiliateId}
                        className={`border rounded-lg p-4 space-y-3 ${!item.tipaltiEnabled ? "bg-destructive/10" : "bg-background"}`}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            {onAffiliateClick ? (
                              <Button
                                variant="link"
                                className="h-auto p-0 font-medium text-foreground hover:text-primary text-left"
                                onClick={() => onAffiliateClick(item.affiliateId)}
                              >
                                {item.affiliateName}
                              </Button>
                            ) : (
                              <p className="font-medium">{item.affiliateName}</p>
                            )}
                            <p className="text-sm text-muted-foreground mt-1">
                              Enroller: {item.enrolleByName}
                            </p>
                          </div>
                          {!item.tipaltiEnabled && (
                            <span className="text-xs bg-destructive text-destructive-foreground px-2 py-1 rounded">
                              No Tipalti
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <p className="text-muted-foreground">Level 1</p>
                            <p className="font-semibold">
                              {formatCurrency(item.levelOneCommission)}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Level 2</p>
                            <p className="font-semibold">
                              {formatCurrency(item.levelTwoCommission)}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Gross</p>
                            <p className="font-semibold">
                              {formatCurrency(item.grossCommissions)}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Adjustments</p>
                            <Button
                              variant="link"
                              className="h-auto p-0 font-semibold text-foreground hover:text-primary"
                              onClick={() => handleAdjustmentsClick(item.affiliateId)}
                            >
                              {formatCurrency(item.adjustments)}
                            </Button>
                          </div>
                        </div>

                        <div className="pt-2 border-t">
                          <p className="text-sm text-muted-foreground">Net Commissions</p>
                          <p className="text-lg font-bold">
                            {formatCurrency(item.netCommissions)}
                          </p>
                        </div>
                      </div>
                    ))}

                    {totals && (
                      <div className="border-2 rounded-lg p-4 bg-muted/50">
                        <p className="font-semibold mb-3">Totals</p>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <p className="text-muted-foreground">Level 1</p>
                            <p className="font-semibold">
                              {formatCurrency(totals.levelOneCommission)}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Level 2</p>
                            <p className="font-semibold">
                              {formatCurrency(totals.levelTwoCommission)}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Gross</p>
                            <p className="font-semibold">
                              {formatCurrency(totals.grossCommissions)}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Adjustments</p>
                            <p className="font-semibold">
                              {formatCurrency(totals.adjustments)}
                            </p>
                          </div>
                        </div>
                        <div className="pt-3 mt-3 border-t">
                          <p className="text-sm text-muted-foreground">Net Total</p>
                          <p className="text-lg font-bold">
                            {formatCurrency(totals.netCommissions)}
                          </p>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

            </>
          )}
        </div>

        <AdjustmentsDialog
          period={{
            _id: periodId,
            periodNumber: periodNumber || 0,
            displayInBackoffice: true,
            status: status || "open",
            startDate: startDate,
            endDate: endDate,
            totalAffiliateCommissions: 0,
            totalAdjustments: 0,
            totalCommissions: 0,
            notes: null,
          }}
          open={adjustmentsOpen}
          onOpenChange={handleAdjustmentsClose}
          affiliateId={selectedAffiliateId}
        />
      </TableCell>
    </TableRow>
  );
}
