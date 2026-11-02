// LIBRARIES
import { create } from 'zustand';
// TYPES
import type { RoomDoc } from './types';

export type RoomStore = {
  roomId: string | null;
  seat: string | null;
  room: RoomDoc | null;
  enterRoom: (roomId: string, seat: string) => void;
  setRoom: (room: RoomDoc) => void;
};

export const useRoomStore = create<RoomStore>()((set) => ({
  roomId: null,
  seat: null,
  room: null,

  enterRoom: (roomId, seat) => {
    set({ roomId, seat, room: null });
  },

  setRoom: (room) => {
    set({ room });
  },
}));
