import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { UpdateUserPayload } from "@/types";
import { updateUser } from "@/api/auth";
import { useAuthStore } from "@/store/useAuthStore";

interface AvatarCustomizationDialogProps {
  open: boolean;
  onClose: () => void;
  currentColor: string;
  currentInitials: string;
  onUpdate: (color: string, initials: string) => void;
}

const PRESET_COLORS = [
  "#3b82f6", // blue
  "#ef4444", // red
  "#10b981", // green
  "#f59e0b", // amber
  "#8b5cf6", // purple
  "#ec4899", // pink
  "#06b6d4", // cyan
  "#f97316", // orange
];

export const AvatarCustomizationDialog = ({
  open,
  onClose,
  currentColor,
  currentInitials,
  onUpdate,
}: AvatarCustomizationDialogProps) => {

  const { updateAuthUser } = useAuthStore();

  const { toast } = useToast();

  const [color, setColor] = useState(currentColor);

  const [initials, setInitials] = useState(currentInitials);

  // Mutation Below
  const handleSaveMutation = useMutation({

    mutationFn: (variables: UpdateUserPayload) => updateUser(variables),

    onSuccess: (response) => {
      // console.log("response is ", response);

      const data = response.data.data;

      updateAuthUser({
        ...("avatarHexColor" in data && data.avatarHexColor !== undefined
          ? { avatarHexColor: data.avatarHexColor }
          : {}),
        ...("avatarInitials" in data && data.avatarInitials !== undefined
          ? { avatarInitials: data.avatarInitials }
          : {}),
      });
      onUpdate(color, initials.toUpperCase());
      onClose();
    },

    onError: (error: any) => {
      // console.log("Error is ", error);
      toast({
        title: "Couldn't Update Avatar",
        description: "Something went wrong",
      });
    },

  });

  // function to handle OnClick save
  const handleSave = async () => {

    // console.log("handleSave hit", initials, color);

    const avatarInitials = initials.trim();
    const avatarHexColor = color.trim();

    let hasChanges = false;

    if(avatarInitials !== currentInitials) hasChanges = true;
    if(avatarHexColor !== currentColor) hasChanges = true;

    if(!hasChanges) {
      toast({
        title: "No Changes",
        description: "Please provide changes before updating"
      });
      return;
    }

    const updatePayload = {
      ...(avatarInitials.trim() !== currentInitials.trim() && { avatarInitials }),
      ...(avatarHexColor.trim() !== currentColor.trim() && { avatarHexColor }),
    }

    // console.log("update Payload is ", updatePayload);

    await handleSaveMutation.mutateAsync(updatePayload)
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Customize Avatar</DialogTitle>
          <DialogDescription>
            Choose a color and set custom initials for your avatar
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Initials Input */}
          <div className="space-y-2">
            <Label htmlFor="initials">Initials (up to 4 characters)</Label>
            <Input
              id="initials"
              name="avatarInitials"
              value={initials}
              onChange={(e) => setInitials(e.target.value.slice(0, 4).toUpperCase())}
              placeholder="e.g., JD or ABCD"
              maxLength={4}
              className="text-center text-lg font-semibold"
            />
          </div>

          {/* Color Picker */}
          <div className="space-y-2">
            <Label>Avatar Color</Label>
            <div className="grid grid-cols-4 gap-3">
              {PRESET_COLORS.map((presetColor) => (
                <button
                  key={presetColor}
                  onClick={() => setColor(presetColor)}
                  className={`h-12 w-12 rounded-full transition-all hover:scale-110 ${color === presetColor ? 'ring-2 ring-offset-2 ring-primary' : ''
                    }`}
                  style={{ backgroundColor: presetColor }}
                  aria-label={`Select color ${presetColor}`}
                />
              ))}
            </div>

            <div className="flex items-center gap-2 pt-2">
              <Label htmlFor="custom-color">Custom:</Label>
              <input
                id="custom-color"
                name="avatarHex"
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="h-10 w-20 rounded border border-input cursor-pointer"
              />
              <span className="text-sm text-muted-foreground">{color}</span>
            </div>
          </div>

          {/* Preview */}
          <div className="flex flex-col items-center gap-2">
            <Label>Preview</Label>
            <div
              className="h-24 w-24 rounded-full flex items-center justify-center text-white text-2xl font-semibold"
              style={{ backgroundColor: color }}
            >
              {initials || '?'}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
