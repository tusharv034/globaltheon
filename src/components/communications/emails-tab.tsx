// import { useEffect, useState } from "react";
// import { supabase } from "@/integrations/supabase/client";
// import { toast } from "sonner";
// import { Button } from "@/components/ui/button";
// import { Switch } from "@/components/ui/switch";
// import {
//   Table,
//   TableBody,
//   TableCell,
//   TableHead,
//   TableHeader,
//   TableRow,
// } from "@/components/ui/table";
// import {
//   DropdownMenu,
//   DropdownMenuContent,
//   DropdownMenuItem,
//   DropdownMenuTrigger,
// } from "@/components/ui/dropdown-menu";
// import {
//   AlertDialog,
//   AlertDialogAction,
//   AlertDialogCancel,
//   AlertDialogContent,
//   AlertDialogDescription,
//   AlertDialogFooter,
//   AlertDialogHeader,
//   AlertDialogTitle,
// } from "@/components/ui/alert-dialog";
// import { Plus, MoreVertical, Edit, Copy, Trash2, Settings } from "lucide-react";
// import { EmailTemplateEditor } from "./email-template-editor";
// import { MasterTemplateEditor } from "./master-template-editor";

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

// export function EmailsTab() {
//   const [templates, setTemplates] = useState<EmailTemplate[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [editingTemplate, setEditingTemplate] = useState<string | null>(null);
//   const [deletingTemplate, setDeletingTemplate] = useState<string | null>(null);
//   const [showEditor, setShowEditor] = useState(false);
//   const [showMasterEditor, setShowMasterEditor] = useState(false);

//   useEffect(() => {
//     loadTemplates();
//   }, []);

//   const loadTemplates = async () => {
//     try {
//       setLoading(true);
//       const { data, error } = await supabase
//         .from("email_templates")
//         .select("*")
//         .order("category", { ascending: true })
//         .order("template_name", { ascending: true });

//       if (error) throw error;
//       setTemplates(data || []);
//     } catch (error) {
//       console.error("Error loading templates:", error);
//       toast.error("Failed to load email templates");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleToggleActive = async (id: string, currentStatus: boolean) => {
//     try {
//       const { error } = await supabase
//         .from("email_templates")
//         .update({ is_active: !currentStatus })
//         .eq("id", id);

//       if (error) throw error;

//       toast.success(`Template ${!currentStatus ? "activated" : "deactivated"}`);
//       loadTemplates();
//     } catch (error) {
//       console.error("Error updating template:", error);
//       toast.error("Failed to update template");
//     }
//   };

//   const handleDuplicate = async (template: EmailTemplate) => {
//     try {
//       const { error } = await supabase
//         .from("email_templates")
//         .insert([{
//           category: template.category,
//           template_name: `${template.template_name} (Copy)`,
//           template_id: template.template_id ? `${template.template_id}_COPY` : null,
//           description: template.description,
//           subject: template.subject,
//           html_content: template.html_content,
//           is_active: false,
//         }]);

//       if (error) throw error;

//       toast.success("Template duplicated successfully");
//       loadTemplates();
//     } catch (error) {
//       console.error("Error duplicating template:", error);
//       toast.error("Failed to duplicate template");
//     }
//   };

//   const handleDelete = async () => {
//     if (!deletingTemplate) return;

//     try {
//       const { error } = await supabase
//         .from("email_templates")
//         .delete()
//         .eq("id", deletingTemplate);

//       if (error) throw error;

//       toast.success("Template deleted successfully");
//       setDeletingTemplate(null);
//       loadTemplates();
//     } catch (error) {
//       console.error("Error deleting template:", error);
//       toast.error("Failed to delete template");
//     }
//   };

//   const handleEditorClose = () => {
//     setShowEditor(false);
//     setEditingTemplate(null);
//   };

//   const handleEditorSave = () => {
//     handleEditorClose();
//     loadTemplates();
//   };

//   const handleMasterEditorClose = () => {
//     setShowMasterEditor(false);
//   };

//   const handleMasterEditorSave = () => {
//     handleMasterEditorClose();
//   };

//   if (showMasterEditor) {
//     return (
//       <MasterTemplateEditor
//         onClose={handleMasterEditorClose}
//         onSave={handleMasterEditorSave}
//       />
//     );
//   }

