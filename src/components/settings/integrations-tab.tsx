// import { useState, useEffect } from "react";
// import { useForm } from "react-hook-form";
// import { zodResolver } from "@hookform/resolvers/zod";
// import * as z from "zod";
// import { supabase } from "@/integrations/supabase/client";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Switch } from "@/components/ui/switch";
// import { useToast } from "@/hooks/use-toast";
// import { Loader2, Mail, MessageSquare, Send, ShoppingBag, Truck, CreditCard } from "lucide-react";
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
// import { Separator } from "@/components/ui/separator";
// import { useModulePermissions } from "@/hooks/use-module-permissions";

// const sendgridSchema = z.object({
//   api_key: z.string().min(1, "API key is required"),
//   from_email: z.string().email("Invalid email"),
//   from_name: z.string().min(1, "From name is required"),
// });

// const twilioSchema = z.object({
//   account_sid: z.string().min(1, "Account SID is required"),
//   auth_token: z.string().min(1, "Auth token is required"),
//   phone_number: z.string().min(1, "Phone number is required"),
// });

// const resendSchema = z.object({
//   api_key: z.string().min(1, "API key is required"),
//   from_email: z.string().email("Invalid email"),
//   from_name: z.string().min(1, "From name is required"),
// });

// const shopifySchema = z.object({
//   store_url: z.string().min(1, "Store URL is required"),
//   access_token: z.string().min(1, "Access token is required"),
//   api_key: z.string().min(1, "API key is required"),
//   api_secret: z.string().min(1, "API secret is required"),
// });

// const awtomicSchema = z.object({
//   api_key: z.string().min(1, "API key is required"),
//   api_url: z.string().url("Invalid API URL"),
// });

// const tipaltiSchema = z.object({
//   api_key: z.string().min(1, "API key is required"),
//   payer_name: z.string().min(1, "Payer name is required"),
//   iframe_url: z.string().url("Invalid iFrame URL"),
// });

// type SendGridFormData = z.infer<typeof sendgridSchema>;
// type TwilioFormData = z.infer<typeof twilioSchema>;
// type ResendFormData = z.infer<typeof resendSchema>;
// type ShopifyFormData = z.infer<typeof shopifySchema>;
// type AwtomicFormData = z.infer<typeof awtomicSchema>;
// type TipaltiFormData = z.infer<typeof tipaltiSchema>;

// export function IntegrationsTab() {
//   const [loading, setLoading] = useState(false);
//   const [sendgridEnabled, setSendgridEnabled] = useState(false);
//   const [twilioEnabled, setTwilioEnabled] = useState(false);
//   const [resendEnabled, setResendEnabled] = useState(false);
//   const [shopifyEnabled, setShopifyEnabled] = useState(false);
//   const [awtomicEnabled, setAwtomicEnabled] = useState(false);
//   const [tipaltiEnabled, setTipaltiEnabled] = useState(false);
//   const { toast } = useToast();
//   const { hasPermission } = useModulePermissions();
//   const canEdit = hasPermission("company_settings_integrations", "edit");

//   const sendgridForm = useForm<SendGridFormData>({
//     resolver: zodResolver(sendgridSchema),
//     defaultValues: {
//       api_key: "",
//       from_email: "",
//       from_name: "",
//     },
//   });

//   const twilioForm = useForm<TwilioFormData>({
//     resolver: zodResolver(twilioSchema),
//     defaultValues: {
//       account_sid: "",
//       auth_token: "",
//       phone_number: "",
//     },
//   });

//   const resendForm = useForm<ResendFormData>({
//     resolver: zodResolver(resendSchema),
//     defaultValues: {
//       api_key: "",
//       from_email: "",
//       from_name: "",
//     },
//   });

//   const shopifyForm = useForm<ShopifyFormData>({
//     resolver: zodResolver(shopifySchema),
//     defaultValues: {
//       store_url: "",
//       access_token: "",
//       api_key: "",
//       api_secret: "",
//     },
//   });

//   const awtomicForm = useForm<AwtomicFormData>({
//     resolver: zodResolver(awtomicSchema),
//     defaultValues: {
//       api_key: "",
//       api_url: "",
//     },
//   });

//   const tipaltiForm = useForm<TipaltiFormData>({
//     resolver: zodResolver(tipaltiSchema),
//     defaultValues: {
//       api_key: "",
//       payer_name: "",
//       iframe_url: "",
//     },
//   });

//   useEffect(() => {
//     loadIntegrations();
//   }, []);

//   const loadIntegrations = async () => {
//     try {
//       const { data, error } = await supabase
//         .from("integrations")
//         .select("*")
//         .in("integration_name", ["sendgrid", "twilio", "resend", "shopify", "awtomic", "tipalti"]);

//       if (error) throw error;

//       data?.forEach((integration) => {
//         const config = integration.config as any;

//         if (integration.integration_name === "sendgrid") {
//           setSendgridEnabled(integration.is_enabled);
//           sendgridForm.reset({
//             api_key: "",
//             from_email: config?.from_email || "",
//             from_name: config?.from_name || "",
//           });
//         } else if (integration.integration_name === "twilio") {
//           setTwilioEnabled(integration.is_enabled);
//           twilioForm.reset({
//             account_sid: "",
//             auth_token: "",
//             phone_number: config?.phone_number || "",
//           });
//         } else if (integration.integration_name === "resend") {
//           setResendEnabled(integration.is_enabled);
//           resendForm.reset({
//             api_key: "",
//             from_email: config?.from_email || "",
//             from_name: config?.from_name || "",
//           });
//         } else if (integration.integration_name === "shopify") {
//           setShopifyEnabled(integration.is_enabled);
//           shopifyForm.reset({
//             store_url: config?.store_url || "",
//             access_token: "",
//             api_key: "",
//             api_secret: "",
//           });
//         } else if (integration.integration_name === "awtomic") {
//           setAwtomicEnabled(integration.is_enabled);
//           awtomicForm.reset({
//             api_key: "",
//             api_url: config?.api_url || "",
//           });
//         } else if (integration.integration_name === "tipalti") {
//           setTipaltiEnabled(integration.is_enabled);
//           tipaltiForm.reset({
//             api_key: "",
//             payer_name: config?.payer_name || "",
//             iframe_url: config?.iframe_url || "",
//           });
//         }
//       });
//     } catch (error: any) {
//       console.error("Error loading integrations:", error);
//       toast({
//         title: "Error",
//         description: "Failed to load integration settings",
//         variant: "destructive",
//       });
//     }
//   };

