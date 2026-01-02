import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { deleteAffiliatesIfInIds, readAffiliatesByEmails, readAllAffiliates } from "@/api/affiliate";
import { createCustomerMergeNote, deleteCustomersIfInIds, readAllCustomers, readCustomerByMergeIds, readCustomersByMergeIds, readCustomersEnrollersOrders, readCustomersOrders, readDuplicateCustomers, updateCustomerEnrolledBy, updateOrdersToNewCustomer } from "@/api/customer";
import CompanySettings from "@/pages/CompanySettings";

interface DuplicateGroup {
  field: string;
  value: string;
  customers: any[];
  affiliates: any[];
  affiliateCount: number;
  subscriptionStatus: Map<string, boolean>;
}

interface DuplicateCustomersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DuplicateCustomersDialog({ open, onOpenChange }: DuplicateCustomersDialogProps) {

  /* 
  
    // Query Client to invalidate Queries
    const queryClient = useQueryClient();
  
    // state to store Selected Group
    const [selectedGroup, setSelectedGroup] = useState<DuplicateGroup | null>(null);
  
    // state to store primaryCustomerId
    const [primaryCustomerId, setPrimaryCustomerId] = useState<string>("");
  
    // state to store customer merge
    const [customersToMerge, setCustomersToMerge] = useState<string[]>([]);
  
    // Query to read all affiliates
    const { data: affiliates } = useQuery({
      queryKey: ["affiliates"],
      queryFn: async () => {
        const { data, error } = await supabase
          .from("affiliates")
          .select("email");
        
        if (error) throw error;
        return data;
      },
      enabled: open,
    });
  
    // Query to read all duplicates
    const { data: duplicates, isLoading } = useQuery({
      queryKey: ["duplicate-customers"],
      queryFn: async () => {
        const { data: customers, error } = await supabase
          .from("customers")
          .select("*");
  
        if (error) throw error;
  
        // Fetch all affiliates to check for matches
        const { data: affiliates } = await supabase
          .from("affiliates")
          .select("*");
  
        // Find duplicates by email, phone, and name combination
        const duplicateGroups: DuplicateGroup[] = [];
        
        // Group by email
        const emailGroups = new Map<string, any[]>();
        customers.forEach(customer => {
          if (customer.email) {
            const email = customer.email.toLowerCase();
            if (!emailGroups.has(email)) {
              emailGroups.set(email, []);
            }
            emailGroups.get(email)!.push(customer);
          }
        });
  
        emailGroups.forEach((group, email) => {
          if (group.length > 1) {
            // Get matching affiliates
            const matchingAffiliates = affiliates?.filter(a => 
              a.email?.toLowerCase() === email
            ) || [];
            
            // Validation: Ensure we're only adding customer records
            const validatedCustomers = group.filter(record => 
              record.customer_id && !record.affiliate_id
            );
            
            
            duplicateGroups.push({
              field: "email",
              value: email,
              customers: validatedCustomers,
              affiliates: matchingAffiliates,
              affiliateCount: matchingAffiliates.length,
              subscriptionStatus: new Map(),
            });
          }
        });
  
        // Group by phone
        const phoneGroups = new Map<string, any[]>();
        customers.forEach(customer => {
          if (customer.phone) {
            const phone = customer.phone.replace(/\D/g, "");
            if (!phoneGroups.has(phone)) {
              phoneGroups.set(phone, []);
            }
            phoneGroups.get(phone)!.push(customer);
          }
        });
  
        phoneGroups.forEach((group, phone) => {
          if (group.length > 1) {
            // Check if not already in email duplicates
            const customerIds = group.map(c => c.id);
            const alreadyInEmailDupes = duplicateGroups.some(dg => 
              dg.customers.some(c => customerIds.includes(c.id))
            );
            if (!alreadyInEmailDupes) {
              // Get matching affiliates by phone
              const matchingAffiliates = affiliates?.filter(a => {
                const affiliatePhone = a.phone?.replace(/\D/g, "");
                return affiliatePhone === phone;
              }) || [];
              
              // Validation: Ensure we're only adding customer records
              const validatedCustomers = group.filter(record => 
                record.customer_id && !record.affiliate_id
              );
              
           
              
              duplicateGroups.push({
                field: "phone",
                value: phone,
                customers: validatedCustomers,
                affiliates: matchingAffiliates,
                affiliateCount: matchingAffiliates.length,
                subscriptionStatus: new Map(),
              });
            }
          }
        });
  
        // Group by address (full address match)
        const addressGroups = new Map<string, any[]>();
        customers.forEach(customer => {
          if (customer.address && customer.city && customer.state_province && customer.postal_code) {
            const fullAddress = `${customer.address.toLowerCase().trim()}, ${customer.city.toLowerCase().trim()}, ${customer.state_province.toLowerCase().trim()} ${customer.postal_code.trim()}`;
            if (!addressGroups.has(fullAddress)) {
              addressGroups.set(fullAddress, []);
            }
            addressGroups.get(fullAddress)!.push(customer);
          }
        });
  
        addressGroups.forEach((group, address) => {
          if (group.length > 1) {
            // Check if not already in other duplicates
            const customerIds = group.map(c => c.id);
            const alreadyInDupes = duplicateGroups.some(dg => 
              dg.customers.some(c => customerIds.includes(c.id))
            );
            if (!alreadyInDupes) {
              // Get matching affiliates by address
              const matchingAffiliates = affiliates?.filter(a => {
                if (a.address && a.city && a.state_province && a.postal_code) {
                  const affiliateAddress = `${a.address.toLowerCase().trim()}, ${a.city.toLowerCase().trim()}, ${a.state_province.toLowerCase().trim()} ${a.postal_code.trim()}`;
                  return affiliateAddress === address;
                }
                return false;
              }) || [];
              
              duplicateGroups.push({
                field: "address",
                value: address,
                customers: group,
                affiliates: matchingAffiliates,
                affiliateCount: matchingAffiliates.length,
                subscriptionStatus: new Map(),
              });
            }
          }
        });
  
        // Fetch subscription status for all customers and affiliates in duplicate groups
        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
        
        const subscriptionStatus = new Map<string, boolean>();
        
        // Get all unique IDs from duplicates
        const allCustomerIds = new Set<string>();
        const allAffiliateIds = new Set<string>();
        
        duplicateGroups.forEach(group => {
          group.customers.forEach(c => allCustomerIds.add(c.id));
          group.affiliates.forEach(a => allAffiliateIds.add(a.id));
        });
  
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
  
        // Update all groups with subscription status
        duplicateGroups.forEach(group => {
          group.subscriptionStatus = subscriptionStatus;
        });
  
        return duplicateGroups;
      },
      enabled: open,
    });
  
    // Mutation to merge duplicates into single user
    const mergeMutation = useMutation({
      mutationFn: async ({ primaryId, mergeIds }: { primaryId: string; mergeIds: string[] }) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Not authenticated");
  
        const { data: mergedCustomers } = await supabase
          .from("customers")
          .select("customer_id, email")
          .in("id", mergeIds);
  
        // Check if any of these customers also exist as affiliates
        const customerEmails = mergedCustomers?.map(c => c.email) || [];
        const { data: matchingAffiliates } = await supabase
          .from("affiliates")
          .select("id, email")
          .in("email", customerEmails);
  
        // Update all orders to point to primary customer
        for (const mergeId of mergeIds) {
          const { error: orderError } = await supabase
            .from("orders")
            .update({ customer_id: primaryId })
            .eq("customer_id", mergeId);
  
          if (orderError) throw orderError;
        }
  
        // If there are matching affiliates, merge them too
        if (matchingAffiliates && matchingAffiliates.length > 1) {
          const primaryAffiliate = matchingAffiliates[0];
          const affiliatesToMerge = matchingAffiliates.slice(1).map(a => a.id);
  
          // Update customers enrolled by merged affiliates
          for (const affiliateId of affiliatesToMerge) {
            await supabase
              .from("customers")
              .update({ enrolled_by: primaryAffiliate.id })
              .eq("enrolled_by", affiliateId);
  
            // Update order commissions
            await supabase
              .from("order_commissions")
              .update({ affiliate_id: primaryAffiliate.id })
              .eq("affiliate_id", affiliateId);
          }
  
          // Delete merged affiliates
          await supabase
            .from("affiliates")
            .delete()
            .in("id", affiliatesToMerge);
        }
  
        // Create merge history note
        const mergedCustomerIds = mergedCustomers?.map((c) => c.customer_id) || [];
        const { error: noteError } = await supabase
          .from("customer_notes")
          .insert({
            customer_id: primaryId,
            note_text: `Merged ${mergeIds.length} duplicate customer record(s) into this account${matchingAffiliates && matchingAffiliates.length > 1 ? ` and ${matchingAffiliates.length - 1} matching affiliate record(s)` : ''}`,
            note_type: "merge",
            metadata: { 
              merged_customer_ids: mergedCustomerIds,
              merged_affiliate_count: matchingAffiliates && matchingAffiliates.length > 1 ? matchingAffiliates.length - 1 : 0
            },
            created_by: user.id,
          });
  
        if (noteError) throw noteError;
  
        // Delete merged customers
        const { error: deleteError } = await supabase
          .from("customers")
          .delete()
          .in("id", mergeIds);
  
        if (deleteError) throw deleteError;
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["customers"] });
        queryClient.invalidateQueries({ queryKey: ["duplicate-customers"] });
        toast.success("Customers merged successfully");
        setSelectedGroup(null);
        setPrimaryCustomerId("");
        setCustomersToMerge([]);
      },
      onError: () => {
        toast.error("Failed to merge customers");
      },
    });
  
    // function to handle Merge
    const handleMerge = () => {
      if (!primaryCustomerId || customersToMerge.length === 0) {
        toast.error("Please select a primary customer and at least one customer to merge");
        return;
      }
  
      if (customersToMerge.includes(primaryCustomerId)) {
        toast.error("Primary customer cannot be in the merge list");
        return;
      }
  
      mergeMutation.mutate({
        primaryId: primaryCustomerId,
        mergeIds: customersToMerge,
      });
    };
  
  */

