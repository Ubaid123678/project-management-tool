import { create } from "zustand";

type UIState = {
  sidebarCollapsed: boolean;
  showMobileSidebar: boolean;
  toggleSidebar: () => void;
  setMobileSidebar: (open: boolean) => void;
};

export const useUIStore = create<UIState>((set) => ({
  sidebarCollapsed: false,
  showMobileSidebar: false,
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setMobileSidebar: (open) => set({ showMobileSidebar: open })
}));
