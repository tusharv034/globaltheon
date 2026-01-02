import { User, Upload, Trash2, Palette, Loader2 } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { useState } from "react";
import { ImageCropDialog } from "./image-crop-dialog";
import { AvatarCustomizationDialog } from "./avatar-customization-dialog";
import { useAuthStore } from "@/store/useAuthStore";
import { useMutation } from "@tanstack/react-query";
import { removeProfilePicture, uploadProfilePicture } from "@/api/auth";
import { useRef } from "react";
import config from "@/config/env";
import { useDateFormatStore } from "@/store/useDateFormat";
import { getDateFormatString } from "@/utils/resolveDateFormat";

interface ProfileHeaderProps {
  profile: {
    firstName?: string;
    lastName?: string;
    profilePictureUrl?: string;
    avatarHexColor?: string;
    avatarInitials?: string;
    createdAt: string;
  };
  onAvatarUpdate: (url: string) => void;
}

export const ProfileHeader = ({ profile, onAvatarUpdate }: ProfileHeaderProps) => {

  // toast
  const { toast } = useToast();

  // state trigger to open Dialog Box for Image Crop
  const [cropDialogOpen, setCropDialogOpen] = useState(false);

  // state to store selected image
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [customizeDialogOpen, setCustomizeDialogOpen] = useState(false);
  const [avatarColor, setAvatarColor] = useState(profile.avatarHexColor || '#3b82f6');
  const [avatarInitials, setAvatarInitials] = useState(profile.avatarInitials || '');

  const { dateFormatRegion, dateFormatVariant } = useDateFormatStore();
  const formatString = getDateFormatString(dateFormatRegion, dateFormatVariant);

  const [isLoading, setIsLoading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const { user, token, _version } = useAuthStore();

  // function to handle new file upload for Profile Picture
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    // Always reset the input value so future selections (even same file) trigger change
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB before cropping)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 5MB",
        variant: "destructive",
      });
      return;
    }

    if (selectedImage) {
      URL.revokeObjectURL(selectedImage);
    }

    // Create preview URL and open crop dialog
    const imageUrl = URL.createObjectURL(file);
    setSelectedImage(imageUrl);
    setCropDialogOpen(true);
  };

  // function to handler apply crop button: uploading image as profile picture
  const handleCropComplete2 = async (croppedBlob: Blob) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      const timestamp = Date.now();
      const filePath = `${user.id}/avatar-${timestamp}.jpg`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, croppedBlob, {
          upsert: true,
          contentType: 'image/jpeg'
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      onAvatarUpdate(publicUrl);
      toast({
        title: "Avatar updated",
        description: "Your profile photo has been updated successfully",
      });

      // Clean up
      if (selectedImage) {
        URL.revokeObjectURL(selectedImage);
        setSelectedImage(null);
      }
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload avatar. Please try again.",
        variant: "destructive",
      });
    }
  };

  const updateProfilePictureMutation = useMutation({
    mutationFn: (id: string, payload: any): any => uploadProfilePicture(id, payload),
    // mutationFn: () => { console.log("called") },

    onSuccess: (response: any) => {
      // console.log("response ", response);
    },

    onError: (error) => {
      // console.log("Error is ", error);
    }

  });

  const { updateAuthUser } = useAuthStore();

  const handleCropComplete = async (croppedBlob: Blob) => {
    setIsLoading(true);

    try {

      if (!croppedBlob) return;

      // console.log("cropped blob is ", croppedBlob);


      const formData = new FormData();
      // This key MUST match multer.single('profilePicture')
      formData.append('profilePicture', croppedBlob, 'avatar.jpg');

      // THIS WILL WORK 100% — bypasses everything
      const response = await fetch(`${import.meta.env.VITE_API_URL}protected/auth/profile/profile-picture`, {
        method: "PATCH",
        credentials: "include",
        body: formData,
      });

      const incomming = await response.json()

      // console.log("response is ", incomming.data);

      // await updateProfilePictureMutation.mutateAsync(user._id, formData);
      if (incomming.data !== undefined) {
        const stateUrl = `${config.cloudFrontUrl}profile-pictures${incomming.data.split("/profile-pictures")[1]}`;

        // console.log("stateUrl is ", stateUrl);
        updateAuthUser({ profilePictureUrl: stateUrl });
        onAvatarUpdate(stateUrl);
      }

      if (selectedImage) {
        URL.revokeObjectURL(selectedImage);
        setSelectedImage(null);
      }
      setCropDialogOpen(false);

      setIsLoading(false);

      return;

    } catch (error) {
      setIsLoading(false);
      console.error('Error uploading avatar:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload avatar. Please try again.",
        variant: "destructive",
      });
    }
  };

  // handle closing of cropping image: essenially not continuing the upload of new profile picture
  const handleDialogClose = () => {
    if (selectedImage) {
      URL.revokeObjectURL(selectedImage);
      setSelectedImage(null);
    }
    setCropDialogOpen(false);
  };

  const removeProfilePictureMutation = useMutation({
    mutationFn: () => removeProfilePicture(),

    onSuccess: (response) => {
      // console.log("response is ", response);

      updateAuthUser({ profilePictureUrl: null });

      onAvatarUpdate(null);
    },

    onError: (error) => {
      // console.log("error is ", error);
    }
  })

  // removing profile picture
  const handleDeleteAvatar = async () => {

    if (!user.profilePictureUrl || user.profilePictureUrl.trim() === "") return;

    // console.log("user.profilePictureUrl is ", user.profilePictureUrl);

    await removeProfilePictureMutation.mutateAsync();
  };

  const handleAvatarCustomizationUpdate = (color: string, initials: string) => {
    setAvatarColor(color);
    setAvatarInitials(initials);
  };

  const getInitials = () => {
    if (avatarInitials) return avatarInitials;
    const first = profile.firstName?.[0] || '';
    const last = profile.lastName?.[0] || '';
    return (first + last).toUpperCase() || 'U';
  };

  const fullName = [profile.firstName, profile.lastName]
    .filter(Boolean)
    .join(' ') || 'User';

  return (
    <>
      {() => console.log("profile", profile.profilePictureUrl)}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center gap-6">
          <Avatar className="h-24 w-24">


            <AvatarImage src={user.profilePictureUrl} alt={fullName} key={user.profilePictureUrl + _version} />
            <AvatarFallback
              className="text-2xl font-bold text-white"
              style={{ backgroundColor: avatarColor }}
            >
              {getInitials()}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1">
            <h2 className="text-2xl font-bold">{fullName}</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Member since {format(new Date(profile.createdAt), formatString)}
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              <input
                ref={fileInputRef}
                type="file"
                id="avatar-upload"
                className="hidden"
                accept="image/*"
                onChange={handleFileSelect}
              />
              <label htmlFor="avatar-upload">
                <Button variant="outline" size="sm" className="cursor-pointer" asChild disabled={isLoading}>
                  <span>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Photo
                  </span>
                </Button>
              </label>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCustomizeDialogOpen(true)}
              >
                <Palette className="mr-2 h-4 w-4" />
                Customize Avatar
              </Button>
              {profile.profilePictureUrl && (
                // {true && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDeleteAvatar}
                  className="text-destructive hover:text-destructive"
                  disabled={isLoading || removeProfilePictureMutation.isPending}
                >
                  {removeProfilePictureMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Photo
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {selectedImage && (
        <ImageCropDialog
          open={cropDialogOpen}
          onClose={handleDialogClose}
          imageUrl={selectedImage}
          onCropComplete={handleCropComplete}
          loading={isLoading}
        />
      )}

      <AvatarCustomizationDialog
        open={customizeDialogOpen}
        onClose={() => setCustomizeDialogOpen(false)}
        currentColor={avatarColor}
        currentInitials={avatarInitials}
        onUpdate={handleAvatarCustomizationUpdate}
      />
    </>
  );
};
