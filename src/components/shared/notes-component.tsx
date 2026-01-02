import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { format } from "date-fns";
import { Plus, FileText, Edit2, Save, X } from "lucide-react";
import { useUserRole } from "@/hooks/use-user-role";
import { useAuthStore } from "@/store/useAuthStore";
import { createCustomerNote, readCustomerNotes, updateCustomerNotes } from "@/api/customer";
import { createAffiliateNote, readAffiliateNotes, updateAffiliateNotes } from "@/api/affiliate";
import { createOrderNote, readOrderNotes, updateOrderNotes } from "@/api/orders";
import { useDateFormatStore } from "@/store/useDateFormat";
import { getDateFormatString } from "@/utils/resolveDateFormat";

interface Note {
  _id: string;
  text: string;
  type: string;
  metadata?: {
    mergedIds?: string[];
  };
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  profiles?: {
    firstName: string | null;
    lastName: string | null;
  } | null;
}

interface NotesComponentProps {
  entityId: string;
  entityType: "affiliate" | "customer" | "order";
  title?: string;
}

export function NotesComponent({ entityId, entityType, title = "Notes & History" }: NotesComponentProps) {

  // user and token from authStore
  const { user, token, impersonating } = useAuthStore();
  // state to store the note text
  const [noteText, setNoteText] = useState("");
  // state to toggle addition of note
  const [isAdding, setIsAdding] = useState(false);
  // state to store the noteId being editted
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  // state to store the text being editted
  const [editText, setEditText] = useState("");
  // state to store the currentUserId
  const [currentUserId, setCurrentUserId] = useState<string | null>(user._id);
  // queryClient to invalidate queries
  const queryClient = useQueryClient();
  // variable to check if the current user is affiliate
  const { isAffiliate } = useUserRole();

  const { dateFormatRegion, dateFormatVariant } = useDateFormatStore();
  const formatString = getDateFormatString(dateFormatRegion, dateFormatVariant);



  // variable to know which table it is
  const tableName = entityType === "affiliate" ? "affiliateNotes" : entityType === "order" ? "orderNotes" : "customerNotes";
  // variable to store the foreign user relation
  const foreignKey = entityType === "affiliate" ? "affiliateId" : entityType === "order" ? "orderId" : "customerId";

  // query to fetch the user notes
  const { data: notes, isLoading, error } = useQuery({
    queryKey: [`${tableName}`, entityId],
    queryFn: async () => {
      try {


        let response;
        if (foreignKey === 'customerId') {
          response = await readCustomerNotes(entityId);
        }

        if (foreignKey === 'affiliateId') {
          response = await readAffiliateNotes(entityId);
        }

        if (foreignKey === 'orderId') {
          response = await readOrderNotes(entityId);
        }

     

        return response.data.data;

      } catch (error) {
        console.error("Error is ", error);
      }
    },
  });

  // mutation to add notes
  const addNoteMutation = useMutation({
    mutationFn: async (payload: any) => {
      if (foreignKey === 'customerId') {
        return await createCustomerNote(payload);
      }
      if (foreignKey === 'affiliateId') {
        return await createAffiliateNote(payload);
      }
      if (foreignKey === 'orderId') {
        return await createOrderNote(payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`${tableName}`, entityId] });
      setNoteText("");
      setIsAdding(false);
      toast.success("Note added successfully");
    },
    onError: () => {
      toast.error("Failed to add note");
    },
  });

  // function to add notes
  const handleAddNote = () => {
    if (!noteText.trim()) {
      toast.error("Please enter a note");
      return;
    }
    const payload = {
      text: noteText,
    }
    if (entityType === "affiliate") payload.affiliateId = entityId
    if (entityType === "customer") payload.customerId = entityId
    if (entityType === "order") payload.orderId = entityId
    addNoteMutation.mutate(payload);
  };

  // mutation to update notes
  const updateNoteMutation = useMutation({
    mutationFn: async (payload: any) => {
      if (foreignKey === 'customerId') {
        return await updateCustomerNotes(payload);
      }
      if (foreignKey === 'affiliateId') {
        return await updateAffiliateNotes(payload);
      }
      if (foreignKey === 'orderId') {
        return await updateOrderNotes(payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`${tableName}`, entityId] });
      setEditingNoteId(null);
      setEditText("");
      toast.success("Note updated successfully");
    },
    onError: () => {
      toast.error("Failed to update note");
    },
  });

  // function to start update notes
  const handleStartEdit = (note: Note) => {
    setEditingNoteId(note._id);
    setEditText(note.text);
  };

  // function to cancel update notes
  const handleCancelEdit = () => {
    setEditingNoteId(null);
    setEditText("");
  };

  // function to save update notes
  const handleSaveEdit = () => {
    if (!editText.trim()) {
      toast.error("Note cannot be empty");
      return;
    }

    if (editingNoteId) {
      updateNoteMutation.mutate({ noteId: editingNoteId, text: editText });
    }
  };

  if (error) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-destructive">
            Failed to load notes. Please try again.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {title}
          </CardTitle>
          {!isAdding && !editingNoteId && (
            <Button size="sm" onClick={() => setIsAdding(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Add Note
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isAdding && (
          <div className="space-y-2 p-4 border rounded-lg bg-muted/50">
            <Textarea
              placeholder="Enter your note..."
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              rows={3}
            />
            <div className="flex gap-2 justify-end">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setIsAdding(false);
                  setNoteText("");
                }}
              >
                Cancel
              </Button>
              <Button size="sm" onClick={handleAddNote}>
                {addNoteMutation.isLoading ? "Saving..." : "Save Note"}
              </Button>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-4 text-muted-foreground">Loading notes...</div>
        ) : notes && notes?.length > 0 ? (
          <div className="space-y-3">
            {notes?.map((note) => (
              <div key={note._id} className="p-4 border rounded-lg space-y-2">
                {note.noteType === "merge" ? (
                  <div className="flex items-start gap-2">
                    <div className="bg-primary/10 text-primary px-2 py-1 rounded text-xs font-semibold">
                      MERGE
                    </div>
                    <div className="flex-1">
                      <p className="text-sm">{note.text}</p>
                      {note.metadata?.mergedIds && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Merged IDs: {note.metadata.mergedIds.join(", ")}
                        </p>
                      )}
                    </div>
                  </div>
                ) : editingNoteId === note._id ? (
                  <div className="space-y-2">
                    <Textarea
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      rows={3}
                    />
                    <div className="flex gap-2 justify-end">
                      <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                        <X className="h-4 w-4 mr-1" />
                        Cancel
                      </Button>
                      <Button size="sm" onClick={handleSaveEdit}>
                        <Save className="h-4 w-4 mr-1" />
                        {updateNoteMutation.isLoading ? "Saving..." : "Save"}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm flex-1">{note.text}</p>
                    {!isAffiliate && currentUserId === note.createdBy && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleStartEdit(note)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                )}
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>
                    {(note.profiles.firstName || "" + note.profiles.lastName || "") || "Unknown User"}
                  </span>
                  <span>•</span>
                  <span>{format(new Date(note.createdAt), `${formatString} h:mm a`)}</span>
                  {note.updatedAt !== note.createdAt && (
                    <>
                      <span>•</span>
                      <span className="italic">edited</span>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No notes yet. Click "Add Note" to create the first one.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
