import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { createAnnouncement, updateAnnouncement } from "@/api/announcement.ts";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface Announcement {
  _id: string;
  title: string;
  content: string;
  announcementType: string;
  startDate: string | null;
  endDate: string | null;
  showOnce: boolean;
  requiresCompletion: boolean;
  isActive: boolean;
  targetRole: string;
}


interface AnnouncementEditorDialogProps {
  closeDialogAndReset: () => void,
  open: boolean;
  onClose: () => void;
  announcement: Announcement | null;
}

export function AnnouncementEditorDialog({
  closeDialogAndReset,
  open,
  onClose,
  announcement,
}: AnnouncementEditorDialogProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [announcementType, setAnnouncementType] = useState("general");
  const [targetRole, setTargetRole] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [showOnce, setShowOnce] = useState(false);
  const [requiresCompletion, setRequiresCompletion] = useState(false);
  const [isActive, setIsActive] = useState(true);

  const [loading, setLoading] = useState(false);

  // useEffect to add the values of annoucement being edited in the form
  useEffect(() => {
    if (announcement) {
      setTitle(announcement.title);
      setContent(announcement.content);
      setAnnouncementType(announcement.announcementType);
      setTargetRole(announcement.targetRole || "all");
      setStartDate(announcement.startDate ? announcement.startDate.split("T")[0] : "");
      setEndDate(announcement.endDate ? announcement.endDate.split("T")[0] : "");
      setShowOnce(announcement.showOnce);
      setRequiresCompletion(announcement.requiresCompletion);
      setIsActive(announcement.isActive);
    } else {
      resetForm();
    }
  }, [announcement, open]);

  const resetForm = () => {
    setTitle("");
    setContent("");
    setAnnouncementType("general");
    setTargetRole("all");
    setStartDate("");
    setEndDate("");
    setShowOnce(false);
    setRequiresCompletion(false);
    setIsActive(true);
  };

  const queryClient = useQueryClient();

  const createAnnouncementMutation = useMutation({
    mutationFn: async (payload: any) => await createAnnouncement(payload),

    onSuccess: (response) => {
      // console.log("response is ", response);
      queryClient.invalidateQueries({ queryKey: ["read-announcements"] });
      queryClient.invalidateQueries({queryKey: ["active-announcements"] });
      closeDialogAndReset();
    },

    onError: (error) => {

      // console.log("error is ", error);
      queryClient.invalidateQueries({ queryKey: ["read-announcements"] });
      queryClient.invalidateQueries({queryKey: ["active-announcements"] });
      closeDialogAndReset();
    }
  });

  const updateAnnouncementMutation = useMutation({
    mutationFn: async (payload: any) => await updateAnnouncement(payload),

    onSuccess: (response) => {
      // console.log("response is ", response);
      queryClient.invalidateQueries({ queryKey: ["read-announcements"] });
      queryClient.invalidateQueries({queryKey: ["active-announcements"] });
      closeDialogAndReset();
    },

    onError: (error) => {
      // console.log("response is ", error);
      queryClient.invalidateQueries({ queryKey: ["read-announcements"] });
      queryClient.invalidateQueries({queryKey: ["active-announcements"] });
      closeDialogAndReset();
    },
  });

  const handleSave = async () => {

    if (announcement) {

      let hasChanges = false;

      const normalizeDate = (date: string | null | undefined): string => {
        if (!date) return "";
        // Remove time and timezone, keep only YYYY-MM-DD
        return date.split("T")[0].trim();
      };

      // detect the changed values
      if (announcement.title !== title) hasChanges = true;
      if (announcement.content !== content) hasChanges = true;
      if (announcement.announcementType !== announcementType) hasChanges = true;
      if (announcement.targetRole !== targetRole) hasChanges = true;
      if (normalizeDate(announcement.startDate) !== normalizeDate(startDate)) hasChanges = true;
      if (normalizeDate(announcement.endDate) !== normalizeDate(endDate)) hasChanges = true;
      if (announcement.showOnce !== showOnce) hasChanges = true;
      if (announcement.requiresCompletion !== requiresCompletion) hasChanges = true;
      if (announcement.isActive !== isActive) hasChanges = true;

      // return if no changes
      if (!hasChanges) {

        toast({
          title: "No changes",
          description: "No Changes to update"
        });

        return;
      }

      // create a payload of changed values
      const payload: any = {
        ...(announcement.title.trim() !== title.trim() && { title }),
        ...(announcement.content.trim() !== content.trim() && { content }),
        ...(announcement.announcementType.trim() !== announcementType.trim() && { announcementType }),
        ...(announcement.targetRole.trim() !== targetRole.trim() && { targetRole }),
        ...(normalizeDate(announcement.startDate) !== normalizeDate(startDate) && { startDate: normalizeDate(startDate) }),
        ...(normalizeDate(announcement.endDate) !== normalizeDate(endDate) && { endDate: normalizeDate(endDate) }),
        ...(announcement.showOnce !== showOnce && { showOnce }),
        ...(announcement.requiresCompletion !== requiresCompletion && { requiresCompletion }),
        ...(announcement.isActive !== isActive && { isActive }),
      }

      payload._id = announcement._id;

      // call update Mutation
      await updateAnnouncementMutation.mutateAsync(payload);

      return;
    }

    const payload: any = {
      title,
      content,
      announcementType,
      targetRole,
      startDate,
      endDate,
      showOnce,
      requiresCompletion,
      isActive,
    };

    if(!payload.title.trim() || !payload.content.trim() || !payload.announcementType || !payload.targetRole){
      toast({
        title: "Invalid Details",
        description: "Please fill all the required values"
      });
      return;
    }

    await createAnnouncementMutation.mutateAsync(payload);
  };

  const modules = {
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ["bold", "italic", "underline", "strike"],
      [{ list: "ordered" }, { list: "bullet" }],
      [{ color: [] }, { background: [] }],
      ["link"],
      ["clean"],
    ],
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {announcement ? "Edit Announcement" : "Create New Announcement"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter announcement title"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Type</Label>
            <Select value={announcementType} onValueChange={setAnnouncementType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="general">General</SelectItem>
                <SelectItem value="welcome">Welcome</SelectItem>
                <SelectItem value="social_media">Social Media Follow</SelectItem>
                <SelectItem value="promotion">Promotion</SelectItem>
                <SelectItem value="update">Update</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="target-role">Target Audience</Label>
            <Select value={targetRole} onValueChange={setTargetRole}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                <SelectItem value="admin">Admins Only</SelectItem>
                <SelectItem value="affiliate">Affiliates Only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Content</Label>
            <ReactQuill
              theme="snow"
              value={content}
              onChange={setContent}
              modules={modules}
              className="bg-background"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start-date">Start Date (Optional)</Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="end-date">End Date (Optional)</Label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="show-once">Show Only Once</Label>
              <p className="text-sm text-muted-foreground">
                Announcement will not show again after being dismissed
              </p>
            </div>
            <Switch
              id="show-once"
              checked={showOnce}
              onCheckedChange={setShowOnce}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="requires-completion">Requires Completion</Label>
              <p className="text-sm text-muted-foreground">
                User must check "Completed" box to dismiss this announcement
              </p>
            </div>
            <Switch
              id="requires-completion"
              checked={requiresCompletion}
              onCheckedChange={setRequiresCompletion}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="is-active">Active</Label>
              <p className="text-sm text-muted-foreground">
                Only active announcements will be shown to users
              </p>
            </div>
            <Switch
              id="is-active"
              checked={isActive}
              onCheckedChange={setIsActive}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={createAnnouncementMutation.isPending || updateAnnouncementMutation.isPending}>
            {createAnnouncementMutation.isPending || updateAnnouncementMutation.isPending ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
