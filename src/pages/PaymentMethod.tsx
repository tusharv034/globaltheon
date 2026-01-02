import { useState, useEffect } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { UserMenu } from "@/components/user-menu";
import { SocialMediaLinks } from "@/components/social-media-links";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PaymentStepper } from "@/components/payment-method/payment-stepper";
import { AddressStep } from "@/components/payment-method/address-step";
import { PaymentMethodStep } from "@/components/payment-method/payment-method-step";
import { TaxFormsStep } from "@/components/payment-method/tax-forms-step";
import { DoneStep } from "@/components/payment-method/done-step";

export default function PaymentMethod() {
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);
  const [tipaltiConfig, setTipaltiConfig] = useState<{
    payer_name: string;
    iframe_url: string;
  } | null>(null);
  const [affiliateData, setAffiliateData] = useState({
    affiliateId: "",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  });
  const { toast } = useToast();

  // Editable form data for demonstration
  const [addressData, setAddressData] = useState({
    type: "Individual",
    contactEmail: "affiliate@example.com",
    phoneNumber: "+12393674700",
    firstName: "John",
    middleName: "",
    lastName: "Doe",
    country: "United States",
    streetAddress: "361 12th ave NE",
    address2: "",
    city: "Naples",
    state: "FL",
    zip: "34120",
  });

  const [paymentData, setPaymentData] = useState({
    paymentMethod: "Direct Deposit / ACH",
    nameOnAccount: "John Doe",
    bankName: "Wells Fargo",
    routingCode: "063107513",
    accountNumber: "******2369",
    accountType: "Checking",
    transactionFee: "USD 1.05",
  });

  const taxFormsData = {
    submittedDate: "5/17/2024",
  };

  const steps = [
    { number: 1, label: "Address", completed: currentStep > 1 },
    { number: 2, label: "Payment Method", completed: currentStep > 2 },
    { number: 3, label: "Tax Forms", completed: currentStep > 3 },
    { number: 4, label: "Done", completed: currentStep > 4 },
  ];

  useEffect(() => {
    loadTipaltiConfig();
    loadAffiliateInfo();
  }, []);

  const loadTipaltiConfig = async () => {
    try {
      const { data, error } = await supabase
        .from("integrations")
        .select("config, is_enabled")
        .eq("integration_name", "tipalti")
        .single();

      if (!error && data && data.is_enabled) {
        setTipaltiConfig(data.config as any);
      } else {
        // Use sane defaults so the demo wizard always renders
        setTipaltiConfig({
          payer_name: "Theon Global",
          iframe_url: "https://ui2.tipalti.com/payeedashboard/home",
        });
      }
    } catch (error: any) {
      console.error("Error loading Tipalti config:", error);
      // Still set defaults to show the demo
      setTipaltiConfig({
        payer_name: "Theon Global",
        iframe_url: "https://ui2.tipalti.com/payeedashboard/home",
      });
    } finally {
      setLoading(false);
    }
  };
  const loadAffiliateInfo = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: affiliate } = await supabase
          .from("affiliates")
          .select("affiliate_id, first_name, last_name, email, phone")
          .eq("auth_user_id", user.id)
          .single();

        if (affiliate) {
          setAffiliateData({
            affiliateId: affiliate.affiliate_id,
            firstName: affiliate.first_name,
            lastName: affiliate.last_name,
            email: affiliate.email,
            phone: affiliate.phone || "",
          });
        }
      }
    } catch (error) {
      console.error("Error loading affiliate info:", error);
    }
  };

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen flex w-full bg-dashboard-bg">
        <AppSidebar />
        
        <div className="flex-1 flex flex-col w-full">
          <header className="h-14 md:h-16 bg-white border-b border-border flex items-center justify-between px-4 md:px-6 shadow-sm sticky top-0 z-10">
            <h1 className="text-lg md:text-xl font-semibold text-foreground">Payment Method</h1>
            <UserMenu />
          </header>
          
          <main className="flex-1 p-4 md:p-6">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : !tipaltiConfig ? (
              <Alert>
                <AlertDescription>
                  Tipalti integration is not configured. Please contact your administrator to enable payment processing.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="max-w-6xl mx-auto space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Payment Setup</CardTitle>
                    <CardDescription>
                      Complete your payment information to receive commissions
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-8">
                    <PaymentStepper currentStep={currentStep} steps={steps} />

                    <div className="min-h-[400px]">
                      {currentStep === 1 && <AddressStep data={addressData} onChange={setAddressData} />}
                      {currentStep === 2 && <PaymentMethodStep data={paymentData} onChange={setPaymentData} />}
                      {currentStep === 3 && <TaxFormsStep data={taxFormsData} />}
                      {currentStep === 4 && <DoneStep />}
                    </div>

                    <div className="flex flex-col sm:flex-row justify-between gap-3 pt-6 border-t">
                      <Button
                        variant="outline"
                        onClick={handleBack}
                        disabled={currentStep === 1}
                        className="w-full sm:w-auto"
                      >
                        Back
                      </Button>
                      {currentStep < 4 && (
                        <Button onClick={handleNext} className="w-full sm:w-auto bg-[#f59e0b] hover:bg-[#d97706] text-white">
                          {currentStep === 2 ? "Edit" : "Next"}
                        </Button>
                      )}
                    </div>

                    <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                      <p className="text-sm text-blue-900">
                        <strong>Demo Mode:</strong> This is a demonstration of the Tipalti payment setup flow. 
                        In production, this will integrate with Tipalti's secure iFrame to collect real payment information.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
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