  // Query Client to invalidate Queries
  const queryClient = useQueryClient();

  // toast for messages
  const { toast } = useToast();

  // state to store Selected Group
  const [selectedGroup, setSelectedGroup] = useState<DuplicateGroup | null>(null);

  // state to store primaryCustomerId
  const [primaryCustomerId, setPrimaryCustomerId] = useState<string>("");

  // state to store customer merge
  const [customersToMerge, setCustomersToMerge] = useState<string[]>([]);

  // Query to read all affiliates
  const { data: affiliates } = useQuery({
    queryKey: ["affiliates"],
    queryFn: async () => {

      try {

        const response = await readAllAffiliates();

        toast({
          title: "Successfull",
          description: "Successfully retrieved all affiliates",
        });

        return response?.data?.data;
      } catch (error) {
        console.log("Error is ", error);
        toast({
          title: "Something went wrong",
          description: error.message || "Please Try again later",
          variant: "destructive"
        });
      }
    },
    enabled: open,
  });

  // Query to read all duplicates
  /* 
  const { data: duplicatesTwo, isLoading } = useQuery({
    queryKey: ["duplicate-customers"],
    queryFn: async () => {
      // Fetch all customers

      const customerResponse = await readAllCustomers()

      const customers = customerResponse.data.data || []

      // Fetch all affiliates
      const affiliateResponse = await readAllAffiliates()

      const affiliates = affiliateResponse.data.data || []

      // Find duplicates by email, phone, and name combination
      // Create an Array called duplicateGroups
      const duplicateGroups: DuplicateGroup[] = [];

      // Group by email
      // Create an Object called emailGroups, the keys in them will be email of each customer and the value will be Array of Objects where each object is the Customer
      const emailGroups = new Map<string, any[]>();

      // Iterate over each customer in the customers fetched before, take thier email, if the emailGroup already has the key we push the customer whose email is being iterated, else we create the key and then push the customer being iterated
      customers.forEach((customer: any) => {
        if (customer.email) {
          const email = customer.email.toLowerCase();
          if (!emailGroups.has(email)) {
            emailGroups.set(email, []);
          }
          emailGroups.get(email)!.push(customer);
        }
      });

      // We iterate over emailGroup, here the group represents the value whereas the email represents the key
      emailGroups.forEach((group, email) => {
        // For each email, we check if the array value that it had, has a length more than 1 or not, which signifies if the thier are duplicate customers present or not
        // We do not care if duplicate customers are not present
        if (group.length > 1) {

          // filter affiliates, whose email matches the the current key being iterated(email)
          const matchingAffiliates = affiliates.length && affiliates?.filter((a: any) =>
            a.email?.toLowerCase() === email
          ) || [];

         
          // Validation: Ensure we're only adding customer records
          // filter out from the duplicate customer array(the value, in key value pair), making sure that the customer has a customerId and no affiliateId
          const validatedCustomers = group.filter(record => {


            return record.selfCustomerId && !record.affiliateId
          }
          );

         
          // Finally in the duplicateGroups array push an Object
          duplicateGroups.push({
            field: "email",// field signifying where the duplication was found
            value: email,// value signifying the actual value which was the cause for duplication
            customers: validatedCustomers,// cstomers where the duplication was found, making sure these customers were not affiliate once
            affiliates: matchingAffiliates,// affiliates where the email was found to be the same
            affiliateCount: matchingAffiliates.length,// count for affiliates
            subscriptionStatus: new Map(),// and object to maintain subscription status
          });
        }
      });

      // Group by phone
      // create a phone maps where the key will be phoneNumber and the value will be customer object
      const phoneGroups = new Map<string, any[]>();

      // Iterate over each customer to create a key if it does not exist and push the customer object as value
      customers.forEach((customer: any) => {
        if (customer.phone) {
          const phone = customer.phone.replace(/\D/g, "");
          if (!phoneGroups.has(phone)) {
            phoneGroups.set(phone, []);
          }
          phoneGroups.get(phone)!.push(customer);
        }
      });

      // iterate over each key-value pair in phoneGroups
      phoneGroups.forEach((group, phone) => {
        // check if duplicates exist
        if (group.length > 1) {
          // Check if not already in email duplicates,
          // create an array of Ids 
          const customerIds = group.map(c => c.selfCustomerId);
          
          // check if the Id's in duplicateGroups
          const alreadyInEmailDupes = duplicateGroups.some(dg =>
            dg.customers.some(c => customerIds.includes(c.selfCustomerId))
          );

    

          // If not in the group proceed further
          if (!alreadyInEmailDupes) {
            // Get matching affiliates by phone
            const matchingAffiliates = affiliates?.filter(a => {
              const affiliatePhone = a.phone?.replace(/\D/g, "");
              return affiliatePhone === phone;
            }) || [];

            // Validation: Ensure we're only adding customer records
            const validatedCustomers = group.filter(record =>
              record.selfCustomerId && !record.affiliateId
            );

            duplicateGroups.push({
              field: "phone",
              value: phone,
              customers: validatedCustomers,
              affiliates: matchingAffiliates,
              affiliateCount: matchingAffiliates.length,
              subscriptionStatus: new Map(),
            });
          }
        }
      });

      // Group by address (full address match)
      // create an addressGroup Map where the address will be key and the customer will be value
      const addressGroups = new Map<string, any[]>();

      // Foreacah customer, create the addressValue key if it does not exist and then add the customer as value
      customers.forEach((customer: any) => {
        if (customer.addressLineOne && customer.cityTown && customer.stateProvince && customer.zipPostal) {
          const fullAddress = `${customer.addressLineOne.toLowerCase().trim()}, ${customer.cityTown.toLowerCase().trim()}, ${customer.stateProvince.toLowerCase().trim()} ${customer.zipPostal.trim()}`;
          if (!addressGroups.has(fullAddress)) {
            addressGroups.set(fullAddress, []);
          }
          addressGroups.get(fullAddress)!.push(customer);
        }
      });

      // For each key value pair of addressGroups
      addressGroups.forEach((group, address) => {
        // If duplicate exist
        if (group.length > 1) {

          // Check if not already in other duplicates

          // create an array of customer Ids
          const customerIds = group.map(c => c.selfCustomerId);

          // check if the duplication already exist in duplicateGroups
          const alreadyInDupes = duplicateGroups.some(dg =>
            dg.customers.some(c => customerIds.includes(c.selfCustomerId))
          );

          // If not already in duplicates proceed further 
          if (!alreadyInDupes) {
            // Get matching affiliates by address
            const matchingAffiliates = affiliates?.filter((a: any) => {
              if (a.addressLineOne && a.cityTown && a.stateProvince && a.zipPostal) {
                const affiliateAddress = `${a.addressLineOne.toLowerCase().trim()}, ${a.cityTown.toLowerCase().trim()}, ${a.stateProvince.toLowerCase().trim()} ${a.zipPostal.trim()}`;
                return affiliateAddress === address;
              }
              return false;
            }) || [];

            // push in duplicate Groups
            duplicateGroups.push({
              field: "address",
              value: address,
              customers: group,
              affiliates: matchingAffiliates,
              affiliateCount: matchingAffiliates.length,
              subscriptionStatus: new Map(),
            });
          }
        }
      });

      // Fetch subscription status for all customers and affiliates in duplicate groups
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

      // create a subscriptionStatus Map
      const subscriptionStatus = new Map<string, boolean>();

      // Get all unique IDs from duplicates
      const allCustomerIds = new Set<string>();
      const allAffiliateIds = new Set<string>();

      // Iterate over each object
      duplicateGroups.forEach(group => {
        // For each item, it takes the group.customers array which contains the customers with overlapping data
        group.customers.forEach(c => allCustomerIds.add(c.selfCustomerId));// adds the ID of each customer in a Set, maintaining Unique Customer Ids
        // For each item, it takes the group.affiliates array which contains the affiliates with overlapping data
        group.affiliates.forEach(a => allAffiliateIds.add(a.selfAffiliateId));// adds the ID of each affiliates in a Set, maintaining Unique Affiliate Ids
      });

      // Check subscription orders for customers
      // For CustomerIds
      if (allCustomerIds.size > 0) {
        // Fetch all the Orders.customerId where subscription is true, and order date is more ninetyDaysAgo(that is ,order date is within three months from before to today, so those of past three months) and customerId is in CustomerIds Array  

        const payload = {
          customersIds: [...allCustomerIds]
        }

        const customerSubscriptionsResponse = await readCustomersOrders(payload);


        const customerSubscriptions = customerSubscriptionsResponse.data.data || []

        // Iterate over each Orders fetched from the API
        customerSubscriptions?.forEach((order: any) => {
          // ForEach Order, add the customerID in the subscriptionStatus as key and the value as true
          subscriptionStatus.set(order.selfCustomerAffiliateId, true);
        });
      }

      // Check subscription orders for customers enrolled by affiliates
      if (allAffiliateIds.size > 0) {
        // Fectch all the orders.enrolledBy where subscription is true, and orderDate i within from three months before to today and customer.enrolledBy is in AffiliateIds Array

        const payload = {
          affiliatesIds: [...allAffiliateIds]
        };

        const affiliateSubscriptionsResponse = await readCustomersEnrollersOrders(payload);

        const affiliateSubscriptions = affiliateSubscriptionsResponse.data.data || []

        // Iterate over previously fetched Orders
        affiliateSubscriptions?.forEach((order: any) => {

          // For each Order, add the customer.enrolledBy in the subscriptionStatus as key and the value as true
          const affiliateId = order.customers.enrolledBy;
          subscriptionStatus.set(affiliateId, true);
        });
      }

      // Update all groups with subscription status
      duplicateGroups.forEach(group => {
        // For each Item in the duplicateGroup array grab the item.subscriptionStatus key and assign the value of subscriptionStatus
        group.subscriptionStatus = subscriptionStatus;
      });

      // Now return the final duplicateGroups array

      console.log("duplicate Groups are ", duplicateGroups);

      return duplicateGroups;
    },
    enabled: open,
  });
  */

