// LIBRARIES
import { create } from 'zustand';
// TYPES
import type { RoomDoc } from './types';

export type RoomStore = {
  roomId: string | null;
  seat: string | null;
  room: RoomDoc | null;
  synced: boolean;
  enterRoom: (roomId: string, seat: string) => void;
  setRoom: (room: RoomDoc, synced: boolean) => void;
};

export const useRoomStore = create<RoomStore>()((set) => ({
  roomId: null,
  seat: null,
  room: null,
  synced: false,

  enterRoom: (roomId, seat) => {
    set({ roomId, seat, room: null, synced: false });
  },

  setRoom: (room, synced) => {
    set({ room, synced });
  },
}));
