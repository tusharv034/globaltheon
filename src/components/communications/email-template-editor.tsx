// import { useEffect, useState } from "react";
// import ReactQuill from "react-quill";
// import "react-quill/dist/quill.snow.css";
// import { supabase } from "@/integrations/supabase/client";
// import { toast } from "sonner";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Textarea } from "@/components/ui/textarea";
// import { Switch } from "@/components/ui/switch";
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
// import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
// import { Loader2, Eye, Send } from "lucide-react";

// interface EmailTemplate {
//   id: string;
//   category: string;
//   template_name: string;
//   template_id: string | null;
//   description: string | null;
//   subject: string;
//   html_content: string;
//   is_active: boolean;
// }

// interface CompanySettings {
//   company_name?: string;
//   owner_first_name?: string;
//   owner_last_name?: string;
//   address_line1?: string;
//   address_line2?: string;
//   city?: string;
//   state_province?: string;
//   postal_code?: string;
//   support_email?: string;
//   company_email?: string;
//   company_phone?: string;
//   hours_of_operation?: string;
//   logo_url?: string;
// }

// interface EmailTemplateEditorProps {
//   templateId?: string;
//   onClose: () => void;
//   onSave: () => void;
// }

// export function EmailTemplateEditor({ templateId, onClose, onSave }: EmailTemplateEditorProps) {
//   console.log(templateId);
//   const [loading, setLoading] = useState(false);
//   const [loadingData, setLoadingData] = useState(!!templateId);
//   const [sendingTest, setSendingTest] = useState(false);
//   const [testEmail, setTestEmail] = useState("");
//   const [category, setCategory] = useState("");
//   const [templateName, setTemplateName] = useState("");
//   const [templateIdValue, setTemplateIdValue] = useState("");
//   const [description, setDescription] = useState("");
//   const [subject, setSubject] = useState("");
//   const [htmlContent, setHtmlContent] = useState("");
//   const [isActive, setIsActive] = useState(true);
//   const [useMasterTemplate, setUseMasterTemplate] = useState(false);
//   const [companySettings, setCompanySettings] = useState<CompanySettings>({});
//   const [showPreview, setShowPreview] = useState(false);
//   const [masterTemplate, setMasterTemplate] = useState<{ header_html: string; footer_html: string; is_enabled: boolean } | null>(null);
//   const [mergeFields] = useState([
//     "{{company_name}}",
//     "{{owner_first_name}}",
//     "{{owner_last_name}}",
//     "{{company_email}}",
//     "{{support_email}}",
//     "{{company_phone}}",
//     "{{hours_of_operation}}",
//     "{{address_line1}}",
//     "{{address_line2}}",
//     "{{city}}",
//     "{{state_province}}",
//     "{{postal_code}}",
//     "{{first_name}}",
//     "{{last_name}}",
//     "{{email}}",
//     "{{affiliate_name}}",
//     "{{customer_name}}",
//     "{{order_number}}",
//     "{{order_total}}",
//     "{{order_date}}",
//     "{{join_date}}",
//     "{{$Commissions}}",
//   ]);

//   useEffect(() => {
//     loadCompanySettings();
//     loadMasterTemplate();
//     if (templateId) {
//       loadTemplate();
//     }
//   }, [templateId]);

//   const loadCompanySettings = async () => {
//     try {
//       const { data, error } = await supabase
//         .from("company_settings")
//         .select("*")
//         .maybeSingle();

//       if (error) throw error;
//       if (data) {
//         setCompanySettings(data);
//       }
//     } catch (error) {
//       console.error("Error loading company settings:", error);
//     }
//   };

//   const loadMasterTemplate = async () => {
//     try {
//       const { data, error } = await supabase
//         .from("email_master_template")
//         .select("header_html, footer_html, is_enabled")
//         .maybeSingle();

//       if (error) throw error;
//       if (data) {
//         setMasterTemplate(data);
//       }
//     } catch (error) {
//       console.error("Error loading master template:", error);
//     }
//   };

//   const loadTemplate = async () => {
//     if (!templateId) return;

