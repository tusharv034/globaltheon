// import { useState, useEffect } from "react";
// import { useForm } from "react-hook-form";
// import { zodResolver } from "@hookform/resolvers/zod";
// import * as z from "zod";
// import { supabase } from "@/integrations/supabase/client";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { useToast } from "@/hooks/use-toast";
// import { Loader2 } from "lucide-react";
// import { useModulePermissions } from "@/hooks/use-module-permissions";

// const companySchema = z.object({
//   company_name: z.string().min(1, "Company name is required"),
//   owner_first_name: z.string().min(1, "First name is required"),
//   owner_last_name: z.string().min(1, "Last name is required"),
//   address_line1: z.string().optional(),
//   address_line2: z.string().optional(),
//   city: z.string().optional(),
//   state_province: z.string().optional(),
//   postal_code: z.string().optional(),
//   company_email: z.string().email("Invalid email").optional().or(z.literal("")),
//   support_email: z.string().email("Invalid email").optional().or(z.literal("")),
//   company_phone: z.string().optional(),
//   hours_of_operation: z.string().optional(),
// });

// type CompanyFormData = z.infer<typeof companySchema>;

// export function CompanyTab() {
//   const [loading, setLoading] = useState(false);
//   const [existingId, setExistingId] = useState<string | null>(null);
//   const { toast } = useToast();
//   const { hasPermission } = useModulePermissions();
//   const canEdit = hasPermission("company_settings_company", "edit");

//   const {
//     register,
//     handleSubmit,
//     reset,
//     formState: { errors },
//   } = useForm<CompanyFormData>({
//     resolver: zodResolver(companySchema),
//   });

//   useEffect(() => {
//     loadCompanySettings();
//   }, []);

//   const loadCompanySettings = async () => {
//     try {
//       const { data, error } = await supabase
//         .from("company_settings")
//         .select("*")
//         .single();

//       if (error && error.code !== "PGRST116") {
//         throw error;
//       }

//       if (data) {
//         setExistingId(data.id);
//         reset({
//           company_name: data.company_name || "",
//           owner_first_name: data.owner_first_name || "",
//           owner_last_name: data.owner_last_name || "",
//           address_line1: data.address_line1 || "",
//           address_line2: data.address_line2 || "",
//           city: data.city || "",
//           state_province: data.state_province || "",
//           postal_code: data.postal_code || "",
//           company_email: data.company_email || "",
//           support_email: data.support_email || "",
//           company_phone: data.company_phone || "",
//           hours_of_operation: data.hours_of_operation || "",
//         });
//       }
//     } catch (error: any) {
//       console.error("Error loading company settings:", error);
//       toast({
//         title: "Error",
//         description: "Failed to load company settings",
//         variant: "destructive",
//       });
//     }
//   };

//   const onSubmit = async (data: CompanyFormData) => {
//     if (!canEdit) {
//       toast({
//         title: "Permission Denied",
//         description: "You need edit permissions to save company settings.",
//         variant: "destructive",
//       });
//       return;
//     }
//     setLoading(true);
//     try {
//       if (existingId) {
//         const { error } = await supabase
//           .from("company_settings")
//           .update(data)
//           .eq("id", existingId);

//         if (error) throw error;
//       } else {
//         const insertData = {
//           company_name: data.company_name,
//           owner_first_name: data.owner_first_name,
//           owner_last_name: data.owner_last_name,
//           address_line1: data.address_line1 || null,
//           address_line2: data.address_line2 || null,
//           city: data.city || null,
//           state_province: data.state_province || null,
//           postal_code: data.postal_code || null,
//           company_email: data.company_email || null,
//           support_email: data.support_email || null,
//           company_phone: data.company_phone || null,
//           hours_of_operation: data.hours_of_operation || null,
//         };

//         const { data: newData, error } = await supabase
//           .from("company_settings")
//           .insert([insertData])
//           .select()
//           .single();

//         if (error) throw error;
//         if (newData) setExistingId(newData.id);
//       }

//       toast({
//         title: "Success",
//         description: "Company settings saved successfully",
//       });
//     } catch (error: any) {
//       console.error("Error saving company settings:", error);
//       toast({
//         title: "Error",
//         description: error.message || "Failed to save company settings",
//         variant: "destructive",
//       });
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="space-y-6">
//       <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
//         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//           <div className="space-y-2">
//             <Label htmlFor="company_name">Company Name *</Label>
//             <Input
//               id="company_name"
//               {...register("company_name")}
//               placeholder="Enter company name"
//               disabled={!canEdit}
//             />
//             {errors.company_name && (
//               <p className="text-sm text-destructive">{errors.company_name.message}</p>
//             )}
//           </div>

