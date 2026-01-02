import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";

interface CommissionLoadingDialogProps {
  open: boolean;
}

export function CommissionLoadingDialog({ open }: CommissionLoadingDialogProps) {
  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md [&>button]:hidden">
        <div className="flex flex-col items-center justify-center py-8 space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <div className="text-center space-y-2">
            <h3 className="text-lg font-semibold">Analyzing Commission Impact</h3>
            <p className="text-sm text-muted-foreground">
              Retrieving commissionable orders, please wait...
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
