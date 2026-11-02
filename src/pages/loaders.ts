// LIBRARIES
import { type LoaderFunctionArgs, redirect } from 'react-router';
import type { Unsubscribe } from 'firebase/firestore';
// GAMES
import { getGame } from '@games';
// STORE
import { type RoomDoc, useRoomStore } from '@store';
// SERVICES
import { claimSeat, ensureSignedIn, subscribeRoom } from '@services';
// UTILS
import { isRoomCode, normalizeRoomCode } from '@utils';

let unsubscribeRoom: Unsubscribe | null = null;

const joinGame = async (roomId: string) => {
  const user = await ensureSignedIn();
  const seat = await claimSeat(roomId, user.uid);
  const { enterRoom, setRoom } = useRoomStore.getState();

  enterRoom(roomId, seat);

  unsubscribeRoom?.();

  const room = await new Promise<RoomDoc | null>((resolve, reject) => {
    unsubscribeRoom = subscribeRoom(
      roomId,
      (data) => {
        if (data) {
          setRoom(data);
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

  return game.load();
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
