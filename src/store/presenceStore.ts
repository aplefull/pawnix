// LIBRARIES
import { create } from 'zustand';

type PresenceStore = {
  online: string[];
  setOnline: (uids: string[]) => void;
};

export const usePresenceStore = create<PresenceStore>()((set) => ({
  online: [],

  setOnline: (uids) => {
    set({ online: uids });
  },
}));