//           <div className="space-y-2">
//             <Label htmlFor="owner_first_name">Owner First Name *</Label>
//             <Input
//               id="owner_first_name"
//               {...register("owner_first_name")}
//               placeholder="First name"
//               disabled={!canEdit}
//             />
//             {errors.owner_first_name && (
//               <p className="text-sm text-destructive">{errors.owner_first_name.message}</p>
//             )}
//           </div>

//           <div className="space-y-2">
//             <Label htmlFor="owner_last_name">Owner Last Name *</Label>
//             <Input
//               id="owner_last_name"
//               {...register("owner_last_name")}
//               placeholder="Last name"
//               disabled={!canEdit}
//             />
//             {errors.owner_last_name && (
//               <p className="text-sm text-destructive">{errors.owner_last_name.message}</p>
//             )}
//           </div>
//         </div>

//         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//           <div className="space-y-2">
//             <Label htmlFor="address_line1">Address Line 1</Label>
//             <Input
//               id="address_line1"
//               {...register("address_line1")}
//               placeholder="Street address"
//               disabled={!canEdit}
//             />
//           </div>

//           <div className="space-y-2">
//             <Label htmlFor="address_line2">Address Line 2</Label>
//             <Input
//               id="address_line2"
//               {...register("address_line2")}
//               placeholder="Apartment, suite, etc. (optional)"
//               disabled={!canEdit}
//             />
//           </div>
//         </div>

//         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//           <div className="space-y-2">
//             <Label htmlFor="city">City</Label>
//             <Input
//               id="city"
//               {...register("city")}
//               placeholder="City"
//               disabled={!canEdit}
//             />
//           </div>

//           <div className="space-y-2">
//             <Label htmlFor="state_province">State/Province</Label>
//             <Input
//               id="state_province"
//               {...register("state_province")}
//               placeholder="State or Province"
//               disabled={!canEdit}
//             />
//           </div>

//           <div className="space-y-2">
//             <Label htmlFor="postal_code">Postal/Zip Code</Label>
//             <Input
//               id="postal_code"
//               {...register("postal_code")}
//               placeholder="Postal or Zip code"
//               disabled={!canEdit}
//             />
//           </div>
//         </div>

//         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//           <div className="space-y-2">
//             <Label htmlFor="company_email">Company Email</Label>
//             <Input
//               id="company_email"
//               type="email"
//               {...register("company_email")}
//               placeholder="company@example.com"
//               disabled={!canEdit}
//             />
//             {errors.company_email && (
//               <p className="text-sm text-destructive">{errors.company_email.message}</p>
//             )}
//           </div>

//           <div className="space-y-2">
//             <Label htmlFor="support_email">Support Email</Label>
//             <Input
//               id="support_email"
//               type="email"
//               {...register("support_email")}
//               placeholder="support@example.com"
//               disabled={!canEdit}
//             />
//             {errors.support_email && (
//               <p className="text-sm text-destructive">{errors.support_email.message}</p>
//             )}
//           </div>

//           <div className="space-y-2">
//             <Label htmlFor="company_phone">Company Phone</Label>
//             <Input
//               id="company_phone"
//               {...register("company_phone")}
//               placeholder="(555) 123-4567"
//               disabled={!canEdit}
//             />
//           </div>
//         </div>

//         <div className="space-y-2">
//           <Label htmlFor="hours_of_operation">Days and Hours of Operation</Label>
//           <Input
//             id="hours_of_operation"
//             {...register("hours_of_operation")}
//             placeholder="e.g., Mon-Fri 9am-5pm EST"
//             disabled={!canEdit}
//           />
//         </div>

//         <Button type="submit" disabled={loading || !canEdit}>
//           {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
//           Save Company Settings
//         </Button>
//       </form>
//     </div>
//   );
// }


import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { useModulePermissions } from "@/hooks/use-module-permissions";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getCompanyData, updateCompanyData } from "@/api/company";



const companySchema = z.object({
  companyName: z.string().min(1, "Company name is required"),
  ownerFirstName: z.string().min(1, "First name is required"),
  ownerLastName: z.string().min(1, "Last name is required"),
  addressLineOne: z.string().optional(),
  addressLineTwo: z.string().optional(),
  city: z.string().optional(),
  stateProvince: z.string().optional(),
  postalCode: z.string().optional(),
  companyEmail: z.string().email("Invalid email").optional().or(z.literal("")),
  supportEmail: z.string().email("Invalid email").optional().or(z.literal("")),
  companyPhone: z.string().optional(),
  hoursOfOperation: z.string().optional(),
});

