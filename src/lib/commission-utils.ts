import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/lib/utils";
import { startOfWeek, endOfWeek, subWeeks, format, parseISO } from "date-fns";

export interface CommissionImpact {
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

// Determine commission period status and dates based on order date
function determineStatusAndPeriod(orderDate: Date): { 
  status: 'open' | 'closed' | 'paid';
  periodStart: Date;
  periodEnd: Date;
} {
  const now = new Date();
  const currentWeekStart = startOfWeek(now, { weekStartsOn: 1 });
  const lastWeekStart = startOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });
  const lastWeekEnd = endOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });

  const orderWeekStart = startOfWeek(orderDate, { weekStartsOn: 1 });
  const orderWeekEnd = endOfWeek(orderDate, { weekStartsOn: 1 });

  if (orderDate >= currentWeekStart) {
    return {
      status: "open",
      periodStart: currentWeekStart,
      periodEnd: endOfWeek(now, { weekStartsOn: 1 })
    };
  } else if (orderDate >= lastWeekStart && orderDate <= lastWeekEnd) {
    return {
      status: "closed",
      periodStart: lastWeekStart,
      periodEnd: lastWeekEnd
    };
  } else {
    return {
      status: "paid",
      periodStart: orderWeekStart,
      periodEnd: orderWeekEnd
    };
  }
}

/**
 * Analyze commission impact when changing enrolling affiliate for a SINGLE order
 */
export async function analyzeSingleOrderCommissionImpact(
  orderId: string,
  newAffiliateId: string
): Promise<CommissionImpact[]> {
  const impacts: CommissionImpact[] = [];

  // Fetch the order with its commissions
  const { data: order } = await supabase
    .from("orders")
    .select(`
      id,
      order_number,
      order_date,
      amount,
      order_commissions (
        id,
        affiliate_id,
        level,
        commission_amount
      )
    `)
    .eq("id", orderId)
    .single();

  if (!order || !order.order_commissions || (order.order_commissions as any).length === 0) {
    return impacts;
  }

  const commissions = order.order_commissions as any;
  const level1Comm = commissions.find((c: any) => c.level === 1);
  
  if (!level1Comm) return impacts;

  const oldAffiliateId = level1Comm.affiliate_id;

  // Fetch old and new affiliates
  const { data: affiliates } = await supabase
    .from("affiliates")
    .select("id, first_name, last_name, enrolled_by")
    .in("id", [oldAffiliateId, newAffiliateId]);

  if (!affiliates || affiliates.length < 2) return impacts;

  const oldAffiliate = affiliates.find(a => a.id === oldAffiliateId);
  const newAffiliate = affiliates.find(a => a.id === newAffiliateId);

  if (!oldAffiliate || !newAffiliate) return impacts;

  const oldAffiliateName = `${oldAffiliate.first_name} ${oldAffiliate.last_name}`;
  const newAffiliateName = `${newAffiliate.first_name} ${newAffiliate.last_name}`;

  // Determine period status
  const orderDate = parseISO(order.order_date);
  const { status, periodStart, periodEnd } = determineStatusAndPeriod(orderDate);
  const periodStatus = status === 'closed' ? 'closed_unpaid' : status === 'paid' ? 'closed_paid' : 'open';

  // Add Level 1 impact
  impacts.push({
    level: 1,
    periodStatus: periodStatus as 'open' | 'closed_unpaid' | 'closed_paid',
    orderCount: 1,
    orderNumbers: [order.order_number],
    orderIds: [order.id],
    orders: [{
      orderId: order.id,
      orderNumber: order.order_number,
      orderDate: order.order_date,
      commissionAmount: parseFloat(level1Comm.commission_amount || 0),
      periodStart: format(periodStart, 'MM/dd/yyyy'),
      periodEnd: format(periodEnd, 'MM/dd/yyyy')
    }],
    totalCommissionAmount: parseFloat(level1Comm.commission_amount || 0),
    oldAffiliateName,
    oldAffiliateId,
    newAffiliateName,
    newAffiliateId
  });

  // Check for Level 2 commission changes
  const level2Comm = commissions.find((c: any) => c.level === 2);
  if (level2Comm) {
    // Fetch uplines
    const uplineIds = [oldAffiliate.enrolled_by, newAffiliate.enrolled_by].filter(Boolean) as string[];
    if (uplineIds.length > 0) {
      const { data: uplines } = await supabase
        .from("affiliates")
        .select("id, first_name, last_name")
        .in("id", uplineIds);

      const oldUpline = uplines?.find(a => a.id === oldAffiliate.enrolled_by);
      const newUpline = uplines?.find(a => a.id === newAffiliate.enrolled_by);

      if (oldUpline && level2Comm.affiliate_id === oldUpline.id) {
        const oldUplineName = `${oldUpline.first_name} ${oldUpline.last_name}`;
        const newUplineName = newUpline 
          ? `${newUpline.first_name} ${newUpline.last_name}`
          : "None (New affiliate has no upline)";
        const newUplineId = newUpline?.id || "";

        if (newUplineId) {
          impacts.push({
            level: 2,
            periodStatus: periodStatus as 'open' | 'closed_unpaid' | 'closed_paid',
            orderCount: 1,
            orderNumbers: [order.order_number],
            orderIds: [order.id],
            orders: [{
              orderId: order.id,
              orderNumber: order.order_number,
              orderDate: order.order_date,
              commissionAmount: parseFloat(level2Comm.commission_amount || 0),
              periodStart: format(periodStart, 'MM/dd/yyyy'),
              periodEnd: format(periodEnd, 'MM/dd/yyyy')
            }],
            totalCommissionAmount: parseFloat(level2Comm.commission_amount || 0),
            oldAffiliateName: oldUplineName,
            oldAffiliateId: oldUpline.id,
            newAffiliateName: newUplineName,
            newAffiliateId: newUplineId
          });
        }
      }
    }
  }

  return impacts;
}

