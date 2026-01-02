import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useToast } from "@/hooks/use-toast";
import { updateCommissionPeriodStatus } from "@/api/commission";

interface CommissionPeriod {
  _id: string;
  periodNumber: number;
  displayInBackoffice: boolean;
  status: string;
  startDate: string;
  endDate: string;
  totalAffiliateCommissions: number;
  totalAdjustments: number;
  totalCommissions: number;
  notes: string | null;
}

interface EditPeriodDialogProps {
  period: CommissionPeriod;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditPeriodDialog({ period, open, onOpenChange }: EditPeriodDialogProps) {

  const formatDateToMMDDYY = (date) => {
    if (!date) return "";
    const [year, month, day] = date.split("-"); // Assuming the date is in YYYY-MM-DD format
    return `${month}-${day}-${year.slice(-2)}`; // Convert to MM-DD-YY
  };

  // state to store the period Number of the period
  const [periodNumber, setPeriodNumber] = useState(period.periodNumber.toString());

  // state to store whether the period is to be displayed to affiliates or not
  const [displayInBackoffice, setDisplayInBackoffice] = useState(period.displayInBackoffice);

  // state to store the status of the period being editted
  const [status, setStatus] = useState(period.status);

  // state to store the start Date of the period being editted
  const [startDate, setStartDate] = useState(formatDateToMMDDYY(period.startDate.split("T")[0]));

  // state to store the endDate of the period being editted
  const [endDate, setEndDate] = useState(formatDateToMMDDYY(period.endDate.split("T")[0]));

  // state to store the notes for the period 
  const [notes, setNotes] = useState(period.notes || "");

  // query client utilized for invalidating the current queries
  const queryClient = useQueryClient();

  // toast for showing on screen alerts
  const { toast } = useToast();

  // useEffect to update the values everytime the period changes
  useEffect(() => {
    setPeriodNumber(period.periodNumber.toString());
    setDisplayInBackoffice(period.displayInBackoffice);
    setStatus(period.status);
    setStartDate(formatDateToMMDDYY(period.startDate.split("T")[0]));
    setEndDate(formatDateToMMDDYY(period.endDate.split("T")[0]));
    setNotes(period.notes || "");
  }, [period]);

  // updateMutation to update the commission period
  const updateMutation = useMutation({
    mutationFn: async (payload: any) => await updateCommissionPeriodStatus(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["commission-periods"] });
      // toast.success("Period updated successfully");
  
      onOpenChange(false);
    },
    onError: (error: any) => {
      console.log("Error is ", error);
      // toast.error(error.message || "Failed to update period");
    },
  });

  // handleSubmit function to catch the submit button click event
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let changes = false;

    const payload = {
      periodId: period._id
    }

    if (period?.displayInBackoffice !== displayInBackoffice) {
      payload.displayInBackoffice = displayInBackoffice;
      changes = true;
    }
    if (period?.status !== status) {
      payload.status = status;
      changes = true;
    }

    if (period?.notes || "" !== notes) {
      payload.notes = notes;
      changes = true;
    }

    if (!changes) {
      toast({
        title: "Unable to update",
        description: "Please provide some changes to update the Period"
      });
      return;
    }

    if(period.status !== status && period.notes === notes){
      toast({
        title: "Unable to update",
        description: "Please provide some notes arount status update"
      });
      return;
    }

    await updateMutation.mutateAsync(payload);
  };



  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Commission Period</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="periodNumber">Period Number *</Label>
            <Input
              id="period_number"
              type="number"
              value={periodNumber}
              onChange={(e) => setPeriodNumber(e.target.value)}
              required
              disabled={true}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="displayInBackoffice"
              checked={displayInBackoffice}
              onCheckedChange={setDisplayInBackoffice}
            />
            <Label htmlFor="display_in_backoffice">Display in Backoffice</Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">Open</SelectItem>
                <SelectItem value="1">Closed</SelectItem>
                <SelectItem value="2">Paid</SelectItem>
                <SelectItem value="3">Not Funded</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date *</Label>
              <Input
                id="startDate"
                type="text"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
                disabled={true}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate">End Date *</Label>
              <Input
                id="endDate"
                type="text"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
                disabled={true}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Updating..." : "Update Period"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
