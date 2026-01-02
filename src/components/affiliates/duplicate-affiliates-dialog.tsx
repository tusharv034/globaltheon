import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { AlertCircle, Info } from "lucide-react";
import { convertCustomerToAffiliate, duplicateAffiliates, validateMergeAffiliate } from "@/api/affiliate";

interface DuplicateGroup {
  field: string;
  value: string;
  affiliates: any[];
  customers: any[];
  customerCount: number;
  subscriptionStatus: Map<string, boolean>;
}

interface DuplicateAffiliatesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DuplicateAffiliatesDialog({ open, onOpenChange }: DuplicateAffiliatesDialogProps) {

  /* 
  
  // queryClient used for invalidating queries
  const queryClient = useQueryClient();
  
  // state to store the selected duplicateGroup
  const [selectedGroup, setSelectedGroup] = useState<DuplicateGroup | null>(null);
  
  // state to store the primaryRecord
  const [primaryRecordId, setPrimaryRecordId] = useState<string>("");

  // state to store the records to be merged
  const [recordsToMerge, setRecordsToMerge] = useState<string[]>([]);

  // state to store the merge Error
  const [mergeError, setMergeError] = useState<string>("");

  // useQuery to get the duplicates
  const { data: duplicates, isLoading } = useQuery({
    queryKey: ["duplicate-affiliates"],
    queryFn: async () => {
      const { data: affiliates, error: affError } = await supabase
        .from("affiliates")
        .select("*");

      if (affError) throw affError;

      const { data: customers, error: custError } = await supabase
        .from("customers")
        .select("*");

      if (custError) throw custError;

      const duplicateGroups: DuplicateGroup[] = [];
      
      // Group by email
      const emailGroups = new Map<string, { affiliates: any[], customers: any[] }>();
      
      affiliates.forEach(affiliate => {
        if (affiliate.email) {
          const email = affiliate.email.toLowerCase();
          if (!emailGroups.has(email)) {
            emailGroups.set(email, { affiliates: [], customers: [] });
          }
          emailGroups.get(email)!.affiliates.push(affiliate);
        }
      });

      customers.forEach(customer => {
        if (customer.email) {
          const email = customer.email.toLowerCase();
          if (!emailGroups.has(email)) {
            emailGroups.set(email, { affiliates: [], customers: [] });
          }
          emailGroups.get(email)!.customers.push(customer);
        }
      });

      emailGroups.forEach((group, email) => {
        if (group.affiliates.length > 1 || (group.affiliates.length > 0 && group.customers.length > 0)) {
          duplicateGroups.push({
            field: "email",
            value: email,
            affiliates: group.affiliates,
            customers: group.customers,
            customerCount: group.customers.length,
            subscriptionStatus: new Map(),
          });
        }
      });

      // Group by phone
      const phoneGroups = new Map<string, { affiliates: any[], customers: any[] }>();
      
      affiliates.forEach(affiliate => {
        if (affiliate.phone) {
          const phone = affiliate.phone.replace(/\D/g, "");
          if (!phoneGroups.has(phone)) {
            phoneGroups.set(phone, { affiliates: [], customers: [] });
          }
          phoneGroups.get(phone)!.affiliates.push(affiliate);
        }
      });

      customers.forEach(customer => {
        if (customer.phone) {
          const phone = customer.phone.replace(/\D/g, "");
          if (!phoneGroups.has(phone)) {
            phoneGroups.set(phone, { affiliates: [], customers: [] });
          }
          phoneGroups.get(phone)!.customers.push(customer);
        }
      });

      phoneGroups.forEach((group, phone) => {
        if (group.affiliates.length > 1 || (group.affiliates.length > 0 && group.customers.length > 0)) {
          const allIds = [...group.affiliates.map(a => a.id), ...group.customers.map(c => c.id)];
          const alreadyInEmailDupes = duplicateGroups.some(dg => 
            [...dg.affiliates.map(a => a.id), ...dg.customers.map(c => c.id)].some(id => allIds.includes(id))
          );
          if (!alreadyInEmailDupes) {
            duplicateGroups.push({
              field: "phone",
              value: phone,
              affiliates: group.affiliates,
              customers: group.customers,
              customerCount: group.customers.length,
              subscriptionStatus: new Map(),
            });
          }
        }
      });

      // Group by address
      const addressGroups = new Map<string, { affiliates: any[], customers: any[] }>();
      
      affiliates.forEach(affiliate => {
        if (affiliate.address && affiliate.city && affiliate.state_province && affiliate.postal_code) {
          const fullAddress = `${affiliate.address.toLowerCase().trim()}, ${affiliate.city.toLowerCase().trim()}, ${affiliate.state_province.toLowerCase().trim()} ${affiliate.postal_code.trim()}`;
          if (!addressGroups.has(fullAddress)) {
            addressGroups.set(fullAddress, { affiliates: [], customers: [] });
          }
          addressGroups.get(fullAddress)!.affiliates.push(affiliate);
        }
      });

      customers.forEach(customer => {
        if (customer.address && customer.city && customer.state_province && customer.postal_code) {
          const fullAddress = `${customer.address.toLowerCase().trim()}, ${customer.city.toLowerCase().trim()}, ${customer.state_province.toLowerCase().trim()} ${customer.postal_code.trim()}`;
          if (!addressGroups.has(fullAddress)) {
            addressGroups.set(fullAddress, { affiliates: [], customers: [] });
          }
          addressGroups.get(fullAddress)!.customers.push(customer);
        }
      });

      addressGroups.forEach((group, address) => {
        if (group.affiliates.length > 1 || (group.affiliates.length > 0 && group.customers.length > 0)) {
          const allIds = [...group.affiliates.map(a => a.id), ...group.customers.map(c => c.id)];
          const alreadyInDupes = duplicateGroups.some(dg => 
            [...dg.affiliates.map(a => a.id), ...dg.customers.map(c => c.id)].some(id => allIds.includes(id))
          );
          if (!alreadyInDupes) {
            duplicateGroups.push({
              field: "address",
              value: address,
              affiliates: group.affiliates,
              customers: group.customers,
              customerCount: group.customers.length,
              subscriptionStatus: new Map(),
            });
          }
        }
      });

      // Fetch subscription status for all affiliates and customers in duplicate groups
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
      
      const subscriptionStatus = new Map<string, boolean>();
      
      // Get all unique IDs from duplicates
      const allAffiliateIds = new Set<string>();
      const allCustomerIds = new Set<string>();
      
      duplicateGroups.forEach(group => {
        group.affiliates.forEach(a => allAffiliateIds.add(a.id));
        group.customers.forEach(c => allCustomerIds.add(c.id));
      });

      // Check subscription orders for customers enrolled by affiliates
      if (allAffiliateIds.size > 0) {
        const { data: affiliateSubscriptions } = await supabase
          .from("orders")
          .select("customers!inner(enrolled_by)")
          .eq("subscription", true)
          .gte("order_date", ninetyDaysAgo.toISOString())
          .in("customers.enrolled_by", Array.from(allAffiliateIds));

        affiliateSubscriptions?.forEach((order: any) => {
          const affiliateId = order.customers.enrolled_by;
          subscriptionStatus.set(affiliateId, true);
        });
      }

      // Check subscription orders for customers
      if (allCustomerIds.size > 0) {
        const { data: customerSubscriptions } = await supabase
          .from("orders")
          .select("customer_id")
          .eq("subscription", true)
          .gte("order_date", ninetyDaysAgo.toISOString())
          .in("customer_id", Array.from(allCustomerIds));

        customerSubscriptions?.forEach((order: any) => {
          subscriptionStatus.set(order.customer_id, true);
        });
      }

      // Update all groups with subscription status
      duplicateGroups.forEach(group => {
        group.subscriptionStatus = subscriptionStatus;
      });

      return duplicateGroups;
    },
    enabled: open,
  });

  // function to validate the merge
  const validateMerge = async (primaryId: string, mergeIds: string[]) => {
    setMergeError("");
    
    // Determine if primary is affiliate or customer
    const primaryAffiliate = selectedGroup?.affiliates.find(a => a.id === primaryId);
    const primaryCustomer = selectedGroup?.customers.find(c => c.id === primaryId);
    
    // Check if any merge record is an affiliate with commission history
    for (const mergeId of mergeIds) {
      const mergeAffiliate = selectedGroup?.affiliates.find(a => a.id === mergeId);
      
      if (mergeAffiliate) {
        // Check if this affiliate has commission history
        const { data: commissions } = await supabase
          .from("order_commissions")
          .select("id")
          .eq("affiliate_id", mergeId)
          .limit(1);
        
        // If merging an affiliate with commission history into a customer, that's not allowed
        if (commissions && commissions.length > 0 && primaryCustomer) {
          setMergeError(`Cannot merge affiliate "${mergeAffiliate.first_name} ${mergeAffiliate.last_name}" with commission history into customer account. Please select the affiliate as primary instead.`);
          return false;
        }
      }
    }
    
    return true;
  };

  // useMutation to merge the duplicate value
  const mergeMutation = useMutation({
    mutationFn: async ({ primaryId, mergeIds }: { primaryId: string; mergeIds: string[] }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Validate the merge
      const isValid = await validateMerge(primaryId, mergeIds);
      if (!isValid) {
        throw new Error(mergeError);
      }

      const primaryAffiliate = selectedGroup?.affiliates.find(a => a.id === primaryId);
      const primaryCustomer = selectedGroup?.customers.find(c => c.id === primaryId);

      let finalAffiliateId = primaryId;
      const mergedRecordNames: string[] = [];

      // If primary is a customer, convert it to affiliate first
      if (primaryCustomer) {
        // Generate a unique affiliate ID
        const affiliateId = `AFF${Date.now()}`;
        
        const { data: newAffiliate, error: createError } = await supabase
          .from("affiliates")
          .insert([{
            affiliate_id: affiliateId,
            first_name: primaryCustomer.first_name,
            last_name: primaryCustomer.last_name,
            email: primaryCustomer.email,
            phone: primaryCustomer.phone || null,
            address: primaryCustomer.address || null,
            address2: primaryCustomer.address2 || null,
            city: primaryCustomer.city || null,
            state_province: primaryCustomer.state_province || null,
            postal_code: primaryCustomer.postal_code || null,
            country: primaryCustomer.country || "USA",
            status: primaryCustomer.status || "active",
            enrolled_by: primaryCustomer.enrolled_by || null,
          }])
          .select()
          .single();

        if (createError) throw createError;
        finalAffiliateId = newAffiliate!.id;

        // Update orders to point to new affiliate as customer
        await supabase
          .from("orders")
          .update({ customer_id: newAffiliate.id })
          .eq("customer_id", primaryCustomer.id);

        // Delete the original customer record
        await supabase
          .from("customers")
          .delete()
          .eq("id", primaryCustomer.id);

        mergedRecordNames.push(`Customer ${primaryCustomer.first_name} ${primaryCustomer.last_name} (converted to affiliate)`);
      }

      // Process each merge record
      for (const mergeId of mergeIds) {
        const mergeAffiliate = selectedGroup?.affiliates.find(a => a.id === mergeId);
        const mergeCustomer = selectedGroup?.customers.find(c => c.id === mergeId);

        if (mergeAffiliate) {
          // Merge affiliate into primary
          await supabase
            .from("customers")
            .update({ enrolled_by: finalAffiliateId })
            .eq("enrolled_by", mergeId);

          await supabase
            .from("affiliates")
            .update({ enrolled_by: finalAffiliateId })
            .eq("enrolled_by", mergeId);

          await supabase
            .from("order_commissions")
            .update({ affiliate_id: finalAffiliateId })
            .eq("affiliate_id", mergeId);

          mergedRecordNames.push(`Affiliate ${mergeAffiliate.first_name} ${mergeAffiliate.last_name} (${mergeAffiliate.affiliate_id})`);

          await supabase
            .from("affiliates")
            .delete()
            .eq("id", mergeId);
        } else if (mergeCustomer) {
          // Convert customer to affiliate or merge into existing affiliate
          await supabase
            .from("orders")
            .update({ customer_id: finalAffiliateId })
            .eq("customer_id", mergeId);

          mergedRecordNames.push(`Customer ${mergeCustomer.first_name} ${mergeCustomer.last_name} (${mergeCustomer.customer_id})`);

          await supabase
            .from("customers")
            .delete()
            .eq("id", mergeId);
        }
      }

      // Recalculate total commissions
      const { data: commissions } = await supabase
        .from("order_commissions")
        .select("commission_amount")
        .eq("affiliate_id", finalAffiliateId);

      if (commissions) {
        const totalCommissions = commissions.reduce((sum, c) => sum + Number(c.commission_amount), 0);
        await supabase
          .from("affiliates")
          .update({ total_commissions: totalCommissions })
          .eq("id", finalAffiliateId);
      }

      // Create merge history note
      await supabase
        .from("affiliate_notes")
        .insert({
          affiliate_id: finalAffiliateId,
          note_text: `Merged ${mergeIds.length} record(s) into this account: ${mergedRecordNames.join(', ')}`,
          note_type: "merge",
          metadata: { merged_records: mergedRecordNames },
          created_by: user.id,
        });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["affiliates"] });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["duplicate-affiliates"] });
      toast.success("Records merged successfully");
      setSelectedGroup(null);
      setPrimaryRecordId("");
      setRecordsToMerge([]);
      setMergeError("");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to merge records");
    },
  });

  // function calling mergeMutation
  const handleMerge = () => {
    if (!primaryRecordId || recordsToMerge.length === 0) {
      toast.error("Please select a primary record and at least one record to merge");
      return;
    }

    if (recordsToMerge.includes(primaryRecordId)) {
      toast.error("Primary record cannot be in the merge list");
      return;
    }

    mergeMutation.mutate({
      primaryId: primaryRecordId,
      mergeIds: recordsToMerge,
    });
  };

  */

