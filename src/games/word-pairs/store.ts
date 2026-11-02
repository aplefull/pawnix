// STORE
import { type RoomStore, type Seats, useRoomStore } from '@store';
// SERVICES
import { fetchSecret, resetRoomState, updateRoomState, updateRoomStateWithSecret } from '@services';
// UTILS
import { logger } from '@utils';
import { createInitialState, getNextRoundState, getRematchState } from './utils';
// CONSTANTS
import { DEFAULT_ROUNDS, PHASES, SEATS } from './constants';
// TYPES
import type { GameState, Seat, Secret } from './types';

type WordPairsView = GameState & {
  roomId: string | null;
  seat: Seat;
  players: Seats;
  names: Seats;
  synced: boolean;
};

const EMPTY_SEATS: Seats = { One: null, Two: null };

const FALLBACK_STATE = createInitialState('en', DEFAULT_ROUNDS);

const toView = ({ roomId, seat, room, synced }: RoomStore): WordPairsView => ({
  synced,
  ...((room?.state as GameState | undefined) ?? FALLBACK_STATE),
  roomId,
  seat: (seat as Seat | null) ?? SEATS[0],
  players: room?.players ?? EMPTY_SEATS,
  names: room?.names ?? EMPTY_SEATS,
});

const getView = () => toView(useRoomStore.getState());

const toGameState = ({ roomId, seat, players, names, synced, ...state }: WordPairsView): GameState => state;

export const useWordPairs = <T>(selector: (view: WordPairsView) => T) => {
  return useRoomStore((store) => selector(toView(store)));
};

export const submitPairing = async (pairing: number[]) => {
  const { roomId, round, matcher } = getView();

  if (!roomId) {
    logger.error('Room id is not provided');
    return;
  }

  await updateRoomStateWithSecret<GameState, Secret>(roomId, matcher, { round, pairing }, { phase: PHASES.GUESSING });
};

export const submitGuess = async (guess: number[]) => {
  const { roomId } = getView();

  if (!roomId) {
    logger.error('Room id is not provided');
    return;
  }

  await updateRoomState<GameState>(roomId, { phase: PHASES.REVEAL, guess });
};

export const startNextRound = async () => {
  const view = getView();

  if (!view.roomId) {
    logger.error('Room id is not provided');
    return;
  }

  const secret = await fetchSecret<Secret>(view.roomId, view.matcher);

  if (!secret || secret.round !== view.round || getView().phase !== PHASES.REVEAL) return;

  await updateRoomState<GameState>(view.roomId, getNextRoundState(toGameState(view), secret.pairing));
};

export const restartGame = async () => {
  const view = getView();

  if (!view.roomId) {
    logger.error('Room id is not provided');
    return;
  }

  await resetRoomState(view.roomId, getRematchState(toGameState(view)));
};
