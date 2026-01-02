import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { format } from "date-fns";
import { Plus, MessageSquare, Edit2, Save, X } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { createOrderNote, readOrderNotes, updateOrderNotes } from "@/api/orders";
import { useDateFormatStore } from "@/store/useDateFormat";
import { getDateFormatString } from "@/utils/resolveDateFormat";

interface OrderNotesProps {
  orderId: string;
}

interface Note {
  _id: string;
  text: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  profiles?: {
    firstName: string;
    lastName: string;
  };
}

export function OrderNotes({ orderId }: OrderNotesProps) {



  const { user, token } = useAuthStore();

  const [currentUserId, setCurrentUserId] = useState<string | null>(user._id || null);

  const queryClient = useQueryClient();

  const [noteText, setNoteText] = useState("");

  const [isAdding, setIsAdding] = useState(false);

  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);

  const [editText, setEditText] = useState("");

  const { dateFormatRegion, dateFormatVariant } = useDateFormatStore();
  const formatString = getDateFormatString(dateFormatRegion, dateFormatVariant);

  // query to fetch the user notes
  const { data: notes, isLoading, error } = useQuery({
    queryKey: [`order-notes`, orderId],
    queryFn: async () => {
      try {


        let response = await readOrderNotes(orderId);

        

        return response?.data.data;

      } catch (error) {
        console.error("Error is ", error);
        return [];
      }
    },
  });

  // mutation to add notes
  const addNoteMutation = useMutation({
    mutationFn: async (payload: any) => {
      return await createOrderNote(payload);
    },
    onSuccess: () => {
      // queryClient.invalidateQueries({ queryKey: [`order`, orderId] });
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
      orderId
    }
    addNoteMutation.mutate(payload);
  };

  // mutation to update notes
  const updateNoteMutation = useMutation({
    mutationFn: async (payload: any) => {
      return await updateOrderNotes(payload);
    },
    onSuccess: () => {
      // queryClient.invalidateQueries({ queryKey: [`order`, orderId] });
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

  return (
    <div className="bg-muted/50 p-6 rounded-lg space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Order Notes
        </h3>

        {!isAdding && (
          <Button size="sm" variant="outline" onClick={() => setIsAdding(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Add Note
          </Button>
        )}

      </div>
      <Separator />

      {isAdding && (
        <div className="space-y-2 p-4 border rounded-lg bg-background">
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
              Save Note
            </Button>
          </div>
        </div>
      )}

      {isLoading && (
        <div className="text-center py-4 text-muted-foreground">Loading notes...</div>
      )}

      {!isLoading && notes && notes?.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No notes yet. Click "Add Note" to create the first one.
        </div>
      )}

      {!isLoading && notes && notes?.length !== 0 && (
        <div className="space-y-3">
          {notes?.map((note: any) => (
            <div key={note._id} className="p-4 border rounded-lg bg-background space-y-2">
              {editingNoteId === note._id ? (
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
                      Save
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm flex-1">{note.text}</p>
                  {currentUserId === note.createdBy && (
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
                  {note.profiles
                    ? `${note.profiles.firstName} ${note.profiles.lastName}`
                    : "Unknown User"}
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
      )}

    </div>
  );

}