//   if (showEditor) {
//     return (
//       <EmailTemplateEditor
//         templateId={editingTemplate || undefined}
//         onClose={handleEditorClose}
//         onSave={handleEditorSave}
//       />
//     );
//   }

//   return (
//     <div className="space-y-6">
//       <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
//         <div>
//           <h3 className="text-lg font-semibold">Emails</h3>
//           <p className="text-sm text-muted-foreground">
//             Edit and preview email templates below
//           </p>
//         </div>
//         <div className="flex flex-col sm:flex-row gap-2">
//           <Button variant="outline" onClick={() => setShowMasterEditor(true)} className="w-full sm:w-auto">
//             <Settings className="mr-2 h-4 w-4" />
//             Master Template
//           </Button>
//           <Button onClick={() => setShowEditor(true)} className="w-full sm:w-auto">
//             <Plus className="mr-2 h-4 w-4" />
//             Create Template
//           </Button>
//         </div>
//       </div>

//       {/* Desktop Table View */}
//       <div className="hidden md:block border rounded-lg overflow-hidden">
//         <Table>
//           <TableHeader>
//             <TableRow>
//               <TableHead>Template name</TableHead>
//               <TableHead>Template ID</TableHead>
//               <TableHead>Description</TableHead>
//               <TableHead className="text-right">Active?</TableHead>
//               <TableHead className="w-[50px]"></TableHead>
//             </TableRow>
//           </TableHeader>
//           <TableBody>
//             {loading ? (
//               <TableRow>
//                 <TableCell colSpan={5} className="text-center">
//                   Loading templates...
//                 </TableCell>
//               </TableRow>
//             ) : templates.length === 0 ? (
//               <TableRow>
//                 <TableCell colSpan={5} className="text-center">
//                   No email templates found
//                 </TableCell>
//               </TableRow>
//             ) : (
//               templates.map((template) => (
//                 <TableRow key={template.id}>
//                   <TableCell className="font-medium">
//                     {template.template_name}
//                   </TableCell>
//                   <TableCell>
//                     {template.template_id ? (
//                       <code className="text-xs bg-muted px-2 py-1 rounded">
//                         {template.template_id}
//                       </code>
//                     ) : (
//                       <span className="text-muted-foreground">-</span>
//                     )}
//                   </TableCell>
//                   <TableCell>{template.description || "-"}</TableCell>
//                   <TableCell className="text-right">
//                     <Switch
//                       checked={template.is_active}
//                       onCheckedChange={() =>
//                         handleToggleActive(template.id, template.is_active)
//                       }
//                     />
//                   </TableCell>
//                   <TableCell>
//                     <DropdownMenu>
//                       <DropdownMenuTrigger asChild>
//                         <Button variant="ghost" size="icon">
//                           <MoreVertical className="h-4 w-4" />
//                         </Button>
//                       </DropdownMenuTrigger>
//                       <DropdownMenuContent align="end">
//                         <DropdownMenuItem
//                           onClick={() => {
//                             setEditingTemplate(template.id);
//                             setShowEditor(true);
//                           }}
//                         >
//                           <Edit className="mr-2 h-4 w-4" />
//                           Edit
//                         </DropdownMenuItem>
//                         <DropdownMenuItem
//                           onClick={() => handleDuplicate(template)}
//                         >
//                           <Copy className="mr-2 h-4 w-4" />
//                           Duplicate
//                         </DropdownMenuItem>
//                         <DropdownMenuItem
//                           onClick={() => setDeletingTemplate(template.id)}
//                           className="text-destructive"
//                         >
//                           <Trash2 className="mr-2 h-4 w-4" />
//                           Delete
//                         </DropdownMenuItem>
//                       </DropdownMenuContent>
//                     </DropdownMenu>
//                   </TableCell>
//                 </TableRow>
//               ))
//             )}
//           </TableBody>
//         </Table>
//       </div>