type CompanyFormData = z.infer<typeof companySchema>;

export function CompanyTab() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { hasPermission } = useModulePermissions();
  const canEdit = hasPermission("company_settings_permissions","company", "edit");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CompanyFormData>({
    resolver: zodResolver(companySchema),
  });

  const { data, error, isError } = useQuery({
    queryKey: ['companySettings'],
    queryFn: getCompanyData,
  });
  const companyData=data?.data?.data;
  
  useEffect(() => {
    if (companyData) {
      reset({
        companyName: companyData.companyName || '',
        ownerFirstName: companyData.ownerFirstName || '',
        ownerLastName: companyData.ownerLastName || '',
        addressLineOne: companyData.addressLineOne || '',
        addressLineTwo: companyData.addressLineTwo || '',
        city: companyData.city || '',
        stateProvince: companyData.stateProvince || '',
        postalCode: companyData.zipPostal || '',
        companyEmail: companyData.companyEmail || '',
        supportEmail: companyData.supportEmail || '',
        companyPhone: companyData.companyPhone || '',
        hoursOfOperation: companyData.hoursOfOperation || '',
      });
    }
  }, [companyData, reset]);

  const mutation = useMutation({
    mutationFn: updateCompanyData,
    onMutate: () => {
      setLoading(true); // Set loading state when mutation starts
    },
    onSuccess: (response) => {
      setLoading(false); // Reset loading state after success
      toast({
        title: "Success",
        description: response.data?.message || "Company details updated successfully",
      });
    },
    onError: (error) => {
      setLoading(false); // Reset loading state if there's an error
      toast({
        title: "Error",
        description: error.message || "Failed to save company settings",
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (companyData) => {
    mutation.mutate(companyData); // Trigger the mutation
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="company_name">Company Name *</Label>
            <Input
              id="company_name"
              {...register("companyName")}
              placeholder="Enter company name"
              disabled={!canEdit}
            />
            {errors.companyName && (
              <p className="text-sm text-destructive">{errors.companyName.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="owner_first_name">Owner First Name *</Label>
            <Input
              id="owner_first_name"
              {...register("ownerFirstName")}
              placeholder="First name"
              disabled={!canEdit}
            />  
            {errors.ownerFirstName && (
              <p className="text-sm text-destructive">{errors.ownerFirstName.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="owner_last_name">Owner Last Name *</Label>
            <Input
              id="owner_last_name"
              {...register("ownerLastName")}
              placeholder="Last name"
              disabled={!canEdit}
            />
            {errors.ownerLastName && (
              <p className="text-sm text-destructive">{errors.ownerLastName.message}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="address_line1">Address Line 1</Label>
            <Input
              id="address_line1"
              {...register("addressLineOne")}
              placeholder="Street address"
              disabled={!canEdit}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address_line2">Address Line 2</Label>
            <Input
              id="address_line2"
              {...register("addressLineTwo")}
              placeholder="Apartment, suite, etc. (optional)"
              disabled={!canEdit}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="city">City</Label>
            <Input
              id="city"
              {...register("city")}
              placeholder="City"
              disabled={!canEdit}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="state_province">State/Province</Label>
            <Input
              id="state_province"
              {...register("stateProvince")}
              placeholder="State or Province"
              disabled={!canEdit}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="postal_code">Postal/Zip Code</Label>
            <Input
              id="postal_code"
              {...register("postalCode")}
              placeholder="Postal or Zip code"
              disabled={!canEdit}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="company_email">Company Email</Label>
            <Input
              id="company_email"
              type="email"
              {...register("companyEmail")}
              placeholder="company@example.com"
              disabled={!canEdit}
            />
            {errors.companyEmail && (
              <p className="text-sm text-destructive">{errors.companyEmail.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="support_email">Support Email</Label>
            <Input
              id="support_email"
              type="email"
              {...register("supportEmail")}
              placeholder="support@example.com"
              disabled={!canEdit}
            />
            {errors.supportEmail && (
              <p className="text-sm text-destructive">{errors.supportEmail.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="company_phone">Company Phone</Label>
            <Input
              id="company_phone"
              {...register("companyPhone")}
              placeholder="(555) 123-4567"
              disabled={!canEdit}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="hours_of_operation">Days and Hours of Operation</Label>
          <Input
            id="hours_of_operation"
            {...register("hoursOfOperation")}
            placeholder="e.g., Mon-Fri 9am-5pm EST"
            disabled={!canEdit}
          />
        </div>

        <Button type="submit" disabled={loading || !canEdit}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Company Settings
        </Button>
      </form>
    </div>
  );
}