//   const saveSendGrid = async (data: SendGridFormData) => {
//     if (!canEdit) {
//       toast({
//         title: "Permission Denied",
//         description: "You need edit permissions to save integration settings.",
//         variant: "destructive",
//       });
//       return;
//     }
//     setLoading(true);
//     try {
//       // Update integration config in database
//       const { error: dbError } = await supabase
//         .from("integrations")
//         .update({
//           is_enabled: sendgridEnabled,
//           config: {
//             from_email: data.from_email,
//             from_name: data.from_name,
//           },
//         })
//         .eq("integration_name", "sendgrid");

//       if (dbError) throw dbError;

//       // Save API key as secret via edge function
//       const { error: secretError } = await supabase.functions.invoke("save-integration-secret", {
//         body: {
//           integration: "sendgrid",
//           secrets: {
//             SENDGRID_API_KEY: data.api_key,
//           },
//         },
//       });

//       if (secretError) throw secretError;

//       toast({
//         title: "Success",
//         description: "SendGrid integration saved successfully",
//       });
//     } catch (error: any) {
//       console.error("Error saving SendGrid:", error);
//       toast({
//         title: "Error",
//         description: error.message || "Failed to save SendGrid integration",
//         variant: "destructive",
//       });
//     } finally {
//       setLoading(false);
//     }
//   };

//   const saveTwilio = async (data: TwilioFormData) => {
//     if (!canEdit) {
//       toast({
//         title: "Permission Denied",
//         description: "You need edit permissions to save integration settings.",
//         variant: "destructive",
//       });
//       return;
//     }
//     setLoading(true);
//     try {
//       // Update integration config in database
//       const { error: dbError } = await supabase
//         .from("integrations")
//         .update({
//           is_enabled: twilioEnabled,
//           config: {
//             phone_number: data.phone_number,
//           },
//         })
//         .eq("integration_name", "twilio");

//       if (dbError) throw dbError;

//       // Save credentials as secrets via edge function
//       const { error: secretError } = await supabase.functions.invoke("save-integration-secret", {
//         body: {
//           integration: "twilio",
//           secrets: {
//             TWILIO_ACCOUNT_SID: data.account_sid,
//             TWILIO_AUTH_TOKEN: data.auth_token,
//           },
//         },
//       });

//       if (secretError) throw secretError;

//       toast({
//         title: "Success",
//         description: "Twilio integration saved successfully",
//       });
//     } catch (error: any) {
//       console.error("Error saving Twilio:", error);
//       toast({
//         title: "Error",
//         description: error.message || "Failed to save Twilio integration",
//         variant: "destructive",
//       });
//     } finally {
//       setLoading(false);
//     }
//   };

//   const saveResend = async (data: ResendFormData) => {
//     if (!canEdit) {
//       toast({
//         title: "Permission Denied",
//         description: "You need edit permissions to save integration settings.",
//         variant: "destructive",
//       });
//       return;
//     }
//     setLoading(true);
//     try {
//       // Update integration config in database
//       const { error: dbError } = await supabase
//         .from("integrations")
//         .update({
//           is_enabled: resendEnabled,
//           config: {
//             from_email: data.from_email,
//             from_name: data.from_name,
//           },
//         })
//         .eq("integration_name", "resend");

//       if (dbError) throw dbError;

//       // Save API key as secret via edge function
//       const { error: secretError } = await supabase.functions.invoke("save-integration-secret", {
//         body: {
//           integration: "resend",
//           secrets: {
//             RESEND_API_KEY: data.api_key,
//           },
//         },
//       });

//       if (secretError) throw secretError;

//       toast({
//         title: "Success",
//         description: "Resend integration saved successfully",
//       });
//     } catch (error: any) {
//       console.error("Error saving Resend:", error);
//       toast({
//         title: "Error",
//         description: error.message || "Failed to save Resend integration",
//         variant: "destructive",
//       });
//     } finally {
//       setLoading(false);
//     }
//   };

//   const saveShopify = async (data: ShopifyFormData) => {
//     if (!canEdit) {
//       toast({
//         title: "Permission Denied",
//         description: "You need edit permissions to save integration settings.",
//         variant: "destructive",
//       });
//       return;
//     }
//     setLoading(true);
//     try {
//       // Update integration config in database
//       const { error: dbError } = await supabase
//         .from("integrations")
//         .update({
//           is_enabled: shopifyEnabled,
//           config: {
//             store_url: data.store_url,
//           },
//         })
//         .eq("integration_name", "shopify");

//       if (dbError) throw dbError;

//       // Save credentials as secrets via edge function
//       const { error: secretError } = await supabase.functions.invoke("save-integration-secret", {
//         body: {
//           integration: "shopify",
//           secrets: {
//             SHOPIFY_ACCESS_TOKEN: data.access_token,
//             SHOPIFY_API_KEY: data.api_key,
//             SHOPIFY_API_SECRET: data.api_secret,
//           },
//         },
//       });

//       if (secretError) throw secretError;

//       toast({
//         title: "Success",
//         description: "Shopify integration saved successfully",
//       });
//     } catch (error: any) {
//       console.error("Error saving Shopify:", error);
//       toast({
//         title: "Error",
//         description: error.message || "Failed to save Shopify integration",
//         variant: "destructive",
//       });
//     } finally {
//       setLoading(false);
//     }
//   };

//   const saveAwtomic = async (data: AwtomicFormData) => {
//     if (!canEdit) {
//       toast({
//         title: "Permission Denied",
//         description: "You need edit permissions to save integration settings.",
//         variant: "destructive",
//       });
//       return;
//     }
//     setLoading(true);
//     try {
//       // Update integration config in database
//       const { error: dbError } = await supabase
//         .from("integrations")
//         .update({
//           is_enabled: awtomicEnabled,
//           config: {
//             api_url: data.api_url,
//           },
//         })
//         .eq("integration_name", "awtomic");

