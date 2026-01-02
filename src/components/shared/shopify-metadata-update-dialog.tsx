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

interface ShopifyMetadataUpdateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (updateMetadata: boolean) => void;
  oldSiteName: string;
  newSiteName: string;
}

export function ShopifyMetadataUpdateDialog({
  open,
  onOpenChange,
  onConfirm,
  oldSiteName,
  newSiteName,
}: ShopifyMetadataUpdateDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Update Shopify META Data?</AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>
              Do you want to update the META Data in Shopify?
            </p>
            <div className="text-sm font-medium">
              <p>From: <span className="font-semibold">Previous Enrolling Affiliate Site Name: {oldSiteName || "None"}</span></p>
              <p>To: <span className="font-semibold">New Enrolling Affiliate Site Name: {newSiteName || "None"}</span></p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => onConfirm(false)}>
            No
          </AlertDialogCancel>
          <AlertDialogAction onClick={() => onConfirm(true)}>
            Yes
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