/**
 * Analyze commission impact when a customer's enrolling affiliate changes
 */
export async function analyzeCustomerCommissionImpact(
  customerId: string,
  oldAffiliateId: string,
  newAffiliateId: string
): Promise<CommissionImpact[]> {
  const impacts: CommissionImpact[] = [];

  // Fetch all required affiliates in one query
  const { data: affiliates } = await supabase
    .from("affiliates")
    .select("id, first_name, last_name, enrolled_by")
    .in("id", [oldAffiliateId, newAffiliateId]);

  if (!affiliates) return impacts;

  const oldAffiliate = affiliates.find(a => a.id === oldAffiliateId);
  const newAffiliate = affiliates.find(a => a.id === newAffiliateId);

  if (!oldAffiliate || !newAffiliate) return impacts;

  const oldAffiliateName = `${oldAffiliate.first_name} ${oldAffiliate.last_name}`;
  const newAffiliateName = `${newAffiliate.first_name} ${newAffiliate.last_name}`;

  // Fetch uplines if they exist (one query for both)
  const uplineIds = [oldAffiliate.enrolled_by, newAffiliate.enrolled_by].filter(Boolean) as string[];
  const { data: uplines } = uplineIds.length > 0 
    ? await supabase
        .from("affiliates")
        .select("id, first_name, last_name")
        .in("id", uplineIds)
    : { data: [] };

  const oldUpline = uplines?.find(a => a.id === oldAffiliate.enrolled_by);
  const newUpline = uplines?.find(a => a.id === newAffiliate.enrolled_by);

  // Fetch all orders for this customer with their commissions
  const { data: orders } = await supabase
    .from("orders")
    .select(`
      id,
      order_number,
      order_date,
      amount,
      order_commissions (
        id,
        affiliate_id,
        level,
        commission_amount
      )
    `)
    .eq("customer_id", customerId);

  if (!orders || orders.length === 0) return impacts;

  // Group orders by period status and level
  const level1ByStatus: { [key: string]: any[] } = { open: [], closed_unpaid: [], closed_paid: [] };
  const level2ByStatus: { [key: string]: any[] } = { open: [], closed_unpaid: [], closed_paid: [] };

  for (const order of orders) {
    const orderDate = parseISO(order.order_date);
    const { status, periodStart, periodEnd } = determineStatusAndPeriod(orderDate);
    const periodStatus = status === 'closed' ? 'closed_unpaid' : status === 'paid' ? 'closed_paid' : 'open';

    const commissions = (order.order_commissions as any) || [];
    
    // Check Level 1 commission (old affiliate)
    const level1Comm = commissions.find((c: any) => c.affiliate_id === oldAffiliateId && c.level === 1);
    if (level1Comm) {
      level1ByStatus[periodStatus].push({
        orderId: order.id,
        orderNumber: order.order_number,
        orderDate: order.order_date,
        commissionAmount: level1Comm.commission_amount,
        commissionId: level1Comm.id,
        periodStart: format(periodStart, 'MM/dd/yyyy'),
        periodEnd: format(periodEnd, 'MM/dd/yyyy')
      });
    }

    // Check Level 2 commission (old affiliate's upline)
    const level2Comm = commissions.find((c: any) => c.level === 2);
    if (level2Comm && oldUpline && level2Comm.affiliate_id === oldUpline.id) {
      const oldUplineName = `${oldUpline.first_name} ${oldUpline.last_name}`;
      const newUplineName = newUpline 
        ? `${newUpline.first_name} ${newUpline.last_name}`
        : "None (New affiliate has no upline)";
      const newUplineId = newUpline?.id || "";

      level2ByStatus[periodStatus].push({
        orderId: order.id,
        orderNumber: order.order_number,
        orderDate: order.order_date,
        commissionAmount: level2Comm.commission_amount,
        commissionId: level2Comm.id,
        oldUplineId: oldUpline.id,
        oldUplineName,
        newUplineId,
        newUplineName,
        periodStart: format(periodStart, 'MM/dd/yyyy'),
        periodEnd: format(periodEnd, 'MM/dd/yyyy')
      });
    }
  }

  // Create impact objects for Level 1
  for (const [periodStatus, orderList] of Object.entries(level1ByStatus)) {
    if (orderList.length > 0) {
      impacts.push({
        level: 1,
        periodStatus: periodStatus as 'open' | 'closed_unpaid' | 'closed_paid',
        orderCount: orderList.length,
        orderNumbers: orderList.map(o => o.orderNumber),
        orderIds: orderList.map(o => o.orderId),
        orders: orderList.map(o => ({
          orderId: o.orderId,
          orderNumber: o.orderNumber,
          orderDate: o.orderDate,
          commissionAmount: parseFloat(o.commissionAmount || 0),
          periodStart: o.periodStart,
          periodEnd: o.periodEnd
        })),
        totalCommissionAmount: orderList.reduce((sum, o) => sum + parseFloat(o.commissionAmount || 0), 0),
        oldAffiliateName,
        oldAffiliateId,
        newAffiliateName,
        newAffiliateId
      });
    }
  }

  // Create impact objects for Level 2 (if applicable)
  for (const [periodStatus, orderList] of Object.entries(level2ByStatus)) {
    if (orderList.length > 0 && orderList[0].newUplineId) {
      impacts.push({
        level: 2,
        periodStatus: periodStatus as 'open' | 'closed_unpaid' | 'closed_paid',
        orderCount: orderList.length,
        orderNumbers: orderList.map(o => o.orderNumber),
        orderIds: orderList.map(o => o.orderId),
        orders: orderList.map(o => ({
          orderId: o.orderId,
          orderNumber: o.orderNumber,
          orderDate: o.orderDate,
          commissionAmount: parseFloat(o.commissionAmount || 0),
          periodStart: o.periodStart,
          periodEnd: o.periodEnd
        })),
        totalCommissionAmount: orderList.reduce((sum, o) => sum + parseFloat(o.commissionAmount || 0), 0),
        oldAffiliateName: orderList[0].oldUplineName,
        oldAffiliateId: orderList[0].oldUplineId,
        newAffiliateName: orderList[0].newUplineName,
        newAffiliateId: orderList[0].newUplineId
      });
    }
  }

  return impacts;
}

