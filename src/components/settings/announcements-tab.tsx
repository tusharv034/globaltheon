import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { AnnouncementEditorDialog } from "./announcement-editor-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
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
import { useModulePermissions } from "@/hooks/use-module-permissions";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { readAnnouncements, deleteAnnouncement } from "@/api/announcement";

interface Announcement {
  _id: string;
  title: string;
  content: string;
  announcementType: string;
  targetRole: string;
  startDate: string | null;
  endDate: string | null;
  showOnce: boolean;
  requiresCompletion: boolean;
  isActive: boolean;
  createdAt: string;
}

export function AnnouncementsTab() {
  /*
  // state to store announcements list
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  // state to store loading
  const [loading, setLoading] = useState(true);
  // state to trigger Dialog Box open and close
  const [editorOpen, setEditorOpen] = useState(false);
  // state to store the selected announcement for editing and deleting
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  // state to toggle Dialog Box used for deletion of an announcement
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  // state to store the annoucement to be deleted
  const [announcementToDelete, setAnnouncementToDelete] = useState<string | null>(null);
  // hasPermission function to check if allowed
  const { hasPermission } = useModulePermissions();
  // storing if permitted
  const canEdit = hasPermission("company_settings_announcements", "edit");

  // useEffect to call the fetching of annoucements
  useEffect(() => {
    loadAnnouncements();
  }, []);

  // function to fetch annoucements
  const loadAnnouncements = async () => {
    try {
      const { data, error } = await supabase
        .from("announcements")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setAnnouncements(data || []);
    } catch (error) {
      console.error("Error loading announcements:", error);
      toast({
        title: "Error",
        description: "Failed to load announcements",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // function to toggle the Creation Dialog Box
  const handleCreate = () => {
    if (!canEdit) {
      toast({
        title: "Permission Denied",
        description: "You need edit permissions to create announcements.",
        variant: "destructive",
      });
      return;
    }
    setSelectedAnnouncement(null);
    setEditorOpen(true);
  };

  // Function to toggle the Updation Dialog Box
  const handleEdit = (announcement: Announcement) => {
    if (!canEdit) {
      toast({
        title: "Permission Denied",
        description: "You need edit permissions to edit announcements.",
        variant: "destructive",
      });
      return;
    }
    setSelectedAnnouncement(announcement);
    setEditorOpen(true);
  };

  // function to delete the annoucement
  const handleDelete = async () => {
    if (!announcementToDelete) return;

    try {
      const { error } = await supabase
        .from("announcements")
        .delete()
        .eq("id", announcementToDelete);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Announcement deleted successfully",
      });

      loadAnnouncements();
    } catch (error) {
      console.error("Error deleting announcement:", error);
      toast({
        title: "Error",
        description: "Failed to delete announcement",
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setAnnouncementToDelete(null);
    }
  };

  // function to toggle Deletion Dialog Box
  const confirmDelete = (id: string) => {
    if (!canEdit) {
      toast({
        title: "Permission Denied",
        description: "You need edit permissions to delete announcements.",
        variant: "destructive",
      });
      return;
    }
    setAnnouncementToDelete(id);
    setDeleteDialogOpen(true);
  };

  // function to Format Date
  const formatDate = (date: string | null) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString();
  };

  if (loading) {
    return <div>Loading...</div>;
  }
  */
  // state to store announcements list
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  // state to trigger Dialog Box open and close
  const [editorOpen, setEditorOpen] = useState(false);

  // state to store the selected announcement for editing and deleting
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);

  // state to toggle Dialog Box used for deletion of an announcement
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // state to store the annoucement to be deleted
  const [announcementToDelete, setAnnouncementToDelete] = useState<string | null>(null);

  // hasPermission function to check if allowed
  const { hasPermission } = useModulePermissions();

  // storing if permitted
  const canEdit = hasPermission("company_settings_permissions", "announcements", "edit");

  // QueryClient mostly used for invalidating queries
  const queryClient = useQueryClient();

  const { data: annoucementsData, isLoading, isError, error } = useQuery({

    queryKey: ["read-announcements"],

    queryFn: async () => {
      try {
        const response = await readAnnouncements();


        // toast({
        //   title: "Success",
        //   description: "Annoucements retrieved successfully",
        //   // variant: "destructive",
        // });

      

        setAnnouncements(response.data.data.announcements)
        return response.data.data;
      } catch (error) {
        console.error("Error is ", error);
        toast({
          title: "Failed",
          description: "Unable to retrieved Annoucements",
          variant: "destructive",
        });
      }
    }
  });
  // queryClient.invalidateQueries({ queryKey: ["read-users"] });

  const closeDialogAndReset = () => {

    setEditorOpen(false);
    setSelectedAnnouncement(null);
    setDeleteDialogOpen(false);
    setAnnouncementToDelete(null);

  }

  // function to toggle the Creation Dialog Box
  const handleCreate = () => {
    if (!canEdit) {
      toast({
        title: "Permission Denied",
        description: "You need edit permissions to create announcements.",
        variant: "destructive",
      });
      return;
    }
    setSelectedAnnouncement(null);
    setEditorOpen(true);
  };

  // Function to toggle the Updation Dialog Box
  const handleEdit = (announcement: Announcement) => {
    if (!canEdit) {
      toast({
        title: "Permission Denied",
        description: "You need edit permissions to edit announcements.",
        variant: "destructive",
      });
      return;
    }
    setSelectedAnnouncement(announcement);
    setEditorOpen(true);
  };

  // function to delete the annoucement
  const handleDelete = async () => {
    if (!announcementToDelete) return;

    const payload: any = {
      _id: announcementToDelete

    }

    await deleteAnnouncementMutation.mutateAsync(payload);
  };

  const deleteAnnouncementMutation = useMutation({
    mutationFn: (payload) => deleteAnnouncement(payload),

    onSuccess: (response) => {
      // console.log("response is ", response);
      toast({
        title: "Success",
        description: "Annoucement deleted successfully",
        // variant: "destructive",
      });
      queryClient.invalidateQueries({ queryKey: ["read-announcements"] });
      closeDialogAndReset();
    },

    onError: (error) => {
      // console.log("error is ", error);
      toast({
        title: "Failed",
        description: "Failed to delete Announcement",
        variant: "destructive",
      });
      queryClient.invalidateQueries({ queryKey: ["read-announcements"] });
      closeDialogAndReset();
    }
  });

  // function to toggle Deletion Dialog Box
  const confirmDelete = (id: string) => {
    if (!canEdit) {
      toast({
        title: "Permission Denied",
        description: "You need edit permissions to delete announcements.",
        variant: "destructive",
      });
      return;
    }
    setAnnouncementToDelete(id);
    setDeleteDialogOpen(true);
  };

  // function to Format Date
  const formatDate = (date: string | null) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString();
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Announcements</h2>
          <p className="text-muted-foreground">
            Create and manage announcements that affiliates will see as pop-ups
          </p>
        </div>
        {canEdit && (
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            New Announcement
          </Button>
        )}
      </div>

      {/* Desktop Table View */}
      <Card className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Target</TableHead>
              <TableHead>Start Date</TableHead>
              <TableHead>End Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Show Once</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {announcements.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground">
                  No announcements found. Create your first announcement to get started.
                </TableCell>
              </TableRow>
            ) : (
              announcements.map((announcement) => (
                <TableRow key={announcement._id}>
                  <TableCell className="font-medium">{announcement.title}</TableCell>
                  <TableCell className="capitalize">{announcement.announcementType}</TableCell>
                  <TableCell className="capitalize">
                    {announcement.targetRole === "all" ? "All Users" :
                      announcement.targetRole === "admin" ? "Admins" : "Affiliates"}
                  </TableCell>
                  <TableCell>{formatDate(announcement.startDate)}</TableCell>
                  <TableCell>{formatDate(announcement.endDate)}</TableCell>
                  <TableCell>
                    <Badge variant={announcement.isActive ? "default" : "secondary"}>
                      {announcement.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>{announcement.showOnce ? "Yes" : "No"}</TableCell>
                  <TableCell className="text-right">
                    {canEdit && (
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(announcement)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => confirmDelete(announcement._id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {announcements && announcements.length === 0 ? (
          <Card className="p-6">
            <p className="text-center text-muted-foreground">
              No announcements found. Create your first announcement to get started.
            </p>
          </Card>
        ) : (
          announcements.map((announcement) => (
            <Card key={announcement._id} className="p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium">{announcement.title}</h4>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <Badge variant={announcement.isActive ? "default" : "secondary"} className="text-xs">
                      {announcement.isActive ? "Active" : "Inactive"}
                    </Badge>
                    <Badge variant="outline" className="text-xs capitalize">
                      {announcement.announcementType}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Target:</span>
                  <span className="capitalize">
                    {announcement.targetRole === "all" ? "All Users" :
                      announcement.targetRole === "admin" ? "Admins" : "Affiliates"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Start Date:</span>
                  <span>{formatDate(announcement.startDate)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">End Date:</span>
                  <span>{formatDate(announcement.endDate)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Show Once:</span>
                  <span>{announcement.showOnce ? "Yes" : "No"}</span>
                </div>
              </div>

              <div className="flex gap-2 pt-2 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(announcement)}
                  className="flex-1"
                >
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => confirmDelete(announcement._id)}
                  className="flex-1"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>

      <AnnouncementEditorDialog
        closeDialogAndReset={closeDialogAndReset}
        open={editorOpen}
        onClose={() => {
          setEditorOpen(false);
          setSelectedAnnouncement(null);
        }}
        announcement={selectedAnnouncement}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the announcement.
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
