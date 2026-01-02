import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff } from "lucide-react";
import logoImage from "@/assets/logo-white.avif";
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useAuthStore, useShopifyStore } from "@/store/useAuthStore";
import { login, loginThroughToken, resetUserPassword } from "@/api/auth";

import { LoginPayload, ResetPasswordPayload } from "@/types";
import config from "@/config/env";
import { getIntegrationsData } from "@/api/company";
import { getCompensationPlan } from "@/api/compensationPlan";
import { useDateFormatStore } from "@/store/useDateFormat";




const Auth = () => {

  try {
    
    const setShopifyUrl = useShopifyStore((state) => state.setShopifyUrl);
    const setDateFormat = useDateFormatStore((state) => state.setDateFormat);

    const [alertDialog, setAlertDialog] = useState({
      open: false,
      title: "",
      description: "",
      variant: "default" as "default" | "destructive"
    });

    const [showForgotPassword, setShowForgotPassword] = useState(false);

    const [loginData, setLoginData] = useState({
      email: "",
      password: ""
    });

    const [showPassword, setShowPassword] = useState(false);

    const [loading, setLoading] = useState(false);

    const { toast } = useToast();

    const navigate = useNavigate();

    const [resetEmail, setResetEmail] = useState("");

    // grab variables from auth store
    const { user, token } = useAuthStore();

    // grab functions from auth store
    const setAuth = useAuthStore((state) => state.setAuth);
    const clearAuth = useAuthStore(state => state.clearAuth);
    const updateAuthUser = useAuthStore(state => state.updateAuthUser);

    useEffect(() => {
      if (token) clearAuth();
    }, []);

    const { data: configData, isLoading: configIsLoading, refetch } = useQuery({
      queryKey: ['config'],
      queryFn: async () => {
       
        const response = await getIntegrationsData();
      

        const shopifyUrl = response?.data?.data.find((c) => c.integrationName === 'shopify')?.config?.storeUrl;

        setShopifyUrl(shopifyUrl);
        return response;
      },
      enabled: false, // Disable automatic fetching
    });


    const { data, isLoading: isFetchingPlan, refetch: refetchPlan } = useQuery({
      queryKey: ["compensationPlan"],
      queryFn: async () => {
     
        const response = await getCompensationPlan();
      
        const plan = response?.data?.data;

        if (plan) {
          const region = plan.dateFormatRegion ?? "default";
          const variant = plan.dateFormatVariant ?? "short";

          // Set into your Zustand store (exactly like your Shopify example)
          setDateFormat(region, variant);
        }

        return response;
      },
      enabled: false, // Disabled — you control when to fetch with refetchPlan()
    });

    // create handleLogin functionality
    const loginMutation = useMutation({

      mutationFn: async (variables: LoginPayload) => await login(variables.email.trim(), variables.password.trim()),

      onSuccess: async (response) => {

        setAuth(response?.data?.data?.token, response?.data?.data?.user, false);

        let stateUrl = null;
        if (response?.data?.data?.user?.profilePictureUrl) {
          stateUrl = `${config.cloudFrontUrl}profile-pictures${response?.data?.data?.user?.profilePictureUrl?.split("/profile-pictures")[1]}`;
        }

        updateAuthUser({ profilePictureUrl: stateUrl });

        toast({
          title: "Welcome back!",
          description: "You've successfully logged in."
        });

      
        // Fetch company configuration only after login
        await refetch();
        await refetchPlan();

        if (response?.data?.data?.user?.role === "affiliate") {

          navigate("/affiliate-dashboard");
        } else {

          navigate("/");
        }


      },

      onError: (error: any) => {

        toast({
          title: "Invalid Credentials",
          description: error?.response?.data?.message || "Please Enter Valid Email and Password",
        });
      }
    });

    const handleLogin2 = async (e: React.FormEvent<HTMLFormElement>) => {

      e.preventDefault();

      const formData = new FormData(e.currentTarget);

      const email = formData.get("login-email") as string;

      const password = formData.get("login-password") as string;

      await loginMutation.mutateAsync({
        email,
        password
      })
    }

    // create resetPassword functionality
    const resetPasswordMutation = useMutation({

      mutationFn: (variables: ResetPasswordPayload) => resetUserPassword({email: variables.email.trim(), domainName: variables.domainName.trim()}),

      onSuccess: (response => {
        // clear field
        toast({
          title: "Email Sent Successfully!",
          description: "Please Check your inbox."
        });
      }),

      onError: (error: any) => {
        console.log("error is ", error?.response?.data?.message);
        toast({
          title: "Please Try Later",
          description: error?.response?.data?.message || "Something went wrong",
        });
      }
    });

    const handleForgotPassword2 = (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      const formData = new FormData(e.currentTarget);

      const email = formData.get("reset-email") as string;

      const domainName = window.location.origin;

      resetPasswordMutation.mutate({
        email,
        domainName
      });
    }

    const loginThroughTokenMutation = useMutation({

      mutationFn: async (payload: any) => await loginThroughToken(payload),

      onSuccess: (response) => {

        const urlWithoutToken = window.location.href.split('?')[0];

        window.history.replaceState({}, '', urlWithoutToken);

        setAuth(response?.data?.data?.affiliateToken, response?.data?.data?.user, true);

        let stateUrl = null;
        if (response?.data?.data?.user?.profilePictureUrl) {
          stateUrl = `${config.cloudFrontUrl}profile-pictures${response?.data?.data?.user?.profilePictureUrl?.split("/profile-pictures")[1]}`;
        }

        updateAuthUser({ profilePictureUrl: stateUrl });

        toast({
          title: "Welcome back!",
          description: "You've successfully impersonated."
        });

        if (response?.data?.data?.user?.role === "admin" || response?.data?.data?.user?.role === "super_admin") {

          navigate("/");
        } else {

          navigate("/affiliate-dashboard");
        }
      },

      onError: (error) => {
        // console.log("error is ", error);
      }
    })

    useEffect(() => {

      // Extract token from URL
      const urlParams = new URLSearchParams(window.location.search);

      const token = urlParams.get('token');

      const callLogin = async () => {

        const payload = {
          token
        }

        await loginThroughTokenMutation.mutateAsync(payload);
      }

      if (token) {
        callLogin();
        return;
      }
    }, []);

    return <>
      <AlertDialog open={alertDialog.open} onOpenChange={open => setAlertDialog({
        ...alertDialog,
        open
      })}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className={alertDialog.variant === "destructive" ? "text-destructive" : ""}>
              {alertDialog.title}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-left whitespace-pre-line">
              {alertDialog.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setAlertDialog({
              ...alertDialog,
              open: false
            })}>
              OK
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="min-h-screen flex">
        {/* Left Side - Form Section */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-background">
          <div className="w-full max-w-md space-y-8">
            <div className="lg:hidden mb-8 -mx-8 -mt-8 px-8 py-8 bg-[#1a1f2e]">
              <img src={logoImage} alt="OneHouse" className="max-w-[150px] w-auto h-auto mx-auto" />
            </div>

            {showForgotPassword ? <div className="space-y-6">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Reset Password</h2>
                <p className="text-muted-foreground">Enter your email to receive reset instructions</p>
              </div>

              <form onSubmit={handleForgotPassword2} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reset-email">Email Address</Label>
                  <Input id="reset-email" name="reset-email" type="email" placeholder="name@company.com" value={resetEmail} onChange={e => setResetEmail(e.target.value)} required className="h-12" />
                </div>

                <Button type="submit" className="w-full h-12 text-base bg-[#1a1f2e] hover:bg-[#1a1f2e]/90" disabled={resetPasswordMutation.isPending}>
                  {resetPasswordMutation.isPending ? "Sending..." : "Send Reset Link"}
                </Button>

                <Button type="button" variant="ghost" className="w-full" onClick={() => setShowForgotPassword(false)}>
                  Back to Login
                </Button>
              </form>
            </div> : <div className="space-y-6">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Welcome back</h2>
                <p className="text-muted-foreground">Enter your credentials to access your account</p>
              </div>

              <form onSubmit={handleLogin2} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email Address</Label>
                  <Input id="login-email" name="login-email" type="email" placeholder="name@company.com" value={loginData.email} onChange={e => setLoginData({
                    ...loginData,
                    email: e.target.value
                  })} required className="h-12" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="login-password">Password</Label>
                  <div className="relative">
                    <Input id="login-password" name="login-password" type={showPassword ? "text" : "password"} placeholder="Enter your password" value={loginData.password} onChange={e => setLoginData({
                      ...loginData,
                      password: e.target.value
                    })} required className="h-12 pr-10" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button type="button" onClick={() => setShowForgotPassword(true)} className="text-sm text-primary hover:underline">
                    Forgot password?
                  </button>
                </div>

                <Button type="submit" className="w-full h-12 text-base bg-[#1a1f2e] hover:bg-[#1a1f2e]/90" disabled={loginMutation.isPending}>
                  {loginMutation.isPending ? "Logging in..." : "Login"}
                </Button>
              </form>
            </div>}
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
              Welcome to Your<br />Affiliate Network
            </h1>
            <p className="text-xl text-gray-300 leading-relaxed">Build, manage, and grow your team with tools designed for success.</p>
            <div className="mt-12 space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-lg">Affiliate commission tracking</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-lg">Real-time analytics dashboard</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-lg">Comprehensive team management</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>;
  } catch (error) {
    // console.log("error is ", error);
  }
};
export default Auth;