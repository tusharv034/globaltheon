import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";
import { updateUser } from "@/api/auth";
import { useMutation } from "@tanstack/react-query";
import { UpdateUserPayload } from "@/types";
import { useAuthStore } from "@/store/useAuthStore";
import { Loader2 } from "lucide-react";

const personalInfoSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(50),
  lastName: z.string().min(1, "Last name is required").max(50),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  addressLineOne: z.string().optional(),
  cityTown: z.string().optional(),
  stateProvince: z.string().optional(),
  zipPostal: z.string().optional(),
  country: z.string().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

type PersonalInfoFormValues = z.infer<typeof personalInfoSchema>;

interface PersonalInfoFormProps {
  profile: PersonalInfoFormValues & { _id: string };
  onUpdate: (updated: PersonalInfoFormValues) => void;
}

export const PersonalInfoForm = ({ profile, onUpdate }: PersonalInfoFormProps) => {

  const updateAuthUser = useAuthStore((state) => state.updateAuthUser);

  // toast
  const { toast } = useToast();

  // initial rendering of values in form
  const form = useForm<PersonalInfoFormValues>({
    resolver: zodResolver(personalInfoSchema),
    reValidateMode: "onChange",
    defaultValues: {
      firstName: profile.firstName || '',
      lastName: profile.lastName || '',
      email: profile.email || '',
      phone: profile.phone || '',
      addressLineOne: profile.addressLineOne || '',
      cityTown: profile.cityTown || '',
      stateProvince: profile.stateProvince || '',
      zipPostal: profile.zipPostal || '',
      country: profile.country || '',
    },
  });
  // Mutation to updateUser

  const updateUserMutation = useMutation({

    mutationFn: (variables: UpdateUserPayload) => updateUser(variables),

    onSuccess: (response) => {
      // console.log("Response is ", response);
      console.log("Response is ", response);
      console.log("Response.data is ", response.data);
      console.log("Response.data.data is ", response.data.data);

      // updateAuthUser
      updateAuthUser(response.data.data);

      toast({
        title: "Profile updated",
        description: "Your information has been saved successfully.",
      });

      // Tell parent exactly what is now on the server
      onUpdate(form.getValues());
    },

    onError: (error) => {
      // console.log("error is ", error);
    }
  });

  const onSubmit2 = async (data: PersonalInfoFormValues) => {
    try {
      // console.log("data is ", data);

      // Grok, create payload based on value changes so to send only required changes
      // 1. Compute only the fields that actually changed
      const changedFields: Partial<PersonalInfoFormValues> = {};

      // Compare each field with the original profile
      if (data.firstName !== (profile.firstName || "")) changedFields.firstName = data.firstName;
      if (data.lastName !== (profile.lastName || "")) changedFields.lastName = data.lastName;
      if (data.email !== (profile.email || "")) changedFields.email = data.email;
      if (data.phone !== (profile.phone || "")) changedFields.phone = data.phone || null;
      if (data.addressLineOne !== (profile.addressLineOne || "")) changedFields.addressLineOne = data.addressLineOne || null;
      if (data.cityTown !== (profile.cityTown || "")) changedFields.cityTown = data.cityTown || null;
      if (data.stateProvince !== (profile.stateProvince || "")) changedFields.stateProvince = data.stateProvince || null;
      if (data.zipPostal !== (profile.zipPostal || "")) changedFields.zipPostal = data.zipPostal || null;
      if (data.country !== (profile.country || "")) changedFields.country = data.country || null;

      // If nothing changed → early return
      if (Object.keys(changedFields).length === 0) {
        toast({
          title: "No changes",
          description: "You haven't made any changes to save.",
        });
        return;
      }

      // console.log("Changde Fields are ", changedFields);

      // 2. Prepare payload for your updateUser API function
      const updatePayload: UpdateUserPayload = {
        ...changedFields,
      };

      await updateUserMutation.mutateAsync(updatePayload);

      // validate data
    } catch (error: any) {
      console.error("Error in onSubmit2:", error);

      toast({
        title: "Update failed",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    }

  }

  useEffect(() => {
    form.reset(profile); // if profile has exactly the same shape!
  }, [profile, form]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit2)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>First Name</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="lastName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Last Name</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input {...field} type="email" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone</FormLabel>
                <FormControl>
                  <Input {...field} type="tel" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Address Information</h3>

          <FormField
            control={form.control}
            name="addressLineOne"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Street Address</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="cityTown"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>City / Town</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="stateProvince"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>State / Province</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="zipPostal"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Zip / Postal Code</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="country"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Country</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <Button type="submit" disabled={updateUserMutation.isPending}>{updateUserMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />: "Save Changes"}</Button>
      </form>
    </Form>
  );
};
