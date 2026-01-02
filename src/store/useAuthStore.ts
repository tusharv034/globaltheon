import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { User, AuthStore } from "@/types";

// Extend the type slightly to include our internal trigger
interface AuthStoreWithVersion extends AuthStore {
  _version: number;
  announcementMounted: boolean;
  updateAuthAnnouncement: (mounted: boolean) => void
}

export const useAuthStore = create<AuthStoreWithVersion>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      shopifyUrl:null,
      impersonating: false,
      announcementMounted: false,
      _version: 0, // ← This is the magic line

      setAuth: (token, user, impersonating) =>
        set({
          impersonating,
          token,
          user,
          _version: Date.now(), // Force re-render on login
        }),

      // This is the key fix — we now bump _version on every update
      updateAuthUser: (updates: Partial<User>) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
          _version: state._version + 1, // ← Forces re-render EVERYWHERE
        })),
      updateAuthAnnouncement: (value: boolean) =>
        set((state) => ({
          announcementMounted: value,
          _version: state._version + 1, // ← Forces re-render EVERYWHERE
        })),

      clearAuth: () =>
        set({
          token: null,
          user: null,
          announcementMounted: false,
          _version: Date.now(),
        }),
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        impersonating: state.impersonating,
        announcementMounted: state.announcementMounted
        // _version is NOT persisted — it's only for runtime re-renders
      }),
    }
  )
);



// Define the Shopify Store Type
interface ShopifyStore {
  shopifyUrl: string | null;
  setShopifyUrl: (url: string) => void;
  clearShopifyUrl: () => void;
}

// Create the store
export const useShopifyStore = create<ShopifyStore>()(
  persist(
    (set) => ({
      shopifyUrl: null,
      setShopifyUrl: (url: string) => set({ shopifyUrl: url }),
      clearShopifyUrl: () => set({ shopifyUrl: null }),
    }),
    {
      name: "shopify-url-storage", // This is the key for the storage
      storage: createJSONStorage(() => sessionStorage), // You can change this to localStorage if needed
      partialize: (state) => ({
        shopifyUrl: state.shopifyUrl, // Persist only the shopifyUrl
      }),
    }
  )
);