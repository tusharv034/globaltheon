import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { UserMenu } from "@/components/user-menu";
import { SocialMediaLinks } from "@/components/social-media-links";
import logoImage from "@/assets/theon-logo.avif";
import { useAuthStore } from "@/store/useAuthStore";
import { readCompany } from "@/api/company";
import { useMutation, useQuery } from "@tanstack/react-query";
import { updateKYC } from "@/api/affiliate";

const kycSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(200),
  email: z.string().trim().email("Invalid email address").max(255),
  phone: z.string().trim().min(1, "Phone number is required").max(50),
  taxId: z.string().trim().min(1, "SSN/EIN is required").max(50),
  addressLineOne: z.string().trim().min(1, "Street address is required").max(500),
  cityTown: z.string().trim().min(1, "City/Town is required").max(100),
  stateProvince: z.string().trim().min(1, "State/Province is required").max(100),
  zipPostal: z.string().trim().min(1, "Zip/Postal code is required").max(20),
});

type KYCFormData = z.infer<typeof kycSchema>;

const KYCCompletion = () => {
  const { user, token } = useAuthStore();

  const clearAuth = useAuthStore(state => state.clearAuth);

  const [affiliateData, setAffiliateData] = useState<any>(user);
  // const [kycStatus, setKycStatus] = useState<'pending' | 'rejected' | "inactive" | null>(user.status === "pending KYC" && "pending" || user.status || null);
  const [kycStatus, setKycStatus] = useState<any>(user.status === "pending KYC" && "pending" || user.status || null);
  const [matchType, setMatchType] = useState<'affiliate' | 'customer' | null>(null);
  const [companySettings, setCompanySettings] = useState<any>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const form = useForm<KYCFormData>({
    resolver: zodResolver(kycSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      taxId: "",
      addressLineOne: "",
      cityTown: "",
      stateProvince: "",
      zipPostal: "",
    },
  });

  useEffect(() => {
    // Pre-fill fields from affiliate data if available
    if (affiliateData) {
    
      const fullName = `${affiliateData.firstName || ''} ${affiliateData.lastName || ''}`.trim();
      if (fullName) {
        form.setValue("name", fullName);
      }
      if (affiliateData.email) {
        form.setValue("email", affiliateData.email);
      }
      if (affiliateData.phone) {
        form.setValue("phone", affiliateData.phone);
      }
      if (affiliateData.taxId) {
        form.setValue("taxId", affiliateData.taxId);
      }
      if (affiliateData.addressLineOne) {
        form.setValue("addressLineOne", affiliateData.addressLineOne);
      }
      if (affiliateData.cityTown) {
        form.setValue("cityTown", affiliateData.cityTown);
      }
      if (affiliateData.stateProvince) {
        form.setValue("stateProvince", affiliateData.stateProvince);
      }
      if (affiliateData.zipPostal) {
        form.setValue("zipPostal", affiliateData.zipPostal);
      }
    }
  }, [affiliateData, form]);


  const { isLoading, data, isError, error } = useQuery({
    queryKey: ["read-company"],
    queryFn: async () => {
      try {
        const response = await readCompany();

      
        setCompanySettings(response?.data?.data);
        return response?.data?.data;
      } catch (error) {
        console.log("error is ", error);
      }
    }
  });

  const updateAuthUser = useAuthStore(state => state.updateAuthUser);

  const kycUpdateMutation = useMutation({
    mutationFn: (payload: any) => updateKYC(payload),

    onSuccess: (response) => {
     
      // update the user store
      updateAuthUser(response.data.data)

    

      // if kycApproved
      if (response.data.data.kycPass) {
        toast({
          title: "KYC Approved!",
          description: "Your account has been verified. You can now access your back office.",
        })
        navigate("/affiliate-dashboard");
      } else {
        setMatchType(response.data.data.matchType || null);
        setKycStatus('rejected');
      }
    },

    onError: (error) => {
      console.log("error is ", error);
      toast({
        title: "Submission Failed",
        description: error.message || "Failed to submit KYC information",
        variant: "destructive",
      })
    }

  })

  useEffect(() => {

  }, [user]);

  const onSubmit = async (data: KYCFormData) => {

    const payload = {}

    if(data.email !== user.email) payload.email = data.email;
    if(data.phone !== user.phone) payload.phone = data.phone;
    if(data.taxId !== user.taxId) payload.taxId = data.taxId;
    if(data.addressLineOne !== user.addressLineOne) payload.addressLineOne = data.addressLineOne;
    if(data.stateProvince !== user.stateProvince) payload.stateProvince = data.stateProvince;
    if(data.cityTown !== user.cityTown) payload.cityTown = data.cityTown;
    if(data.zipPostal !== user.zipPostal) payload.zipPostal = data.zipPostal;


    // check for payload exist
    if (!Object.keys(payload).length === 0) return;

    // Call edge function to check duplicates and process KYC
    await kycUpdateMutation.mutateAsync(payload);
    return;
  }

  
  if (isLoading || kycUpdateMutation.isLoading) {
    return (
      <SidebarProvider defaultOpen={true}>
        <div className="min-h-screen flex w-full bg-dashboard-bg">
          <AppSidebar />
          
          <div className="flex-1 flex flex-col w-full overflow-x-hidden">
            <header className="md:hidden h-14 flex items-center justify-between gap-3 px-4 border-b border-white/10 sticky top-0 z-10" style={{ backgroundColor: "#1a1f2e" }}>
              <div className="flex items-center gap-3">
                <SidebarTrigger className="text-white hover:bg-white/10" />
                <img src={logoImage} alt="Theon Global" className="h-8 w-auto" />
              </div>
              <UserMenu />
            </header>
            
            <header className="hidden md:flex h-16 bg-white border-b border-border items-center justify-between px-6 shadow-sm sticky top-0 z-10">
              <h1 className="text-xl font-semibold text-foreground">KYC Verification</h1>
              <UserMenu />
            </header>
            
            <main className="flex-1 flex items-center justify-center p-6">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </main>
            
            <footer className="px-4 md:px-6 py-4 border-t border-border flex flex-col sm:flex-row items-center justify-center sm:justify-between gap-3">
              <p className="text-sm text-muted-foreground">© {new Date().getFullYear()}, Theon Global</p>
              <SocialMediaLinks />
            </footer>
          </div >
        </div >
      </SidebarProvider >
    );
  }


  // If KYC was rejected, show only the rejection message
  if (kycStatus === 4 || kycStatus === 2) {
    // if (user.status === 'rejected') {
    return (
      <SidebarProvider defaultOpen={true}>
        <div className="min-h-screen flex w-full bg-dashboard-bg">
          <AppSidebar />

          <div className="flex-1 flex flex-col w-full overflow-x-hidden">
            {/* Mobile Header */}
            <header className="md:hidden h-14 flex items-center justify-between gap-3 px-4 border-b border-white/10 sticky top-0 z-10" style={{ backgroundColor: "#1a1f2e" }}>
              <div className="flex items-center gap-3">
                <SidebarTrigger className="text-white hover:bg-white/10" />
                <img src={logoImage} alt="Theon Global" className="h-8 w-auto" />
              </div>
              <UserMenu />
            </header>

            {/* Desktop Header */}
            <header className="hidden md:flex h-16 bg-white border-b border-border items-center justify-between px-6 shadow-sm sticky top-0 z-10">
              <h1 className="text-xl font-semibold text-foreground">KYC Verification</h1>
              <UserMenu />
            </header>

            <main className="flex-1 p-4 md:p-6">
              <div className="max-w-4xl w-full mx-auto">
                <Card className="w-full">
                  <CardHeader>
                    <CardTitle className="text-xl sm:text-2xl font-bold">KYC Verification</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <Alert variant="destructive">
                      <AlertDescription className="space-y-2">
                        <p>
                          One or more pieces of information matches another Theon Global {matchType === 'customer' ? 'Customer' : 'Affiliate'} account. We would love to help you signup as an affiliate for Theon Global.
                        </p>
                        <p>
                          Feel free to give us a call at{" "}
                          <strong>{companySettings?.companyPhone || "346-808-2171"}</strong>{" "}
                          {companySettings?.hoursOfOperation || "Monday - Friday (9am - 5pm CST)"}{" "}
                          or feel free to{" "}
                          <a href="#" className="underline font-semibold">Click Here</a> and submit the form and a support representative can help you directly.
                        </p>
                      </AlertDescription>
                    </Alert>

                    <Button
                      variant="outline"
                      size="lg"
                      className="w-full sm:w-auto"
                      onClick={() => supabase.auth.signOut().then(() => navigate("/auth"))}
                    >
                      Sign Out
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </main>

            <footer className="px-4 md:px-6 py-4 border-t border-border flex flex-col sm:flex-row items-center justify-center sm:justify-between gap-3">
              <p className="text-sm text-muted-foreground">© {new Date().getFullYear()}, Theon Global</p>
              <SocialMediaLinks />
            </footer>
          </div>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen flex w-full bg-dashboard-bg">
        <AppSidebar />

        <div className="flex-1 flex flex-col w-full overflow-x-hidden">
          {/* Mobile Header */}
          <header className="md:hidden h-14 flex items-center justify-between gap-3 px-4 border-b border-white/10 sticky top-0 z-10" style={{ backgroundColor: "#1a1f2e" }}>
            <div className="flex items-center gap-3">
              <SidebarTrigger className="text-white hover:bg-white/10" />
              <img src={logoImage} alt="Theon Global" className="h-8 w-auto" />
            </div>
            <UserMenu />
          </header>

          {/* Desktop Header */}
          <header className="hidden md:flex h-16 bg-white border-b border-border items-center justify-between px-6 shadow-sm sticky top-0 z-10">
            <h1 className="text-xl font-semibold text-foreground">KYC Verification</h1>
            <UserMenu />
          </header>

          <main className="flex-1 p-4 md:p-6">
            <div className="max-w-4xl w-full mx-auto">
              <Card className="w-full">
                <CardHeader>
                  <CardTitle className="text-xl sm:text-2xl font-bold break-words">WELCOME TO YOUR BACK OFFICE</CardTitle>
                  <CardDescription className="text-sm sm:text-base mt-2">
                    We need a little more information from you. Please provide your SSN, Address, Phone and Email to complete your application and access your back office.
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-4 sm:px-6">
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 sm:space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Name</FormLabel>
                              <FormControl>
                                <Input {...field} className="bg-muted text-sm" disabled />
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
                                <Input {...field} type="email" className="text-sm" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                        <FormField
                          control={form.control}
                          name="phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Phone</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="(XXX) XXX-XXXX" className="text-sm" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="taxId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>SSN/EIN</FormLabel>
                              <FormControl>
                                <Input {...field} type="password" placeholder="XXX-XX-XXXX" className="text-sm" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="space-y-4">
                        <FormLabel>Address</FormLabel>

                        <FormField
                          control={form.control}
                          name="addressLineOne"
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input {...field} placeholder="Street Address" className="text-sm" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
                          <FormField
                            control={form.control}
                            name="cityTown"
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input {...field} placeholder="City" className="text-sm" />
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
                                <FormControl>
                                  <Input {...field} placeholder="State/Province" className="text-sm" />
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
                                <FormControl>
                                  <Input {...field} placeholder="Zip / Postal Code" className="text-sm" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-4 pt-4">
                        <Button type="submit" disabled={isLoading} size="lg" className="w-full sm:w-auto px-8">
                          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          Save
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="lg"
                          className="w-full sm:w-auto"
                          onClick={() => {
                            clearAuth()
                            navigate("/auth")
                          }}
                        >
                          Sign Out
                        </Button>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </div>
          </main>

          <footer className="px-4 md:px-6 py-4 border-t border-border flex flex-col sm:flex-row items-center justify-center sm:justify-between gap-3">
            <p className="text-sm text-muted-foreground">© {new Date().getFullYear()}, Theon Global</p>
            <SocialMediaLinks />
          </footer>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default KYCCompletion;
