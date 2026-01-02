import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff } from "lucide-react";
import logoImage from "@/assets/logo-white.avif";
import { useAuthStore } from "@/store/useAuthStore";
import { useMutation, useQueries, useQuery } from "@tanstack/react-query";
import { changeUserPassword, checkResetPasswordAllowed } from "@/api/auth";
import { Check } from 'lucide-react';

const resetPasswordSchema = z.object({
  // temporaryPassword: z.string().min(1, "Temporary password is required"),
  newPassword: z.string(),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

export default function ResetPassword() {

  const { toast } = useToast()

  // used for navgation
  const navigate = useNavigate();

  const resetTokenRef = useRef<string | null>(null);

  const [resetToken, setResetToken] = useState("");

  // used for fetching the token
  const [searchParams] = useSearchParams();

  // state to trigger show tempPassword
  const [showTempPassword, setShowTempPassword] = useState(false);

  // state to trigger show newPassword
  const [showNewPassword, setShowNewPassword] = useState(false);

  // state to trigger show confirmPassword
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // state to store password strength
  const [newPasswordStrength, setNewPasswordStrength] = useState(0);

  // state to store the newPassword
  const [newPassword, setNewPassword] = useState("");

  // state to store password strength
  const [confirmPasswordStrength, setConfirmPasswordStrength] = useState(0);

  // state to store the newPassword
  const [confirmPassword, setConfirmPassword] = useState("");

  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      // temporaryPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const { token, user } = useAuthStore();

  const { data: checkResetAllowed, isLoading } = useQuery({
    queryKey: ["check-reset-allowed"],
    queryFn: async() => {

      try {
       const payload = {
        token: resetTokenRef.current
      }
      const response = await checkResetPasswordAllowed(payload);

      console.log("checkResetAllowed response is ", response);

      return response.data.data; 
      } catch (error) {
        navigate("/auth");
      }
    },
    enabled: !!(resetToken)
  })

  useEffect(() => {

    const resetToken = searchParams.get("token");

    console.log("resetToken is ", resetToken);

    resetTokenRef.current = resetToken;

    setResetToken(resetToken);

    // if (true) return;
    if(resetToken || resetToken !== null) return;

    navigate("/auth");

  }, [navigate, searchParams]);

  const changePasswordMutation = useMutation({
    mutationFn: async (payload: any) => await changeUserPassword(payload),

    onSuccess: (response) => {
      // console.log("reseponse is ", response);
      toast({
        title: "Password Reset Sucessfully",
        description: "Please Login again with new password",
      });
      setNewPasswordStrength(0);
      setConfirmPasswordStrength(0);
      setNewPassword("");
      setConfirmPassword("");
      navigate("/auth");
    },

    onError: (error) => {
      console.log("changePasswordMutation error is ", error?.response?.data?.message);
      toast({
        title: "Please Try Later",
        description: error?.response?.data?.message || "Something went wrong",
      });
    }
  })

  const onSubmit = async (values: ResetPasswordFormValues) => {

    const payload = {
      token: resetTokenRef.current,
      // temporaryPassword: values.temporaryPassword,
      newPassword: values.newPassword,
      confirmPassword: values.confirmPassword,
    }

    console.log("payload is ", payload);

    await changePasswordMutation.mutateAsync(payload);
  };

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
    
    // Rule 2.5: At least 1 lowercase letter
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
    
    // Rule 2.5: At least 1 lowercase letter
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
    <div className="min-h-screen flex">
      {/* Left Side - Form Section */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md space-y-8">
          <div className="lg:hidden mb-8 -mx-8 -mt-8 px-8 py-8 bg-[#1a1f2e]">
            <img src={logoImage} alt="OneHouse" className="max-w-[150px] w-auto h-auto mx-auto" />
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tight">Reset Your Password</h2>
              <p className="text-muted-foreground">Enter your temporary password and choose a new password</p>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {/* 
                <FormField
                  control={form.control}
                  name="temporaryPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Temporary Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showTempPassword ? "text" : "password"}
                            placeholder="Enter temporary password"
                            className="h-12 pr-10"
                            {...field}
                          />
                          <button
                            type="button"
                            onClick={() => {

                              setShowTempPassword(!showTempPassword)
                            }}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                          >
                            {showTempPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 */}

                <FormField
                  control={form.control}
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showNewPassword ? "text" : "password"}
                            placeholder="Enter new password"
                            className="h-12 pr-10"
                            {...field}
                            onChange={(e) => {
                              field.onChange(e);
                              setNewPassword(e.target.value);
                            }}
                          />
                          <div
                            // type="button"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                          >
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
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground">Confirm New Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="Confirm new password"
                            className="h-12 pr-10"
                            {...field}
                            required
                            onChange={(e) => {
                              field.onChange(e); // ← Important: update react-hook-form state
                              setConfirmPassword(e.target.value); // ← Your local state for strength check
                            }}
                          />
                          <div
                            // type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                          >
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

                <Button type="submit" className="w-full h-12 text-base bg-[#1a1f2e] hover:bg-[#1a1f2e]/90">
                  {changePasswordMutation?.isPending ? "Updating Password..." : "Reset Password"}
                  {/* {"Reset Password"} */}
                </Button>
              </form>
            </Form>

            <div className="mt-4 text-center text-sm text-muted-foreground">
              <p>Need help? Contact support at support@theonglobal.com</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Brand Section */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#1a1f2e] relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-64 h-64 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-white rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 flex flex-col justify-center px-16 text-white">
          <img src={logoImage} alt="OneHouse" className="max-w-[200px] w-auto h-auto mb-12" />
          <h1 className="text-5xl font-bold mb-6 leading-tight">
            Secure Your<br />Account
          </h1>
          <p className="text-xl text-gray-300 leading-relaxed">
            Create a strong password to protect your affiliate network account and sensitive data.
          </p>
          <div className="mt-12 space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-lg">Secure password encryption</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-lg">Protected account access</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-lg">Safe data management</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
