// import { useEffect, useState } from "react";
// import ReactQuill from "react-quill";
// import "react-quill/dist/quill.snow.css";
// import { supabase } from "@/integrations/supabase/client";
// import { toast } from "sonner";
// import { Button } from "@/components/ui/button";
// import { Label } from "@/components/ui/label";
// import { Switch } from "@/components/ui/switch";
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
// import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
// import { Loader2, Eye } from "lucide-react";

// interface MasterTemplateEditorProps {
//   onClose: () => void;
//   onSave: () => void;
// }

// export function MasterTemplateEditor({ onClose, onSave }: MasterTemplateEditorProps) {
//   const [loading, setLoading] = useState(false);
//   const [loadingData, setLoadingData] = useState(true);
//   const [headerHtml, setHeaderHtml] = useState("");
//   const [footerHtml, setFooterHtml] = useState("");
//   const [isEnabled, setIsEnabled] = useState(false);
//   const [templateId, setTemplateId] = useState<string | null>(null);
//   const [showPreview, setShowPreview] = useState(false);

//   useEffect(() => {
//     loadMasterTemplate();
//   }, []);

//   const loadMasterTemplate = async () => {
//     try {
//       setLoadingData(true);
//       const { data, error } = await supabase
//         .from("email_master_template")
//         .select("*")
//         .maybeSingle();

//       if (error) throw error;

//       if (data) {
//         setTemplateId(data.id);
//         setHeaderHtml(data.header_html || "");
//         setFooterHtml(data.footer_html || "");
//         setIsEnabled(data.is_enabled);
//       }
//     } catch (error) {
//       console.error("Error loading master template:", error);
//       toast.error("Failed to load master template");
//     } finally {
//       setLoadingData(false);
//     }
//   };

//   const handleSave = async () => {
//     try {
//       setLoading(true);

//       const templateData = {
//         header_html: headerHtml,
//         footer_html: footerHtml,
//         is_enabled: isEnabled,
//       };

//       if (templateId) {
//         const { error } = await supabase
//           .from("email_master_template")
//           .update(templateData)
//           .eq("id", templateId);

//         if (error) throw error;
//       } else {
//         const { error } = await supabase
//           .from("email_master_template")
//           .insert([templateData]);

//         if (error) throw error;
//       }

//       toast.success("Master template updated successfully");
//       onSave();
//     } catch (error: any) {
//       console.error("Error saving master template:", error);
//       toast.error(error.message || "Failed to save master template");
//     } finally {
//       setLoading(false);
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
//         <CardTitle>Master Email Template</CardTitle>
//         <CardDescription>
//           Configure the header and footer that will wrap all emails that opt-in to use the master template
//         </CardDescription>
//       </CardHeader>
//       <CardContent className="space-y-6">
//         <div className="flex items-center space-x-2">
//           <Switch
//             id="is_enabled"
//             checked={isEnabled}
//             onCheckedChange={setIsEnabled}
//           />
//           <Label htmlFor="is_enabled">Enable Master Template</Label>
//           <p className="text-sm text-muted-foreground ml-2">
//             (Templates must individually opt-in to use it)
//           </p>
//         </div>

//         <div className="space-y-2">
//           <Label>Header HTML</Label>
//           <p className="text-sm text-muted-foreground mb-2">
//             This will appear at the top of emails that use the master template
//           </p>
//           <div className="relative z-10">
//             <ReactQuill
//               theme="snow"
//               value={headerHtml}
//               onChange={setHeaderHtml}
//               modules={modules}
//               className="h-48 mb-12"
//             />
//           </div>
//         </div>

//         <div className="space-y-2">
//           <Label>Footer HTML</Label>
//           <p className="text-sm text-muted-foreground mb-2">
//             This will appear at the bottom of emails that use the master template
//           </p>
//           <div className="relative z-10">
//             <ReactQuill
//               theme="snow"
//               value={footerHtml}
//               onChange={setFooterHtml}
//               modules={modules}
//               className="h-48 mb-12"
//             />
//           </div>
//         </div>

//         <div className="flex gap-3">
//           <Button onClick={handleSave} disabled={loading}>
//             {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
//             Save Master Template
//           </Button>
//           <Button 
//             variant="outline" 
//             onClick={() => setShowPreview(true)}
//           >
//             <Eye className="mr-2 h-4 w-4" />
//             Preview
//           </Button>
//           <Button variant="outline" onClick={onClose}>
//             Cancel
//           </Button>
//         </div>
//       </CardContent>

//       <Dialog open={showPreview} onOpenChange={setShowPreview}>
//         <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
//           <DialogHeader>
//             <DialogTitle>Master Template Preview</DialogTitle>
//             <DialogDescription>
//               This is how the header and footer will wrap email content
//             </DialogDescription>
//           </DialogHeader>

