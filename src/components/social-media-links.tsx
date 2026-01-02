// import { useEffect, useState } from "react";
// import { supabase } from "@/integrations/supabase/client";
// import { Facebook, Twitter, Instagram, Youtube } from "lucide-react";

// interface SocialMediaData {
//   facebook_url?: string;
//   x_url?: string;
//   instagram_url?: string;
//   youtube_url?: string;
// }

// export function SocialMediaLinks() {
//   const [socialMedia, setSocialMedia] = useState<SocialMediaData | null>(null);

//   useEffect(() => {
//     loadSocialMedia();
//   }, []);

//   const loadSocialMedia = async () => {
//     try {
//       const { data, error } = await supabase
//         .from("social_media_links")
//         .select("*")
//         .maybeSingle();

//       if (error) throw error;
//       if (data) {
//         setSocialMedia(data);
//       }
//     } catch (error) {
//       console.error("Error loading social media links:", error);
//     }
//   };

//   // Don't render if no social media links exist
//   if (!socialMedia || (!socialMedia.facebook_url && !socialMedia.x_url && !socialMedia.instagram_url && !socialMedia.youtube_url)) {
//     return null;
//   }

//   return (
//     <div className="flex gap-3 items-center">
//       {socialMedia.facebook_url && (
//         <a
//           href={socialMedia.facebook_url}
//           target="_blank"
//           rel="noopener noreferrer"
//           className="h-10 w-10 flex items-center justify-center transition-opacity hover:opacity-70"
//           aria-label="Facebook"
//         >
//           <Facebook className="h-6 w-6" style={{ color: '#1a1f2e' }} />
//         </a>
//       )}
      
//       {socialMedia.x_url && (
//         <a
//           href={socialMedia.x_url}
//           target="_blank"
//           rel="noopener noreferrer"
//           className="h-10 w-10 flex items-center justify-center transition-opacity hover:opacity-70"
//           aria-label="X (Twitter)"
//         >
//           <Twitter className="h-6 w-6" style={{ color: '#1a1f2e' }} />
//         </a>
//       )}
      
//       {socialMedia.instagram_url && (
//         <a
//           href={socialMedia.instagram_url}
//           target="_blank"
//           rel="noopener noreferrer"
//           className="h-10 w-10 flex items-center justify-center transition-opacity hover:opacity-70"
//           aria-label="Instagram"
//         >
//           <Instagram className="h-6 w-6" style={{ color: '#1a1f2e' }} />
//         </a>
//       )}
      
//       {socialMedia.youtube_url && (
//         <a
//           href={socialMedia.youtube_url}
//           target="_blank"
//           rel="noopener noreferrer"
//           className="h-10 w-10 flex items-center justify-center transition-opacity hover:opacity-70"
//           aria-label="YouTube"
//         >
//           <Youtube className="h-6 w-6" style={{ color: '#1a1f2e' }} />
//         </a>
//       )}
//     </div>
//   );
// }
// SocialMediaLinks.tsx
import { Facebook, Twitter, Instagram, Youtube } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getCompanySocials } from '@/api/company';
import { useSocialMediaStore } from '@/store/useCompanyStore';
import { useEffect } from "react";
export function SocialMediaLinks() {
  const { data, isLoading } = useQuery({
    queryKey: ['companySocials'],
    queryFn: getCompanySocials,
  });

  const setSocialMediaLinks = useSocialMediaStore((state) => state.setSocialMediaLinks);

  // Update store when data arrives
  useEffect(() => {
    const socialMedia = data?.data?.data;
    if (socialMedia) {
      setSocialMediaLinks(socialMedia); // This now safely merges
    }
  }, [data, setSocialMediaLinks]);

  // Read directly from store — reactive and clean
  const { facebookUrl, xUrl, instagramUrl, youtubeUrl } =
    useSocialMediaStore((state) => state.socialMediaLinks);

  if (isLoading) return null;

  const hasAnyLink = facebookUrl || xUrl || instagramUrl || youtubeUrl;
  if (!hasAnyLink) return null;

 
  return (
    <div className="flex gap-3 items-center">
      {facebookUrl && (
        <a
          href={facebookUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="h-10 w-10 flex items-center justify-center transition-opacity hover:opacity-70"
          aria-label="Facebook"
        >
          <Facebook className="h-6 w-6" style={{ color: '#1a1f2e' }} />
        </a>
      )}
      
      {xUrl && (
        <a
          href={xUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="h-10 w-10 flex items-center justify-center transition-opacity hover:opacity-70"
          aria-label="X (Twitter)"
        >
          <Twitter className="h-6 w-6" style={{ color: '#1a1f2e' }} />
        </a>
      )}
      
      {instagramUrl && (
        <a
          href={instagramUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="h-10 w-10 flex items-center justify-center transition-opacity hover:opacity-70"
          aria-label="Instagram"
        >
          <Instagram className="h-6 w-6" style={{ color: '#1a1f2e' }} />
        </a>
      )}
      
      {youtubeUrl && (
        <a
          href={youtubeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="h-10 w-10 flex items-center justify-center transition-opacity hover:opacity-70"
          aria-label="YouTube"
        >
          <Youtube className="h-6 w-6" style={{ color: '#1a1f2e' }} />
        </a>
      )}
    </div>
  );
}