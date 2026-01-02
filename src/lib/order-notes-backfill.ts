import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/lib/utils";

// Backfills missing order notes for historical enrolling affiliate changes
// Uses affiliate_notes metadata created during commission adjustments to reconstruct per-order notes
export async function backfillOrderNotesFromAffiliateNotes(): Promise<{ inserted: number; skipped: number }> {
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth?.user?.id;
  if (!userId) return { inserted: 0, skipped: 0 };

  // Fetch system notes that contain adjustment metadata with order_ids
  const { data: sysNotes, error: notesErr } = await supabase
    .from("affiliate_notes")
    .select("id, affiliate_id, note_text, created_at, metadata")
    .not("metadata->order_ids", "is", null);

  if (notesErr || !sysNotes || sysNotes.length === 0) return { inserted: 0, skipped: 0 };

  // Collect all unique order ids from metadata and involved affiliate ids
  const allOrderIds = new Set<string>();
  const allAffiliateIds = new Set<string>();
  const usefulNotes = sysNotes.filter((n: any) => {
    const t = n.metadata?.adjustment_type as string | undefined;
    const orderIds = (n.metadata?.order_ids as string[] | undefined) || [];
    orderIds.forEach((id) => allOrderIds.add(id));
    if (n.affiliate_id) allAffiliateIds.add(n.affiliate_id);
    const tf = n.metadata?.transferred_from as string | undefined;
    const tt = n.metadata?.transferred_to as string | undefined;
    if (tf) allAffiliateIds.add(tf);
    if (tt) allAffiliateIds.add(tt);
    return t === "transfer_in" || t === "transfer_out" || t === "clawback" || t === "credit";
  });

  if (allOrderIds.size === 0) return { inserted: 0, skipped: 0 };

  const orderIdList = Array.from(allOrderIds);
  const affiliateIdList = Array.from(allAffiliateIds);

  // Fetch affiliate names for better notes
  const { data: affiliates } = await supabase
    .from("affiliates")
    .select("id, affiliate_id, first_name, last_name")
    .in("id", affiliateIdList);

  const affName = new Map<string, string>();
  const affLabel = new Map<string, string>();
  affiliates?.forEach((a) => {
    const name = `${a.first_name} ${a.last_name}`;
    affName.set(a.id, name);
    const code = (a as any).affiliate_id || "";
    affLabel.set(a.id, `${code} ${name}`.trim());
  });

  // Fetch existing order notes for these orders to avoid duplicates
  const { data: existingOrderNotes } = await supabase
    .from("order_notes")
    .select("id, order_id, note_text")
    .in("order_id", orderIdList);

  const existingByOrder = new Map<string, { id: string; note_text: string }[]>();
  existingOrderNotes?.forEach((n) => {
    const arr = existingByOrder.get(n.order_id) || [];
    arr.push({ id: n.id, note_text: n.note_text });
    existingByOrder.set(n.order_id, arr);
  });

  // Fetch orders for context and commissions for per-order amounts
  const [{ data: orders }, { data: commissions }] = await Promise.all([
    supabase.from("orders").select("id, order_number, order_date").in("id", orderIdList),
    supabase.from("order_commissions").select("order_id, level, commission_amount, affiliate_id").in("order_id", orderIdList),
  ]);

  const orderMap = new Map<string, { order_number: string; order_date: string }>();
  orders?.forEach((o) => orderMap.set(o.id, { order_number: o.order_number, order_date: o.order_date }));

  const commByOrderLevel = new Map<string, { amount: number; affiliate_id: string }>();
  commissions?.forEach((c) => {
    commByOrderLevel.set(`${c.order_id}:${c.level}`, { amount: parseFloat(c.commission_amount as any) || 0, affiliate_id: c.affiliate_id });
  });

  // Helper to decide if a correct (non-placeholder) note already exists for this order
  const hasSimilarNote = (orderId: string, level: number, kind: "transfer" | "clawback_credit"): boolean => {
    const notes = existingByOrder.get(orderId) || [];
    return notes.some(({ note_text }) => {
      const hasPlaceholders = note_text.includes("previous affiliate") || note_text.includes("new affiliate");
      if (kind === "transfer") return note_text.startsWith("Commission transfer:") && note_text.includes(`Level ${level}`) && !hasPlaceholders;
      return note_text.startsWith("Commission adjustment (CLAWBACK/CREDIT):") && note_text.includes(`Level ${level}`) && !hasPlaceholders;
    });
  };

  // Find a placeholder note to update if present
  const findPlaceholderNoteId = (orderId: string, level: number, kind: "transfer" | "clawback_credit"): string | null => {
    const notes = existingByOrder.get(orderId) || [];
    const match = notes.find(({ note_text }) => {
      const hasPlaceholders = note_text.includes("previous affiliate") || note_text.includes("new affiliate");
      if (!hasPlaceholders) return false;
      if (kind === "transfer") return note_text.startsWith("Commission transfer:") && note_text.includes(`Level ${level}`);
      return note_text.startsWith("Commission adjustment (CLAWBACK/CREDIT):") && note_text.includes(`Level ${level}`);
    });
    return match ? match.id : null;
  };

  let inserted = 0;
  let skipped = 0;
  const inserts: any[] = [];
  const updates: { id: string; note_text: string }[] = [];

  for (const n of usefulNotes as any[]) {
    const meta = n.metadata || {};
    const orderIds: string[] = meta.order_ids || [];
    const level: number = meta.level || 1;
    const type: string = meta.adjustment_type;

    // Determine participants for this note
    let oldId: string | undefined;
    let newId: string | undefined;

    // Determine note style
    const isTransfer = type === "transfer_in" || type === "transfer_out";

    if (isTransfer) {
      // Open/Unpaid transfer
      if (type === "transfer_out") {
        oldId = n.affiliate_id; // transferring FROM this affiliate
        newId = meta.transferred_to as string | undefined;
      } else {
        // transfer_in
        oldId = meta.transferred_from as string | undefined;
        newId = n.affiliate_id; // transferring TO this affiliate
      }
    } else {
      // Closed/Paid adjustments
      if (type === "clawback") {
        oldId = n.affiliate_id; // clawback FROM this affiliate
        newId = meta.transferred_to as string | undefined;
      } else {
        // credit
        oldId = meta.transferred_from as string | undefined; // previously paid to this affiliate
        newId = n.affiliate_id; // CREDIT to this affiliate
      }
    }

    const oldLabel = (oldId && (affLabel.get(oldId) || affName.get(oldId))) || "previous affiliate";
    const newLabel = (newId && (affLabel.get(newId) || affName.get(newId))) || "new affiliate";

    for (const oid of orderIds) {
      if (hasSimilarNote(oid, level, isTransfer ? "transfer" : "clawback_credit")) {
        skipped++;
        continue;
      }

      const orderInfo = orderMap.get(oid);
      if (!orderInfo) {
        skipped++;
        continue;
      }

      const comm = commByOrderLevel.get(`${oid}:${level}`);
      const amt = comm?.amount || 0;

      let noteText = "";
      if (isTransfer) {
        // Commission transfer note (open/unpaid periods)
        noteText = `Commission transfer: Level ${level} commission (${formatCurrency(amt)}) transferred from ${oldLabel} to ${newLabel} due to enrolling affiliate change.`;
      } else {
        // Clawback/Credit note (closed/paid periods)
        noteText = `Commission adjustment (CLAWBACK/CREDIT): Level ${level} commission (${formatCurrency(amt)}) was previously paid to previous affiliate, ${oldLabel}. Due to enrolling affiliate change, a clawback adjustment was added to previous affiliate's account and a credit adjustment was added to affiliate ${newLabel}'s account in the current open commission period.`;
      }

      const placeholderId = findPlaceholderNoteId(oid, level, isTransfer ? "transfer" : "clawback_credit");
      if (placeholderId) {
        updates.push({ id: placeholderId, note_text: noteText });
        // Update local cache text
        const arr = existingByOrder.get(oid) || [];
        const idx = arr.findIndex((x) => x.id === placeholderId);
        if (idx >= 0) arr[idx] = { id: placeholderId, note_text: noteText };
        existingByOrder.set(oid, arr);
      } else {
        inserts.push({ order_id: oid, note_text: noteText, created_by: userId });
      }
      inserted++;
    }
  }

  if (inserts.length > 0) {
    // Insert in chunks to avoid payload limits
    const chunkSize = 100;
    for (let i = 0; i < inserts.length; i += chunkSize) {
      const chunk = inserts.slice(i, i + chunkSize);
      await supabase.from("order_notes").insert(chunk);
    }
  }

  if (updates.length > 0) {
    const chunkSize = 50;
    for (let i = 0; i < updates.length; i += chunkSize) {
      const chunk = updates.slice(i, i + chunkSize);
      await Promise.all(
        chunk.map((u) =>
          supabase.from("order_notes").update({ note_text: u.note_text }).eq("id", u.id)
        )
      );
    }
  }

  return { inserted, skipped };
}
