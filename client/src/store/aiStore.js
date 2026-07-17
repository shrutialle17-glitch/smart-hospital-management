import { create } from 'zustand';

export const useAIStore = create((set) => ({
  isDrawerOpen: false,
  toggleDrawer: () => set((state) => ({ isDrawerOpen: !state.isDrawerOpen })),
  closeDrawer: () => set({ isDrawerOpen: false }),
  openDrawer: () => set({ isDrawerOpen: true }),
  
  messages: [],
  addMessage: (msg) => set((state) => ({ messages: [...state.messages, msg] })),
  setMessages: (messages) => set({ messages }),
  
  isLoading: false,
  setIsLoading: (loading) => set({ isLoading: loading }),

  activeConversationId: null,
  setActiveConversationId: (id) => set({ activeConversationId: id }),
}));
