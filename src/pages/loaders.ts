// LIBRARIES
import { type LoaderFunctionArgs, redirect } from 'react-router';
import type { Unsubscribe } from 'firebase/firestore';
// GAMES
import { type GameEntry, type GameModule, getGame } from '@games';
// STORE
import { type RoomDoc, useRoomStore } from '@store';
// SERVICES
import { claimSeat, ensureSignedIn, NameRequiredError, subscribeRoom } from '@services';
// UTILS
import { getStoredName, isRoomCode, normalizeRoomCode } from '@utils';

let unsubscribeRoom: Unsubscribe | null = null;

export type JoinResult = { gameModule: GameModule; needsName?: never } | { gameModule?: never; needsName: GameEntry };

const takeSeat = async (roomId: string, uid: string) => {
  try {
    return await claimSeat(roomId, uid, getStoredName());
  } catch (error) {
    if (error instanceof NameRequiredError) {
      const game = getGame(error.game);
      if (game) return { needsName: game };
    }

    throw error;
  }
};

const joinGame = async (roomId: string): Promise<JoinResult> => {
  const user = await ensureSignedIn();
  const seat = await takeSeat(roomId, user.uid);

  if (typeof seat !== 'string') return seat;

  const { enterRoom, setRoom } = useRoomStore.getState();

  enterRoom(roomId, seat);

  unsubscribeRoom?.();

  const room = await new Promise<RoomDoc | null>((resolve, reject) => {
    unsubscribeRoom = subscribeRoom(
      roomId,
      (data, synced) => {
        if (data) {
          setRoom(data, synced);
        }
        resolve(data);
      },
      reject
    );
  });

  const game = room && getGame(room.game);

  if (!game) {
    throw new Error(`Room ${roomId} has a game this site doesn't know`);
  }

  return { gameModule: await game.load() };
};

export const gameLoader = async ({ params }: LoaderFunctionArgs) => {
  const game = getGame(params.gameId ?? '');

  if (!game) {
    throw redirect('/');
  }

  return { game, gameModule: await game.load() };
};

export const playLoader = ({ params }: LoaderFunctionArgs) => {
  const roomId = normalizeRoomCode(params.roomId ?? '');

  if (!isRoomCode(roomId)) {
    throw new Error(`Invalid room code: ${params.roomId}`);
  }

  if (roomId !== params.roomId) {
    throw redirect(`/play/${roomId}`);
  }

  return { promise: joinGame(roomId) };
};