//     try {
//       setLoadingData(true);
//       const { data, error } = await supabase
//         .from("email_templates")
//         .select("*")
//         .eq("id", templateId)
//         .single();

//       if (error) throw error;

//       if (data) {
//         setCategory(data.category);
//         setTemplateName(data.template_name);
//         setTemplateIdValue(data.template_id || "");
//         setDescription(data.description || "");
//         setSubject(data.subject);
//         setHtmlContent(data.html_content);
//         setIsActive(data.is_active);
//         setUseMasterTemplate(data.use_master_template || false);
//       }
//     } catch (error) {
//       console.error("Error loading template:", error);
//       toast.error("Failed to load template");
//     } finally {
//       setLoadingData(false);
//     }
//   };

//   const handleSave = async () => {
//     if (!category || !templateName || !subject || !htmlContent) {
//       toast.error("Please fill in all required fields");
//       return;
//     }

//     try {
//       setLoading(true);

//       const templateData = {
//         category,
//         template_name: templateName,
//         template_id: templateIdValue || null,
//         description,
//         subject,
//         html_content: htmlContent,
//         is_active: isActive,
//         use_master_template: useMasterTemplate,
//       };

//       if (templateId) {
//         const { error } = await supabase
//           .from("email_templates")
//           .update(templateData)
//           .eq("id", templateId);

//         if (error) throw error;
//         toast.success("Template updated successfully");
//       } else {
//         const { error } = await supabase
//           .from("email_templates")
//           .insert([templateData]);

//         if (error) throw error;
//         toast.success("Template created successfully");
//       }

//       onSave();
//     } catch (error: any) {
//       console.error("Error saving template:", error);
//       toast.error(error.message || "Failed to save template");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const insertMergeField = (field: string) => {
//     setHtmlContent(htmlContent + " " + field);
//   };

//   const getPreviewContent = () => {
//     // Replace merge fields with sample data
//     let previewContent = htmlContent;
//     const sampleData: Record<string, string> = {
//       "{{company_name}}": companySettings.company_name || "Your Company",
//       "{{owner_first_name}}": companySettings.owner_first_name || "Jane",
//       "{{owner_last_name}}": companySettings.owner_last_name || "Smith",
//       "{{support_email}}": companySettings.support_email || "support@example.com",
//       "{{company_email}}": companySettings.company_email || "info@example.com",
//       "{{company_phone}}": companySettings.company_phone || "(555) 123-4567",
//       "{{hours_of_operation}}": companySettings.hours_of_operation || "Mon-Fri 9am-5pm EST",
//       "{{address_line1}}": companySettings.address_line1 || "123 Main Street",
//       "{{address_line2}}": companySettings.address_line2 || "Suite 100",
//       "{{city}}": companySettings.city || "New York",
//       "{{state_province}}": companySettings.state_province || "NY",
//       "{{postal_code}}": companySettings.postal_code || "10001",
//       "{{first_name}}": "John",
//       "{{last_name}}": "Doe",
//       "{{email}}": "john.doe@example.com",
//       "{{affiliate_name}}": "Jane Smith",
//       "{{customer_name}}": "Robert Johnson",
//       "{{order_number}}": "#12345",
//       "{{order_total}}": "$99.99",
//       "{{order_date}}": new Date().toLocaleDateString(),
//       "{{join_date}}": new Date().toLocaleDateString(),
//       "{{$Commissions}}": "$1,234.56",
//     };

//     Object.entries(sampleData).forEach(([key, value]) => {
//       previewContent = previewContent.replace(new RegExp(key, "g"), value);
//     });

//     // Wrap with master template if enabled
//     if (useMasterTemplate && masterTemplate?.is_enabled) {
//       const header = masterTemplate.header_html || "";
//       const footer = masterTemplate.footer_html || "";
//       previewContent = header + previewContent + footer;
//     }

//     return previewContent;
//   };

//   const getPreviewSubject = () => {
//     let previewSubject = subject;
//     const sampleData: Record<string, string> = {
//       "{{company_name}}": companySettings.company_name || "Your Company",
//       "{{owner_first_name}}": companySettings.owner_first_name || "Jane",
//       "{{owner_last_name}}": companySettings.owner_last_name || "Smith",
//       "{{first_name}}": "John",
//       "{{last_name}}": "Doe",
//     };