  // queryClient used for invalidating queries
  const queryClient = useQueryClient();

  // state to store the selected duplicateGroup
  const [selectedGroup, setSelectedGroup] = useState<DuplicateGroup | null>(null);

  // state to store the primaryRecord
  const [primaryRecordId, setPrimaryRecordId] = useState<string>("");

  // state to store the records to be merged
  const [recordsToMerge, setRecordsToMerge] = useState<string[]>([]);

  // state to store the merge Error
  const [mergeError, setMergeError] = useState<string>("");

  // useQuery to get the duplicates
  const { data: duplicates, isLoading } = useQuery({
    queryKey: ["duplicate-affiliates"],
    queryFn: async () => {
      try {

        const response = await duplicateAffiliates();


        return response.data.data || [];

      } catch (error) {
        console.error("Error is ", error);
        toast({
          title: "Error fetching Duplicates",
          description: error.message || "Something went wrong"
        })
      }
    },
    enabled: open,
  });

  const validateMergeMutation = useMutation({
    mutationFn: async (payload: any) => await validateMergeAffiliate(payload),

    onSuccess: (response) => {
  
      return response.data.data;
    },

    onError: (error) => {
      console.error("error is ", error);
    }
  })

  // function to validate the merge
  const validateMerge = async (primaryId: string, mergeIds: string[]) => {
    setMergeError("");

    // Determine if primary is affiliate or customer
    const primaryAffiliate = selectedGroup?.affiliates.find(a => {

      if (a.selfAffiliateId === parseInt(primaryId)){
        return a;
      }
    });
    const primaryCustomer = selectedGroup?.customers.find(c => c.selfCustomerId === parseInt(primaryId));

    // Check if any merge record is an affiliate with commission history
    for (const mergeId of mergeIds) {

      const mergeAffiliate = selectedGroup?.affiliates.find(a => a.selfAffiliateId === parseInt(mergeId));

      if (mergeAffiliate && primaryCustomer) {

        const payload = {
          mergeId
        }

        const commissions = await validateMergeMutation.mutateAsync(payload);

        // Check if this affiliate has commission history

        // If merging an affiliate with commission history into a customer, that's not allowed
        if (commissions && commissions?.length !== 0) {
          setMergeError(`Cannot merge affiliate "${mergeAffiliate.firstName} ${mergeAffiliate.lastName}" with commission history into customer account. Please select the affiliate as primary instead.`);
          return false;
        }
      }
    }

    return true;
  };