//           <div className="space-y-4">
//             <div className="border rounded-lg p-6 bg-white">
//               {headerHtml && (
//                 <>
//                   <div 
//                     dangerouslySetInnerHTML={{ __html: headerHtml }}
//                     className="prose prose-sm max-w-none border-b pb-4 mb-4"
//                   />
//                 </>
//               )}

//               <div className="bg-muted/30 p-4 my-4 rounded">
//                 <p className="text-sm text-muted-foreground italic text-center">
//                   [ Email content will appear here ]
//                 </p>
//               </div>

//               {footerHtml && (
//                 <>
//                   <div 
//                     dangerouslySetInnerHTML={{ __html: footerHtml }}
//                     className="prose prose-sm max-w-none border-t pt-4 mt-4"
//                   />
//                 </>
//               )}
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
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, Eye } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getMasterEmailTemplate,updateMasterEmailTemplate } from "@/api/communication";


interface MasterTemplateEditorProps {
  onClose: () => void;
  onSave: () => void;
}

export function MasterTemplateEditor({ onClose, onSave }: MasterTemplateEditorProps) {
  const [loading, setLoading] = useState(false);
  const [headerHtml, setHeaderHtml] = useState("");
  const [footerHtml, setFooterHtml] = useState("");
  const [isEnabled, setIsEnabled] = useState(false);
  const [templateId, setTemplateId] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);



  const { data, error, isError } = useQuery({
    queryKey: ['masterEmailTemplate'],
    queryFn: getMasterEmailTemplate,
  });

  const masterEmailData = data?.data?.data;
 
  useEffect(() => {
    if (masterEmailData) {
      setHeaderHtml(masterEmailData.headerHtml || "");
      setFooterHtml(masterEmailData.footerHtml || "");
      setIsEnabled(masterEmailData.isEnabled);
    }
  }, [masterEmailData]);


  // Mutation for updating the email template
  const mutation = useMutation({
    mutationFn: updateMasterEmailTemplate,
    onMutate: () => {
      setLoading(true); // Show loading state while mutation is in progress
    },
    onSuccess: (response) => {
      setLoading(false); // Hide loading on success
      toast.success("Master template updated successfully");
      onSave(); // Callback function after successful update
    },
    onError: (error) => {
      setLoading(false); // Hide loading on error
      toast.error(error.message || "Failed to save master template");
    },
  });

  const handleSave = async () => {
    try {
      setLoading(true);

      const templateData = {
        headerHtml,
        footerHtml,
        isEnabled,
      };

      // Call the mutation function to update the template
      mutation.mutate(templateData);

    } catch (error) {
      setLoading(false);
      toast.error("Failed to save template");
    }
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

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Master Email Template</CardTitle>
        <CardDescription>
          Configure the header and footer that will wrap all emails that opt-in to use the master template
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center space-x-2">
          <Switch
            id="is_enabled"
            checked={isEnabled}
            onCheckedChange={setIsEnabled}
          />
          <Label htmlFor="is_enabled">Enable Master Template</Label>
          <p className="text-sm text-muted-foreground ml-2">
            (Templates must individually opt-in to use it)
          </p>
        </div>

        <div className="space-y-2">
          <Label>Header HTML</Label>
          <p className="text-sm text-muted-foreground mb-2">
            This will appear at the top of emails that use the master template
          </p>
          <div className="relative z-10">
            <ReactQuill
              theme="snow"
              value={headerHtml}
              onChange={setHeaderHtml}
              modules={modules}
              className="h-48 mb-12"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Footer HTML</Label>
          <p className="text-sm text-muted-foreground mb-2">
            This will appear at the bottom of emails that use the master template
          </p>
          <div className="relative z-10">
            <ReactQuill
              theme="snow"
              value={footerHtml}
              onChange={setFooterHtml}
              modules={modules}
              className="h-48 mb-12"
            />
          </div>
        </div>

        <div className="flex gap-3">
          <Button onClick={handleSave} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Master Template
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowPreview(true)}
          >
            <Eye className="mr-2 h-4 w-4" />
            Preview
          </Button>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </CardContent>

      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Master Template Preview</DialogTitle>
            <DialogDescription>
              This is how the header and footer will wrap email content
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="border rounded-lg p-6 bg-white">
              {headerHtml && (
                <>
                  <div
                    dangerouslySetInnerHTML={{ __html: headerHtml }}
                    className="prose prose-sm max-w-none border-b pb-4 mb-4"
                  />
                </>
              )}

              <div className="bg-muted/30 p-4 my-4 rounded">
                <p className="text-sm text-muted-foreground italic text-center">
                  [ Email content will appear here ]
                </p>
              </div>

              {footerHtml && (
                <>
                  <div
                    dangerouslySetInnerHTML={{ __html: footerHtml }}
                    className="prose prose-sm max-w-none border-t pt-4 mt-4"
                  />
                </>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}