//     Object.entries(sampleData).forEach(([key, value]) => {
//       previewSubject = previewSubject.replace(new RegExp(key, "g"), value);
//     });

//     return previewSubject;
//   };

//   const handleSendTestEmail = async () => {
//     if (!subject || !htmlContent) {
//       toast.error("Please add subject and content before sending test email");
//       return;
//     }

//     try {
//       setSendingTest(true);
//       const { data: { session } } = await supabase.auth.getSession();

//       if (!session) {
//         toast.error("You must be logged in to send test emails");
//         return;
//       }

//       const { error } = await supabase.functions.invoke("send-test-email", {
//         body: {
//           subject,
//           html_content: htmlContent,
//           use_master_template: useMasterTemplate,
//           test_email: testEmail || undefined,
//         },
//       });

//       if (error) throw error;

//       toast.success("Test email sent! Check your inbox.");
//     } catch (error: any) {
//       console.error("Error sending test email:", error);
//       toast.error(error.message || "Failed to send test email");
//     } finally {
//       setSendingTest(false);
//     }
//   };

//   const modules = {
//     toolbar: [
//       [{ header: [1, 2, 3, false] }],
//       ["bold", "italic", "underline", "strike"],
//       [{ list: "ordered" }, { list: "bullet" }],
//       [{ color: [] }, { background: [] }],
//       [{ align: [] }],
//       ["link", "image"],
//       ["clean"],
//     ],
//   };

//   if (loadingData) {
//     return (
//       <div className="flex items-center justify-center p-8">
//         <Loader2 className="h-8 w-8 animate-spin" />
//       </div>
//     );
//   }

//   return (
//     <Card>
//       <CardHeader>
//         <CardTitle>{templateId ? "Edit" : "Create"} Email Template</CardTitle>
//         <CardDescription>
//           Use merge fields to personalize your emails
//         </CardDescription>
//       </CardHeader>
//       <CardContent className="space-y-6">
//         <div className="grid grid-cols-2 gap-4">
//           <div className="space-y-2">
//             <Label htmlFor="category">Category *</Label>
//             <Input
//               id="category"
//               value={category}
//               onChange={(e) => setCategory(e.target.value)}
//               placeholder="e.g., Affiliate, Customer, Welcome"
//             />
//           </div>

//           <div className="space-y-2">
//             <Label htmlFor="template_name">Template Name *</Label>
//             <Input
//               id="template_name"
//               value={templateName}
//               onChange={(e) => setTemplateName(e.target.value)}
//               placeholder="Template name"
//             />
//           </div>
//         </div>

//         <div className="space-y-2">
//           <Label htmlFor="template_id">Template ID</Label>
//           <Input
//             id="template_id"
//             value={templateIdValue}
//             onChange={(e) => setTemplateIdValue(e.target.value)}
//             placeholder="e.g., NEW_AFFILIATE, WELCOME_EMAIL (optional)"
//           />
//           <p className="text-xs text-muted-foreground">
//             Unique identifier for programmatic reference. Use uppercase with underscores.
//           </p>
//         </div>

//         <div className="space-y-2">
//           <Label htmlFor="description">Description</Label>
//           <Textarea
//             id="description"
//             value={description}
//             onChange={(e) => setDescription(e.target.value)}
//             placeholder="Brief description of when this email is sent"
//             rows={2}
//           />
//         </div>

//         <div className="space-y-2">
//           <Label htmlFor="subject">Email Subject *</Label>
//           <Input
//             id="subject"
//             value={subject}
//             onChange={(e) => setSubject(e.target.value)}
//             placeholder="Email subject line"
//           />
//         </div>

