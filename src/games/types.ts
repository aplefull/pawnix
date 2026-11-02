// LIBRARIES
import type { ComponentType } from 'react';

export type TCreateRoomOptions = {
  seat: string;
  state: object;
};

export type TCreateRoomProps = {
  onCreate: (options: TCreateRoomOptions) => void;
};

export type GameModule = {
  CreateRoom: ComponentType<TCreateRoomProps>;
  Game: ComponentType;
};

export type GameMeta = {
  id: string;
  name: string;
  tagline: string;
  seats: readonly string[];
};

export type GameEntry = GameMeta & {
  load: () => Promise<GameModule>;
};