//       if (dbError) throw dbError;

//       // Save API key as secret via edge function
//       const { error: secretError } = await supabase.functions.invoke("save-integration-secret", {
//         body: {
//           integration: "awtomic",
//           secrets: {
//             AWTOMIC_API_KEY: data.api_key,
//           },
//         },
//       });

//       if (secretError) throw secretError;

//       toast({
//         title: "Success",
//         description: "Awtomic integration saved successfully",
//       });
//     } catch (error: any) {
//       console.error("Error saving Awtomic:", error);
//       toast({
//         title: "Error",
//         description: error.message || "Failed to save Awtomic integration",
//         variant: "destructive",
//       });
//     } finally {
//       setLoading(false);
//     }
//   };

//   const saveTipalti = async (data: TipaltiFormData) => {
//     if (!canEdit) {
//       toast({
//         title: "Permission Denied",
//         description: "You need edit permissions to save integration settings.",
//         variant: "destructive",
//       });
//       return;
//     }
//     setLoading(true);
//     try {
//       // Update integration config in database
//       const { error: dbError } = await supabase
//         .from("integrations")
//         .update({
//           is_enabled: tipaltiEnabled,
//           config: {
//             payer_name: data.payer_name,
//             iframe_url: data.iframe_url,
//           },
//         })
//         .eq("integration_name", "tipalti");

//       if (dbError) throw dbError;

//       // Save API key as secret via edge function
//       const { error: secretError } = await supabase.functions.invoke("save-integration-secret", {
//         body: {
//           integration: "tipalti",
//           secrets: {
//             TIPALTI_API_KEY: data.api_key,
//           },
//         },
//       });

//       if (secretError) throw secretError;

//       toast({
//         title: "Success",
//         description: "Tipalti integration saved successfully",
//       });
//     } catch (error: any) {
//       console.error("Error saving Tipalti:", error);
//       toast({
//         title: "Error",
//         description: error.message || "Failed to save Tipalti integration",
//         variant: "destructive",
//       });
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="space-y-6">
//       <div>
//         <h2 className="text-2xl font-bold mb-2">Integrations</h2>
//         <p className="text-muted-foreground">
//           Configure third-party services for email and SMS communications
//         </p>
//       </div>

//       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//         {/* SendGrid Integration */}
//         <Card>
//         <CardHeader>
//           <div className="flex items-center justify-between">
//             <div className="flex items-center gap-3">
//               <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
//                 <Mail className="h-5 w-5 text-primary" />
//               </div>
//               <div>
//                 <CardTitle>SendGrid</CardTitle>
//                 <CardDescription>Email delivery service</CardDescription>
//               </div>
//             </div>
//             <Switch
//               checked={sendgridEnabled}
//               onCheckedChange={setSendgridEnabled}
//               disabled={!canEdit}
//             />
//           </div>
//         </CardHeader>
//         <CardContent>
//           <form onSubmit={sendgridForm.handleSubmit(saveSendGrid)} className="space-y-4">
//             <div className="space-y-2">
//               <Label htmlFor="sendgrid_api_key">API Key *</Label>
//               <Input
//                 id="sendgrid_api_key"
//                 type="password"
//                 placeholder="SG.xxxxxxxxxxxxx"
//                 {...sendgridForm.register("api_key")}
//                 disabled={!canEdit}
//               />
//               {sendgridForm.formState.errors.api_key && (
//                 <p className="text-sm text-destructive">
//                   {sendgridForm.formState.errors.api_key.message}
//                 </p>
//               )}
//             </div>

//             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//               <div className="space-y-2">
//                 <Label htmlFor="sendgrid_from_email">From Email *</Label>
//                 <Input
//                   id="sendgrid_from_email"
//                   type="email"
//                   placeholder="noreply@company.com"
//                   {...sendgridForm.register("from_email")}
//                   disabled={!canEdit}
//                 />
//                 {sendgridForm.formState.errors.from_email && (
//                   <p className="text-sm text-destructive">
//                     {sendgridForm.formState.errors.from_email.message}
//                   </p>
//                 )}
//               </div>

//               <div className="space-y-2">
//                 <Label htmlFor="sendgrid_from_name">From Name *</Label>
//                 <Input
//                   id="sendgrid_from_name"
//                   placeholder="Company Name"
//                   {...sendgridForm.register("from_name")}
//                   disabled={!canEdit}
//                 />
//                 {sendgridForm.formState.errors.from_name && (
//                   <p className="text-sm text-destructive">
//                     {sendgridForm.formState.errors.from_name.message}
//                   </p>
//                 )}
//               </div>
//             </div>

//             <Button type="submit" disabled={loading || !canEdit}>
//               {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
//               Save SendGrid Settings
//             </Button>
//           </form>
//         </CardContent>
//         </Card>

//         {/* Twilio Integration */}
//         <Card>
//         <CardHeader>
//           <div className="flex items-center justify-between">
//             <div className="flex items-center gap-3">
//               <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
//                 <MessageSquare className="h-5 w-5 text-primary" />
//               </div>
//               <div>
//                 <CardTitle>Twilio</CardTitle>
//                 <CardDescription>SMS and voice service</CardDescription>
//               </div>
//             </div>
//             <Switch
//               checked={twilioEnabled}
//               onCheckedChange={setTwilioEnabled}
//               disabled={!canEdit}
//             />
//           </div>
//         </CardHeader>
//         <CardContent>
//           <form onSubmit={twilioForm.handleSubmit(saveTwilio)} className="space-y-4">
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//               <div className="space-y-2">
//                 <Label htmlFor="twilio_account_sid">Account SID *</Label>
//                 <Input
//                   id="twilio_account_sid"
//                   type="password"
//                   placeholder="ACxxxxxxxxxxxxx"
//                   {...twilioForm.register("account_sid")}
//                   disabled={!canEdit}
//                 />
//                 {twilioForm.formState.errors.account_sid && (
//                   <p className="text-sm text-destructive">
//                     {twilioForm.formState.errors.account_sid.message}
//                   </p>
//                 )}
//               </div>