//         <div className="space-y-2">
//           <Label>Email Content *</Label>
//           <div className="mb-2">
//             <p className="text-sm text-muted-foreground mb-2">Merge Fields:</p>
//             <div className="flex flex-wrap gap-2">
//               {mergeFields.map((field) => (
//                 <Button
//                   key={field}
//                   type="button"
//                   variant="outline"
//                   size="sm"
//                   onClick={() => insertMergeField(field)}
//                 >
//                   {field}
//                 </Button>
//               ))}
//             </div>
//           </div>
//           <div className="relative z-10">
//             <ReactQuill
//               theme="snow"
//               value={htmlContent}
//               onChange={setHtmlContent}
//               modules={modules}
//               className="h-64 mb-12"
//             />
//           </div>
//         </div>

//         <div className="flex items-center justify-between pt-4 relative z-20">
//           <div className="flex items-center space-x-2">
//             <Switch
//               id="is_active"
//               checked={isActive}
//               onCheckedChange={setIsActive}
//             />
//             <Label htmlFor="is_active">Active</Label>
//           </div>
//           {masterTemplate?.is_enabled && (
//             <div className="flex items-center space-x-2">
//               <Switch
//                 id="use_master_template"
//                 checked={useMasterTemplate}
//                 onCheckedChange={setUseMasterTemplate}
//               />
//               <Label htmlFor="use_master_template">Use Master Template</Label>
//             </div>
//           )}
//         </div>

//         <div className="space-y-3">
//           <div className="flex items-center gap-3">
//             <div className="flex-1 space-y-2">
//               <Label htmlFor="test_email">Test Email Address (optional)</Label>
//               <Input
//                 id="test_email"
//                 type="email"
//                 value={testEmail}
//                 onChange={(e) => setTestEmail(e.target.value)}
//                 placeholder="Leave blank to send to your logged-in email"
//               />
//             </div>
//           </div>

//           <div className="flex gap-3">
//             <Button onClick={handleSave} disabled={loading}>
//               {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
//               {templateId ? "Update" : "Create"} Template
//             </Button>
//             <Button 
//               variant="outline" 
//               onClick={() => setShowPreview(true)}
//               disabled={!htmlContent || !subject}
//             >
//               <Eye className="mr-2 h-4 w-4" />
//               Preview Email
//             </Button>
//             <Button 
//               variant="secondary" 
//               onClick={handleSendTestEmail}
//               disabled={sendingTest || !htmlContent || !subject}
//             >
//               {sendingTest ? (
//                 <Loader2 className="mr-2 h-4 w-4 animate-spin" />
//               ) : (
//                 <Send className="mr-2 h-4 w-4" />
//               )}
//               Send Test Email
//             </Button>
//             <Button variant="outline" onClick={onClose}>
//               Cancel
//             </Button>
//           </div>
//         </div>
//       </CardContent>

//       <Dialog open={showPreview} onOpenChange={setShowPreview}>
//         <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
//           <DialogHeader>
//             <DialogTitle>Email Preview</DialogTitle>
//             <DialogDescription>
//               This is how the email will appear to recipients. Merge fields are shown with sample data.
//             </DialogDescription>
//           </DialogHeader>

//           <div className="space-y-4">
//             <div className="border-b pb-4">
//               <div className="space-y-2">
//                 <div className="flex items-center text-sm">
//                   <span className="font-semibold w-20">Subject:</span>
//                   <span className="text-muted-foreground">{getPreviewSubject()}</span>
//                 </div>
//                 <div className="flex items-center text-sm">
//                   <span className="font-semibold w-20">From:</span>
//                   <span className="text-muted-foreground">
//                     {companySettings.company_name || "Your Company"} &lt;{companySettings.company_email || "noreply@example.com"}&gt;
//                   </span>
//                 </div>
//                 <div className="flex items-center text-sm">
//                   <span className="font-semibold w-20">To:</span>
//                   <span className="text-muted-foreground">recipient@example.com</span>
//                 </div>
//               </div>
//             </div>

//             <div className="border rounded-lg p-6 bg-white">
//               <div 
//                 dangerouslySetInnerHTML={{ __html: getPreviewContent() }}
//                 className="prose prose-sm max-w-none"
//               />
//             </div>

//             <div className="bg-muted/50 rounded-lg p-4">
//               <p className="text-xs text-muted-foreground">
//                 <strong>Note:</strong> This preview shows sample data for merge fields. 
//                 Actual emails will contain real data from your system.
//               </p>
//             </div>
//           </div>
//         </DialogContent>
//       </Dialog>
//     </Card>
//   );
// }


