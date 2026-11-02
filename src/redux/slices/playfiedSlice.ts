// LIBRARIES
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
// CONSTANTS
import { PLAYFIELD_SIZE, PLAYERS } from '@constants';
// REDUX
import { RootState } from '@redux';
// SERVICES
import { db } from '@services';
// UTILS
import { logger } from '@utils';

export type Position = {
  row: number;
  col: number;
};

export type Player = (typeof PLAYERS)[keyof typeof PLAYERS];

export type InitialPlayfieldState = {
  placed: Position[];
  playerOnePos: Position;
  playerTwoPos: Position;
  playerOneWallsLeft: number;
  playerTwoWallsLeft: number;
  player: Player;
  turn: Player;
  isGameStarted: boolean;
  roomId: string | null;
  winner: Player | null;
};

type FirebasePlayfieldState = Pick<
  InitialPlayfieldState,
  | 'placed'
  | 'playerOnePos'
  | 'playerTwoPos'
  | 'playerOneWallsLeft'
  | 'playerTwoWallsLeft'
  | 'isGameStarted'
  | 'roomId'
  | 'turn'
  | 'winner'
> & {
  initialPlayer: Player;
};

const initialState: InitialPlayfieldState = {
  placed: [],
  playerOnePos: { row: 16, col: 8 },
  playerTwoPos: { row: 0, col: 8 },
  playerOneWallsLeft: 10,
  playerTwoWallsLeft: 10,
  player: PLAYERS.PLAYER_1,
  turn: PLAYERS.PLAYER_1,
  isGameStarted: false,
  roomId: null,
  winner: null,
};

export const createNewRoom = createAsyncThunk<void, { initialPlayer: Player; roomId: string }, { state: RootState }>(
  'game/createNewRoom',
  async (data, { getState }) => {
    const { initialPlayer, roomId } = data;

    const { playfield } = getState();
    const { playerOnePos, playerTwoPos, playerOneWallsLeft, playerTwoWallsLeft, placed, winner, turn, isGameStarted } =
      playfield;

    if (!roomId) {
      logger.error('Room id is not provided');
      return;
    }

    const docRef = doc(db, 'rooms', roomId);

    await setDoc(docRef, {
      initialPlayer,
      roomId,
      turn,
      isGameStarted,
      playerOneWallsLeft,
      playerTwoWallsLeft,
      playerOnePos,
      playerTwoPos,
      placed,
      winner,
    });
  }
);

export const restartGame = createAsyncThunk<void, void, { state: RootState }>(
  'game/restart',
  async (_, { getState }) => {
    const { playfield } = getState();
    const { roomId } = playfield;

    if (!roomId) {
      logger.error('Room id is not provided');
      return;
    }

    const docRef = doc(db, 'rooms', roomId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const { initialPlayer } = docSnap.data() as FirebasePlayfieldState;

      if (!initialPlayer) {
        logger.error(`Initial player is ${initialPlayer}`);
        return;
      }

      const cleanData = {
        initialPlayer: initialPlayer,
        roomId: roomId,
        turn: PLAYERS.PLAYER_1,
        isGameStarted: true,
        playerOneWallsLeft: 10,
        playerTwoWallsLeft: 10,
        playerOnePos: { row: 16, col: 8 },
        playerTwoPos: { row: 0, col: 8 },
        placed: [],
        winner: null,
      } satisfies FirebasePlayfieldState;

      await setDoc(docRef, cleanData, {
        merge: true,
      });
    }
  }
);

export const move = createAsyncThunk<InitialPlayfieldState, Position, { state: RootState }>(
  'game/move',
  async (data, { getState }) => {
    const { playfield } = getState();
    const { player, roomId, turn } = playfield;

    if (!roomId) {
      logger.error('Room id is not provided');
      return playfield;
    }

    const newState = structuredClone(playfield);

    if (player === PLAYERS.PLAYER_1) {
      newState.playerOnePos = data;
    } else {
      newState.playerTwoPos = data;
    }

    if (data.row === 0 && player === PLAYERS.PLAYER_1) newState.winner = PLAYERS.PLAYER_1;
    if (data.row === PLAYFIELD_SIZE && player === PLAYERS.PLAYER_2) newState.winner = PLAYERS.PLAYER_2;

    if (turn === PLAYERS.PLAYER_1) {
      newState.turn = PLAYERS.PLAYER_2;
    } else {
      newState.turn = PLAYERS.PLAYER_1;
    }

    const docRef = doc(db, 'rooms', roomId);

    await updateDoc(docRef, {
      playerOnePos: newState.playerOnePos,
      playerTwoPos: newState.playerTwoPos,
      turn: newState.turn,
      winner: newState.winner,
    });

    return newState;
  }
);

export const place = createAsyncThunk<InitialPlayfieldState, Position[], { state: RootState }>(
  'game/place',
  async (data, { getState }) => {
    const { playfield } = getState();
    const { placed, playerOneWallsLeft, playerTwoWallsLeft, turn, player, roomId } = playfield;

    if (!roomId) {
      logger.error('Room id is not provided');
      return playfield;
    }

    const newState = structuredClone(playfield);

    newState.placed = [...placed, ...data];
    if (player === PLAYERS.PLAYER_1) {
      newState.playerOneWallsLeft = playerOneWallsLeft - 1;
    } else {
      newState.playerTwoWallsLeft = playerTwoWallsLeft - 1;
    }

    if (turn === PLAYERS.PLAYER_1) {
      newState.turn = PLAYERS.PLAYER_2;
    } else {
      newState.turn = PLAYERS.PLAYER_1;
    }

    const docRef = doc(db, 'rooms', roomId);

    await updateDoc(docRef, {
      placed: newState.placed,
      playerOneWallsLeft: newState.playerOneWallsLeft,
      playerTwoWallsLeft: newState.playerTwoWallsLeft,
      turn: newState.turn,
    });

    return newState;
  }
);

const playfieldSlice = createSlice({
  name: 'playfield',
  initialState,
  reducers: {
    selectPlayer: (state, action) => {
      state.player = action.payload;
    },
    setRoomId: (state, action) => {
      state.roomId = action.payload;
    },
    setData: (state, action) => {
      state.turn = action.payload.turn;
      state.roomId = action.payload.roomId;
      state.isGameStarted = action.payload.isGameStarted;
      state.placed = action.payload.placed;
      state.playerOneWallsLeft = action.payload.playerOneWallsLeft;
      state.playerTwoWallsLeft = action.payload.playerTwoWallsLeft;
      state.winner = action.payload.winner;
      //  change them separately so order of keys is not changed
      state.playerOnePos.row = action.payload.playerOnePos.row;
      state.playerOnePos.col = action.payload.playerOnePos.col;
      state.playerTwoPos.row = action.payload.playerTwoPos.row;
      state.playerTwoPos.col = action.payload.playerTwoPos.col;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(move.fulfilled, (state, action) => {
      state.playerOnePos = action.payload.playerOnePos;
      state.playerTwoPos = action.payload.playerTwoPos;
      state.turn = action.payload.turn;
      state.winner = action.payload.winner;
    });

    builder.addCase(place.fulfilled, (state, action) => {
      state.playerOneWallsLeft = action.payload.playerOneWallsLeft;
      state.playerTwoWallsLeft = action.payload.playerTwoWallsLeft;
      state.turn = action.payload.turn;
      state.placed = action.payload.placed;
    });
  },
});

export const { selectPlayer, setRoomId, setData } = playfieldSlice.actions;

export default playfieldSlice.reducer;
