// store/socialMediaStore.ts
import { create } from 'zustand';

interface SocialMediaLinks {
  facebookUrl?: string;
  xUrl?: string;
  instagramUrl?: string;
  youtubeUrl?: string;
}

interface SocialMediaStore {
  socialMediaLinks: SocialMediaLinks;
  setSocialMediaLinks: (links: Partial<SocialMediaLinks>) => void;
}

export const useSocialMediaStore = create<SocialMediaStore>((set) => ({
  socialMediaLinks: {
    facebookUrl: undefined,
    xUrl: undefined,
    instagramUrl: undefined,
    youtubeUrl: undefined,
  },
  setSocialMediaLinks: (links) =>
    set((state) => ({
      socialMediaLinks: {
        ...state.socialMediaLinks,
        ...links, // Only overrides provided fields
      },
    })),
}));