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
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { updateUserPassword } from "@/api/auth";
import { UpdateUserPasswordPayload } from "@/types";
import { useAuthStore } from "@/store/useAuthStore";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Check } from 'lucide-react';

const securitySchema = z.object({
  currentPassword: z.string().min(6, "Password must be at least 6 characters"),
  newPassword: z.string(),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type SecurityFormValues = z.infer<typeof securitySchema>;

export const SecurityForm = () => {

  // toast
  const { toast } = useToast();

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [newPasswordStrength, setNewPasswordStrength] = useState(0);
  const [confirmPasswordStrength, setConfirmPasswordStrength] = useState(0);

  const [newPassword, setNewPassword] = useState("");

  const [confirmPassword, setConfirmPassword] = useState("");

  // initial data rendering
  const form = useForm<SecurityFormValues>({
    resolver: zodResolver(securitySchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  // handle form submit
  const onSubmit = async (data: SecurityFormValues) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: data.newPassword,
      });

      if (error) throw error;

      toast({
        title: "Password updated",
        description: "Your password has been changed successfully",
      });

      form.reset();
    } catch (error: any) {
      console.error('Error updating password:', error);
      toast({
        title: "Update failed",
        description: error.message || "Failed to update password. Please try again.",
        variant: "destructive",
      });
    }
  };

  // updateUserPasswordMutation
  const updateUserPasswordMutation = useMutation({
    mutationFn: (variables: UpdateUserPasswordPayload) => updateUserPassword(variables),

    onSuccess: (response) => {
      // console.log("response is ", response);
      toast({
        title: "Password updated",
        description: "Your password has been changed successfully",
      });
      setNewPasswordStrength(0);
      setConfirmPasswordStrength(0);
      setNewPassword("");
      setConfirmPassword("");

      form.reset();
    },

    onError: (error) => {
      // const clearAuth = useAuthStore((state) => state.clearAuth);
      // clearAuth();
      // console.log("error is ", error?.response?.data?.message);
      toast({
        title: "Update failed",
        description: error?.response?.data?.message,
        variant: "destructive",
      });
    }
  })

  const onSubmit2 = async (data: SecurityFormValues) => {
    try {

      // console.log("data is ", data);

      if (!data.currentPassword || !data.newPassword || !data.confirmPassword) {
        // toast.error("All fields are required");
        return;
      }

      const updateUserPasswordPayload: UpdateUserPasswordPayload = {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
        confirmPassword: data.confirmPassword,
      }

      // Rule 1: At least 6 characters
      if (data.newPassword?.length < 6) return;

      // Rule 2: At least 1 uppercase letter
      if (!/[A-Z]/.test(data.newPassword)) return;

      // Rule 2.5: At least 1 lowercase letter
      if (!/[a-z]/.test(data.newPassword)) return;

      // Rule 3: At least 1 number
      if (!/[0-9]/.test(data.newPassword)) return;

      // Rule 4: At least 1 special character
      if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(data.newPassword)) return;

      if (data.newPassword !== data.confirmPassword) return;

      await updateUserPasswordMutation.mutateAsync(updateUserPasswordPayload);

    } catch (error) {
      console.error("Error is ", error);
    }
  }

  useEffect(() => {
    if (!newPassword || newPassword.trim() === "") {
      setNewPasswordStrength(0);
      return;
    }

    let strength = 0;

    // Rule 1: At least 6 characters
    if (newPassword.length >= 6) strength += 1;

    // Rule 2: At least 1 uppercase letter
    if (/[A-Z]/.test(newPassword)) strength += 1;

    // Rule 2.5: At least 1 uppercase letter
    if (/[a-z]/.test(newPassword)) strength += 1;

    // Rule 3: At least 1 number
    if (/[0-9]/.test(newPassword)) strength += 1;

    // Rule 4: At least 1 special character
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword)) strength += 1;

    setNewPasswordStrength(strength);
  }, [newPassword]);

  useEffect(() => {
    if (!confirmPassword || confirmPassword.trim() === "") {
      setConfirmPasswordStrength(0);
      return;
    }

    let strength = 0;

    // Rule 1: At least 6 characters
    if (confirmPassword.length >= 6) strength += 1;

    // Rule 2: At least 1 uppercase letter
    if (/[A-Z]/.test(confirmPassword)) strength += 1;

    // Rule 2.5: At least 1 uppercase letter
    if (/[a-z]/.test(confirmPassword)) strength += 1;

    // Rule 3: At least 1 number
    if (/[0-9]/.test(confirmPassword)) strength += 1;

    // Rule 4: At least 1 special character
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(confirmPassword)) strength += 1;

    setConfirmPasswordStrength(strength);
  }, [confirmPassword]);

  useEffect(() => {
    // Trigger validation when passwords change
    form.trigger("confirmPassword");
  }, [newPassword, confirmPassword, form]);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Password</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Update your password to keep your account secure
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit2)} className="space-y-6 max-w-md">
          <FormField
            control={form.control}
            name="currentPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Current Password</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input {...field} type={showCurrentPassword ? "text" : "password"} />
                    <div 
                    // type="button" 
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                      {showCurrentPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </div>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="newPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>New Password</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input {...field} type={showNewPassword ? "text" : "password"} onChange={(e) => {
                      field.onChange(e); // ← Important: update react-hook-form state
                      setNewPassword(e.target.value); // ← Your local state for strength check
                    }} />
                    <div 
                    // type="button" 
                    onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                      {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </div>
                  </div>
                </FormControl>
                <FormDescription>
                  <>
                    <div className="w-full flex gap-2">
                      <div className={`${newPasswordStrength > 0 ? "bg-green-800" : "bg-white"} border border-solid border-1 w-full h-2 rounded-sm`}></div>
                      <div className={`${newPasswordStrength > 1 ? "bg-green-800" : "bg-white"} border border-solid border-1 w-full h-2 rounded-sm`}></div>
                      <div className={`${newPasswordStrength > 2 ? "bg-green-800" : "bg-white"} border border-solid border-1 w-full h-2 rounded-sm`}></div>
                      <div className={`${newPasswordStrength > 3 ? "bg-green-800" : "bg-white"} border border-solid border-1 w-full h-2 rounded-sm`}></div>
                      <div className={`${newPasswordStrength > 4 ? "bg-green-800" : "bg-white"} border border-solid border-1 w-full h-2 rounded-sm`}></div>
                    </div>
                    <div className="flex flex-wrap justify-start items-start gap-3 max-w-[380px]">
                      <div className={`${newPassword.length >= 6 && "text-green-800"} text-sm flex justify-start items-center gap-1`}>{newPassword.length >= 6 && <Check className="h-3.5 w-3.5" />}6+ characters</div>
                      <div className={`${(/[A-Z]/.test(newPassword)) && "text-green-800"} text-sm flex justify-start items-center gap-1`}>{(/[A-Z]/.test(newPassword)) && <Check className="h-3.5 w-3.5" />}Atleast 1 Uppercase letter</div><br />
                      <div className={`${(/[a-z]/.test(newPassword)) && "text-green-800"} text-sm flex justify-start items-center gap-1`}>{(/[a-z]/.test(newPassword)) && <Check className="h-3.5 w-3.5" />}Atleast 1 Lowercase letter</div>
                      <div className={`${(/[0-9]/.test(newPassword)) && "text-green-800"} text-sm flex justify-start items-center gap-1`}>{(/[0-9]/.test(newPassword)) && <Check className="h-3.5 w-3.5" />}Atleast 1 Number</div><br />
                      <div className={`${(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword)) && "text-green-800"} text-sm flex justify-start items-center gap-1`}>{(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword)) && <Check className="h-3.5 w-3.5" />}Atleast 1 Special Character</div>
                    </div>
                  </>
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field, fieldState }) => (
              <FormItem>
                <FormLabel className="text-foreground">Confirm New Password</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input {...field} type={showConfirmPassword ? "text" : "password"} onChange={(e) => {
                      field.onChange(e); // ← Important: update react-hook-form state
                      setConfirmPassword(e.target.value); // ← Your local state for strength check
                    }} />
                    <div 
                    // type="button" 
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                      {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </div>
                  </div>
                </FormControl>
                <FormDescription>
                  <>
                    <div className="w-full flex gap-2">
                      <div className={`${confirmPasswordStrength > 0 ? "bg-green-800" : "bg-white"} border border-solid border-1 w-full h-2 rounded-sm`}></div>
                      <div className={`${confirmPasswordStrength > 1 ? "bg-green-800" : "bg-white"} border border-solid border-1 w-full h-2 rounded-sm`}></div>
                      <div className={`${confirmPasswordStrength > 2 ? "bg-green-800" : "bg-white"} border border-solid border-1 w-full h-2 rounded-sm`}></div>
                      <div className={`${confirmPasswordStrength > 3 ? "bg-green-800" : "bg-white"} border border-solid border-1 w-full h-2 rounded-sm`}></div>
                      <div className={`${confirmPasswordStrength > 4 ? "bg-green-800" : "bg-white"} border border-solid border-1 w-full h-2 rounded-sm`}></div>
                    </div>
                    <div className="flex flex-wrap justify-start items-start gap-3 max-w-[380px]">
                      <div className={`${confirmPassword.length >= 6 && "text-green-800"} text-sm flex justify-start items-center gap-1`}>{confirmPassword.length >= 6 && <Check className="h-3.5 w-3.5" />}6+ characters</div>
                      <div className={`${(/[A-Z]/.test(confirmPassword)) && "text-green-800"} text-sm flex justify-start items-center gap-1`}>{(/[A-Z]/.test(confirmPassword)) && <Check className="h-3.5 w-3.5" />}Atleast 1 Uppercase letter</div><br />
                      <div className={`${(/[a-z]/.test(confirmPassword)) && "text-green-800"} text-sm flex justify-start items-center gap-1`}>{(/[a-z]/.test(confirmPassword)) && <Check className="h-3.5 w-3.5" />}Atleast 1 Lowercase letter</div>
                      <div className={`${(/[0-9]/.test(confirmPassword)) && "text-green-800"} text-sm flex justify-start items-center gap-1`}>{(/[0-9]/.test(confirmPassword)) && <Check className="h-3.5 w-3.5" />}Atleast 1 Number</div><br />
                      <div className={`${(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(confirmPassword)) && "text-green-800"} text-sm flex justify-start items-center gap-1`}>{(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(confirmPassword)) && <Check className="h-3.5 w-3.5" />}Atleast 1 Special Character</div>
                    </div>
                  </>
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" disabled={updateUserPasswordMutation.isPending}>{updateUserPasswordMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Update Password"}</Button>
        </form>
      </Form>
    </div>
  );
};
