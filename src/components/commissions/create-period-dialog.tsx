import { useState } from "react";
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

interface CreatePeriodDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreatePeriodDialog({ open, onOpenChange }: CreatePeriodDialogProps) {
  const [periodNumber, setPeriodNumber] = useState("");
  const [displayInBackoffice, setDisplayInBackoffice] = useState(true);
  const [status, setStatus] = useState("open");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [notes, setNotes] = useState("");
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("commission_periods").insert({
        period_number: parseInt(periodNumber),
        display_in_backoffice: displayInBackoffice,
        status,
        start_date: startDate,
        end_date: endDate,
        notes: notes || null,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["commission-periods"] });
      toast.success("Period created successfully");
      onOpenChange(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create period");
    },
  });

  const resetForm = () => {
    setPeriodNumber("");
    setDisplayInBackoffice(true);
    setStatus("open");
    setStartDate("");
    setEndDate("");
    setNotes("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!periodNumber || !startDate || !endDate) {
      toast.error("Please fill in all required fields");
      return;
    }
    createMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create Commission Period</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="period_number">Period Number *</Label>
            <Input
              id="period_number"
              type="number"
              value={periodNumber}
              onChange={(e) => setPeriodNumber(e.target.value)}
              required
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="display_in_backoffice"
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
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="not_funded">Not Funded</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_date">Start Date *</Label>
              <Input
                id="start_date"
                type="date"
                value={startDate}
                onChange={(e) => {
                  const value = e.target.value;
                  setStartDate(value);
                  if (value) {
                    const d = new Date(value);
                    d.setDate(d.getDate() + 6);
                    const iso = d.toISOString().slice(0, 10);
                    setEndDate(iso);
                  } else {
                    setEndDate("");
                  }
                }}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="end_date">End Date *</Label>
              <Input
                id="end_date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
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
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Creating..." : "Create Period"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
