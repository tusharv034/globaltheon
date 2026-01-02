import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { NotesComponent } from "./notes-component";
import { User, ShoppingCart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface NotesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entityId: string;
  entityType: "customer" | "affiliate" | "order";
  entityName: string;
  onViewEntity?: () => void;
  onViewOrders?: () => void;
}

export function NotesDialog({
  open,
  onOpenChange,
  entityId,
  entityType,
  entityName,
  onViewEntity,
  onViewOrders
}: NotesDialogProps) {

  const { toast } = useToast();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between p-2">
            <span>Notes - {entityName}</span>
            <div className="flex gap-2">
              {onViewEntity && entityType !== "order" && (
                <Button variant="outline" size="sm" onClick={onViewEntity}>
                  <User className="h-4 w-4 mr-2" />
                  View {entityType === "customer" ? "Customer" : "Affiliate"}
                </Button>
              )}
              {onViewOrders && entityType !== "order" && (
                <Button variant="outline" size="sm"
                  onClick={onViewOrders}
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  View Orders
                </Button>
              )}
            </div>
          </DialogTitle>
        </DialogHeader>
        <NotesComponent entityId={entityId} entityType={entityType} />
      </DialogContent>
    </Dialog>
  );
}