  const convertCustomerToAffiliateMutation = useMutation({
    mutationFn: async (payload: any) => await convertCustomerToAffiliate(payload),

    onSuccess: (response) => {
 

      return response.data.data;
    },

    onError: (error) => {
      console.log("error is ", error);
      return error;
    }
  })

  // useMutation to merge the duplicate value
  const mergeMutation = useMutation({
    mutationFn: async ({ primaryId, mergeIds }: { primaryId: string; mergeIds: string[] }) => {


      // Validate the merge
      /* 
      const isValid = await validateMerge(primaryId, mergeIds);
      if (!isValid) {
        throw new Error(mergeError);
      }
      */


      const primaryAffiliate = selectedGroup?.affiliates.find(a => a.selfAffiliateId === primaryId);
      const primaryCustomer = selectedGroup?.customers.find(c => c.selfCustomerId === primaryId);

      let finalAffiliateId = primaryId;
      const mergedRecordNames: string[] = [];


      // If primary is a customer, first convert it to affiliate
      if (primaryCustomer) {

        const payload = {
          customerId: primaryCustomer._id
        };

        const convertCustomerToAffiliateResponse = await convertCustomerToAffiliateMutation.mutateAsync(payload);

        mergedRecordNames.push(`Customer ${primaryCustomer.firstName} ${primaryCustomer.lastName} (converted to affiliate)`);
      }

      // return;

      // Process each merge record
      for (const mergeId of mergeIds) {
        const mergeAffiliate = selectedGroup?.affiliates.find(a => {
      
          return a.selfAffiliateId === mergeId
        });

        const mergeCustomer = selectedGroup?.customers.find(c => {
         
          return c.selfCustomerId === mergeId
        });

        return;

        if (mergeAffiliate) {
          // Merge affiliate into primary
          await supabase
            .from("customers")
            .update({ enrolled_by: finalAffiliateId })
            .eq("enrolled_by", mergeId);

          await supabase
            .from("affiliates")
            .update({ enrolled_by: finalAffiliateId })
            .eq("enrolled_by", mergeId);

          await supabase
            .from("order_commissions")
            .update({ affiliate_id: finalAffiliateId })
            .eq("affiliate_id", mergeId);

            
            await supabase
            .from("affiliates")
            .delete()
            .eq("id", mergeId);

            mergedRecordNames.push(`Affiliate ${mergeAffiliate.first_name} ${mergeAffiliate.last_name} (${mergeAffiliate.affiliate_id})`);
        } 
        
        if (mergeCustomer) {
          // Convert customer to affiliate or merge into existing affiliate
          await supabase
            .from("orders")
            .update({ customer_id: finalAffiliateId })
            .eq("customer_id", mergeId);

            
            await supabase
            .from("customers")
            .delete()
            .eq("id", mergeId);
            
            mergedRecordNames.push(`Customer ${mergeCustomer.first_name} ${mergeCustomer.last_name} (${mergeCustomer.customer_id})`);
        }
      }

      return;

      // Recalculate total commissions
      const { data: commissions } = await supabase
        .from("order_commissions")
        .select("commission_amount")
        .eq("affiliate_id", finalAffiliateId);

      if (commissions) {
        const totalCommissions = commissions.reduce((sum, c) => sum + Number(c.commission_amount), 0);
        await supabase
          .from("affiliates")
          .update({ total_commissions: totalCommissions })
          .eq("id", finalAffiliateId);
      }

      // Create merge history note
      await supabase
        .from("affiliate_notes")
        .insert({
          affiliate_id: finalAffiliateId,
          note_text: `Merged ${mergeIds.length} record(s) into this account: ${mergedRecordNames.join(', ')}`,
          note_type: "merge",
          metadata: { merged_records: mergedRecordNames },
          created_by: user.id,
        });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["affiliates"] });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["duplicate-affiliates"] });
      toast.success("Records merged successfully");
      setSelectedGroup(null);
      setPrimaryRecordId("");
      setRecordsToMerge([]);
      setMergeError("");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to merge records");
    },
  });

  // function calling mergeMutation
  const handleMerge = async () => {
    if (!primaryRecordId || recordsToMerge.length === 0) {
      toast.error("Please select a primary record and at least one record to merge");
      return;
    }

    if (recordsToMerge.includes(primaryRecordId)) {
      toast.error("Primary record cannot be in the merge list");
      return;
    }

    await mergeMutation.mutateAsync({
      primaryId: primaryRecordId,
      mergeIds: recordsToMerge,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Find Duplicate Affiliates / Customers</DialogTitle>
        </DialogHeader>

        {/* Business Rules */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription className="text-sm space-y-1">
            <p className="font-semibold">Merging Business Rules:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Two affiliate accounts can be merged together, even if both have commission history</li>
              <li>A customer account can be merged into any affiliate account</li>
              <li><strong>Important:</strong> An affiliate with commission history cannot be merged into a customer account</li>
            </ul>
          </AlertDescription>
        </Alert>

        {/* Loader */}
        {isLoading && (
          <div className="text-center py-8">Scanning for duplicates...</div>
        )}

        {!isLoading && duplicates && duplicates?.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No duplicate affiliates/customers found!
          </div>
        )}

        {!isLoading && duplicates && duplicates.length !== 0 && (
          <div className="space-y-4">

            {!selectedGroup && (
              <>
                <div className="flex items-center gap-2 text-amber-600 bg-amber-50 p-4 rounded-lg">
                  <AlertCircle className="h-5 w-5" />
                  <p>Found {duplicates.length} potential duplicate group(s)</p>
                </div>
                <div className="space-y-2">
                  {duplicates.map((group, idx) => (
                    <div
                      key={idx}
                      className="border rounded-lg p-4 hover:bg-accent cursor-pointer"
                      onClick={() => {
                        setSelectedGroup(group)
                      }}
                    >
                      <div className="font-medium">
                        Duplicate {group.field}: {group.value}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {group.affiliates.length} affiliate{group.affiliates.length !== 1 ? 's' : ''} / {group.customerCount} customer{group.customerCount !== 1 ? 's' : ''} found
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {selectedGroup && (
              <>
                <div className="space-y-4">
                  <Button variant="outline" onClick={() => {
                    setSelectedGroup(null);
                    setPrimaryRecordId("");
                    setRecordsToMerge([]);
                    setMergeError("");
                  }}>
                    ← Back to all duplicates
                  </Button>

                  {mergeError && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{mergeError}</AlertDescription>
                    </Alert>
                  )}

                  <div className="border rounded-lg p-4 space-y-4">
                    <div>
                      <h3 className="font-semibold">
                        Merge Records - {selectedGroup.field}: {selectedGroup.value}
                      </h3>
                      <div className="text-sm text-muted-foreground mt-1">
                        Found {selectedGroup.affiliates.length} affiliate record(s) and {selectedGroup.customerCount} customer record(s)
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">
                        Select the primary record to keep (all data will be merged into this record):
                      </p>

                      {/* Display Affiliates */}
                      {selectedGroup && selectedGroup?.affiliates?.map((affiliate) => (
                        <div
                          key={affiliate?.selfAffiliateId}
                          className={`border rounded-lg p-4 cursor-pointer ${primaryRecordId === affiliate.selfAffiliateId ? "border-primary bg-primary/5" : ""
                            }`}
                          onClick={() => {
                            setPrimaryRecordId(affiliate.selfAffiliateId);
                            setMergeError("");
                          }}
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="font-medium">
                                {affiliate.firstName} {affiliate.lastName}
                              </div>
                              <div className="text-sm space-y-1 mt-1">
                                <div className="font-mono text-xs bg-muted px-2 py-1 rounded inline-block">
                                  Affiliate ID: {affiliate.selfAffiliateId}
                                </div>
                                <div className="text-muted-foreground">Email: {affiliate.email}</div>
                                <div className="text-muted-foreground">Phone: {affiliate.phone || "N/A"}</div>
                                <div className="text-muted-foreground">
                                  Address: {affiliate.addressLineOne ? `${affiliate.addressLineOne}, ${affiliate.cityTown}, ${affiliate.stateProvince}` : "N/A"}
                                </div>
                                <div className="text-muted-foreground">Created: {new Date(affiliate.createdAt).toLocaleDateString()}</div>
                                <div className="text-muted-foreground">
                                  Subscription: 
                                  <span className={selectedGroup?.subscriptionStatus?.[affiliate?.selfAffiliateId] ? "text-red-600 font-semibold" : "text-foreground"}>
                                    {selectedGroup?.subscriptionStatus?.[affiliate?.selfAffiliateId] ? "Yes" : "No"}
                                  </span>
                                </div>
                                <div className="text-red-600 font-medium mt-1">Affiliate</div>{/* bg-red-300 rounded-full w-fit px-4 py-[2px] */}
                              </div>
                            </div>
                            {primaryRecordId === affiliate.selfAffiliateId && (
                              <div className="text-primary font-medium">Primary</div>
                            )}
                          </div>
                        </div>
                      ))}

                      {/* Display Customers */}
                      {selectedGroup && selectedGroup?.customers?.map((customer) => (
                        <div
                          key={customer.selfCustomerId}
                          className={`border rounded-lg p-4 cursor-pointer ${primaryRecordId === customer.selfCustomerId ? "border-primary bg-primary/5" : ""
                            }`}
                          onClick={() => {
                            setPrimaryRecordId(customer.selfCustomerId);
                            setMergeError("");
                          }}
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="font-medium">
                                {customer.firstName} {customer.lastName}
                              </div>
                              <div className="text-sm space-y-1 mt-1">
                                <div className="font-mono text-xs bg-muted px-2 py-1 rounded inline-block">
                                  Customer ID: {customer.selfCustomerId}
                                </div>
                                <div className="text-muted-foreground">Email: {customer.email}</div>
                                <div className="text-muted-foreground">Phone: {customer.phone || "N/A"}</div>
                                <div className="text-muted-foreground">
                                  Address: {customer.addressLineOne ? `${customer.addressLineOne}, ${customer.cityTown}, ${customer.stateProvince}` : "N/A"}
                                </div>
                                <div className="text-muted-foreground">Created: {new Date(customer.createdAt).toLocaleDateString()}</div>
                                <div className="text-muted-foreground">
                                  Subscription: 
                                  <span className={selectedGroup.subscriptionStatus[customer.selfCustomerId] ? "text-red-600 font-semibold" : "text-foreground"}>
                                    {selectedGroup.subscriptionStatus[customer.selfCustomerId] ? "Yes" : "No"}
                                  </span>
                                </div>
                                <div className="text-blue-600 font-medium mt-1">Customer</div>
                              </div>
                            </div>
                            {primaryRecordId === customer.selfCustomerId && (
                              <div className="text-primary font-medium">Primary</div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {primaryRecordId && (
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">
                          Select records to merge into the primary:
                        </p>

                        {/* Affiliates to merge */}
                        {selectedGroup?.affiliates
                          .filter((a) => a.selfAffiliateId !== primaryRecordId)
                          .map((affiliate) => (
                            <div key={affiliate.selfAffiliateId} className="flex items-center gap-3 border rounded-lg p-3">
                              <Checkbox
                                checked={recordsToMerge.includes(affiliate.selfAffiliateId)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setRecordsToMerge([...recordsToMerge, affiliate.selfAffiliateId]);
                                  } else {
                                    setRecordsToMerge(recordsToMerge.filter((id) => id !== affiliate.selfAffiliateId));
                                  }
                                  setMergeError("");
                                }}
                              />
                              <div className="flex-1">
                                <div className="font-medium">
                                  {affiliate.firstName} {affiliate.lastName}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  Affiliate ID: {affiliate.selfAffiliateId} • {affiliate.email} • {affiliate.phone || "No phone"}
                                </div>
                                <div className="text-sm text-red-600 font-medium">Affiliate</div>
                              </div>
                            </div>
                          ))}

                        {/* Customers to merge */}
                        {selectedGroup.customers
                          .filter((c) => c.selfCustomerId !== primaryRecordId)
                          .map((customer) => (
                            <div key={customer.selfCustomerId} className="flex items-center gap-3 border rounded-lg p-3">
                              <Checkbox
                                checked={recordsToMerge.includes(customer.selfCustomerId)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setRecordsToMerge([...recordsToMerge, customer.selfCustomerId]);
                                  } else {
                                    setRecordsToMerge(recordsToMerge.filter((id) => id !== customer.selfCustomerId));
                                  }
                                  setMergeError("");
                                }}
                              />
                              <div className="flex-1">
                                <div className="font-medium">
                                  {customer.firstName} {customer.lastName}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  Customer ID: {customer.selfCustomerId} • {customer.email} • {customer.phone || "No phone"}
                                </div>
                                <div className="text-sm text-blue-600 font-medium">Customer</div>
                              </div>
                            </div>
                          ))}
                      </div>
                    )}

                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => {
                        setSelectedGroup(null);
                        setPrimaryRecordId("");
                        setRecordsToMerge([]);
                        setMergeError("");
                      }}>
                        Cancel
                      </Button>
                      <Button
                        onClick={handleMerge}
                        disabled={!primaryRecordId || recordsToMerge.length === 0 || mergeMutation.isPending}
                      >
                        {mergeMutation.isPending ? "Merging..." : "Merge Records"}
                      </Button>
                    </div>
                  </div>
                </div>
              </>
            )}

          </div>
        )}

      </DialogContent>
    </Dialog>
  );
}
