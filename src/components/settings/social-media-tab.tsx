// import { useEffect, useState } from "react";
// import { useForm } from "react-hook-form";
// import { zodResolver } from "@hookform/resolvers/zod";
// import * as z from "zod";
// import { supabase } from "@/integrations/supabase/client";
// import { toast } from "sonner";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
// import { Facebook, Twitter, Instagram, Youtube, Loader2 } from "lucide-react";
// import { useModulePermissions } from "@/hooks/use-module-permissions";

// const socialMediaSchema = z.object({
//   facebook_url: z.string().url("Must be a valid URL").optional().or(z.literal("")),
//   x_url: z.string().url("Must be a valid URL").optional().or(z.literal("")),
//   instagram_url: z.string().url("Must be a valid URL").optional().or(z.literal("")),
//   youtube_url: z.string().url("Must be a valid URL").optional().or(z.literal("")),
// });

// type SocialMediaFormData = z.infer<typeof socialMediaSchema>;

// export function SocialMediaTab() {
//   const [loading, setLoading] = useState(false);
//   const [socialMediaId, setSocialMediaId] = useState<string | null>(null);
//   const { hasPermission } = useModulePermissions();
//   const canEdit = hasPermission("company_settings_social_media", "edit");

//   const {
//     register,
//     handleSubmit,
//     reset,
//     formState: { errors },
//   } = useForm<SocialMediaFormData>({
//     resolver: zodResolver(socialMediaSchema),
//     defaultValues: {
//       facebook_url: "",
//       x_url: "",
//       instagram_url: "",
//       youtube_url: "",
//     },
//   });

//   useEffect(() => {
//     loadSocialMediaLinks();
//   }, []);

//   const loadSocialMediaLinks = async () => {
//     try {
//       const { data, error } = await supabase
//         .from("social_media_links")
//         .select("*")
//         .maybeSingle();

//       if (error) throw error;

//       if (data) {
//         setSocialMediaId(data.id);
//         reset({
//           facebook_url: data.facebook_url || "",
//           x_url: data.x_url || "",
//           instagram_url: data.instagram_url || "",
//           youtube_url: data.youtube_url || "",
//         });
//       }
//     } catch (error) {
//       console.error("Error loading social media links:", error);
//       toast.error("Failed to load social media links");
//     }
//   };

//   const onSubmit = async (data: SocialMediaFormData) => {
//     if (!canEdit) {
//       toast.error("You need edit permissions to save social media settings");
//       return;
//     }

//     try {
//       setLoading(true);

//       if (socialMediaId) {
//         const { error } = await supabase
//           .from("social_media_links")
//           .update(data)
//           .eq("id", socialMediaId);

//         if (error) throw error;
//         toast.success("Social media links updated successfully");
//       } else {
//         const { data: newData, error } = await supabase
//           .from("social_media_links")
//           .insert([data])
//           .select()
//           .single();

//         if (error) throw error;
//         setSocialMediaId(newData.id);
//         toast.success("Social media links saved successfully");
//       }
//     } catch (error) {
//       console.error("Error saving social media links:", error);
//       toast.error("Failed to save social media links");
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <Card>
//       <CardHeader>
//         <CardTitle>Social Media Links</CardTitle>
//         <CardDescription>
//           Add your company's social media profile URLs
//         </CardDescription>
//       </CardHeader>
//       <CardContent>
//         <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
//           <div className="space-y-4">
//             <div className="space-y-2">
//               <Label htmlFor="facebook_url" className="flex items-center gap-2">
//                 <Facebook className="h-4 w-4" />
//                 Facebook
//               </Label>
//               <Input
//                 id="facebook_url"
//                 placeholder="https://facebook.com/yourcompany"
//                 {...register("facebook_url")}
//                 disabled={!canEdit}
//               />
//               {errors.facebook_url && (
//                 <p className="text-sm text-destructive">{errors.facebook_url.message}</p>
//               )}
//             </div>

//             <div className="space-y-2">
//               <Label htmlFor="x_url" className="flex items-center gap-2">
//                 <Twitter className="h-4 w-4" />
//                 X (Twitter)
//               </Label>
//               <Input
//                 id="x_url"
//                 placeholder="https://x.com/yourcompany"
//                 {...register("x_url")}
//                 disabled={!canEdit}
//               />
//               {errors.x_url && (
//                 <p className="text-sm text-destructive">{errors.x_url.message}</p>
//               )}
//             </div>

//             <div className="space-y-2">
//               <Label htmlFor="instagram_url" className="flex items-center gap-2">
//                 <Instagram className="h-4 w-4" />
//                 Instagram
//               </Label>
//               <Input
//                 id="instagram_url"
//                 placeholder="https://instagram.com/yourcompany"
//                 {...register("instagram_url")}
//                 disabled={!canEdit}
//               />
//               {errors.instagram_url && (
//                 <p className="text-sm text-destructive">{errors.instagram_url.message}</p>
//               )}
//             </div>