//               <div className="space-y-2">
//                 <Label htmlFor="twilio_auth_token">Auth Token *</Label>
//                 <Input
//                   id="twilio_auth_token"
//                   type="password"
//                   placeholder="Enter auth token"
//                   {...twilioForm.register("auth_token")}
//                   disabled={!canEdit}
//                 />
//                 {twilioForm.formState.errors.auth_token && (
//                   <p className="text-sm text-destructive">
//                     {twilioForm.formState.errors.auth_token.message}
//                   </p>
//                 )}
//               </div>
//             </div>

//             <div className="space-y-2">
//               <Label htmlFor="twilio_phone_number">Twilio Phone Number *</Label>
//               <Input
//                 id="twilio_phone_number"
//                 placeholder="+1234567890"
//                 {...twilioForm.register("phone_number")}
//                 disabled={!canEdit}
//               />
//               {twilioForm.formState.errors.phone_number && (
//                 <p className="text-sm text-destructive">
//                   {twilioForm.formState.errors.phone_number.message}
//                 </p>
//               )}
//             </div>

//             <Button type="submit" disabled={loading || !canEdit}>
//               {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
//               Save Twilio Settings
//             </Button>
//           </form>
//         </CardContent>
//         </Card>

//         {/* Resend Integration */}
//         <Card>
//         <CardHeader>
//           <div className="flex items-center justify-between">
//             <div className="flex items-center gap-3">
//               <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
//                 <Send className="h-5 w-5 text-primary" />
//               </div>
//               <div>
//                 <CardTitle>Resend</CardTitle>
//                 <CardDescription>Modern email API service</CardDescription>
//               </div>
//             </div>
//             <Switch
//               checked={resendEnabled}
//               onCheckedChange={setResendEnabled}
//               disabled={!canEdit}
//             />
//           </div>
//         </CardHeader>
//         <CardContent>
//           <form onSubmit={resendForm.handleSubmit(saveResend)} className="space-y-4">
//             <div className="space-y-2">
//               <Label htmlFor="resend_api_key">API Key *</Label>
//               <Input
//                 id="resend_api_key"
//                 type="password"
//                 placeholder="re_xxxxxxxxxxxxx"
//                 {...resendForm.register("api_key")}
//                 disabled={!canEdit}
//               />
//               {resendForm.formState.errors.api_key && (
//                 <p className="text-sm text-destructive">
//                   {resendForm.formState.errors.api_key.message}
//                 </p>
//               )}
//             </div>

//             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//               <div className="space-y-2">
//                 <Label htmlFor="resend_from_email">From Email *</Label>
//                 <Input
//                   id="resend_from_email"
//                   type="email"
//                   placeholder="noreply@company.com"
//                   {...resendForm.register("from_email")}
//                   disabled={!canEdit}
//                 />
//                 {resendForm.formState.errors.from_email && (
//                   <p className="text-sm text-destructive">
//                     {resendForm.formState.errors.from_email.message}
//                   </p>
//                 )}
//               </div>

//               <div className="space-y-2">
//                 <Label htmlFor="resend_from_name">From Name *</Label>
//                 <Input
//                   id="resend_from_name"
//                   placeholder="Company Name"
//                   {...resendForm.register("from_name")}
//                   disabled={!canEdit}
//                 />
//                 {resendForm.formState.errors.from_name && (
//                   <p className="text-sm text-destructive">
//                     {resendForm.formState.errors.from_name.message}
//                   </p>
//                 )}
//               </div>
//             </div>

//             <Button type="submit" disabled={loading || !canEdit}>
//               {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
//               Save Resend Settings
//             </Button>
//           </form>
//         </CardContent>
//         </Card>

//         {/* Shopify Integration */}
//         <Card>
//           <CardHeader>
//             <div className="flex items-center justify-between">
//               <div className="flex items-center gap-3">
//                 <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
//                   <ShoppingBag className="h-5 w-5 text-primary" />
//                 </div>
//                 <div>
//                   <CardTitle>Shopify</CardTitle>
//                   <CardDescription>E-commerce platform integration</CardDescription>
//                 </div>
//               </div>
//               <Switch
//                 checked={shopifyEnabled}
//                 onCheckedChange={setShopifyEnabled}
//                 disabled={!canEdit}
//               />
//             </div>
//           </CardHeader>
//           <CardContent>
//             <form onSubmit={shopifyForm.handleSubmit(saveShopify)} className="space-y-4">
//               <div className="space-y-2">
//                 <Label htmlFor="shopify_store_url">Store URL *</Label>
//                 <Input
//                   id="shopify_store_url"
//                   placeholder="your-store.myshopify.com"
//                   {...shopifyForm.register("store_url")}
//                   disabled={!canEdit}
//                 />
//                 {shopifyForm.formState.errors.store_url && (
//                   <p className="text-sm text-destructive">
//                     {shopifyForm.formState.errors.store_url.message}
//                   </p>
//                 )}
//               </div>

//               <div className="space-y-2">
//                 <Label htmlFor="shopify_access_token">Access Token *</Label>
//                 <Input
//                   id="shopify_access_token"
//                   type="password"
//                   placeholder="shpat_xxxxxxxxxxxxx"
//                   {...shopifyForm.register("access_token")}
//                   disabled={!canEdit}
//                 />
//                 {shopifyForm.formState.errors.access_token && (
//                   <p className="text-sm text-destructive">
//                     {shopifyForm.formState.errors.access_token.message}
//                   </p>
//                 )}
//               </div>

//               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                 <div className="space-y-2">
//                   <Label htmlFor="shopify_api_key">API Key *</Label>
//                   <Input
//                     id="shopify_api_key"
//                     type="password"
//                     placeholder="Enter API key"
//                     {...shopifyForm.register("api_key")}
//                     disabled={!canEdit}
//                   />
//                   {shopifyForm.formState.errors.api_key && (
//                     <p className="text-sm text-destructive">
//                       {shopifyForm.formState.errors.api_key.message}
//                     </p>
//                   )}
//                 </div>

