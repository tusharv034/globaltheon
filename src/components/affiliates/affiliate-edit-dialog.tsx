
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Check, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useState, useMemo, useEffect } from "react";
import { format } from "date-fns";
import { AffiliateNotes } from "./affiliate-notes";
import { CommissionHistory } from "./commission-history";
import { AffiliateCustomersList } from "./affiliate-customers-list";
import { AffiliateDownlineList } from "./affiliate-downline-list";
import { CustomerEditDialog } from "../customers/customer-edit-dialog";
import { CustomerOrdersDialog } from "@/components/customers/customer-orders-dialog";
import { OrderDetailDialog } from "@/components/customers/order-detail-dialog";
import { EnrollingAffiliateChangeDialog } from "../shared/enrolling-affiliate-change-dialog";
import { PhoneNumbersCompactManager } from "../shared/phone-numbers-compact-manager";
import { Mail, MailX } from "lucide-react";
import { ShopifyUpdateDialog } from "../shared/shopify-update-dialog";
import { ShopifyMetadataUpdateDialog } from "../shared/shopify-metadata-update-dialog";
import { CommissionAdjustmentDialog } from "../shared/commission-adjustment-dialog";
import { useAuthStore } from "@/store/useAuthStore";
import { getAffiliateById, updateAffiliate, listAffiliates, sendTemporaryPassword } from "@/api/affiliate";
import { useDateFormatStore } from "@/store/useDateFormat";
import { UpdateAffiliatePayload } from "@/types/api/affiliate";
import { getDateFormatString } from "@/utils/resolveDateFormat";

//comment for tracking
export interface PhoneNumbers {
  number: string;
  type?: "home" | "mobile" | "work" | "other";
  isPrimary?: boolean;
}
// Update the interface to match backend structure
interface Affiliate {
  _id: string;
  selfAffiliateId: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  phoneNumbers?: PhoneNumbers[];
  addressLineOne?: string;
  addressLineTwo?: string;
  cityTown?: string;
  stateProvince?: string;
  zipPostal?: string;
  country?: string;
  status: number;
  siteName?: string;
  tipaltiEnabled: boolean;
  allowAutomaticChargebacks: boolean;
  kycPass: boolean;
  enrolledBy: number;
  emailOptedOut?: boolean;
  emailOptedOutAt?: string;
  taxId?: string;
  authUserId?: string;
  // For compatibility with existing code
  id: string;
  affiliate_id: string;
  address: string | null;
  city: string | null;
  state_province: string | null;
  postal_code: string | null;
  teqnavi_enabled: boolean;
  auth_user_id?: string | null;
  tax_id?: string | null;
  enrolling_affiliate?: {
    id: string;
    affiliate_id: string;
    first_name: string;
    last_name: string;
  } | null;
}

interface AffiliateEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultTab?: string;
  initialExpandedCommission?: string;
  initialExpandedLevel?: 1 | 2;
  initialExpandedPeriod?: string;
  filterStartDate?: string;
  filterEndDate?: string;
  onBack?: () => void;
  readOnly?: boolean;
  affiliateMongoId: string;
}

