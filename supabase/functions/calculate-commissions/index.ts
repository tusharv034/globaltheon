import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

type UUID = string

interface CompensationPlan {
  level_percentages?: Record<string, number>
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('[commissions] Start recalculation aligned to existing periods')

    // 1) Read compensation plan (fallbacks preserved)
    const { data: compPlan, error: compErr } = await supabase
      .from('compensation_plans')
      .select('level_percentages')
      .single()

    if (compErr) throw compErr

    const level1Pct = (compPlan?.level_percentages?.['1'] ?? 25) / 100
    const level2Pct = (compPlan?.level_percentages?.['2'] ?? 12) / 100
    console.log(`[commissions] Rates -> L1=${level1Pct * 100}%, L2=${level2Pct * 100}%`)

    // 2) Get existing commission periods (source of truth)
    const { data: periods, error: perErr } = await supabase
      .from('commission_periods')
      .select('id, period_number, start_date, end_date, status')
      .order('start_date', { ascending: true })

    if (perErr) throw perErr
    if (!periods || periods.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No commission periods found. Please create them first.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // 3) Clear existing order commissions before rebuilding to avoid duplicates
    {
      const { error: delErr } = await supabase
        .from('order_commissions')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000')
      if (delErr) throw delErr
      console.log('[commissions] Cleared existing order_commissions')
    }

    const commissionsToInsert: Array<{
      order_id: UUID
      affiliate_id: UUID
      level: number
      commission_amount: number
      commission_rate: number
    }> = []

    // 4) For each existing period, fetch orders in its window and compute L1/L2
    for (const period of periods) {
      const start = period.start_date
      const end = period.end_date
      console.log(`[commissions] Period ${period.period_number} -> ${start} to ${end} (${period.status})`)

      // Use an exclusive end bound (next day at 00:00 UTC) to include the full end date
      const endExclusive = new Date(end)
      endExclusive.setDate(endExclusive.getDate() + 1)
      const endExclusiveIso = endExclusive.toISOString()

      const { data: orders, error: ordErr } = await supabase
        .from('orders')
        .select(`
          id,
          order_date,
          amount,
          customers!inner (
            id,
            enrolled_by
          )
        `)
        .gte('order_date', start)
        .lt('order_date', endExclusiveIso)

      if (ordErr) throw ordErr

      // Build a map of L1 affiliate -> L2 affiliate for ONLY involved L1s to avoid row limits
      const l1Ids = Array.from(new Set((orders ?? [])
        .map((o: any) => o.customers?.enrolled_by)
        .filter((v: any) => !!v))) as UUID[]

      const l1ToL2 = new Map<UUID, UUID | null>()
      if (l1Ids.length > 0) {
        const { data: l1Affiliates, error: l1Err } = await supabase
          .from('affiliates')
          .select('id, enrolled_by')
          .in('id', l1Ids)
        if (l1Err) throw l1Err
        for (const a of l1Affiliates ?? []) {
          l1ToL2.set(a.id as UUID, (a.enrolled_by as UUID | null) ?? null)
        }
      }

      for (const o of orders ?? []) {
        const l1Id = o.customers?.enrolled_by as UUID | null
        if (l1Id) {
          commissionsToInsert.push({
            order_id: o.id as UUID,
            affiliate_id: l1Id,
            level: 1,
            commission_amount: Number(o.amount) * level1Pct,
            commission_rate: level1Pct * 100,
          })

          const l2Id = l1ToL2.get(l1Id) ?? null
          if (l2Id) {
            commissionsToInsert.push({
              order_id: o.id as UUID,
              affiliate_id: l2Id,
              level: 2,
              commission_amount: Number(o.amount) * level2Pct,
              commission_rate: level2Pct * 100,
            })
          }
        }
      }
    }

    // 5) Insert commissions in batches
    console.log(`[commissions] Inserting ${commissionsToInsert.length} commission rows`)
    if (commissionsToInsert.length > 0) {
      const batchSize = 1000
      for (let i = 0; i < commissionsToInsert.length; i += batchSize) {
        const batch = commissionsToInsert.slice(i, i + batchSize)
        const { error: insErr } = await supabase.from('order_commissions').insert(batch)
        if (insErr) throw insErr
      }
    }

    // 6) Recompute period totals using existing adjustments
    console.log('[commissions] Recomputing period totals')
    for (const period of periods) {
      // Use exclusive end for totals as well
      const endExclusive2 = new Date(period.end_date)
      endExclusive2.setDate(endExclusive2.getDate() + 1)

      const { data: ordersInPeriod, error: ordInErr } = await supabase
        .from('orders')
        .select('id')
        .gte('order_date', period.start_date)
        .lt('order_date', endExclusive2.toISOString())

      if (ordInErr) throw ordInErr
      const orderIds = (ordersInPeriod ?? []).map((r) => r.id)

      let totalAffiliateCommissions = 0
      if (orderIds.length > 0) {
        const { data: periodComms, error: commErr } = await supabase
          .from('order_commissions')
          .select('commission_amount')
          .in('order_id', orderIds)
        if (commErr) throw commErr
        totalAffiliateCommissions = (periodComms ?? []).reduce((sum, c) => sum + Number(c.commission_amount), 0)
      }

      const { data: adjustments, error: adjErr } = await supabase
        .from('commission_period_adjustments')
        .select('adjustment_amount')
        .eq('period_id', period.id)
      if (adjErr) throw adjErr
      const totalAdjustments = (adjustments ?? []).reduce((sum, a) => sum + Number(a.adjustment_amount), 0)

      const { error: updErr } = await supabase
        .from('commission_periods')
        .update({
          total_affiliate_commissions: totalAffiliateCommissions,
          total_adjustments: totalAdjustments,
          total_commissions: totalAffiliateCommissions + totalAdjustments,
        })
        .eq('id', period.id)

      if (updErr) throw updErr

      console.log(
        `[commissions] Period ${period.period_number}: L1+L2=$${totalAffiliateCommissions.toFixed(2)} + adj=$${totalAdjustments.toFixed(2)} -> total=$${(
          totalAffiliateCommissions + totalAdjustments
        ).toFixed(2)}`
      )
    }

    console.log('[commissions] Completed successfully')
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Commissions recalculated using existing commission periods',
        commissions_created: commissionsToInsert.length,
        periods_processed: periods.length,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    console.error('[commissions] Error:', error)
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
