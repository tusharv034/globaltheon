import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { X } from "lucide-react";
import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/store/useAuthStore";
import { readActiveAnnouncements, createUserAnnouncement, readUserAnnouncements } from "@/api/announcement";

interface Announcement {
  _id: string;
  title: string;
  content: string;
  announcementType: string;
  showOnce: boolean;
  requiresCompletion: boolean;
  targetRole: string;
  startDate: Date;
  endDate: Date;
}

export function AnnouncementPopup() {

  // state to store which announcement is being iterated
  const [currentIndex, setCurrentIndex] = useState(0);

  // state to store
  const [completed, setCompleted] = useState(false);

  // state to store if is loading
  const [loading, setLoading] = useState(true);

  // state to toggle the Announcement opening and closing
  const [isOpen, setIsOpen] = useState(true);

  // state to store the current user and there token
  const { user, token } = useAuthStore()

  // Query Client used to invalidate queries
  const queryClient = useQueryClient();

  // query to fetch all the active announcements and the user announcements
  const [announcementsQuery, userSeenQuery] = useQueries({
    queries: [
      {
        queryKey: ["active-announcements"],
        queryFn: readActiveAnnouncements,
        // staleTime: 5 * 60 * 1000,
      },
      {
        queryKey: ["user-announcements"],
        queryFn: () => readUserAnnouncements(),
        enabled: !!user?._id,
        staleTime: 10 * 60 * 1000,
      },
    ],
  });

  const isError = announcementsQuery.isError || userSeenQuery.isError;

  // Filter announcements client-side (same logic as before)
  const activeAnnouncements = useMemo(() => {

    if (!announcementsQuery.data || !userSeenQuery.data || !user) return [];

    const all = announcementsQuery.data.data.data;

    // console.log("all active announcements are ", all.length);

    const seen = new Set(userSeenQuery.data.data.data.map((x: any) => x.announcementId));

    // console.log("seen is ", seen);

    const now = new Date();
    const isAdmin = ["admin", "super_admin"].includes(user.role);

    console.log("isAdmin ", isAdmin);

    const result = all.filter((ann: Announcement) => {
      // console.log("ann is ", ann);
      // 1. Date range
      const start = ann.startDate ? new Date(ann.startDate) : null;
      const end = ann.endDate ? new Date(ann.endDate) : null;
      if (start && now < start) return false;
      if (end && now > end) return false;

      // console.log("within date");

      // 2. showOnce logic
      seen.has(ann._id);
      if (ann.showOnce && seen.has(ann._id)) return false;

      console.log("hasn't been shown", seen.has(ann._id), "and ", ann.showOnce);

      // 3–5. Role targeting
      const target = ann.targetRole || "all";

      // if (target === "all") {
      //   console.log("for all");
      //   return true
      // };
      if (target === "admin" && !isAdmin) {
        return false
      };
      if (target === "affiliate" && isAdmin) {
        return false
      };

      // console.log("including");

      return true


      // Custom role match
      // return user.role === target;
    });

    // console.log("result is ", result.length);

    return result;
  }, [
    announcementsQuery.data,
    userSeenQuery.data,
    user,
  ]);

  // Reset index when announcements change
  useEffect(() => {
    setCurrentIndex(0);
    setCompleted(false);
  }, [activeAnnouncements.length]);



  // Mutation to mark announcement as seen/completed
  const markSeenMutation = useMutation({
    mutationFn: async (payload: any) => await createUserAnnouncement(payload),
    onSuccess: () => {

      // ONLY invalidate when we're dismissing the VERY LAST announcement
      const isLast = currentIndex === activeAnnouncements.length - 1;
      // if (isLast) queryClient.invalidateQueries({
      //   queryKey: ["user-announcements"]
      // });
    },
  });

  const handleDismiss = async (markAsCompleted = false) => {
    if (activeAnnouncements.length === 0 || !user) return;

    console.log("mark as completed is ", markAsCompleted);

    const current = activeAnnouncements[currentIndex];

    // if(current.showOnce && current.requiresCompletion && !markAsCompleted) return;
    // if(!current.showOnce && !current.requiresCompletion) return;
    // if(!current.showOnce && current.requiresCompletion && !markAsCompleted) return;

    // Record in backend
    if ((current.showOnce && current.requiresCompletion && markAsCompleted) || (current.showOnce && !current.requiresCompletion) || (!current.showOnce && current.requiresCompletion && markAsCompleted)) {

      console.log("creating userAnnouncement");
      await markSeenMutation.mutateAsync({
        announcementId: current._id,
        completed: markAsCompleted,
        dismissedAt: new Date()
      });
    }
    /* 
    if ((current.requiresCompletion && markAsCompleted) || !current.requiresCompletion) {
      
      await markSeenMutation.mutateAsync({
        announcementId: current._id,
        completed: markAsCompleted,
        dismissedAt: new Date()
      });

    }
    */

    // Move to next
    if (currentIndex !== activeAnnouncements.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setCompleted(false);
    } else {
      // This is LAST → close the dialog
      setIsOpen(false);
    }
  };

  useEffect(() => {
    if (activeAnnouncements.length > 0) {
      setIsOpen(true);
      setCurrentIndex(0);
      setCompleted(false);
    }
  }, [activeAnnouncements.length]);

  // if (isLoading || announcementsQuery.data.data.data.length === 0) return null;
  // Don't render if loading or no announcements
  if (announcementsQuery.isLoading || userSeenQuery.isLoading || isError || activeAnnouncements.length === 0) {
    return null;
  }
  //  return null;

  const currentAnnouncement = activeAnnouncements[currentIndex];

  if (!currentAnnouncement) {
    return null; // Safety net — prevents crash
  }

  return (
    <Dialog open={isOpen && activeAnnouncements.length > 0} onOpenChange={() => handleDismiss(completed)}>
      <DialogContent className="w-[calc(100vw-24px)] md:max-w-2xl h-full max-h-96 rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl">{currentAnnouncement?.title}</DialogTitle>
        </DialogHeader>

        {currentAnnouncement.content && (<div
          className="prose prose-sm max-w-none py-4 overflow-y-auto"
          dangerouslySetInnerHTML={{ __html: currentAnnouncement.content }}
        />)}

        {currentAnnouncement.requiresCompletion && (
          <div className="flex items-center space-x-2 py-4 border-t">
            <Checkbox
              id="completed"
              checked={completed}
              onCheckedChange={(checked) => setCompleted(checked === true)}
            />
            <Label
              htmlFor="completed"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              I have completed this action
            </Label>
          </div>
        )}

        <DialogFooter>
          <div className="flex justify-between w-full items-center">
            <span className="text-sm text-muted-foreground">
              {currentIndex + 1} of {activeAnnouncements.length}
            </span>
            <Button onClick={() => handleDismiss(completed)}>
              {currentIndex < activeAnnouncements.length - 1 ? "Next" : "Close"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