//                 <div className="space-y-2">
//                   <Label htmlFor="shopify_api_secret">API Secret *</Label>
//                   <Input
//                     id="shopify_api_secret"
//                     type="password"
//                     placeholder="Enter API secret"
//                     {...shopifyForm.register("api_secret")}
//                     disabled={!canEdit}
//                   />
//                   {shopifyForm.formState.errors.api_secret && (
//                     <p className="text-sm text-destructive">
//                       {shopifyForm.formState.errors.api_secret.message}
//                     </p>
//                   )}
//                 </div>
//               </div>

//               <Button type="submit" disabled={loading || !canEdit}>
//                 {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
//                 Save Shopify Settings
//               </Button>
//             </form>
//           </CardContent>
//         </Card>

//         {/* Awtomic Integration */}
//         <Card>
//           <CardHeader>
//             <div className="flex items-center justify-between">
//               <div className="flex items-center gap-3">
//                 <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
//                   <Truck className="h-5 w-5 text-primary" />
//                 </div>
//                 <div>
//                   <CardTitle>Awtomic</CardTitle>
//                   <CardDescription>Subscription management for autoships</CardDescription>
//                 </div>
//               </div>
//               <Switch
//                 checked={awtomicEnabled}
//                 onCheckedChange={setAwtomicEnabled}
//                 disabled={!canEdit}
//               />
//             </div>
//           </CardHeader>
//           <CardContent>
//             <form onSubmit={awtomicForm.handleSubmit(saveAwtomic)} className="space-y-4">
//               <div className="space-y-2">
//                 <Label htmlFor="awtomic_api_url">API URL *</Label>
//                 <Input
//                   id="awtomic_api_url"
//                   type="url"
//                   placeholder="https://api.awtomic.com"
//                   {...awtomicForm.register("api_url")}
//                   disabled={!canEdit}
//                 />
//                 {awtomicForm.formState.errors.api_url && (
//                   <p className="text-sm text-destructive">
//                     {awtomicForm.formState.errors.api_url.message}
//                   </p>
//                 )}
//               </div>

//               <div className="space-y-2">
//                 <Label htmlFor="awtomic_api_key">API Key *</Label>
//                 <Input
//                   id="awtomic_api_key"
//                   type="password"
//                   placeholder="Enter API key"
//                   {...awtomicForm.register("api_key")}
//                   disabled={!canEdit}
//                 />
//                 {awtomicForm.formState.errors.api_key && (
//                   <p className="text-sm text-destructive">
//                     {awtomicForm.formState.errors.api_key.message}
//                   </p>
//                 )}
//               </div>

//               <Button type="submit" disabled={loading || !canEdit}>
//                 {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
//                 Save Awtomic Settings
//               </Button>
//             </form>
//           </CardContent>
//         </Card>

//         {/* Tipalti Integration */}
//         <Card>
//           <CardHeader>
//             <div className="flex items-center justify-between">
//               <div className="flex items-center gap-3">
//                 <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
//                   <CreditCard className="h-5 w-5 text-primary" />
//                 </div>
//                 <div>
//                   <CardTitle>Tipalti</CardTitle>
//                   <CardDescription>Affiliate payment processing</CardDescription>
//                 </div>
//               </div>
//               <Switch
//                 checked={tipaltiEnabled}
//                 onCheckedChange={setTipaltiEnabled}
//                 disabled={!canEdit}
//               />
//             </div>
//           </CardHeader>
//           <CardContent>
//             <form onSubmit={tipaltiForm.handleSubmit(saveTipalti)} className="space-y-4">
//               <div className="space-y-2">
//                 <Label htmlFor="tipalti_payer_name">Payer Name *</Label>
//                 <Input
//                   id="tipalti_payer_name"
//                   placeholder="Your Company Name"
//                   {...tipaltiForm.register("payer_name")}
//                   disabled={!canEdit}
//                 />
//                 {tipaltiForm.formState.errors.payer_name && (
//                   <p className="text-sm text-destructive">
//                     {tipaltiForm.formState.errors.payer_name.message}
//                   </p>
//                 )}
//               </div>

//               <div className="space-y-2">
//                 <Label htmlFor="tipalti_iframe_url">iFrame URL *</Label>
//                 <Input
//                   id="tipalti_iframe_url"
//                   type="url"
//                   placeholder="https://ui2.tipalti.com/payeedashboard/home"
//                   {...tipaltiForm.register("iframe_url")}
//                   disabled={!canEdit}
//                 />
//                 {tipaltiForm.formState.errors.iframe_url && (
//                   <p className="text-sm text-destructive">
//                     {tipaltiForm.formState.errors.iframe_url.message}
//                   </p>
//                 )}
//               </div>

//               <div className="space-y-2">
//                 <Label htmlFor="tipalti_api_key">API Key *</Label>
//                 <Input
//                   id="tipalti_api_key"
//                   type="password"
//                   placeholder="Enter API key"
//                   {...tipaltiForm.register("api_key")}
//                   disabled={!canEdit}
//                 />
//                 {tipaltiForm.formState.errors.api_key && (
//                   <p className="text-sm text-destructive">
//                     {tipaltiForm.formState.errors.api_key.message}
//                   </p>
//                 )}
//               </div>

//               <Button type="submit" disabled={loading || !canEdit}>
//                 {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
//                 Save Tipalti Settings
//               </Button>
//             </form>
//           </CardContent>
//         </Card>
//       </div>
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
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Mail, MessageSquare, Send, ShoppingBag, Truck, CreditCard } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useModulePermissions } from "@/hooks/use-module-permissions";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getIntegrationsData } from "@/api/company";
import { updateIntegrations } from "@/api/company";

const sendgridSchema = z.object({
  apiKey: z.string().min(1, "API key is required"),
  fromEmail: z.string().email("Invalid email"),
  fromName: z.string().min(1, "From name is required"),
});

const twilioSchema = z.object({
  accountSid: z.string().min(1, "Account SID is required"),
  authToken: z.string().min(1, "Auth token is required"),
  phoneNumber: z.string().min(1, "Phone number is required"),
});