  const { data: duplicates, isLoading } = useQuery({
    queryKey: ["duplicate-customers"],
    queryFn: async () => {

      const response = await readDuplicateCustomers();

      console.log("readDuplicateCustomers response is ", response);

      return response.data.data;
    }
  })

  // Mutation to merge duplicates into single user
  const mergeMutation = useMutation({
    mutationFn: async ({ primaryId, mergeIds }: { primaryId: string; mergeIds: string[] }) => {

      // Read Customers based on mergeIds, get selfCustomerId and email
      const readCustomersByMergeIdsResponse = await readCustomersByMergeIds({
        mergeIds
      });
      
      const mergedCustomers = readCustomersByMergeIdsResponse.data.data || []

      // Check if any of these customers also exist as affiliates
      const customerEmails = mergedCustomers?.map((c: any) => c.email) || [];
      
      // Read Affiliates based on customerEmails, get selfAffiliateId and Email
      const readAffiliatesByEmailsResponse = await readAffiliatesByEmails({
        emails: customerEmails
      }) ;
      
      const matchingAffiliates = readAffiliatesByEmailsResponse.data.data || [];

      return;

      // Update all orders to point to primary customer
      for (const mergeId of mergeIds) {

      // update the order.selfCustomerAffiliateId to primaryId, where selfCustomerId === mergeId
      const updateOrdersToNewCustomerResponse = await updateOrdersToNewCustomer({
        mergeId,
        primaryId
      })

      }
      // If there are matching affiliates, merge them too
      if (matchingAffiliates && matchingAffiliates.length > 1) {
        const primaryAffiliate = matchingAffiliates[0];
        const affiliatesToMerge = matchingAffiliates.slice(1).map((a: any) => a.selfAffiliateId);

        // Update customers enrolled by merged affiliates
        for (const affiliateId of affiliatesToMerge) {

          // In Customers, update enrolledBy: primaryAffiliate.selfAffiliateId, where enrolledBy === affiliateId

          const updateCustomerEnrolledByResposne = await updateCustomerEnrolledBy({newEnrolledBy: primaryAffiliate.selfAffiliateId, enrolledBy: affiliateId})

          // Update order commissions, update selfAffiliateId: parimaryAffilliate.selfAffiliateId, where selfAffiliateId === affiliateId
          /*
          await supabase
              .from("order_commissions")
              .update({ affiliate_id: primaryAffiliate.id })
              .eq("affiliate_id", affiliateId);
          */
          
        }

        // Delete affiliates, where selfAffiliateId in affiliatesToMerge
        const deleteAffiliatesIfInIdsResponse = await deleteAffiliatesIfInIds({
          affiliatesToMerge
        }); 

        console.log("deleteAffiliatesIfInIdsResponse is ", deleteAffiliatesIfInIdsResponse);
        // await supabase
        //   .from("affiliates")
        //   .delete()
        //   .in("id", affiliatesToMerge);
      }

      // Create merge history note
      const mergedCustomerIds = mergedCustomers?.map((c: any) => c.selfCustomerId) || [];
      // create Customer Note
      const newCustomerNote = await createCustomerMergeNote(
        {
          selfCustomerId: primaryId,
          text: `Merged ${mergeIds.length} duplicate customer record(s) into this account${matchingAffiliates && matchingAffiliates.length > 1 ? ` and ${matchingAffiliates.length - 1} matching affiliate record(s)` : ''}`,
          type: "merge",
          metadata: {
            mergedCustomerIds,
            mergedAffiliateCount: matchingAffiliates && matchingAffiliates.length > 1 ? matchingAffiliates.length - 1 : 0
          }
        }
      );

      // Delete merged customers where customer.selfCustomerId in mergeIds
      const deleteCustomersIfInIdsResponse = await deleteCustomersIfInIds({
        mergeIds
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["duplicate-customers"] });
      toast.success("Customers merged successfully");
      setSelectedGroup(null);
      setPrimaryCustomerId("");
      setCustomersToMerge([]);
    },
    onError: () => {
      toast.error("Failed to merge customers");
    },
  });