/**
 * Analyze commission impact when an affiliate's enrolling affiliate changes
 */
export async function analyzeAffiliateCommissionImpact(
  affiliateId: string,
  oldEnrollingAffiliateId: string,
  newEnrollingAffiliateId: string
): Promise<CommissionImpact[]> {
  const impacts: CommissionImpact[] = [];

  // Fetch affiliate names
  const { data: affiliates } = await supabase
    .from("affiliates")
    .select("id, first_name, last_name, enrolled_by")
    .in("id", [affiliateId, oldEnrollingAffiliateId, newEnrollingAffiliateId]);

  if (!affiliates) return impacts;

  const affiliate = affiliates.find(a => a.id === affiliateId);
  const oldEnrolling = affiliates.find(a => a.id === oldEnrollingAffiliateId);
  const newEnrolling = affiliates.find(a => a.id === newEnrollingAffiliateId);

  if (!affiliate || !oldEnrolling || !newEnrolling) return impacts;

  const oldEnrollingName = `${oldEnrolling.first_name} ${oldEnrolling.last_name}`;
  const newEnrollingName = `${newEnrolling.first_name} ${newEnrolling.last_name}`;

  // Fetch all customers enrolled by this affiliate
  const { data: customers } = await supabase
    .from("customers")
    .select("id")
    .eq("enrolled_by", affiliateId);

  if (!customers || customers.length === 0) return impacts;

  const customerIds = customers.map(c => c.id);

  // Fetch all orders for these customers with their commissions
  const { data: orders } = await supabase
    .from("orders")
    .select(`
      id,
      order_number,
      order_date,
      amount,
      customer_id,
      order_commissions (
        id,
        affiliate_id,
        level,
        commission_amount
      )
    `)
    .in("customer_id", customerIds);

  if (!orders || orders.length === 0) return impacts;

  // Group orders by period status and level
  const level1ByStatus: { [key: string]: any[] } = { open: [], closed_unpaid: [], closed_paid: [] };

  for (const order of orders) {
    const orderDate = parseISO(order.order_date);
    const { status, periodStart, periodEnd } = determineStatusAndPeriod(orderDate);
    const periodStatus = status === 'closed' ? 'closed_unpaid' : status === 'paid' ? 'closed_paid' : 'open';

    const commissions = (order.order_commissions as any) || [];
    
    // Check Level 2 commission for this affiliate's customers (old/new enrolling affiliate)
    const level2Comm = commissions.find((c: any) => c.affiliate_id === oldEnrollingAffiliateId && c.level === 2);
    if (level2Comm) {
      level1ByStatus[periodStatus].push({
        orderId: order.id,
        orderNumber: order.order_number,
        orderDate: order.order_date,
        commissionAmount: level2Comm.commission_amount,
        commissionId: level2Comm.id,
        periodStart: format(periodStart, 'MM/dd/yyyy'),
        periodEnd: format(periodEnd, 'MM/dd/yyyy')
      });
    }
  }

  // Create impact objects for Level 1 (which is actually Level 2 from the affiliate's customers' perspective)
  for (const [periodStatus, orderList] of Object.entries(level1ByStatus)) {
    if (orderList.length > 0) {
      impacts.push({
        level: 1,
        periodStatus: periodStatus as 'open' | 'closed_unpaid' | 'closed_paid',
        orderCount: orderList.length,
        orderNumbers: orderList.map(o => o.orderNumber),
        orderIds: orderList.map(o => o.orderId),
        orders: orderList.map(o => ({
          orderId: o.orderId,
          orderNumber: o.orderNumber,
          orderDate: o.orderDate,
          commissionAmount: parseFloat(o.commissionAmount || 0),
          periodStart: o.periodStart,
          periodEnd: o.periodEnd
        })),
        totalCommissionAmount: orderList.reduce((sum, o) => sum + parseFloat(o.commissionAmount || 0), 0),
        oldAffiliateName: oldEnrollingName,
        oldAffiliateId: oldEnrollingAffiliateId,
        newAffiliateName: newEnrollingName,
        newAffiliateId: newEnrollingAffiliateId
      });
    }
  }

  return impacts;
}