import { useEffect, useState } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, Eye, Send } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { SendTestEmailPayload } from "@/types";
import {
  getMasterEmailTemplate,
  getEmailTemplateById,
  createEmailTemplate,
  updateEmailTemplate,
  sendTestEmail
} from "@/api/communication";
import { getCompanyData } from "@/api/company";

interface CompanySettings {
  companyName?: string;
  ownerFirstName?: string;
  ownerLastName?: string;
  addressLineOne?: string;
  addressLineTwo?: string;
  city?: string;
  stateProvince?: string;
  zipPostal?: string;
  supportEmail?: string;
  companyEmail?: string;
  companyPhone?: string;
  hoursOfOperation?: string;
}

interface EmailTemplateEditorProps {
  templateId?: string;
  onClose: () => void;
  onSave: () => void;
}

export function EmailTemplateEditor({ templateId, onClose, onSave }: EmailTemplateEditorProps) {

  const [sendingTest, setSendingTest] = useState(false);
  const [testEmail, setTestEmail] = useState("");
  const [category, setCategory] = useState("");
  const [templateName, setTemplateName] = useState("");
  const [templateIdValue, setTemplateIdValue] = useState("");
  const [description, setDescription] = useState("");
  const [subject, setSubject] = useState("");
  const [htmlContent, setHtmlContent] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [useMasterTemplate, setUseMasterTemplate] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const [mergeFields] = useState([
    "{{company_name}}",
    "{{owner_first_name}}",
    "{{owner_last_name}}",
    "{{company_email}}",
    "{{support_email}}",
    "{{company_phone}}",
    "{{hours_of_operation}}",
    "{{address_line1}}",
    "{{address_line2}}",
    "{{city}}",
    "{{state_province}}",
    "{{postal_code}}",
    "{{first_name}}",
    "{{last_name}}",
    "{{email}}",
    "{{affiliate_name}}",
    "{{customer_name}}",
    "{{order_number}}",
    "{{order_total}}",
    "{{order_date}}",
    "{{join_date}}",
    "{{$Commissions}}",
  ]);

  // Fetch Company Settings
  const { data: companyData } = useQuery({
    queryKey: ["companySettings"],
    queryFn: getCompanyData,
  });
  const companySettings = companyData?.data?.data;
  // Fetch Master Template
  const { data: masterTemplateData } = useQuery({
    queryKey: ["masterEmailTemplate"],
    queryFn: getMasterEmailTemplate,
    select: (res) => res.data?.data || null,
  });

  const masterTemplate = masterTemplateData
    ? {
      header_html: masterTemplateData.headerHtml || "",
      footer_html: masterTemplateData.footerHtml || "",
      is_enabled: masterTemplateData.isEnabled || false,
    }
    : null;

  // Fetch single template if editing
  const { data: templateData, isLoading: loadingTemplate } = useQuery({
    queryKey: ["emailTemplate", templateId],
    queryFn: () => getEmailTemplateById(templateId!),
    enabled: !!templateId,
    select: (res) => res.data?.data,
  });

  // Populate form when editing
  useEffect(() => {
    if (templateData) {
      setCategory(templateData.category || "");
      setTemplateName(templateData.templateName);
      setTemplateIdValue(templateData.templateId || "");
      setDescription(templateData.description || "");
      setSubject(templateData.subject);
      setHtmlContent(templateData.emailContent);
      setIsActive(templateData.isActive);
      setUseMasterTemplate(templateData.includeMasterTemplate);
    }
  }, [templateData]);

  // Mutations
  const createMutation = useMutation({
    mutationFn: createEmailTemplate,
    onSuccess: () => {
      toast.success("Template created successfully");
      onSave();
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to create template");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      updateEmailTemplate(id, data),
    onSuccess: () => {
      toast.success("Template updated successfully");
      onSave();
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to update template");
    },
  });

  const handleSave = async () => {
    if (!category || !templateName || !subject || !htmlContent) {
      toast.error("Please fill in all required fields");
      return;
    }

    const payload = {
      templateName,
      templateId: templateIdValue || undefined,
      description: description || undefined,
      category,
      subject,
      emailContent: htmlContent,
      isActive,
      includeMasterTemplate: useMasterTemplate,
    };

    if (templateId) {
      updateMutation.mutate({ id: templateId, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const insertMergeField = (field: string) => {
    setHtmlContent((prev) => prev + " " + field);
  };

  const getPreviewContent = () => {
    let previewContent = htmlContent;
    const sampleData: Record<string, string> = {
      "{{company_name}}": companySettings?.companyName ?? "Your Company",
      "{{owner_first_name}}": companySettings?.ownerFirstName ?? "Jane",
      "{{owner_last_name}}": companySettings?.ownerLastName ?? "Smith",
      "{{support_email}}": companySettings?.supportEmail ?? "support@example.com",
      "{{company_email}}": companySettings?.companyEmail ?? "info@example.com",
      "{{company_phone}}": companySettings?.companyPhone ?? "(555) 123-4567",
      "{{hours_of_operation}}": companySettings?.hoursOfOperation ?? "Mon-Fri 9am-5pm EST",
      "{{address_line1}}": companySettings?.addressLineOne ?? "123 Main Street",
      "{{address_line2}}": companySettings?.addressLineTwo ?? "Suite 100",
      "{{city}}": companySettings?.city ?? "New York",
      "{{state_province}}": companySettings?.stateProvince ?? "NY",
      "{{postal_code}}": companySettings?.zipPostal ?? "10001",

      "{{first_name}}": "John",
      "{{last_name}}": "Doe",
      "{{email}}": "john.doe@example.com",
      "{{affiliate_name}}": "Jane Smith",
      "{{customer_name}}": "Robert Johnson",
      "{{order_number}}": "#12345",
      "{{order_total}}": "$99.99",
      "{{order_date}}": new Date().toLocaleDateString(),
      "{{join_date}}": new Date().toLocaleDateString(),
      "{{$Commissions}}": "$1,234.56",
    };
    Object.entries(sampleData).forEach(([key, value]) => {
      previewContent = previewContent.replace(new RegExp(key, "g"), value);
    });

    if (useMasterTemplate && masterTemplate?.is_enabled) {
      const header = masterTemplate.header_html || "";
      const footer = masterTemplate.footer_html || "";
      previewContent = header + previewContent + footer;
    }

    return previewContent;
  };

  const getPreviewSubject = () => {
    let previewSubject = subject;
    const sampleData: Record<string, string> = {
      "{{company_name}}": companySettings?.companyName ?? "Your Company",
      "{{owner_first_name}}": companySettings?.ownerFirstName ?? "Jane",
      "{{owner_last_name}}": companySettings?.ownerLastName ?? "Smith",
      "{{first_name}}": "John",
      "{{last_name}}": "Doe",
    };

    Object.entries(sampleData).forEach(([key, value]) => {
      previewSubject = previewSubject.replace(new RegExp(key, "g"), value);
    });

    return previewSubject;
  };


  const mutation = useMutation({
    mutationFn: (payload: SendTestEmailPayload) =>
      sendTestEmail(payload).then((res) => res.data), // assuming your api.post returns { data, error, etc. }

    onSuccess: (data) => {
      toast.success(
        data.message || `Test email sent to ${data.data.sentTo || "your inbox"}!`
      );
    },

    onError: (error: any) => {
      console.error("Error sending test email:", error);
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to send test email";
      toast.error(message);
    },
  });


  // Updated handler
  const handleSendTestEmail = async () => {
    if (!subject || !htmlContent) {
      toast.error("Please add subject and content before sending test email");
      return;
    }

    if (!testEmail?.trim()) {
      toast.error("Please enter a test email address");
      return;
    }

    const payload: SendTestEmailPayload = {
      subject,
      htmlContent,
      useMasterTemplate,
      testEmail: testEmail.trim(),
    };

    mutation.mutate(payload);
  };

  const modules = {
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ["bold", "italic", "underline", "strike"],
      [{ list: "ordered" }, { list: "bullet" }],
      [{ color: [] }, { background: [] }],
      [{ align: [] }],
      ["link", "image"],
      ["clean"],
    ],
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  if (loadingTemplate && templateId) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{templateId ? "Edit" : "Create"} Email Template</CardTitle>
        <CardDescription>
          Use merge fields to personalize your emails
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="category">Category *</Label>
            <Input
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="e.g., Affiliate, Customer, Welcome"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="template_name">Template Name *</Label>
            <Input
              id="template_name"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="Template name"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="template_id">Template ID</Label>
          <Input
            id="template_id"
            value={templateIdValue}
            onChange={(e) => setTemplateIdValue(e.target.value)}
            placeholder="e.g., NEW_AFFILIATE, WELCOME_EMAIL (optional)"
          />
          <p className="text-xs text-muted-foreground">
            Unique identifier for programmatic reference. Use uppercase with underscores.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief description of when this email is sent"
            rows={2}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="subject">Email Subject *</Label>
          <Input
            id="subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Email subject line"
          />
        </div>

        <div className="space-y-2">
          <Label>Email Content *</Label>
          <div className="mb-2">
            <p className="text-sm text-muted-foreground mb-2">Merge Fields:</p>
            <div className="flex flex-wrap gap-2">
              {mergeFields.map((field) => (
                <Button
                  key={field}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => insertMergeField(field)}
                >
                  {field}
                </Button>
              ))}
            </div>
          </div>
          <div className="relative z-10">
            <ReactQuill
              theme="snow"
              value={htmlContent}
              onChange={setHtmlContent}
              modules={modules}
              className="h-64 mb-12"
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 relative z-20">
          <div className="flex items-center space-x-2">
            <Switch
              id="is_active"
              checked={isActive}
              onCheckedChange={setIsActive}
            />
            <Label htmlFor="is_active">Active</Label>
          </div>
          {masterTemplate?.is_enabled && (
            <div className="flex items-center space-x-2">
              <Switch
                id="use_master_template"
                checked={useMasterTemplate}
                onCheckedChange={setUseMasterTemplate}
              />
              <Label htmlFor="use_master_template">Use Master Template</Label>
            </div>
          )}
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex-1 space-y-2">
              <Label htmlFor="test_email">Test Email Address (optional)</Label>
              <Input
                id="test_email"
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="Leave blank to send to your logged-in email"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <Button onClick={handleSave} disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {templateId ? "Update" : "Create"} Template
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowPreview(true)}
              disabled={!htmlContent || !subject}
            >
              <Eye className="mr-2 h-4 w-4" />
              Preview Email
            </Button>
            <Button
              variant="secondary"
              onClick={handleSendTestEmail}
              disabled={sendingTest || !htmlContent || !subject}
            >
              {sendingTest ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              Send Test Email
            </Button>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </div>
      </CardContent>

      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Email Preview</DialogTitle>
            <DialogDescription>
              This is how the email will appear to recipients. Merge fields are shown with sample data.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="border-b pb-4">
              <div className="space-y-2">
                <div className="flex items-center text-sm">
                  <span className="font-semibold w-20">Subject:</span>
                  <span className="text-muted-foreground">{getPreviewSubject()}</span>
                </div>
                <div className="flex items-center text-sm">
                  <span className="font-semibold w-20">From:</span>
                  <span className="text-muted-foreground">
                    {companySettings?.companyName ?? "Your Company"} &lt;{companySettings?.companyEmail ?? "noreply@example.com"}&gt;
                  </span>
                </div>
                <div className="flex items-center text-sm">
                  <span className="font-semibold w-20">To:</span>
                  <span className="text-muted-foreground">recipient@example.com</span>
                </div>
              </div>
            </div>

            <div className="border rounded-lg p-6 bg-white">
              <div
                dangerouslySetInnerHTML={{ __html: getPreviewContent() }}
                className="prose prose-sm max-w-none"
              />
            </div>

            <div className="bg-muted/50 rounded-lg p-4">
              <p className="text-xs text-muted-foreground">
                <strong>Note:</strong> This preview shows sample data for merge fields.
                Actual emails will contain real data from your system.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}