//       {/* Mobile Card View */}
//       <div className="md:hidden space-y-4">
//         {loading ? (
//           <div className="text-center py-8 text-muted-foreground">
//             Loading templates...
//           </div>
//         ) : templates.length === 0 ? (
//           <div className="text-center py-8 text-muted-foreground">
//             No email templates found
//           </div>
//         ) : (
//           templates.map((template) => (
//             <div key={template.id} className="border rounded-lg p-4 space-y-3">
//               <div className="flex items-start justify-between gap-2">
//                 <div className="flex-1 min-w-0">
//                   <h4 className="font-medium">{template.template_name}</h4>
//                   {template.template_id && (
//                     <code className="text-xs bg-muted px-2 py-1 rounded block mt-1 w-fit">
//                       {template.template_id}
//                     </code>
//                   )}
//                   {template.description && (
//                     <p className="text-sm text-muted-foreground mt-2">
//                       {template.description}
//                     </p>
//                   )}
//                 </div>
//                 <DropdownMenu>
//                   <DropdownMenuTrigger asChild>
//                     <Button variant="ghost" size="icon" className="flex-shrink-0">
//                       <MoreVertical className="h-4 w-4" />
//                     </Button>
//                   </DropdownMenuTrigger>
//                   <DropdownMenuContent align="end">
//                     <DropdownMenuItem
//                       onClick={() => {
//                         setEditingTemplate(template.id);
//                         setShowEditor(true);
//                       }}
//                     >
//                       <Edit className="mr-2 h-4 w-4" />
//                       Edit
//                     </DropdownMenuItem>
//                     <DropdownMenuItem
//                       onClick={() => handleDuplicate(template)}
//                     >
//                       <Copy className="mr-2 h-4 w-4" />
//                       Duplicate
//                     </DropdownMenuItem>
//                     <DropdownMenuItem
//                       onClick={() => setDeletingTemplate(template.id)}
//                       className="text-destructive"
//                     >
//                       <Trash2 className="mr-2 h-4 w-4" />
//                       Delete
//                     </DropdownMenuItem>
//                   </DropdownMenuContent>
//                 </DropdownMenu>
//               </div>
//               <div className="flex items-center justify-between pt-2 border-t">
//                 <span className="text-sm text-muted-foreground">Active</span>
//                 <Switch
//                   checked={template.is_active}
//                   onCheckedChange={() =>
//                     handleToggleActive(template.id, template.is_active)
//                   }
//                 />
//               </div>
//             </div>
//           ))
//         )}
//       </div>

//       <AlertDialog
//         open={!!deletingTemplate}
//         onOpenChange={(open) => !open && setDeletingTemplate(null)}
//       >
//         <AlertDialogContent>
//           <AlertDialogHeader>
//             <AlertDialogTitle>Delete Email Template</AlertDialogTitle>
//             <AlertDialogDescription>
//               Are you sure you want to delete this email template? This action
//               cannot be undone.
//             </AlertDialogDescription>
//           </AlertDialogHeader>
//           <AlertDialogFooter>
//             <AlertDialogCancel>Cancel</AlertDialogCancel>
//             <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
//           </AlertDialogFooter>
//         </AlertDialogContent>
//       </AlertDialog>
//     </div>
//   );
// }
// components/emails-tab.tsx

// EmailsTab.tsx
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getEmailTemplates,
  toggleTemplateStatus,
  duplicateEmailTemplate,
  deleteEmailTemplate,
} from "@/api/communication";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, MoreVertical, Edit, Copy, Trash2, Settings } from "lucide-react";
import { EmailTemplateEditor } from "./email-template-editor";
import { MasterTemplateEditor } from "./master-template-editor";
import type { EmailTemplate } from "@/types";