const resendSchema = z.object({
  apiKey: z.string().min(1, "API key is required"),
  fromEmail: z.string().email("Invalid email"),
  fromName: z.string().min(1, "From name is required"),
});

const shopifySchema = z.object({
  storeUrl: z.string().min(1, "Store URL is required"),
  accessToken: z.string().min(1, "Access token is required"),
  apiKey: z.string().min(1, "API key is required"),
  apiSecret: z.string().min(1, "API secret is required"),
});

const awtomicSchema = z.object({
  apiKey: z.string().min(1, "API key is required"),
  apiUrl: z.string().url("Invalid API URL"),
});

const tipaltiSchema = z.object({
  apiKey: z.string().min(1, "API key is required"),
  payerName: z.string().min(1, "Payer name is required"),
  iframeUrl: z.string().url("Invalid iFrame URL"),
});

type SendGridFormData = z.infer<typeof sendgridSchema>;
type TwilioFormData = z.infer<typeof twilioSchema>;
type ResendFormData = z.infer<typeof resendSchema>;
type ShopifyFormData = z.infer<typeof shopifySchema>;
type AwtomicFormData = z.infer<typeof awtomicSchema>;
type TipaltiFormData = z.infer<typeof tipaltiSchema>;

export function IntegrationsTab() {
  const [loading, setLoading] = useState(false);
  const [sendgridEnabled, setSendgridEnabled] = useState(false);
  const [twilioEnabled, setTwilioEnabled] = useState(false);
  const [resendEnabled, setResendEnabled] = useState(false);
  const [shopifyEnabled, setShopifyEnabled] = useState(false);
  const [awtomicEnabled, setAwtomicEnabled] = useState(false);
  const [tipaltiEnabled, setTipaltiEnabled] = useState(false);
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({
    sendgrid: false,
    twilio: false,
    resend: false,
    shopify: false,
    awtomic: false,
    tipalti: false,
  });
  const { toast } = useToast();
  const { hasPermission } = useModulePermissions();
  const canEdit = hasPermission("company_settings_permissions", "integrations", "edit");

  const sendgridForm = useForm<SendGridFormData>({
    resolver: zodResolver(sendgridSchema),
    defaultValues: {
      apiKey: "",
      fromEmail: "",
      fromName: "",
    },
  });

  const twilioForm = useForm<TwilioFormData>({
    resolver: zodResolver(twilioSchema),
    defaultValues: {
      accountSid: "",
      authToken: "",
      phoneNumber: "",
    },
  });

  const resendForm = useForm<ResendFormData>({
    resolver: zodResolver(resendSchema),
    defaultValues: {
      apiKey: "",
      fromEmail: "",
      fromName: "",
    },
  });

  const shopifyForm = useForm<ShopifyFormData>({
    resolver: zodResolver(shopifySchema),
    defaultValues: {
      storeUrl: "",
      accessToken: "",
      apiKey: "",
      apiSecret: "",
    },
  });

  const awtomicForm = useForm<AwtomicFormData>({
    resolver: zodResolver(awtomicSchema),
    defaultValues: {
      apiKey: "",
      apiUrl: "",
    },
  });

  const tipaltiForm = useForm<TipaltiFormData>({
    resolver: zodResolver(tipaltiSchema),
    defaultValues: {
      apiKey: "",
      payerName: "",
      iframeUrl: "",
    },
  });

  // Assume getIntegrationsData is the function fetching your integrations data
  const { data, error, isError } = useQuery({
    queryKey: ['integrations'],
    queryFn: getIntegrationsData,
  });

  const integrationsData = data?.data?.data;
  // console.log("data : ", integrationsData);


  useEffect(() => {
    if (integrationsData) {
      integrationsData?.forEach((integration) => {
        const config = integration.config as any;

        if (integration.integrationName === "sendgrid") {
          setSendgridEnabled(integration.isEnabled);
          sendgridForm.reset({
            apiKey: config.apiKey || "",
            fromEmail: config.fromEmail || "",
            fromName: config.fromName || "",
          });
        } else if (integration.integrationName === "twilio") {
          setTwilioEnabled(integration.isEnabled);
          twilioForm.reset({
            accountSid: config.accountSid || "",
            authToken: config.authToken || "",
            phoneNumber: config.phoneNumber || "",
          });
        } else if (integration.integrationName === "resend") {
          setResendEnabled(integration.isEnabled);
          resendForm.reset({
            apiKey: config.apiKey || "",
            fromEmail: config.fromEmail || "",
            fromName: config.fromName || "",
          });
        } else if (integration.integrationName === "shopify") {
          setShopifyEnabled(integration.isEnabled);
          shopifyForm.reset({
            storeUrl: config.storeUrl || "",
            accessToken: config.accessToken || "",
            apiKey: config.apiKey || "",
            apiSecret: config.apiSecret || "",
          });
        } else if (integration.integrationName === "awtomic") {
          setAwtomicEnabled(integration.isEnabled);
          awtomicForm.reset({
            apiKey: config.apiKey || "",
            apiUrl: config.apiUrl || "",
          });
        } else if (integration.integrationName === "tipalti") {
          setTipaltiEnabled(integration.isEnabled);
          tipaltiForm.reset({
            apiKey: config.apiKey || "",
            payerName: config.payerName || "",
            iframeUrl: config.iframeUrl || "",
          });
        }
      });
    }
  }, [integrationsData]);


  const mutation = useMutation({
    mutationFn: updateIntegrations,
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

  const saveIntegration = async (integrationName, isEnabled, config, successMessage) => {
    if (!canEdit) {
      toast({
        title: "Permission Denied",
        description: "You need edit permissions to save integration settings.",
        variant: "destructive",
      });
      return;
    }

    // Set only this integration's loading to true
    setLoadingStates(prev => ({ ...prev, [integrationName]: true }));
    try {
      // Create the data object
      const updatedData = {
        integrationName,
        isEnabled,
        config,
      };

      // Call the mutation
      await mutation.mutateAsync(updatedData);

      // Show success message with custom success description
      toast({
        title: "Success",
        description: successMessage,
      });
    } catch (error: any) {
      console.error(`Error saving ${integrationName}:`, error);
      toast({
        title: "Error",
        description: error.message || `Failed to save ${integrationName} integration`,
        variant: "destructive",
      });
    } finally {
      setLoadingStates(prev => ({ ...prev, [integrationName]: false }));
    }
  };

  const saveSendGrid = (sendgridForm) => {
    saveIntegration(
      "sendgrid",
      sendgridEnabled,
      sendgridForm,
      "SendGrid integration saved successfully",
    );
  };

  const saveTwilio = (twilioForm) => {
    saveIntegration(
      "twilio",
      twilioEnabled,
      twilioForm,
      "Twilio integration saved successfully",
    );
  };

  const saveResend = (resendForm) => {
    saveIntegration(
      "resend",
      resendEnabled,
      resendForm,
      "Resend integration saved successfully",
    );
  };

  const saveShopify = (shopifyForm) => {
    saveIntegration(
      "shopify",
      shopifyEnabled,
      shopifyForm,
      "Shopify integration saved successfully",
    );
  };

  const saveAwtomic = (awtomicForm) => {
    saveIntegration(
      "awtomic",
      awtomicEnabled,
      awtomicForm,
      "Awtomic integration saved successfully",
    );
  };
  const saveTipalti = (tipaltiForm) => {
    saveIntegration(
      "tipalti",
      tipaltiEnabled,
      tipaltiForm,
      "Tipalti integration saved successfully",
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Integrations</h2>
        <p className="text-muted-foreground">
          Configure third-party services for email and SMS communications
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* SendGrid Integration */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Mail className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle>SendGrid</CardTitle>
                  <CardDescription>Email delivery service</CardDescription>
                </div>
              </div>
              <Switch
                checked={sendgridEnabled}
                onCheckedChange={setSendgridEnabled}
                disabled={!canEdit}
              />
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={sendgridForm.handleSubmit(saveSendGrid)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="sendgrid_api_key">API Key *</Label>
                <Input
                  id="sendgrid_api_key"
                  type="password"
                  placeholder="SG.xxxxxxxxxxxxx"
                  {...sendgridForm.register("apiKey")}
                  disabled={!canEdit}
                />
                {sendgridForm.formState.errors.apiKey && (
                  <p className="text-sm text-destructive">
                    {sendgridForm.formState.errors.apiKey.message}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sendgrid_from_email">From Email *</Label>
                  <Input
                    id="sendgrid_from_email"
                    type="email"
                    placeholder="noreply@company.com"
                    {...sendgridForm.register("fromEmail")}
                    disabled={!canEdit}
                  />
                  {sendgridForm.formState.errors.fromEmail && (
                    <p className="text-sm text-destructive">
                      {sendgridForm.formState.errors.fromEmail.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sendgrid_from_name">From Name *</Label>
                  <Input
                    id="sendgrid_from_name"
                    placeholder="Company Name"
                    {...sendgridForm.register("fromName")}
                    disabled={!canEdit}
                  />
                  {sendgridForm.formState.errors.fromName && (
                    <p className="text-sm text-destructive">
                      {sendgridForm.formState.errors.fromName.message}
                    </p>
                  )}
                </div>
              </div>

              <Button type="submit" disabled={loadingStates.sendgrid || !canEdit}>
                {loadingStates.sendgrid && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save SendGrid Settings
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Twilio Integration */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <MessageSquare className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle>Twilio</CardTitle>
                  <CardDescription>SMS and voice service</CardDescription>
                </div>
              </div>
              <Switch
                checked={twilioEnabled}
                onCheckedChange={setTwilioEnabled}
                disabled={!canEdit}
              />
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={twilioForm.handleSubmit(saveTwilio)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="twilio_account_sid">Account SID *</Label>
                  <Input
                    id="twilio_account_sid"
                    type="password"
                    placeholder="ACxxxxxxxxxxxxx"
                    {...twilioForm.register("accountSid")}
                    disabled={!canEdit}
                  />
                  {twilioForm.formState.errors.accountSid && (
                    <p className="text-sm text-destructive">
                      {twilioForm.formState.errors.accountSid.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="twilio_auth_token">Auth Token *</Label>
                  <Input
                    id="twilio_auth_token"
                    type="password"
                    placeholder="Enter auth token"
                    {...twilioForm.register("authToken")}
                    disabled={!canEdit}
                  />
                  {twilioForm.formState.errors.authToken && (
                    <p className="text-sm text-destructive">
                      {twilioForm.formState.errors.authToken.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="twilio_phone_number">Twilio Phone Number *</Label>
                <Input
                  id="twilio_phone_number"
                  placeholder="+1234567890"
                  {...twilioForm.register("phoneNumber")}
                  disabled={!canEdit}
                />
                {twilioForm.formState.errors.phoneNumber && (
                  <p className="text-sm text-destructive">
                    {twilioForm.formState.errors.phoneNumber.message}
                  </p>
                )}
              </div>

              <Button type="submit" disabled={loadingStates.twilio || !canEdit}>
                {loadingStates.twilio && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Twilio Settings
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Resend Integration */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Send className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle>Resend</CardTitle>
                  <CardDescription>Modern email API service</CardDescription>
                </div>
              </div>
              <Switch
                checked={resendEnabled}
                onCheckedChange={setResendEnabled}
                disabled={!canEdit}
              />
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={resendForm.handleSubmit(saveResend)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="resend_api_key">API Key *</Label>
                <Input
                  id="resend_api_key"
                  type="password"
                  placeholder="re_xxxxxxxxxxxxx"
                  {...resendForm.register("apiKey")}
                  disabled={!canEdit}
                />
                {resendForm.formState.errors.apiKey && (
                  <p className="text-sm text-destructive">
                    {resendForm.formState.errors.apiKey.message}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="resend_from_email">From Email *</Label>
                  <Input
                    id="resend_from_email"
                    type="email"
                    placeholder="noreply@company.com"
                    {...resendForm.register("fromEmail")}
                    disabled={!canEdit}
                  />
                  {resendForm.formState.errors.fromEmail && (
                    <p className="text-sm text-destructive">
                      {resendForm.formState.errors.fromEmail.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="resend_from_name">From Name *</Label>
                  <Input
                    id="resend_from_name"
                    placeholder="Company Name"
                    {...resendForm.register("fromName")}
                    disabled={!canEdit}
                  />
                  {resendForm.formState.errors.fromName && (
                    <p className="text-sm text-destructive">
                      {resendForm.formState.errors.fromName.message}
                    </p>
                  )}
                </div>
              </div>

              <Button type="submit" disabled={loadingStates.resend || !canEdit}>
                {loadingStates.resend && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Resend Settings
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Shopify Integration */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <ShoppingBag className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle>Shopify</CardTitle>
                  <CardDescription>E-commerce platform integration</CardDescription>
                </div>
              </div>
              <Switch
                checked={shopifyEnabled}
                onCheckedChange={setShopifyEnabled}
                disabled={!canEdit}
              />
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={shopifyForm.handleSubmit(saveShopify)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="shopify_store_url">Store URL *</Label>
                <Input
                  id="shopify_store_url"
                  placeholder="your-store.myshopify.com"
                  {...shopifyForm.register("storeUrl")}
                  disabled={!canEdit}
                />
                {shopifyForm.formState.errors.storeUrl && (
                  <p className="text-sm text-destructive">
                    {shopifyForm.formState.errors.storeUrl.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="shopify_access_token">Access Token *</Label>
                <Input
                  id="shopify_access_token"
                  type="password"
                  placeholder="shpat_xxxxxxxxxxxxx"
                  {...shopifyForm.register("accessToken")}
                  disabled={!canEdit}
                />
                {shopifyForm.formState.errors.accessToken && (
                  <p className="text-sm text-destructive">
                    {shopifyForm.formState.errors.accessToken.message}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="shopify_api_key">API Key *</Label>
                  <Input
                    id="shopify_api_key"
                    type="password"
                    placeholder="Enter API key"
                    {...shopifyForm.register("apiKey")}
                    disabled={!canEdit}
                  />
                  {shopifyForm.formState.errors.apiKey && (
                    <p className="text-sm text-destructive">
                      {shopifyForm.formState.errors.apiKey.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="shopify_api_secret">API Secret *</Label>
                  <Input
                    id="shopify_api_secret"
                    type="password"
                    placeholder="Enter API secret"
                    {...shopifyForm.register("apiSecret")}
                    disabled={!canEdit}
                  />
                  {shopifyForm.formState.errors.apiSecret && (
                    <p className="text-sm text-destructive">
                      {shopifyForm.formState.errors.apiSecret.message}
                    </p>
                  )}
                </div>
              </div>

              <Button type="submit" disabled={loadingStates.shopify || !canEdit}>
                {loadingStates.shopify && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Shopify Settings
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Awtomic Integration */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Truck className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle>Awtomic</CardTitle>
                  <CardDescription>Subscription management for autoships</CardDescription>
                </div>
              </div>
              <Switch
                checked={awtomicEnabled}
                onCheckedChange={setAwtomicEnabled}
                disabled={!canEdit}
              />
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={awtomicForm.handleSubmit(saveAwtomic)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="awtomic_api_url">API URL *</Label>
                <Input
                  id="awtomic_api_url"
                  type="url"
                  placeholder="https://api.awtomic.com"
                  {...awtomicForm.register("apiUrl")}
                  disabled={!canEdit}
                />
                {awtomicForm.formState.errors.apiUrl && (
                  <p className="text-sm text-destructive">
                    {awtomicForm.formState.errors.apiUrl.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="awtomic_api_key">API Key *</Label>
                <Input
                  id="awtomic_api_key"
                  type="password"
                  placeholder="Enter API key"
                  {...awtomicForm.register("apiKey")}
                  disabled={!canEdit}
                />
                {awtomicForm.formState.errors.apiKey && (
                  <p className="text-sm text-destructive">
                    {awtomicForm.formState.errors.apiKey.message}
                  </p>
                )}
              </div>

              <Button type="submit" disabled={loadingStates.awtomic || !canEdit}>
                {loadingStates.awtomic && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Awtomic Settings
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Tipalti Integration */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <CreditCard className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle>Tipalti</CardTitle>
                  <CardDescription>Affiliate payment processing</CardDescription>
                </div>
              </div>
              <Switch
                checked={tipaltiEnabled}
                onCheckedChange={setTipaltiEnabled}
                disabled={!canEdit}
              />
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={tipaltiForm.handleSubmit(saveTipalti)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="tipalti_payer_name">Payer Name *</Label>
                <Input
                  id="tipalti_payer_name"
                  placeholder="Your Company Name"
                  {...tipaltiForm.register("payerName")}
                  disabled={!canEdit}
                />
                {tipaltiForm.formState.errors.payerName && (
                  <p className="text-sm text-destructive">
                    {tipaltiForm.formState.errors.payerName.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="tipalti_iframe_url">iFrame URL *</Label>
                <Input
                  id="tipalti_iframe_url"
                  type="url"
                  placeholder="https://ui2.tipalti.com/payeedashboard/home"
                  {...tipaltiForm.register("iframeUrl")}
                  disabled={!canEdit}
                />
                {tipaltiForm.formState.errors.iframeUrl && (
                  <p className="text-sm text-destructive">
                    {tipaltiForm.formState.errors.iframeUrl.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="tipalti_api_key">API Key *</Label>
                <Input
                  id="tipalti_api_key"
                  type="password"
                  placeholder="Enter API key"
                  {...tipaltiForm.register("apiKey")}
                  disabled={!canEdit}
                />
                {tipaltiForm.formState.errors.apiKey && (
                  <p className="text-sm text-destructive">
                    {tipaltiForm.formState.errors.apiKey.message}
                  </p>
                )}
              </div>

              <Button type="submit" disabled={loadingStates.tipalti || !canEdit}>
                {loadingStates.tipalti && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Tipalti Settings
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
