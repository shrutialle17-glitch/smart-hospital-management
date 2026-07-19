import { create } from "zustand";

export const useAIStore = create((set) => ({
  isDrawerOpen: false,

  toggleDrawer: () =>
    set((state) => ({
      isDrawerOpen: !state.isDrawerOpen,
    })),
}));