export function AffiliateEditDialog({ open, onOpenChange, defaultTab = "details", initialExpandedCommission, initialExpandedLevel, initialExpandedPeriod, filterStartDate, filterEndDate, onBack: onBackProp, readOnly = false, affiliateMongoId }: AffiliateEditDialogProps) {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const [affiliateSearch, setAffiliateSearch] = useState("");
  const [currentEnrollingAffiliate, setCurrentEnrollingAffiliate] = useState<{ id: string; name: string; affiliateId: string } | null>(null);
  const [navigationStack, setNavigationStack] = useState<Affiliate[]>([]);
  const [currentAffiliate, setCurrentAffiliate] = useState<Affiliate | null>(null);
  const [viewingCustomer, setViewingCustomer] = useState<any>(null);
  const [viewingCustomerOrders, setViewingCustomerOrders] = useState<any>(null);
  const [viewingOrderId, setViewingOrderId] = useState<string | null>(null);
  const [viewingOrderCustomerType, setViewingOrderCustomerType] = useState(null);
  const [activeTab, setActiveTab] = useState(sessionStorage.getItem("affiliate-dialog-tab-value") || defaultTab);
  const [showAffiliateChangeDialog, setShowAffiliateChangeDialog] = useState(false);
  const [pendingAffiliateChange, setPendingAffiliateChange] = useState<{ newId: string; newName: string; newAffiliateId: string } | null>(null);
  const [emailOptedOut, setEmailOptedOut] = useState(false);
  const [phoneNumbers, setPhoneNumbers] = useState([]);
  const [showShopifyDialog, setShowShopifyDialog] = useState(false);
  const [pendingFormData, setPendingFormData] = useState<any>(null);
  const [showCommissionAdjustmentDialog, setShowCommissionAdjustmentDialog] = useState(false);
  const [commissionImpacts, setCommissionImpacts] = useState<CommissionImpact[]>([]);
  const [showShopifyMetadataDialog, setShowShopifyMetadataDialog] = useState(false);
  const [shopifyMetadataSiteNames, setShopifyMetadataSiteNames] = useState<{ oldSiteName: string; newSiteName: string } | null>(null);
  const [enrollingAffiliateChanged, setEnrollingAffiliateChanged] = useState(false);
  const [showPasswordChangeDialog, setShowPasswordChangeDialog] = useState(false);
  const [pendingPassword, setPendingPassword] = useState<string>("");
  const [passwordChangeNote, setPasswordChangeNote] = useState<string>("");
  const [isSendingTempPassword, setIsSendingTempPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);



  const { dateFormatRegion, dateFormatVariant } = useDateFormatStore();
  const formatString = getDateFormatString(dateFormatRegion, dateFormatVariant);

  const companyId = user?.selfClientId?.toString() || "1";
  // Fetch affiliate details from backend when dialog opens
  const { data: affiliateData, isLoading: isFetchingAffiliate } = useQuery({
    queryKey: ['affiliate', affiliateMongoId],
    queryFn: () => getAffiliateById(affiliateMongoId),
    enabled: open && !!affiliateMongoId,
  });

  useEffect(() => {
    if (affiliateData?.data?.success && affiliateData.data.data) {
      const backendAffiliate = affiliateData.data.data;
      setCurrentAffiliate({
        ...convertBackendToUiAffiliate(backendAffiliate),
        // Keep compatibility fields
        id: backendAffiliate._id,
        affiliate_id: backendAffiliate.selfAffiliateId.toString(),
        address: backendAffiliate.addressLineOne || null,
        city: backendAffiliate.cityTown || null,
        state_province: backendAffiliate.stateProvince || null,
        postal_code: backendAffiliate.zipPostal || null,
        teqnavi_enabled: backendAffiliate.tipaltiEnabled,
        auth_user_id: backendAffiliate.authUserId,
        tax_id: backendAffiliate.taxId,
      });
      setEmailOptedOut(backendAffiliate.emailOptedOut || false);
      setPhoneNumbers(backendAffiliate.phoneNumbers || []);
    }
  }, [affiliateData]);

  useEffect(() => {
    if (open) {
      setNavigationStack([]);
      setViewingCustomer(null);
      setActiveTab(defaultTab);
    }
  }, [open, defaultTab]);

  // Helper function to convert backend affiliate to UI format
  const convertBackendToUiAffiliate = (backendAffiliate: any): Affiliate => {

    const statusMap: Record<string, string> = {
      1: "Active",
      2: "Inactive",
      3: "Pending KYC", // Note the space
      4: "Rejected"
    };
    // const uiStatus = statusMap[backendAffiliate.status] || backendAffiliate.status;
    const uiStatus = backendAffiliate.status;
    return {
      _id: backendAffiliate._id,
      selfAffiliateId: backendAffiliate.selfAffiliateId,
      firstName: backendAffiliate.firstName,
      lastName: backendAffiliate.lastName,
      email: backendAffiliate.email,
      phone: backendAffiliate.phone,
      phoneNumbers: backendAffiliate.phoneNumbers || [],
      addressLineOne: backendAffiliate.addressLineOne,
      addressLineTwo: backendAffiliate.addressLineTwo,
      cityTown: backendAffiliate.cityTown,
      stateProvince: backendAffiliate.stateProvince,
      zipPostal: backendAffiliate.zipPostal,
      country: backendAffiliate.country,
      status: uiStatus,
      siteName: backendAffiliate.siteName,
      tipaltiEnabled: backendAffiliate.tipaltiEnabled,
      allowAutomaticChargebacks: backendAffiliate.allowAutomaticChargebacks,
      kycPass: backendAffiliate.kycPass,
      enrolledBy: backendAffiliate.enrolledBy,
      emailOptedOut: backendAffiliate.emailOptedOut,
      emailOptedOutAt: backendAffiliate.emailOptedOutAt,
      taxId: backendAffiliate.taxId,
      authUserId: backendAffiliate.authUserId,
      // Enroller if available
      enrolling_affiliate: backendAffiliate.enroller ? {
        id: backendAffiliate.enroller.selfAffiliateId.toString(),
        affiliate_id: backendAffiliate.enroller.selfAffiliateId.toString(),
        first_name: backendAffiliate.enroller.firstName,
        last_name: backendAffiliate.enroller.lastName,
      } : null,
    } as Affiliate;
  };

  // Fetch affiliates for enrolling affiliate search
  const { data: backendAffiliates } = useQuery({
    queryKey: ["affiliates-for-search", companyId],
    queryFn: async () => {
      const payload = {
        companyId,
        page: 1,
        limit: 100,
      };

      const response = await listAffiliates(payload);

      if (!response.data.success) {
        throw new Error(response.data.message);
      }

      return response.data.data.affiliates;
    },
  });

  // Get current enrolling affiliate details
  useEffect(() => {
    const fetchEnrollingAffiliate = async () => {
      if (currentAffiliate?.enrolledBy && backendAffiliates) {
        const enrollingAffiliate = backendAffiliates.find(a => a.selfAffiliateId === currentAffiliate.enrolledBy);
        if (enrollingAffiliate) {
          setCurrentEnrollingAffiliate({
            id: enrollingAffiliate.selfAffiliateId.toString(),
            name: `${enrollingAffiliate.firstName} ${enrollingAffiliate.lastName}`,
            affiliateId: enrollingAffiliate.selfAffiliateId.toString()
          });
        }
      } else {
        setCurrentEnrollingAffiliate(null);
      }
    };
    fetchEnrollingAffiliate();
  }, [currentAffiliate?.enrolledBy, backendAffiliates, open]);

  // Form setup
  const form = useForm({
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      addressLineOne: "",
      addressLineTwo: "",
      cityTown: "",
      stateProvince: "",
      zipPostal: "",
      country: "",
      status: 1,
      siteName: "",
      tipaltiEnabled: false,
      allowAutomaticChargebacks: false,
      kycPass: false,
      enrolledBy: "",
      taxId: "",
      password: "", // Add password field
    },
  });


  // Update form when currentAffiliate changes
  useEffect(() => {
    if (currentAffiliate) {
      const statusValue = currentAffiliate.status === 3 ? 3 : currentAffiliate.status;
      setPhoneNumbers(currentAffiliate.phoneNumbers || []);

      form.reset({
        firstName: currentAffiliate.firstName,
        lastName: currentAffiliate.lastName,
        email: currentAffiliate.email,
        phone: currentAffiliate.phone || "",
        addressLineOne: currentAffiliate.addressLineOne || "",
        addressLineTwo: currentAffiliate.addressLineTwo || "",
        cityTown: currentAffiliate.cityTown || "",
        stateProvince: currentAffiliate.stateProvince || "",
        zipPostal: currentAffiliate.zipPostal || "",
        country: currentAffiliate.country || "",
        status: statusValue,
        siteName: currentAffiliate.siteName || "",
        tipaltiEnabled: currentAffiliate.tipaltiEnabled,
        allowAutomaticChargebacks: currentAffiliate.allowAutomaticChargebacks,
        kycPass: currentAffiliate.kycPass,
        enrolledBy: currentAffiliate.enrolledBy?.toString() || "",
        taxId: currentAffiliate.taxId || "",
        password: "",
      });
    }
  }, [currentAffiliate, form]);

  // Handler functions
  const handleCustomerClick = (customer: any) => {
    setViewingCustomer(customer);
    setActiveTab("details");
  };

  const handleViewCustomerOrders = (customerId: string | number) => {
    setViewingCustomerOrders(customerId);
    setActiveTab("details");
  };

  const handleViewLastOrder = (orderId: string, customerType: string) => {
    setViewingOrderId(orderId);
    setViewingOrderCustomerType(customerType);
    // setActiveTab("details");
  };

  const handleAffiliateClick = (affiliate: any) => {
    if (currentAffiliate) {
      setNavigationStack(prev => [...prev, currentAffiliate]);
    }
    setCurrentAffiliate(affiliate);
    setActiveTab("details");
  };

  const handleBack = () => {
    if (navigationStack.length > 0) {
      const previousAffiliate = navigationStack[navigationStack.length - 1];
      setNavigationStack(prev => prev.slice(0, -1));
      setCurrentAffiliate(previousAffiliate);
    } else if (onBackProp) {
      onBackProp();
    }
  };

  const handleBackFromCustomer = () => {
    setViewingCustomer(null);
    setActiveTab("customers");
  };

  const handleBackFromCustomerOrders = () => {
    setViewingCustomerOrders(null);
    setActiveTab("customers");
  };

  const handleAffiliateChangeConfirm = () => {
    if (pendingAffiliateChange) {
      const formData = {
        ...form.getValues(),
        emailOptedOut,
        phoneNumbers,
        enrolledBy: pendingAffiliateChange.newId
      };
      updateMutation.mutate(formData);
      setPendingAffiliateChange(null);
      setShowAffiliateChangeDialog(false);
    }
  };

  const handleShopifyConfirm = () => {
    if (pendingFormData) {
      updateMutation.mutate(pendingFormData);
      setPendingFormData(null);
    }
    setShowShopifyDialog(false);
  };

  const handleCommissionAdjustmentConfirm = () => {
    // Implement commission adjustment logic
    setShowCommissionAdjustmentDialog(false);
    setCommissionImpacts([]);
  };

  const handleCommissionAdjustmentCancel = () => {
    setShowCommissionAdjustmentDialog(false);
    setCommissionImpacts([]);
  };

  const handleShopifyMetadataConfirm = () => {
    // Implement Shopify metadata update logic
    setShowShopifyMetadataDialog(false);
    setShopifyMetadataSiteNames(null);
  };

  const sendTemporaryPasswordMutation = useMutation({
    mutationFn: async (payload: any) => await sendTemporaryPassword(payload),

    onSuccess: (response) => {
      toast.success("Temprorary Password Sent Successfully");
    },

    onError: (error) => {
      toast.error("Something went wrong");
    }
  });


  const handleSendTemporaryPassword = async () => {
    setIsSendingTempPassword(true);
    if (!currentAffiliate?.email) {
      toast.error("Affiliate email is required");
      return;
    }
    const domainName = window.location.origin;

    const payload = {
      affiliateId: currentAffiliate._id,
      domainName
    }


    await sendTemporaryPasswordMutation.mutateAsync(payload);


    setIsSendingTempPassword(false);
  };

  const handlePasswordChangeConfirm = async () => {
    console.log("pending password is ", pendingPassword)
    console.log("passwordChangeNote is ", passwordChangeNote)
    console.log("conditino is  is ", !!(pendingPassword && passwordChangeNote))
    if (!!(pendingPassword && passwordChangeNote)) {
      // Implement password change logic
      console.log("adding value to form");
      form.setValue("password", pendingPassword);

      // Add note about password change
      // You'll need to implement this based on your notes system

      await updateMutation.mutateAsync({
        password: pendingPassword,
        passwordChangeReason: passwordChangeNote
      });
      setShowPasswordChangeDialog(false);
      setPendingPassword("");
      setPasswordChangeNote("");
      toast.success("Password changed successfully");
    }
  };

  // Update mutation using backend API
  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      if (!user) throw new Error("User not authenticated");

      const payload: UpdateAffiliatePayload = {
        _id: currentAffiliate?._id || "",
        companyId,
        updatedBy: user._id,
        // Map form data to backend fields
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone || undefined,
        addressLineOne: data.addressLineOne || undefined,
        addressLineTwo: data.addressLineTwo || undefined,
        cityTown: data.cityTown || undefined,
        stateProvince: data.stateProvince || undefined,
        zipPostal: data.zipPostal || undefined,
        country: data.country || undefined,
        status: data.status,
        siteName: data.siteName || undefined,
        tipaltiEnabled: data.tipaltiEnabled,
        allowAutomaticChargebacks: data.allowAutomaticChargebacks,
        kycPass: data.kycPass,
        enrolledBy: data.enrolledBy ? parseInt(data.enrolledBy) : undefined,
        taxId: data.taxId || undefined,
        emailOptedOut: emailOptedOut,
        emailOptedOutAt: new Date().toDateString(),
        phoneNumbers: phoneNumbers,
        ...(data.password && {password: data.password}),
        ...(data.passwordChangeReason && { passwordChangeReason: data.passwordChangeReason }),
      };

      const response = await updateAffiliate(payload);

      if (!response.data.success) {
        throw new Error(response.data.message);
      }

      return response.data.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["affiliates"] });
      queryClient.invalidateQueries({ queryKey: ["affiliate", affiliateMongoId] });
      toast.success("Affiliate updated successfully");

      // Update current affiliate with new data
      setCurrentAffiliate(prev => prev ? ({
        ...prev,
        ...form.getValues(),
        emailOptedOut,
        phoneNumbers,
      }) : null);

      // Close dialog if no navigation stack
      if (navigationStack.length === 0) {
        onOpenChange(false);
      }
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update affiliate");
    },
  });

  const onSubmit = (data: any) => {
    // Validation
    if (data.siteName && data.siteName.includes("@")) {
      toast.error("Site name cannot contain an @ symbol (email address)");
      return;
    }

    // Check if password is being changed
    if (data.password) {
      setPendingPassword(data.password);
      setShowPasswordChangeDialog(true);
      return;
    }

    // Check if enrolling affiliate changed
    const newEnrolledBy = data.enrolledBy ? parseInt(data.enrolledBy) : undefined;
    if (newEnrolledBy !== currentAffiliate?.enrolledBy && currentEnrollingAffiliate) {
      const newAffiliate = backendAffiliates?.find(a => a.selfAffiliateId === newEnrolledBy);
      if (newAffiliate) {
        setPendingAffiliateChange({
          newId: newEnrolledBy.toString(),
          newName: `${newAffiliate.firstName} ${newAffiliate.lastName}`,
          newAffiliateId: newAffiliate.selfAffiliateId.toString()
        });
        setShowAffiliateChangeDialog(true);
        return;
      }
    }

    const formData = { ...data, emailOptedOut };

    console.log("form Data is ", formData);


    updateMutation.mutate(formData);
  };

  // Filter affiliates for search
  const filteredAffiliates = useMemo(() => {
    if (!affiliateSearch.trim() || !backendAffiliates) return [];

    return backendAffiliates.filter((aff) => {
      const fullName = `${aff.firstName} ${aff.lastName}`.toLowerCase();
      return fullName.includes(affiliateSearch.toLowerCase()) &&
        aff.selfAffiliateId !== currentAffiliate?.selfAffiliateId;
    }) || [];
  }, [backendAffiliates, affiliateSearch, currentAffiliate]);

  // Effect to update sessionStorage whenever activeTab changes
  useEffect(() => {
    console.log("inside useEffect");
    if (activeTab) {
      console.log("changing sessions storage");
      sessionStorage.setItem('affiliate-dialog-tab-value', activeTab);
    }
  }, [activeTab]);

  if (isFetchingAffiliate || !currentAffiliate) {
    return <div>Loading...</div>; // Add proper loading state if needed
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex-shrink-0 pb-4">
          <div className="flex items-center gap-2">
            {(navigationStack.length > 0 || onBackProp) && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onBackProp || handleBack}
                className="h-8 w-8 flex-shrink-0"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <DialogTitle>
              View Affiliate - {currentAffiliate.firstName} {currentAffiliate.lastName}
            </DialogTitle>
          </div>
          {navigationStack.length > 0 && (
            <p className="text-sm text-muted-foreground mt-2">
              Viewing downline of {navigationStack[navigationStack.length - 1].firstName}{' '}
              {navigationStack[navigationStack.length - 1].lastName}
            </p>
          )}
        </DialogHeader>

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex-1 flex flex-col overflow-hidden"
        >
          <TabsList className=" flex flex-row md:grid md:grid-cols-5 flex-nowrap md:flex-wrap overflow-x-auto md:overflow-visible bg-muted p-1 rounded-md gap-1 md:gap-0 flex-shrink-0">
            <TabsTrigger value="details" className="flex-1 md:flex-initial" onClick={() => setActiveTab('details')}>
              Affiliate Details
            </TabsTrigger>
            <TabsTrigger value="customers" className="flex-1 md:flex-initial" onClick={() => setActiveTab('customers')}>
              Customers
            </TabsTrigger>
            <TabsTrigger value="affiliates" className="flex-1 md:flex-initial" onClick={() => setActiveTab('affiliates')}>
              Affiliates
            </TabsTrigger>
            <TabsTrigger value="commissions" className="flex-1 md:flex-initial" onClick={() => setActiveTab('commissions')}>
              Commission History
            </TabsTrigger>
            <TabsTrigger value="notes" className="flex-1 md:flex-initial" onClick={() => setActiveTab('notes')}>
              Notes & History
            </TabsTrigger>
          </TabsList>

          <TabsContent
            value="details"
            className="mt-6 flex-1 overflow-y-auto data-[state=active]:flex data-[state=active]:flex-col px-1"
          >
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Responsive Grid: 1 col mobile, 2 col tablet+ */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
                  <FormField control={form.control} name="siteName" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Site Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <div className="mt-2 text-sm flex flex-col sm:flex-row gap-3 sm:gap-6">
                        <div>
                          <span className="font-medium">Affiliate ID: </span>
                          <span className="text-muted-foreground">{currentAffiliate.affiliate_id}</span>
                        </div>
                        <div>
                          <span className="font-medium">Tipalti: </span>
                          <span className={cn(
                            currentAffiliate.teqnavi_enabled
                              ? "text-green-600 dark:text-green-400"
                              : "text-red-600 dark:text-red-400",
                            "font-medium"
                          )}>
                            {currentAffiliate.teqnavi_enabled ? "Yes" : "No"}
                          </span>
                        </div>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="status" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value?.toString()}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="1">Active</SelectItem>
                          <SelectItem value="2">Inactive</SelectItem>
                          <SelectItem value="3">Pending KYC</SelectItem>
                          <SelectItem value="4">Rejected</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>

                {/* Email Opt-out Card */}
                <div className="p-4 border rounded-lg bg-muted/50">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      {emailOptedOut ? (
                        <MailX className="h-5 w-5 text-destructive flex-shrink-0" />
                      ) : (
                        <Mail className="h-5 w-5 text-green-600 flex-shrink-0" />
                      )}
                      <div>
                        <p className="font-medium">Email Preferences</p>
                        <p className="text-sm text-muted-foreground">
                          {emailOptedOut ? "Opted out of emails" : "Subscribed to emails"}
                        </p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant={emailOptedOut ? "default" : "destructive"}
                      size="sm"
                      onClick={() => setEmailOptedOut(!emailOptedOut)}
                    >
                      {emailOptedOut ? "Opt In" : "Opt Out"}
                    </Button>
                  </div>
                  {currentAffiliate.emailOptedOutAt && emailOptedOut && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Opted out on: {format(new Date(currentAffiliate.emailOptedOutAt), formatString)}
                    </p>
                  )}
                </div>

                {/* Switches - Stack on mobile, side-by-side on larger */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField control={form.control} name="tipaltiEnabled" render={({ field }) => (
                    <FormItem className="p-4 border rounded-lg bg-muted/50 space-y-3">
                      <div className="flex items-center justify-between">
                        <FormLabel className="font-medium">Tipalti Enabled</FormLabel>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Enable Tipalti payment processing for this affiliate
                      </p>
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="kycPass" render={({ field }) => (
                    <FormItem className="p-4 border rounded-lg bg-muted/50 space-y-3">
                      <div className="flex items-center justify-between">
                        <FormLabel className="font-medium">KYC Pass</FormLabel>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        When disabled, affiliate must complete KYC verification before accessing dashboard
                      </p>
                    </FormItem>
                  )} />
                </div>

                <FormField control={form.control} name="allowAutomaticChargebacks" render={({ field }) => (
                  <FormItem className="p-4 border rounded-lg bg-muted/50 space-y-3">
                    <div className="flex items-center justify-between">
                      <FormLabel className="font-medium">Allow Automatic Chargebacks</FormLabel>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      When disabled, prevents automatic clawbacks for closed periods
                    </p>
                  </FormItem>
                )} />

                {/* Enrolling Affiliate - Full width, responsive command */}
                <FormField control={form.control} name="enrolledBy" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Enrolling Affiliate</FormLabel>
                    <input type="hidden" {...field} />
                    <div className="flex flex-col gap-3">
                      {currentEnrollingAffiliate && (
                        <div className="text-sm p-3 bg-muted rounded-md">
                          Current: <span className="font-medium">{currentEnrollingAffiliate.name}</span>
                        </div>
                      )}
                      <Command className="rounded-md border bg-popover text-popover-foreground shadow-md">
                        <CommandInput
                          placeholder="Search to change enrolling affiliate..."
                          value={affiliateSearch}
                          onValueChange={setAffiliateSearch}
                        />
                        {affiliateSearch && (
                          <CommandList className="max-h-56 overflow-auto">
                            <CommandEmpty>No affiliate found.</CommandEmpty>
                            <CommandGroup>
                              {filteredAffiliates.map((aff) => (
                                <CommandItem
                                  key={aff._id}
                                  onSelect={() => {
                                    field.onChange(aff.selfAffiliateId.toString());
                                    setAffiliateSearch(`${aff.firstName} ${aff.lastName}`);
                                  }}
                                >
                                  <Check className={cn(
                                    "mr-2 h-4 w-4",
                                    aff.selfAffiliateId.toString() === field.value ? "opacity-100" : "opacity-0"
                                  )} />
                                  {aff.firstName} {aff.lastName}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        )}
                      </Command>
                    </div>
                    <FormMessage />
                  </FormItem>
                )} />

                {/* Name Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField control={form.control} name="firstName" render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="lastName" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>

                <FormField control={form.control} name="email" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl><Input {...field} type="email" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                {/* Phone + Tax ID */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <PhoneNumbersCompactManager
                    affiliateMongoId={affiliateMongoId}
                    phoneNumbers={phoneNumbers}
                    onChange={setPhoneNumbers}
                  />
                  <FormField control={form.control} name="taxId" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tax ID</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value || ""}
                          placeholder="Enter new Tax ID"
                        />
                      </FormControl>
                      {currentAffiliate.taxId && (
                        <p className="text-sm text-muted-foreground mt-1">
                          Current: ......{currentAffiliate.taxId.slice(-4)}
                        </p>
                      )}
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>

                {/* Password Field */}
                <FormField control={form.control} name="password" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <div className="relative flex-1">
                        <FormControl>
                          <Input
                            {...field}
                            type={showPassword ? "text" : "password"}
                            placeholder="Enter new password (leave blank to keep current)"
                            autoComplete="new-password"
                          />
                        </FormControl>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleSendTemporaryPassword}
                        disabled={updateMutation.isPending || isSendingTempPassword}
                      >
                        {sendTemporaryPasswordMutation.isPending ? "Sending..." : "Send Temporary Password"}
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                      Only enter if changing password. A note will be required.
                    </p>
                    <FormMessage />
                  </FormItem>
                )} />

                {/* Address Fields */}
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField control={form.control} name="addressLineOne" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address Line 1</FormLabel>
                        <FormControl><Input {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="addressLineTwo" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address Line 2</FormLabel>
                        <FormControl><Input {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <FormField control={form.control} name="cityTown" render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel>City</FormLabel>
                        <FormControl><Input {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="stateProvince" render={({ field }) => (
                      <FormItem>
                        <FormLabel>State/Province</FormLabel>
                        <FormControl><Input {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="zipPostal" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Postal Code</FormLabel>
                        <FormControl><Input {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>

                  <FormField control={form.control} name="country" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Country</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>

                {/* Action Buttons - Fixed at bottom */}
                <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t flex-shrink-0">
                  {readOnly ? (
                    <Button type="button" onClick={() => onOpenChange(false)}>
                      Close
                    </Button>
                  ) : (
                    <>
                      <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={updateMutation.isPending}>
                        {updateMutation.isPending ? "Saving..." : "Save Changes"}
                      </Button>
                    </>
                  )}
                </div>
              </form>
            </Form>
          </TabsContent>

          {/* Other tabs remain scrollable independently */}
          <TabsContent value="customers" className="mt-6 flex-1 overflow-y-auto">
            <AffiliateCustomersList
              affiliateId={currentAffiliate.id}
              onCustomerClick={handleCustomerClick}
              onViewOrders={handleViewCustomerOrders}
              onViewLastOrder={handleViewLastOrder}
            />
          </TabsContent>

          <TabsContent value="affiliates" className="mt-6 flex-1 overflow-y-auto">
            <AffiliateDownlineList
              affiliateId={currentAffiliate._id}
              onAffiliateClick={handleAffiliateClick}
            />
          </TabsContent>

          <TabsContent value="commissions" className="mt-6 flex-1 overflow-y-auto">
            <CommissionHistory
              affiliateId={currentAffiliate.id}
              initialExpandedWeek={initialExpandedCommission}
              initialExpandedLevel={initialExpandedLevel}
              initialExpandedPeriod={initialExpandedPeriod}
              filterStartDate={filterStartDate}
              filterEndDate={filterEndDate}
            />
          </TabsContent>

          <TabsContent value="notes" className="mt-6 flex-1 overflow-y-auto">
            <AffiliateNotes affiliateId={currentAffiliate.id} />
          </TabsContent>
        </Tabs>
      </DialogContent>

      {viewingCustomer && (
        <CustomerEditDialog
          customer={viewingCustomer}
          open={!!viewingCustomer}
          onOpenChange={(open) => !open && setViewingCustomer(null)}
          viewingContext={{
            affiliateName: `${currentAffiliate.firstName} ${currentAffiliate.lastName}`
          }}
          onBack={handleBackFromCustomer}
          customerId={viewingCustomer}
        />
      )}

      {viewingCustomerOrders && (
        <CustomerOrdersDialog
          customerId={viewingCustomerOrders}
          open={!!viewingCustomerOrders}
          onOpenChange={(open) => !open && setViewingCustomerOrders(null)}
          viewingContext={{
            affiliateName: `${currentAffiliate.firstName} ${currentAffiliate.lastName}`
          }}
          onBack={handleBackFromCustomerOrders}
        />
      )}

      {viewingOrderId && (
        <OrderDetailDialog
          orderId={viewingOrderId}
          customerType={viewingOrderCustomerType}
          open={!!viewingOrderId}
          onOpenChange={(open) => !open && setViewingOrderId(null)}
        />
      )}

      {showAffiliateChangeDialog && pendingAffiliateChange && currentEnrollingAffiliate && (
        <EnrollingAffiliateChangeDialog
          open={showAffiliateChangeDialog}
          onOpenChange={setShowAffiliateChangeDialog}
          oldAffiliateName={currentEnrollingAffiliate.name}
          oldAffiliateId={currentEnrollingAffiliate.affiliateId}
          newAffiliateName={pendingAffiliateChange.newName}
          newAffiliateId={pendingAffiliateChange.newAffiliateId}
          onConfirm={handleAffiliateChangeConfirm}
        />
      )}

      <ShopifyUpdateDialog
        open={showShopifyDialog}
        onOpenChange={setShowShopifyDialog}
        onConfirm={handleShopifyConfirm}
        entityType="affiliate"
      />

      {showCommissionAdjustmentDialog && (
        <CommissionAdjustmentDialog
          open={showCommissionAdjustmentDialog}
          onOpenChange={setShowCommissionAdjustmentDialog}
          entityName={`${currentAffiliate.firstName} ${currentAffiliate.lastName}`}
          impacts={commissionImpacts}
          onConfirm={handleCommissionAdjustmentConfirm}
          onCancel={handleCommissionAdjustmentCancel}
          onViewOrder={handleViewLastOrder}
        />
      )}

      {showShopifyMetadataDialog && shopifyMetadataSiteNames && (
        <ShopifyMetadataUpdateDialog
          open={showShopifyMetadataDialog}
          onOpenChange={setShowShopifyMetadataDialog}
          onConfirm={handleShopifyMetadataConfirm}
          oldSiteName={shopifyMetadataSiteNames.oldSiteName}
          newSiteName={shopifyMetadataSiteNames.newSiteName}
        />
      )}

      {/* Password Change Confirmation Dialog */}
      <Dialog open={showPasswordChangeDialog} onOpenChange={setShowPasswordChangeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Password Change</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              You are about to change the password for {currentAffiliate.firstName} {currentAffiliate.lastName}.
              Please provide a reason for this change.
            </p>
            <div>
              <label className="text-sm font-medium">Reason for Password Change *</label>
              <textarea
                className="w-full mt-2 p-2 border rounded-md min-h-[100px]"
                value={passwordChangeNote}
                onChange={(e) => setPasswordChangeNote(e.target.value)}
                placeholder="Enter the reason for changing this affiliate's password..."
                required
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowPasswordChangeDialog(false);
                  setPendingPassword("");
                  setPasswordChangeNote("");
                }}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handlePasswordChangeConfirm}
                disabled={!passwordChangeNote.trim()}
              >
                Confirm Change
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}

/*
I want to make this entirely responsive i should not need to scroll to view the part of the pages, it should be responsive based on the device also we dont use anythign to make our work done , we must have to use the
exsiting design technology must adhere to it

*/