//             <div className="space-y-2">
//               <Label htmlFor="youtube_url" className="flex items-center gap-2">
//                 <Youtube className="h-4 w-4" />
//                 YouTube
//               </Label>
//               <Input
//                 id="youtube_url"
//                 placeholder="https://youtube.com/@yourcompany"
//                 {...register("youtube_url")}
//                 disabled={!canEdit}
//               />
//               {errors.youtube_url && (
//                 <p className="text-sm text-destructive">{errors.youtube_url.message}</p>
//               )}
//             </div>
//           </div>

//           <Button type="submit" disabled={loading || !canEdit}>
//             {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
//             Save Social Media Links
//           </Button>
//         </form>
//       </CardContent>
//     </Card>
//   );
// }



import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Facebook, Twitter, Instagram, Youtube, Loader2 } from "lucide-react";
import { useModulePermissions } from "@/hooks/use-module-permissions";
import { getCompanySocials, updateCompanySocials } from '@/api/company';
import { useMutation, useQuery } from "@tanstack/react-query";
import { useSocialMediaStore } from '@/store/useCompanyStore';

const socialMediaSchema = z.object({
  facebookUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  xUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  instagramUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  youtubeUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
});

type SocialMediaFormData = z.infer<typeof socialMediaSchema>;

export function SocialMediaTab() {
  const [loading, setLoading] = useState(false);
  const { hasPermission } = useModulePermissions();
  const canEdit = hasPermission("company_settings_permissions", "social_media", "edit");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SocialMediaFormData>({
    resolver: zodResolver(socialMediaSchema),
    defaultValues: {
      facebookUrl: "",
      xUrl: "",
      instagramUrl: "",
      youtubeUrl: "",
    },
  });

  const { data, error } = useQuery({
    queryKey: ['companySocials'],
    queryFn: getCompanySocials
  })

  const companySocialsData = data?.data?.data;
  const setSocialMediaLinks = useSocialMediaStore((state) => state.setSocialMediaLinks);
  useEffect(() => {
    if (companySocialsData) {
      reset({
        facebookUrl: companySocialsData.facebookUrl || '',
        xUrl: companySocialsData.xUrl || '',
        instagramUrl: companySocialsData.instagramUrl || '',
        youtubeUrl: companySocialsData.youtubeUrl || ''
      })
    }
  }, [companySocialsData, reset]);

  const mutation = useMutation({
    mutationFn: updateCompanySocials,
    onMutate: () => {
      setLoading(true);
    },
    onSuccess: (response) => {
      setLoading(false);
      toast.success(response.data.message || "Social media links updated successfully");
    },
    onError: (error) => {
      setLoading(false);
      console.error("Error saving social media links:", error);
      toast.error("Failed to save social media links");
    }
  })

  const onSubmit = async (companySocialsData) => {
    mutation.mutate(companySocialsData);
     setSocialMediaLinks(companySocialsData);
  }


  return (
    <Card>
      <CardHeader>
        <CardTitle>Social Media Links</CardTitle>
        <CardDescription>
          Add your company's social media profile URLs
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="facebook_url" className="flex items-center gap-2">
                <Facebook className="h-4 w-4" />
                Facebook
              </Label>
              <Input
                id="facebook_url"
                placeholder="https://facebook.com/yourcompany"
                {...register("facebookUrl")}
                disabled={!canEdit}
              />
              {errors.facebookUrl && (
                <p className="text-sm text-destructive">{errors.facebookUrl.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="x_url" className="flex items-center gap-2">
                <Twitter className="h-4 w-4" />
                X (Twitter)
              </Label>
              <Input
                id="x_url"
                placeholder="https://x.com/yourcompany"
                {...register("xUrl")}
                disabled={!canEdit}
              />
              {errors.xUrl && (
                <p className="text-sm text-destructive">{errors.xUrl.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="instagram_url" className="flex items-center gap-2">
                <Instagram className="h-4 w-4" />
                Instagram
              </Label>
              <Input
                id="instagram_url"
                placeholder="https://instagram.com/yourcompany"
                {...register("instagramUrl")}
                disabled={!canEdit}
              />
              {errors.instagramUrl && (
                <p className="text-sm text-destructive">{errors.instagramUrl.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="youtube_url" className="flex items-center gap-2">
                <Youtube className="h-4 w-4" />
                YouTube
              </Label>
              <Input
                id="youtube_url"
                placeholder="https://youtube.com/@yourcompany"
                {...register("youtubeUrl")}
                disabled={!canEdit}
              />
              {errors.youtubeUrl && (
                <p className="text-sm text-destructive">{errors.youtubeUrl.message}</p>
              )}
            </div>
          </div>

          <Button type="submit" disabled={loading || !canEdit}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Social Media Links
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
