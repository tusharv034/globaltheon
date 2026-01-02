import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

// Define the types
interface DateFormatState {
  dateFormatRegion: string;
  dateFormatVariant: string;
  setDateFormat: (region: string, variant: string) => void;
  clearDateFormat: () => void;
}

// Create the store with persistence
export const useDateFormatStore = create<DateFormatState>()(
  persist(
    (set) => ({
      dateFormatRegion: "default",
      dateFormatVariant: "short",

      setDateFormat: (region: string, variant: string) =>
        set({
          dateFormatRegion: region,
          dateFormatVariant: variant,
        }),

      clearDateFormat: () =>
        set({
          dateFormatRegion: "default",
          dateFormatVariant: "short",
        }),
    }),
    {
      name: "date-format-storage", // Key in sessionStorage/localStorage
      storage: createJSONStorage(() => sessionStorage), // Change to localStorage if you want it permanent across sessions
      partialize: (state) => ({
        dateFormatRegion: state.dateFormatRegion,
        dateFormatVariant: state.dateFormatVariant,
      }),
    }
  )
);