/**
 * Apply approved commission adjustments
 */
export async function applyCommissionAdjustments(
  impacts: CommissionImpact[],
  note: string | undefined,
  userId: string,
  entityId: string,
  entityType: 'customer' | 'affiliate'
): Promise<void> {
  // Track all affected affiliates to ensure they all get notes
  const affectedAffiliates = new Set<string>();
  
  for (const impact of impacts) {
    affectedAffiliates.add(impact.oldAffiliateId);
    affectedAffiliates.add(impact.newAffiliateId);
    
    const notePrefix = `Commission adjustment: ${impact.level === 1 ? 'Level 1' : 'Level 2'} commissions for ${impact.orderCount} order(s) (${impact.orderNumbers.join(', ')})`;
    const noteReason = note ? `\nReason: ${note}` : '';
    const orderListDetails = impact.orders.map(o => `  - Order ${o.orderNumber} (${o.orderDate}): ${formatCurrency(o.commissionAmount)}`).join('\n');

    if (impact.periodStatus === 'open' || impact.periodStatus === 'closed_unpaid') {
      // Update existing commission records
      for (const orderId of impact.orderIds) {
        // Fetch the commission record for this order
        const { data: commissions } = await supabase
          .from("order_commissions")
          .select("*")
          .eq("order_id", orderId)
          .eq("level", impact.level);

        if (commissions && commissions.length > 0) {
          // Update the affiliate_id to the new affiliate
          await supabase
            .from("order_commissions")
            .update({ affiliate_id: impact.newAffiliateId })
            .eq("order_id", orderId)
            .eq("level", impact.level)
            .eq("affiliate_id", impact.oldAffiliateId);
        }
      }

      // Create order notes for each affected order
      for (const order of impact.orders) {
        const orderNoteText = `Commission transfer: ${impact.level === 1 ? 'Level 1' : 'Level 2'} commission (${formatCurrency(order.commissionAmount)}) transferred from ${impact.oldAffiliateName} to ${impact.newAffiliateName} due to enrolling affiliate change.${note ? `\nReason: ${note}` : ''}`;
        
        await supabase.from("order_notes").insert({
          order_id: order.orderId,
          note_text: orderNoteText,
          created_by: userId
        });
      }

      // Create detailed notes on both old and new affiliates for EACH impact
      const oldNoteText = `${notePrefix} transferred FROM ${impact.oldAffiliateName} (${impact.level === 1 ? 'Level 1' : 'Level 2'}) TO ${impact.newAffiliateName}.\nTotal: ${formatCurrency(impact.totalCommissionAmount)}\nOrders:\n${orderListDetails}${noteReason}`;
      const newNoteText = `${notePrefix} transferred FROM ${impact.oldAffiliateName} TO ${impact.newAffiliateName} (${impact.level === 1 ? 'Level 1' : 'Level 2'}).\nTotal: ${formatCurrency(impact.totalCommissionAmount)}\nOrders:\n${orderListDetails}${noteReason}`;

      await supabase.from("affiliate_notes").insert({
        affiliate_id: impact.oldAffiliateId,
        note_text: oldNoteText,
        note_type: "system",
        created_by: userId,
        metadata: {
          adjustment_type: 'transfer_out',
          level: impact.level,
          amount: -impact.totalCommissionAmount,
          order_ids: impact.orderIds,
          order_numbers: impact.orderNumbers,
          transferred_to: impact.newAffiliateId,
          transferred_to_name: impact.newAffiliateName
        }
      });

      await supabase.from("affiliate_notes").insert({
        affiliate_id: impact.newAffiliateId,
        note_text: newNoteText,
        note_type: "system",
        created_by: userId,
        metadata: {
          adjustment_type: 'transfer_in',
          level: impact.level,
          amount: impact.totalCommissionAmount,
          order_ids: impact.orderIds,
          order_numbers: impact.orderNumbers,
          transferred_from: impact.oldAffiliateId,
          transferred_from_name: impact.oldAffiliateName
        }
      });

    } else if (impact.periodStatus === 'closed_paid') {
      // Check if the old affiliate has automatic chargebacks disabled
      const { data: oldAffiliate } = await supabase
        .from("affiliates")
        .select("allow_automatic_chargebacks, first_name, last_name, email")
        .eq("id", impact.oldAffiliateId)
        .single();

      const allowChargeback = oldAffiliate?.allow_automatic_chargebacks !== false;

      // Create commission adjustments (clawback from old, credit to new)
      // First, get the most recent open commission period
      const { data: openPeriods } = await supabase
        .from("commission_periods")
        .select("id, start_date, end_date")
        .eq("status", "open")
        .order("created_at", { ascending: false })
        .limit(1);

      const openPeriod = openPeriods?.[0];

      if (openPeriod && allowChargeback) {
        // Create clawback adjustment for old affiliate
        await supabase.from("commission_period_adjustments").insert({
          period_id: openPeriod.id,
          affiliate_id: impact.oldAffiliateId,
          adjustment_amount: -impact.totalCommissionAmount,
          created_by: userId,
          reason: `CLAWBACK: ${impact.level === 1 ? 'Level 1' : 'Level 2'} commissions from previously paid period - Orders: ${impact.orderNumbers.join(', ')} - Transferred to ${impact.newAffiliateName}${note ? ` - ${note}` : ''}`
        });

        // Create credit adjustment for new affiliate
        await supabase.from("commission_period_adjustments").insert({
          period_id: openPeriod.id,
          affiliate_id: impact.newAffiliateId,
          adjustment_amount: impact.totalCommissionAmount,
          created_by: userId,
          reason: `CREDIT: ${impact.level === 1 ? 'Level 1' : 'Level 2'} commissions from previously paid period - Orders: ${impact.orderNumbers.join(', ')} - Transferred from ${impact.oldAffiliateName}${note ? ` - ${note}` : ''}`
        });
      } else if (openPeriod && !allowChargeback) {
        // Chargeback was prevented - send notification email
        try {
          // Get order details for the first order in the impact
          const { data: order } = await supabase
            .from("orders")
            .select(`
              *,
              customers (
                first_name,
                last_name,
                email
              )
            `)
            .eq("id", impact.orderIds[0])
            .single();

          if (order) {
            const customer = order.customers as any;
            const periodStr = `${format(parseISO(openPeriod.start_date), 'MM/dd/yyyy')} - ${format(parseISO(openPeriod.end_date), 'MM/dd/yyyy')}`;

            await supabase.functions.invoke('chargeback-notification', {
              body: {
                orderNumber: order.order_number,
                orderAmount: order.amount,
                orderDate: format(parseISO(order.order_date), 'MM/dd/yyyy'),
                customerName: `${customer?.first_name || ''} ${customer?.last_name || ''}`.trim(),
                customerEmail: customer?.email || '',
                level1AffiliateName: `${oldAffiliate.first_name} ${oldAffiliate.last_name}`,
                level1AffiliateEmail: oldAffiliate.email,
                level1CommissionAmount: impact.totalCommissionAmount,
                level1CommissionPeriod: periodStr,
                level1ChargebackPrevented: true,
                level2ChargebackPrevented: false,
              }
            });
          }
        } catch (emailError) {
          console.error("Failed to send chargeback notification email:", emailError);
        }

        // Create a note indicating the chargeback was NOT applied
        const noteText = `CHARGEBACK PREVENTED: ${impact.level === 1 ? 'Level 1' : 'Level 2'} commissions from previously paid period were NOT charged back due to "Allow Automatic Chargebacks" flag being disabled.\nOrders: ${impact.orderNumbers.join(', ')}\nTotal Amount: ${formatCurrency(impact.totalCommissionAmount)}\nManual adjustment required if chargeback is desired.${note ? `\nReason: ${note}` : ''}`;

        await supabase.from("affiliate_notes").insert({
          affiliate_id: impact.oldAffiliateId,
          note_text: noteText,
          note_type: "system",
          created_by: userId,
          metadata: {
            adjustment_type: 'chargeback_prevented',
            level: impact.level,
            amount: impact.totalCommissionAmount,
            order_ids: impact.orderIds,
            order_numbers: impact.orderNumbers
          }
        });
      }

      // Create order notes for each affected order (clawback scenario)
      for (const order of impact.orders) {
        const orderNoteText = `Commission adjustment (CLAWBACK/CREDIT): ${impact.level === 1 ? 'Level 1' : 'Level 2'} commission (${formatCurrency(order.commissionAmount)}) was previously paid to ${impact.oldAffiliateName}. Due to enrolling affiliate change, a clawback adjustment was added to ${impact.oldAffiliateName}'s account and a credit adjustment was added to ${impact.newAffiliateName}'s account in the current open commission period.${note ? `\nReason: ${note}` : ''}`;
        
        await supabase.from("order_notes").insert({
          order_id: order.orderId,
          note_text: orderNoteText,
          created_by: userId
        });
      }

      const oldNoteText = `${notePrefix} - CLAWBACK: Negative adjustment of ${formatCurrency(impact.totalCommissionAmount)} added to current open period. These commissions were previously paid but are being transferred to ${impact.newAffiliateName} (${impact.level === 1 ? 'Level 1' : 'Level 2'}) due to enrolling affiliate change.\nOrders:\n${orderListDetails}${noteReason}`;
      const newNoteText = `${notePrefix} - CREDIT: Positive adjustment of ${formatCurrency(impact.totalCommissionAmount)} added to current open period. These commissions were transferred from ${impact.oldAffiliateName} (${impact.level === 1 ? 'Level 1' : 'Level 2'}) due to enrolling affiliate change.\nOrders:\n${orderListDetails}${noteReason}`;

      await supabase.from("affiliate_notes").insert({
        affiliate_id: impact.oldAffiliateId,
        note_text: oldNoteText,
        note_type: "system",
        created_by: userId,
        metadata: {
          adjustment_type: 'clawback',
          level: impact.level,
          amount: -impact.totalCommissionAmount,
          order_ids: impact.orderIds,
          order_numbers: impact.orderNumbers,
          transferred_to: impact.newAffiliateId,
          transferred_to_name: impact.newAffiliateName,
          period_id: openPeriod?.id
        }
      });

      await supabase.from("affiliate_notes").insert({
        affiliate_id: impact.newAffiliateId,
        note_text: newNoteText,
        note_type: "system",
        created_by: userId,
        metadata: {
          adjustment_type: 'credit',
          level: impact.level,
          amount: impact.totalCommissionAmount,
          order_ids: impact.orderIds,
          order_numbers: impact.orderNumbers,
          transferred_from: impact.oldAffiliateId,
          transferred_from_name: impact.oldAffiliateName,
          period_id: openPeriod?.id
        }
      });

      // Update commission records to reflect the new affiliate even for closed/paid periods
      for (const oid of impact.orderIds) {
        await supabase
          .from("order_commissions")
          .update({ affiliate_id: impact.newAffiliateId })
          .eq("order_id", oid)
          .eq("level", impact.level)
          .eq("affiliate_id", impact.oldAffiliateId);
      }
    }
  }

  // Create a comprehensive summary note on the entity (customer or affiliate) being changed
  const level1Impacts = impacts.filter(i => i.level === 1);
  const level2Impacts = impacts.filter(i => i.level === 2);
  
  let summaryDetails = `Enrolling affiliate changed. ${impacts.length} commission adjustment(s) applied affecting ${impacts.reduce((sum, i) => sum + i.orderCount, 0)} total order(s).`;
  
  if (level1Impacts.length > 0) {
    const l1Impact = level1Impacts[0];
    summaryDetails += `\n\nLevel 1: ${l1Impact.oldAffiliateName} → ${l1Impact.newAffiliateName}`;
  }
  
  if (level2Impacts.length > 0) {
    const l2Impact = level2Impacts[0];
    summaryDetails += `\nLevel 2: ${l2Impact.oldAffiliateName} → ${l2Impact.newAffiliateName}`;
  }
  
  if (note) {
    summaryDetails += `\n\nReason: ${note}`;
  }
  
  if (entityType === 'customer') {
    await supabase.from("customer_notes").insert({
      customer_id: entityId,
      note_text: summaryDetails,
      note_type: "note",
      created_by: userId,
      metadata: {
        affected_affiliates: Array.from(affectedAffiliates),
        total_impacts: impacts.length,
        total_orders: impacts.reduce((sum, i) => sum + i.orderCount, 0)
      }
    });
  } else {
    await supabase.from("affiliate_notes").insert({
      affiliate_id: entityId,
      note_text: summaryDetails,
      note_type: "note",
      created_by: userId,
      metadata: {
        affected_affiliates: Array.from(affectedAffiliates),
        total_impacts: impacts.length,
        total_orders: impacts.reduce((sum, i) => sum + i.orderCount, 0)
      }
    });
  }
}
