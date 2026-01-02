import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface EnrollingAffiliateChangeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  oldAffiliateName: string;
  oldAffiliateId: string;
  newAffiliateName: string;
  newAffiliateId: string;
  onConfirm: (note?: string) => void;
}

export function EnrollingAffiliateChangeDialog({
  open,
  onOpenChange,
  oldAffiliateName,
  oldAffiliateId,
  newAffiliateName,
  newAffiliateId,
  onConfirm,
}: EnrollingAffiliateChangeDialogProps) {
  const [note, setNote] = useState("");

  const handleConfirm = () => {
    onConfirm(note.trim() || undefined);
    setNote("");
    onOpenChange(false);
  };

  const handleCancel = () => {
    setNote("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Confirm Enrolling Affiliate Change</DialogTitle>
          <DialogDescription>
            You are changing the enrolling affiliate from <strong>{oldAffiliateName} ({oldAffiliateId})</strong> to <strong>{newAffiliateName} ({newAffiliateId})</strong>.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-2">
          <Label htmlFor="change-note">Reason for Change (Optional)</Label>
          <Textarea
            id="change-note"
            placeholder="Enter the reason for this change..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleConfirm}>
            Confirm Change
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
