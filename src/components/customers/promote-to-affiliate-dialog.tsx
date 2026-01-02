import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useForm } from "react-hook-form";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { useState, useMemo } from "react";
import { readActiveAffiliates } from "@/api/affiliate";
import { promoteCustomerToAffiliate } from "@/api/customer";

interface Customer {
  id: string;
  customer_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  phone_numbers?: any;
  address?: string;
  address2?: string;
  city?: string;
  state_province?: string;
  postal_code?: string;
  country?: string;
  status: string;
  email_opted_out?: boolean;
  email_opted_out_at?: string;
  enrolled_by?: string;
}

interface PromoteToAffiliateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: Customer;
  onSuccess: () => void;
}

interface PromoteFormData {
  site_name: string;
  status: string;
  enrolled_by?: string;
  tax_id?: string;
}

export function PromoteToAffiliateDialog({
  open,
  onOpenChange,
  customer,
  onSuccess
}: PromoteToAffiliateDialogProps) {

  // queryClient for invalidating queries
  const queryClient = useQueryClient();
  // state to store the search values
  const [affiliateSearch, setAffiliateSearch] = useState("");
  // state to open the recommended values
  const [affiliatePopoverOpen, setAffiliatePopoverOpen] = useState(false);

  // Form 
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<PromoteFormData>({
    defaultValues: {
      siteName: "",
      status: 1,
      enrolledBy: customer.enrolledBy || undefined,
      taxId: ""
    }
  });

  const enrolledBy = watch("enrolledBy");

  // Fetch affiliates for enrolling affiliate search
  const { data: affiliates, isLoading } = useQuery({
    queryKey: ['affiliates-for-promotion'],
    queryFn: async () => {
      try {

        const response = await readActiveAffiliates();

        return response.data.data;
      } catch (error) {
        // console.error("Error is ", error);

      }
    }
  });

  // Filter affiliates based on search
  const filteredAffiliates = useMemo(() => {
    if (!affiliateSearch.trim()) return affiliates || [];

    const searchLower = affiliateSearch?.toString()?.toLowerCase();

    // console.log("affiliates during useMemo is ", affiliates);
    // console.log("Search  value is", searchLower);
    return affiliates.length !== 0 ? affiliates?.filter((aff) => {
      const fullName = `${aff.firstName} ${aff.lastName}`.toLowerCase();
      const selfAffiliateId = aff.selfAffiliateId.toString().toLowerCase();
      if (fullName.includes(searchLower) || selfAffiliateId.includes(searchLower)) {
        // console.log("found match ", aff);
      }
      return fullName.includes(searchLower) || selfAffiliateId.includes(searchLower);
    }) : [];
  }, [affiliates, affiliateSearch, isLoading]);

  // Get selected affiliate name
  // affiliates
  const selectedAffiliate = filteredAffiliates?.find(a => a.selfAffiliateId.toString() === enrolledBy.toString());

  const promoteMutation2 = useMutation({
    mutationFn: async (formData: PromoteFormData) => {


      return
      // Generate a unique affiliate_id
      const { data: maxAffiliateData } = await supabase
        .from('affiliates')
        .select('affiliate_id')
        .order('affiliate_id', { ascending: false })
        .limit(1)
        .maybeSingle();

      let newAffiliateId = "AFF-10001";
      if (maxAffiliateData?.affiliate_id) {
        const maxNum = parseInt(maxAffiliateData.affiliate_id.replace('AFF-', ''));
        newAffiliateId = `AFF-${(maxNum + 1).toString().padStart(5, '0')}`;
      }

      // Create the affiliate record
      const { error: affiliateError } = await supabase
        .from('affiliates')
        .insert({
          affiliate_id: newAffiliateId,
          first_name: customer.first_name,
          last_name: customer.last_name,
          email: customer.email,
          phone: customer.phone,
          phone_numbers: customer.phone_numbers,
          address: customer.address,
          address2: customer.address2,
          city: customer.city,
          state_province: customer.state_province,
          postal_code: customer.postal_code,
          country: customer.country,
          status: formData.status,
          email_opted_out: customer.email_opted_out,
          email_opted_out_at: customer.email_opted_out_at,
          enrolled_by: formData.enrolled_by || null,
          site_name: formData.site_name,
          tax_id: formData.tax_id || null,
          rank: "Affiliate",
          teqnavi_enabled: false,
          total_commissions: 0,
          total_sales: 0
        });

      if (affiliateError) throw affiliateError;

      // Get the newly created affiliate's UUID
      const { data: newAffiliate } = await supabase
        .from('affiliates')
        .select('id')
        .eq('affiliate_id', newAffiliateId)
        .single();

      if (!newAffiliate) throw new Error("Failed to retrieve new affiliate ID");

      // Get admin info for the note
      const userId = (await supabase.auth.getUser()).data.user?.id;
      const { data: profile } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('id', userId)
        .maybeSingle();

      const adminName = profile
        ? `${profile.first_name} ${profile.last_name}`.trim()
        : 'Unknown Admin';

      // Create a note in the affiliate's notes
      const noteText = `Customer ${customer.first_name} ${customer.last_name} (${customer.customer_id}) promoted to Affiliate on ${format(new Date(), 'MM/dd/yyyy')}. Promoted by: ${adminName}`;

      await supabase
        .from('affiliate_notes')
        .insert({
          affiliate_id: newAffiliate.id,
          note_text: noteText,
          note_type: 'system',
          created_by: userId,
          metadata: {
            type: 'promotion',
            previous_customer_id: customer.customer_id,
            promoted_by: adminName,
            promotion_date: new Date().toISOString()
          }
        });

      return newAffiliateId;
    },
    onSuccess: (newAffiliateId) => {
      toast({
        title: "Success",
        description: `Customer promoted to affiliate ${newAffiliateId}`,
      });
      queryClient.invalidateQueries({ queryKey: ['affiliates'] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      onSuccess();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to promote customer to affiliate",
        variant: "destructive",
      });
    }
  });

  const promoteMutation = useMutation({
    mutationFn: async (payload: any) => await promoteCustomerToAffiliate(payload),

    onSuccess: (response) => {
      // console.log("response is ", response);
      toast({
        title: "Customer promoted",
        description: "Customer promoted successfully",
      })
      queryClient.invalidateQueries({ queryKey: ['affiliates'] });
      queryClient.invalidateQueries(["customers"]);
      onSuccess();
    },

    onError: (error) => {
      // console.log("error is ", error);
      queryClient.invalidateQueries(["customers"]);
      toast({
        title: "Customer could not be promoted",
        description: error.response.data.message,
        variant: "destructive",
      })
    }
  });

  const onSubmit = (data: PromoteFormData) => {

    // console.log("data is ", data);

    let error = null;

    if (data.siteName.toString().trim() === "") {
      error = "Please Enter site name"
    }
    if (isNaN(parseInt(data.status))) {
      error = "Please Enter valid Status "
    }
    if (isNaN(parseInt(data.enrolledBy))) {
      error = "Please Enter enrolled By";
    }
    if (data.taxId.toString().trim() === "") {
      error = "Please Enter Tax ID";
    }

    if (error) {

      toast({
        title: "Invalid Data",
        description: error
      })
      return;
    }

    data.customerId = customer._id;

    promoteMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Promote Customer to Affiliate</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Customer Name</Label>
              <Input value={`${customer.firstName} ${customer.lastName}`} disabled />
            </div>
            <div>
              <Label>Email</Label>
              <Input value={customer.email} disabled />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="site_name">Site Name *</Label>
              <Input
                id="siteName"
                {...register("siteName", { required: "Site name is required" })}
                placeholder="Enter site name"
              />
              {errors.siteName && (
                <p className="text-sm text-destructive mt-1">{errors.siteName.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="status">Status *</Label>
              <div className="relative">
                <select
                  id="status"
                  value={watch("status")}
                  onChange={(e) => setValue("status", e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value={1}>Active</option>
                  <option value={2}>Inactive</option>
                  <option value={3}>Cancelled</option>
                  <option value={4}>Terminated</option>
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="enrolled_by">Enrolling Affiliate</Label>
              <Popover open={affiliatePopoverOpen} onOpenChange={setAffiliatePopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={affiliatePopoverOpen}
                    className="w-full justify-between"
                  >
                    {selectedAffiliate
                      ? `${selectedAffiliate.selfAffiliateId} - ${selectedAffiliate.firstName} ${selectedAffiliate.lastName}`
                      : "Search for affiliate..."}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[400px] p-0" align="start">
                  <Command>
                    <CommandInput
                      placeholder="Search affiliates..."
                      value={affiliateSearch}
                      onValueChange={setAffiliateSearch}
                    />
                    <CommandList>
                      <CommandEmpty>No affiliate found.</CommandEmpty>
                      <CommandGroup>
                        <CommandItem
                          value="none"
                          onSelect={() => {
                            setValue("enrolledBy", undefined);
                            setAffiliatePopoverOpen(false);
                            setAffiliateSearch("");
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              !enrolledBy ? "opacity-100" : "opacity-0"
                            )}
                          />
                          None
                        </CommandItem>
                        {!isLoading && filteredAffiliates?.map((affiliate) => (
                          <CommandItem
                            key={affiliate.selfAffiliateId}
                            value={`${affiliate.selfAffiliateId}-${affiliate.firstName}-${affiliate.lastName}`}
                            onSelect={() => {
                              setValue("enrolledBy", affiliate.selfAffiliateId);
                              setAffiliatePopoverOpen(false);
                              setAffiliateSearch("");
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                enrolledBy.toString() === affiliate.selfAffiliateId.toString() ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {affiliate.selfAffiliateId} - {affiliate.firstName} {affiliate.lastName}
                          </CommandItem>
                        ))}

                        {isLoading && (
                          <>
                            <Loader2 />
                          </>
                        )}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label htmlFor="taxId">Tax ID</Label>
              <Input
                id="taxId"
                {...register("taxId")}
                placeholder="Enter tax ID"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={promoteMutation.isPending}>
              {promoteMutation.isPending ? "Promoting..." : "Promote to Affiliate"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