  // function to handle Merge
  const handleMerge = () => {
    if (!primaryCustomerId || customersToMerge.length === 0) {
      toast.error("Please select a primary customer and at least one customer to merge");
      return;
    }

    if (customersToMerge.includes(primaryCustomerId)) {
      toast.error("Primary customer cannot be in the merge list");
      return;
    }

    mergeMutation.mutate({
      primaryId: primaryCustomerId,
      mergeIds: customersToMerge,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Find Duplicate Customers / Affiliates</DialogTitle>
        </DialogHeader>

        <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 space-y-2">
          <h4 className="font-semibold text-blue-900 dark:text-blue-100">Merging Business Rules:</h4>
          <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-disc list-inside">
            <li>Two customer accounts can be merged together, even if both have order history</li>
            <li>A customer account can be merged into any affiliate account</li>
            <li className="font-semibold">Important: An affiliate with commission history cannot be merged into a customer account</li>
          </ul>
        </div>

        {/* Loader */}
        {isLoading && (
          <div className="text-center py-8">Scanning for duplicates...</div>
        )}

        {/* Loaded but no Duplicates */}
        {!isLoading && duplicates && duplicates?.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No duplicate customers found!
          </div>
        )}

        {/* Loaded and duplicates */}
        {!isLoading && duplicates && duplicates?.length !== 0 && (
          <div className="space-y-4">

            {!selectedGroup && (
              <>
                <div className="flex items-center gap-2 text-amber-600 bg-amber-50 p-4 rounded-lg">
                  <AlertCircle className="h-5 w-5" />
                  <p>Found {duplicates?.length} potential duplicate group(s)</p>
                </div>
                <div className="space-y-2">
                  {duplicates?.map((group, idx) => (
                    <div
                      key={idx}
                      className="border rounded-lg p-4 hover:bg-accent cursor-pointer"
                      onClick={() => {
                        console.log("group is ", group);
                        setSelectedGroup(group)
                      }}
                    >
                      <div className="font-medium">
                        Duplicate {group?.field}: {group?.value}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {group?.customers?.length} customer{group?.customers?.length !== 1 ? 's' : ''} / {group?.affiliateCount} affiliate{group?.affiliateCount !== 1 ? 's' : ''} found
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {selectedGroup && (
              <div className="space-y-4">
                <Button variant="outline" onClick={() => setSelectedGroup(null)}>
                  ← Back to all duplicates
                </Button>

                <div className="border rounded-lg p-4 space-y-4">
                  <div>
                    <h3 className="font-semibold">
                      Merge Accounts - {selectedGroup?.field}: {selectedGroup?.value}
                    </h3>
                    <div className="text-sm text-muted-foreground mt-1">
                      Found {selectedGroup?.customers?.length} customer record(s) and {selectedGroup?.affiliateCount} matching affiliate record(s)
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      Select the primary record to keep (all data will be merged into this record):
                    </p>

                    {/* Display Customers */}
                    {selectedGroup?.customers?.map((customer) => (
                      <div
                        key={customer.selfCustomerId}
                        className={`border rounded-lg p-4 cursor-pointer ${primaryCustomerId === customer.selfCustomerId ? "border-primary bg-primary/5" : ""
                          }`}
                        onClick={() => setPrimaryCustomerId(customer.selfCustomerId)}
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
                                Subscription: <span className={selectedGroup.subscriptionStatus[customer.selfCustomerId] ? "text-red-600 font-semibold" : "text-foreground"}>
                                  {selectedGroup.subscriptionStatus[customer.selfCustomerId] ? "Yes" : "No"}
                                </span>
                              </div>
                              <div className="text-blue-600 font-medium mt-1">Customer</div>
                            </div>
                          </div>
                          {primaryCustomerId === customer.selfCustomerId && (
                            <div className="text-primary font-medium">Primary</div>
                          )}
                        </div>
                      </div>
                    ))}

                    {/* Display Affiliates */}
                    {selectedGroup?.affiliates?.map((affiliate) => (
                      <div
                        key={affiliate._id}
                        className={`border rounded-lg p-4 cursor-pointer ${primaryCustomerId === affiliate.selfAffiliateId ? "border-primary bg-primary/5" : ""
                          }`}
                        onClick={() => setPrimaryCustomerId(affiliate.selfAffiliateId)}
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
                                Subscription: <span className={selectedGroup.subscriptionStatus[affiliate.selfAffiliateId] ? "text-red-600 font-semibold" : "text-foreground"}>
                                  {selectedGroup.subscriptionStatus[affiliate.selfAffiliateId] ? "Yes" : "No"}
                                </span>
                              </div>
                              <div className="text-red-600 font-medium mt-1">Affiliate</div>
                            </div>
                          </div>
                          {primaryCustomerId === affiliate.selfAffiliateId && (
                            <div className="text-primary font-medium">Primary</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {primaryCustomerId && (
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">
                        Select customers / affiliates to merge into the primary record:
                      </p>
                      {/* Customers to merge */}
                      {selectedGroup?.customers
                        .filter((c) => c.selfCustomerId !== primaryCustomerId)
                        .map((customer) => (
                          <div key={customer.selfCustomerId} className="flex items-center gap-3 border rounded-lg p-3">
                            <Checkbox
                              checked={customersToMerge.includes(customer.selfCustomerId)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setCustomersToMerge([...customersToMerge, customer.selfCustomerId]);
                                } else {
                                  setCustomersToMerge(customersToMerge.filter((id) => id !== customer.selfCustomerId));
                                }
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

                      {/* Affiliates to merge */}
                      {selectedGroup.affiliates
                        .filter((a) => a.selfAffiliateId !== primaryCustomerId)
                        .map((affiliate) => (
                          <div key={affiliate.selfAffiliateId} className="flex items-center gap-3 border rounded-lg p-3">
                            <Checkbox
                              checked={customersToMerge.includes(affiliate.selfAffiliateId)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setCustomersToMerge([...customersToMerge, affiliate.selfAffiliateId]);
                                } else {
                                  setCustomersToMerge(customersToMerge.filter((id) => id !== affiliate.selfAffiliateId));
                                }
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
                    </div>
                  )}

                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => {
                      setSelectedGroup(null);
                      setPrimaryCustomerId("");
                      setCustomersToMerge([]);
                    }}>
                      Cancel
                    </Button>
                    <Button
                      onClick={handleMerge}
                      disabled={!primaryCustomerId || customersToMerge.length === 0 || mergeMutation.isPending}
                    >
                      {mergeMutation.isPending ? "Merging..." : "Merge Customers"}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 
        {isLoading ? (
          <div className="text-center py-8">Scanning for duplicates...</div>
        ) : duplicates && duplicates.length > 0 ? (
          <div className="space-y-4">
            {!selectedGroup ? (
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
                      onClick={() => setSelectedGroup(group)}
                    >
                      <div className="font-medium">
                        Duplicate {group.field}: {group.value}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {group.customers.length} customer{group.customers.length !== 1 ? 's' : ''} / {group.affiliateCount} affiliate{group.affiliateCount !== 1 ? 's' : ''} found
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="space-y-4">
                <Button variant="outline" onClick={() => setSelectedGroup(null)}>
                  ← Back to all duplicates
                </Button>

                <div className="border rounded-lg p-4 space-y-4">
                  <div>
                    <h3 className="font-semibold">
                      Merge Accounts - {selectedGroup.field}: {selectedGroup.value}
                    </h3>
                    <div className="text-sm text-muted-foreground mt-1">
                      Found {selectedGroup.customers.length} customer record(s) and {selectedGroup.affiliateCount} matching affiliate record(s)
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      Select the primary record to keep (all data will be merged into this record):
                    </p>
                    
                    {selectedGroup.customers.map((customer) => (
                      <div
                        key={customer.id}
                        className={`border rounded-lg p-4 cursor-pointer ${
                          primaryCustomerId === customer.id ? "border-primary bg-primary/5" : ""
                        }`}
                        onClick={() => setPrimaryCustomerId(customer.id)}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="font-medium">
                              {customer.first_name} {customer.last_name}
                            </div>
                            <div className="text-sm space-y-1 mt-1">
                              <div className="font-mono text-xs bg-muted px-2 py-1 rounded inline-block">
                                Customer ID: {customer.customer_id}
                              </div>
                              <div className="text-muted-foreground">Email: {customer.email}</div>
                              <div className="text-muted-foreground">Phone: {customer.phone || "N/A"}</div>
                              <div className="text-muted-foreground">
                                Address: {customer.address ? `${customer.address}, ${customer.city}, ${customer.state_province}` : "N/A"}
                              </div>
                              <div className="text-muted-foreground">Created: {new Date(customer.created_at).toLocaleDateString()}</div>
                              <div className="text-muted-foreground">
                                Subscription: <span className={selectedGroup.subscriptionStatus.get(customer.id) ? "text-red-600 font-semibold" : "text-foreground"}>
                                  {selectedGroup.subscriptionStatus.get(customer.id) ? "Yes" : "No"}
                                </span>
                              </div>
                              <div className="text-blue-600 font-medium mt-1">Customer</div>
                            </div>
                          </div>
                          {primaryCustomerId === customer.id && (
                            <div className="text-primary font-medium">Primary</div>
                          )}
                        </div>
                      </div>
                    ))}
                  
                    {selectedGroup.affiliates.map((affiliate) => (
                      <div
                        key={affiliate.id}
                        className={`border rounded-lg p-4 cursor-pointer ${
                          primaryCustomerId === affiliate.id ? "border-primary bg-primary/5" : ""
                        }`}
                        onClick={() => setPrimaryCustomerId(affiliate.id)}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="font-medium">
                              {affiliate.first_name} {affiliate.last_name}
                            </div>
                            <div className="text-sm space-y-1 mt-1">
                              <div className="font-mono text-xs bg-muted px-2 py-1 rounded inline-block">
                                Affiliate ID: {affiliate.affiliate_id}
                              </div>
                              <div className="text-muted-foreground">Email: {affiliate.email}</div>
                              <div className="text-muted-foreground">Phone: {affiliate.phone || "N/A"}</div>
                              <div className="text-muted-foreground">
                                Address: {affiliate.address ? `${affiliate.address}, ${affiliate.city}, ${affiliate.state_province}` : "N/A"}
                              </div>
                              <div className="text-muted-foreground">Created: {new Date(affiliate.created_at).toLocaleDateString()}</div>
                              <div className="text-muted-foreground">
                                Subscription: <span className={selectedGroup.subscriptionStatus.get(affiliate.id) ? "text-red-600 font-semibold" : "text-foreground"}>
                                  {selectedGroup.subscriptionStatus.get(affiliate.id) ? "Yes" : "No"}
                                </span>
                              </div>
                              <div className="text-red-600 font-medium mt-1">Affiliate</div>
                            </div>
                          </div>
                          {primaryCustomerId === affiliate.id && (
                            <div className="text-primary font-medium">Primary</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {primaryCustomerId && (
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">
                        Select customers / affiliates to merge into the primary record:
                      </p>

                      {selectedGroup.customers
                        .filter((c) => c.id !== primaryCustomerId)
                        .map((customer) => (
                          <div key={customer.id} className="flex items-center gap-3 border rounded-lg p-3">
                            <Checkbox
                              checked={customersToMerge.includes(customer.id)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setCustomersToMerge([...customersToMerge, customer.id]);
                                } else {
                                  setCustomersToMerge(customersToMerge.filter((id) => id !== customer.id));
                                }
                              }}
                            />
                            <div className="flex-1">
                              <div className="font-medium">
                                {customer.first_name} {customer.last_name}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                Customer ID: {customer.customer_id} • {customer.email} • {customer.phone || "No phone"}
                              </div>
                              <div className="text-sm text-blue-600 font-medium">Customer</div>
                            </div>
                          </div>
                        ))}
                      
                      {selectedGroup.affiliates
                        .filter((a) => a.id !== primaryCustomerId)
                        .map((affiliate) => (
                          <div key={affiliate.id} className="flex items-center gap-3 border rounded-lg p-3">
                            <Checkbox
                              checked={customersToMerge.includes(affiliate.id)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setCustomersToMerge([...customersToMerge, affiliate.id]);
                                } else {
                                  setCustomersToMerge(customersToMerge.filter((id) => id !== affiliate.id));
                                }
                              }}
                            />
                            <div className="flex-1">
                              <div className="font-medium">
                                {affiliate.first_name} {affiliate.last_name}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                Affiliate ID: {affiliate.affiliate_id} • {affiliate.email} • {affiliate.phone || "No phone"}
                              </div>
                              <div className="text-sm text-red-600 font-medium">Affiliate</div>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}

                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => {
                      setSelectedGroup(null);
                      setPrimaryCustomerId("");
                      setCustomersToMerge([]);
                    }}>
                      Cancel
                    </Button>
                    <Button
                      onClick={handleMerge}
                      disabled={!primaryCustomerId || customersToMerge.length === 0 || mergeMutation.isPending}
                    >
                      {mergeMutation.isPending ? "Merging..." : "Merge Customers"}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No duplicate customers found!
          </div>
        )}

         */}
      </DialogContent>
    </Dialog>
  );
}
