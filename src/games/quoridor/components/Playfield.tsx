// LIBRARIES
import { memo, useCallback, useMemo, useState } from 'react';
import { useShallow } from 'zustand/shallow';
// STORE
import { useGameStore } from '../gameStore';
import type { Player, Position } from '../types';
// UTILS
import {
  availableMovesWithPlayer,
  containsPosition,
  doesPlayerHaveWalls,
  getElementType,
  getWallCells,
  getWallFromSlot,
  isBlockingPath,
  isCurrentPlayerTurn,
  isLegalWallPlacement,
  isSamePosition,
} from '../utils';
// COMPONENTS
import { Cell } from './Cell';
import { WallLayer } from './WallLayer';
import { WallSlot } from './WallSlot';
// CONSTANTS
import { ELEMENTS, PLAYERS, PLAYFIELD_INITIAL_STATE, PLAYFIELD_SIZE } from '../constants';
// STYLES
import styles from '@styles/games/quoridor/playfield.module.scss';

const ALL_POSITIONS: Position[] = PLAYFIELD_INITIAL_STATE.flatMap((row, rowIndex) =>
  row.map((_, col) => ({ row: rowIndex, col }))
);

const TILES = ALL_POSITIONS.filter((position) => getElementType(position) === ELEMENTS.TILE);

const WALL_SLOTS = ALL_POSITIONS.filter((position) => {
  const type = getElementType(position);
  return type === ELEMENTS.HORIZONTAL_WALL || type === ELEMENTS.VERTICAL_WALL;
});

const getGoalOwner = (position: Position): Player | null => {
  if (position.row === 0) return PLAYERS.PLAYER_1;
  if (position.row === PLAYFIELD_SIZE) return PLAYERS.PLAYER_2;
  return null;
};

export const Playfield = memo(() => {
  const [hoveredSlot, setHoveredSlot] = useState<Position | null>(null);
  const {
    walls,
    players,
    turn,
    player,
    playerOneWallsLeft,
    playerTwoWallsLeft,
    playerOnePos,
    playerTwoPos,
    move,
    place,
  } = useGameStore(
    useShallow((state) => ({
      walls: state.walls,
      players: state.players,
      turn: state.turn,
      player: state.player,
      playerOneWallsLeft: state.playerOneWallsLeft,
      playerTwoWallsLeft: state.playerTwoWallsLeft,
      playerOnePos: state.playerOnePos,
      playerTwoPos: state.playerTwoPos,
      move: state.move,
      place: state.place,
    }))
  );

  const placed = useMemo(() => walls.flatMap(getWallCells), [walls]);

  const isFlipped = player === PLAYERS.PLAYER_2;
  const isCurrentTurn = !!players.One && !!players.Two && isCurrentPlayerTurn(turn, player);
  const canPlace = isCurrentTurn && doesPlayerHaveWalls(player, playerOneWallsLeft, playerTwoWallsLeft);

  const availableMoves = useMemo(() => {
    if (!isCurrentTurn) return [];
    return availableMovesWithPlayer(playerOnePos, playerTwoPos, player, placed);
  }, [isCurrentTurn, playerOnePos, playerTwoPos, player, placed]);

  const getWallPlacement = useCallback(
    (position: Position) => {
      const wall = getWallFromSlot(position);
      const cells = getWallCells(wall);
      const isValid = isLegalWallPlacement(cells, placed) && !isBlockingPath(playerOnePos, playerTwoPos, cells, placed);

      return { wall, isValid };
    },
    [placed, playerOnePos, playerTwoPos]
  );

  const wallPreview = useMemo(() => {
    if (!canPlace || !hoveredSlot) return null;
    return getWallPlacement(hoveredSlot);
  }, [canPlace, hoveredSlot, getWallPlacement]);

  const handleMove = useCallback(
    (position: Position) => {
      move(position);
    },
    [move]
  );

  const handleWallHover = useCallback((position: Position) => {
    setHoveredSlot(position);
  }, []);

  const handleWallLeave = useCallback(() => {
    setHoveredSlot(null);
  }, []);

  const handleWallSelect = useCallback(
    (position: Position) => {
      const { wall, isValid } = getWallPlacement(position);
      if (!isValid) return;

      setHoveredSlot(null);
      place(wall);
    },
    [place, getWallPlacement]
  );

  const getOccupant = (position: Position) => {
    if (isSamePosition(position, playerOnePos)) return PLAYERS.PLAYER_1;
    if (isSamePosition(position, playerTwoPos)) return PLAYERS.PLAYER_2;
    return null;
  };

  return (
    <div className={styles.playfield}>
      {TILES.map((position) => (
        <Cell
          key={`${position.row}-${position.col}`}
          position={position}
          isFlipped={isFlipped}
          occupant={getOccupant(position)}
          goalOf={getGoalOwner(position)}
          canMoveHere={containsPosition(availableMoves, position)}
          player={player}
          onMove={handleMove}
        />
      ))}

      <WallLayer walls={walls} isFlipped={isFlipped} variant="placed" />

      {wallPreview && (
        <WallLayer
          walls={[wallPreview.wall]}
          isFlipped={isFlipped}
          variant={wallPreview.isValid ? 'preview' : 'invalid'}
        />
      )}

      {canPlace &&
        WALL_SLOTS.map((position) => (
          <WallSlot
            key={`${position.row}-${position.col}`}
            position={position}
            isFlipped={isFlipped}
            onHover={handleWallHover}
            onLeave={handleWallLeave}
            onSelect={handleWallSelect}
          />
        ))}
    </div>
  );
});
