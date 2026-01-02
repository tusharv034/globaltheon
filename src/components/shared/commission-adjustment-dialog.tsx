import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { format, parseISO } from "date-fns";
import { formatCurrency } from "@/lib/utils";

interface CommissionImpact {
  level: 1 | 2;
  periodStatus: 'open' | 'closed_unpaid' | 'closed_paid';
  orderCount: number;
  orderNumbers: string[];
  orderIds: string[];
  orders: Array<{
    orderId: string;
    orderNumber: string;
    orderDate: string;
    commissionAmount: number;
    periodStart: string;
    periodEnd: string;
  }>;
  totalCommissionAmount: number;
  oldAffiliateName: string;
  oldAffiliateId: string;
  newAffiliateName: string;
  newAffiliateId: string;
}

interface CommissionAdjustmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entityName: string; // Customer or Affiliate name being changed
  impacts: CommissionImpact[];
  onConfirm: (approvedImpacts: CommissionImpact[], selectedOrderIds: string[], note?: string) => void;
  onCancel: () => void;
  onViewOrder?: (orderId: string) => void;
}

export function CommissionAdjustmentDialog({
  open,
  onOpenChange,
  entityName,
  impacts,
  onConfirm,
  onCancel,
  onViewOrder,
}: CommissionAdjustmentDialogProps) {
  const [note, setNote] = useState("");
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());

  // Generate unique key for each order that includes level to keep selections independent
  const getOrderKey = (orderId: string, level: number) => `${level}-${orderId}`;

  const handleToggleOrder = (orderId: string, level: number) => {
    const key = getOrderKey(orderId, level);
    setSelectedOrders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  };

  const handleToggleAllOrdersInImpact = (impact: CommissionImpact) => {
    const allSelected = impact.orders.every(o => selectedOrders.has(getOrderKey(o.orderId, impact.level)));
    setSelectedOrders(prev => {
      const newSet = new Set(prev);
      impact.orders.forEach(order => {
        const key = getOrderKey(order.orderId, impact.level);
        if (allSelected) {
          newSet.delete(key);
        } else {
          newSet.add(key);
        }
      });
      return newSet;
    });
  };

  const handleConfirm = () => {
    // Filter impacts to only include orders that are selected
    const impactsWithSelectedOrders = impacts.map(impact => ({
      ...impact,
      orders: impact.orders.filter(o => selectedOrders.has(getOrderKey(o.orderId, impact.level))),
      orderIds: impact.orders.filter(o => selectedOrders.has(getOrderKey(o.orderId, impact.level))).map(o => o.orderId),
      orderNumbers: impact.orders.filter(o => selectedOrders.has(getOrderKey(o.orderId, impact.level))).map(o => o.orderNumber),
      orderCount: impact.orders.filter(o => selectedOrders.has(getOrderKey(o.orderId, impact.level))).length,
      totalCommissionAmount: impact.orders
        .filter(o => selectedOrders.has(getOrderKey(o.orderId, impact.level)))
        .reduce((sum, o) => sum + o.commissionAmount, 0)
    })).filter(impact => impact.orderCount > 0);

    // Extract unique order IDs for the callback (without level prefix)
    const uniqueOrderIds = Array.from(new Set(
      impactsWithSelectedOrders.flatMap(impact => impact.orderIds)
    ));

    onConfirm(impactsWithSelectedOrders, uniqueOrderIds, note.trim() || undefined);
    setNote("");
    setSelectedOrders(new Set());
    onOpenChange(false);
  };

  const handleCancelClick = () => {
    setNote("");
    setSelectedOrders(new Set());
    onCancel();
  };

  // Group impacts by level and period status
  const level1OpenUnpaid = impacts.filter(i => i.level === 1 && (i.periodStatus === 'open' || i.periodStatus === 'closed_unpaid'));
  const level2OpenUnpaid = impacts.filter(i => i.level === 2 && (i.periodStatus === 'open' || i.periodStatus === 'closed_unpaid'));
  const level1Paid = impacts.filter(i => i.level === 1 && i.periodStatus === 'closed_paid');
  const level2Paid = impacts.filter(i => i.level === 2 && i.periodStatus === 'closed_paid');

  const renderOrderList = (impact: CommissionImpact) => {
    const allOrdersSelected = impact.orders.every(o => selectedOrders.has(getOrderKey(o.orderId, impact.level)));

    return (
      <div className="mt-3 space-y-2">
        <div className="flex items-center gap-2 mb-2">
          <Checkbox
            id={`select-all-${getImpactKey(impact)}`}
            checked={allOrdersSelected}
            onCheckedChange={() => handleToggleAllOrdersInImpact(impact)}
          />
          <Label htmlFor={`select-all-${getImpactKey(impact)}`} className="text-sm font-medium cursor-pointer">
            Select all orders
          </Label>
        </div>
        <div className="space-y-1 pl-6">
          {impact.orders.map(order => {
            const orderKey = getOrderKey(order.orderId, impact.level);
            return (
              <div key={orderKey} className="flex items-center gap-2">
                <Checkbox
                  id={`order-${orderKey}`}
                  checked={selectedOrders.has(orderKey)}
                  onCheckedChange={() => handleToggleOrder(order.orderId, impact.level)}
                />
                <Label htmlFor={`order-${orderKey}`} className="text-sm cursor-pointer flex items-center gap-2 flex-1">
                  <button
                    type="button"
                    onClick={() => onViewOrder?.(order.orderId)}
                    className="text-primary hover:underline font-medium"
                  >
                    Order #{order.orderNumber}
                  </button>
                  <span className="text-muted-foreground">
                    - Commission Period: {order.periodStart} - {order.periodEnd}
                  </span>
                  <span className="ml-auto font-medium">
                    {formatCurrency(order.commissionAmount)}
                  </span>
                </Label>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const getImpactKey = (impact: CommissionImpact) => 
    `${impact.level}-${impact.periodStatus}-${impact.oldAffiliateId}`;

  const getPeriodStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return <Badge variant="default">Open</Badge>;
      case 'closed_unpaid':
        return <Badge variant="secondary">Closed (Unpaid)</Badge>;
      case 'closed_paid':
        return <Badge variant="outline">Closed (Paid)</Badge>;
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Commission Adjustment Required</DialogTitle>
          <DialogDescription>
            Changing the enrolling affiliate for <strong>{entityName}</strong> will affect existing commissions. 
            Please review and approve the adjustments below.
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="max-h-[50vh] pr-4">
          <div className="space-y-6">
            {/* Show message if no impacts */}
            {impacts.length === 0 && (
              <div className="border rounded-lg p-4 bg-muted/50">
                <p className="text-sm text-muted-foreground">
                  No commission adjustments are required for this change. All affected orders are in periods where commissions can be updated automatically.
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  You can proceed with the enrolling affiliate change by clicking "Proceed Without Adjustments" below.
                </p>
              </div>
            )}

            {/* Level 1 - Open/Unpaid Periods */}
            {level1OpenUnpaid.map((impact, idx) => (
              <div key={getImpactKey(impact)} className="border rounded-lg p-4 space-y-3">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <Label className="font-semibold">
                      Level 1 Commission Transfer
                    </Label>
                    {getPeriodStatusBadge(impact.periodStatus)}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    <strong>{impact.oldAffiliateName}</strong> has <strong>{impact.orderCount}</strong> order{impact.orderCount !== 1 ? 's' : ''} with 
                    Level 1 commissions totaling <strong>{formatCurrency(impact.totalCommissionAmount)}</strong> in {impact.periodStatus === 'open' ? 'open' : 'closed and unpaid'} commission periods.
                  </p>
                  <p className="text-sm">
                    Select orders to transfer commissions to <strong>{impact.newAffiliateName}</strong>:
                  </p>
                  {renderOrderList(impact)}
                </div>
              </div>
            ))}

            {/* Level 2 - Open/Unpaid Periods */}
            {level2OpenUnpaid.map((impact, idx) => (
              <div key={getImpactKey(impact)} className="border rounded-lg p-4 space-y-3">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <Label className="font-semibold">
                      Level 2 Commission Transfer
                    </Label>
                    {getPeriodStatusBadge(impact.periodStatus)}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    <strong>{impact.oldAffiliateName}</strong> (2nd level upline) has <strong>{impact.orderCount}</strong> order{impact.orderCount !== 1 ? 's' : ''} with 
                    Level 2 commissions totaling <strong>{formatCurrency(impact.totalCommissionAmount)}</strong> in {impact.periodStatus === 'open' ? 'open' : 'closed and unpaid'} commission periods.
                  </p>
                  <p className="text-sm">
                    Select orders to transfer commissions to <strong>{impact.newAffiliateName}</strong>:
                  </p>
                  {renderOrderList(impact)}
                </div>
              </div>
            ))}

            {/* Level 1 - Closed/Paid Periods */}
            {level1Paid.map((impact, idx) => (
              <div key={getImpactKey(impact)} className="border rounded-lg p-4 space-y-3 bg-amber-50 dark:bg-amber-950/20">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <Label className="font-semibold">
                      Level 1 Commission Clawback
                    </Label>
                    {getPeriodStatusBadge(impact.periodStatus)}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    <strong>{impact.oldAffiliateName}</strong> has already been paid for <strong>{impact.orderCount}</strong> order{impact.orderCount !== 1 ? 's' : ''} with 
                    Level 1 commissions totaling <strong>{formatCurrency(impact.totalCommissionAmount)}</strong> in closed and paid commission periods.
                  </p>
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                    If approved, a negative adjustment (clawback) will be created for <strong>{impact.oldAffiliateName}</strong> and a positive adjustment will be created for <strong>{impact.newAffiliateName}</strong> in the current open period.
                  </p>
                  {renderOrderList(impact)}
                </div>
              </div>
            ))}

            {/* Level 2 - Closed/Paid Periods */}
            {level2Paid.map((impact, idx) => (
              <div key={getImpactKey(impact)} className="border rounded-lg p-4 space-y-3 bg-amber-50 dark:bg-amber-950/20">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <Label className="font-semibold">
                      Level 2 Commission Clawback
                    </Label>
                    {getPeriodStatusBadge(impact.periodStatus)}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    <strong>{impact.oldAffiliateName}</strong> (2nd level upline) has already been paid for <strong>{impact.orderCount}</strong> order{impact.orderCount !== 1 ? 's' : ''} with 
                    Level 2 commissions totaling <strong>{formatCurrency(impact.totalCommissionAmount)}</strong> in closed and paid commission periods.
                  </p>
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                    If approved, a negative adjustment (clawback) will be created for <strong>{impact.oldAffiliateName}</strong> and a positive adjustment will be created for <strong>{impact.newAffiliateName}</strong> in the current open period.
                  </p>
                  {renderOrderList(impact)}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="space-y-2 mt-4">
          <Label htmlFor="adjustment-note">Reason for Changes (Optional)</Label>
          <Textarea
            id="adjustment-note"
            placeholder="Enter the reason for these commission adjustments..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
          />
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleCancelClick}>
            Cancel All Changes
          </Button>
          <Button 
            onClick={handleConfirm}
            disabled={impacts.length > 0 && selectedOrders.size === 0}
          >
            {impacts.length === 0 
              ? "Proceed Without Adjustments" 
              : `Apply Selected Adjustments (${selectedOrders.size} orders)`
            }
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