export function EmailsTab() {
  const [editingTemplate, setEditingTemplate] = useState<string | null>(null);
  const [deletingTemplate, setDeletingTemplate] = useState<string | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [showMasterEditor, setShowMasterEditor] = useState(false);

  const queryClient = useQueryClient();

  // Fetch templates — matches your real backend response
  const {
    data: response,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["emailTemplates"],
    queryFn: async () => {
      const res = await getEmailTemplates();
      return res.data; // { success, message, data: [...], pagination }
    },
  });

  const templates: EmailTemplate[] = response?.data ?? [];
  // pagination available if you want later: response?.pagination
  const toggleMutation = useMutation({
  mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
    toggleTemplateStatus(id, !isActive),

  onSuccess: (_, { isActive }) => {
    if (isActive) {
      toast.success("Template deactivated");
    } else {
      toast.success("Template activated");
    }

    queryClient.invalidateQueries({ queryKey: ["emailTemplates"] });
  },

  onError: () => {
    toast.error("Failed to update template status");
  },
});
  const duplicateMutation = useMutation({
    mutationFn: duplicateEmailTemplate,
    onSuccess: () => {
      toast.success("Template duplicated successfully");
      queryClient.invalidateQueries({ queryKey: ["emailTemplates"] });
    },
    onError: () => toast.error("Failed to duplicate template"),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteEmailTemplate,
    onSuccess: () => {
      toast.success("Template deleted successfully");
      setDeletingTemplate(null);
      queryClient.invalidateQueries({ queryKey: ["emailTemplates"] });
    },
    onError: () => toast.error("Failed to delete template"),
  });

  const handleToggleActive = (id: string, currentStatus: boolean) => {
    toggleMutation.mutate({ id, isActive: currentStatus });
  };

  const handleDuplicate = (template: EmailTemplate) => {
    duplicateMutation.mutate(template._id);
  };

  const handleDelete = () => {
    if (deletingTemplate) {
      deleteMutation.mutate(deletingTemplate);
    }
  };

  const handleEditorClose = () => {
    setShowEditor(false);
    setEditingTemplate(null);
  };

  const handleEditorSave = () => {
    handleEditorClose();
    queryClient.invalidateQueries({ queryKey: ["emailTemplates"] });
  };

  const handleMasterEditorClose = () => setShowMasterEditor(false);
  const handleMasterEditorSave = () => handleMasterEditorClose();

  if (showMasterEditor) {
    return (
      <MasterTemplateEditor
        onClose={handleMasterEditorClose}
        onSave={handleMasterEditorSave}
      />
    );
  }

  if (showEditor) {
    return (
      <EmailTemplateEditor
        templateId={editingTemplate || undefined}
        onClose={handleEditorClose}
        onSave={handleEditorSave}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold">Emails</h3>
          <p className="text-sm text-muted-foreground">
            Edit and preview email templates below
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={() => setShowMasterEditor(true)} className="w-full sm:w-auto">
            <Settings className="mr-2 h-4 w-4" />
            Master Template
          </Button>
          <Button onClick={() => setShowEditor(true)} className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            Create Template
          </Button>
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Template name</TableHead>
              <TableHead>Template ID</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">Active?</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center">
                  Loading templates...
                </TableCell>
              </TableRow>
            ) : templates.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center">
                  No email templates found
                </TableCell>
              </TableRow>
            ) : (
              templates.map((template) => (
                <TableRow key={template._id}>
                  <TableCell className="font-medium">
                    {template.templateName}
                  </TableCell>
                  <TableCell>
                    {template.templateId ? (
                      <code className="text-xs bg-muted px-2 py-1 rounded">
                        {template.templateId}
                      </code>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>{template.description || "-"}</TableCell>
                  <TableCell className="text-right">
                    <Switch
                      checked={template.isActive}
                      onCheckedChange={() => handleToggleActive(template._id, template.isActive)}
                      disabled={toggleMutation.isPending}
                    />
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            setEditingTemplate(template._id);
                            setShowEditor(true);
                          }}
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDuplicate(template)}
                        >
                          <Copy className="mr-2 h-4 w-4" />
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setDeletingTemplate(template._id)}
                          className="text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            Loading templates...
          </div>
        ) : templates.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No email templates found
          </div>
        ) : (
          templates.map((template) => (
            <div key={template._id} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium">{template.templateName}</h4>
                  {template.templateId && (
                    <code className="text-xs bg-muted px-2 py-1 rounded block mt-1 w-fit">
                      {template.templateId}
                    </code>
                  )}
                  {template.description && (
                    <p className="text-sm text-muted-foreground mt-2">
                      {template.description}
                    </p>
                  )}
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="flex-shrink-0">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => {
                        setEditingTemplate(template._id);
                        setShowEditor(true);
                      }}
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleDuplicate(template)}
                    >
                      <Copy className="mr-2 h-4 w-4" />
                      Duplicate
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setDeletingTemplate(template._id)}
                      className="text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="flex items-center justify-between pt-2 border-t">
                <span className="text-sm text-muted-foreground">Active</span>
                <Switch
                  checked={template.isActive}
                  onCheckedChange={() => handleToggleActive(template._id, template.isActive)}
                  disabled={toggleMutation.isPending}
                />
              </div>
            </div>
          ))
        )}
      </div>

      <AlertDialog
        open={!!deletingTemplate}
        onOpenChange={(open) => !open && setDeletingTemplate(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Email Template</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this email template? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}