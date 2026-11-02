// LIBRARIES
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { useShallow } from 'zustand/shallow';
// STORE
import { movePawn, placeWall, useQuoridor } from '../store';
import type { Player, Position, Wall } from '../types';
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
  const [pendingWall, setPendingWall] = useState<Wall | null>(null);
  const { walls, players, turn, player, playerOneWallsLeft, playerTwoWallsLeft, playerOnePos, playerTwoPos } =
    useQuoridor(
      useShallow((state) => ({
        walls: state.walls,
        players: state.players,
        turn: state.turn,
        player: state.player,
        playerOneWallsLeft: state.playerOneWallsLeft,
        playerTwoWallsLeft: state.playerTwoWallsLeft,
        playerOnePos: state.playerOnePos,
        playerTwoPos: state.playerTwoPos,
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

  const isValidWall = useCallback(
    (wall: Wall) => {
      const cells = getWallCells(wall);
      return isLegalWallPlacement(cells, placed) && !isBlockingPath(playerOnePos, playerTwoPos, cells, placed);
    },
    [placed, playerOnePos, playerTwoPos]
  );

  const wallPreview = useMemo(() => {
    if (!canPlace) return null;

    const wall = hoveredSlot ? getWallFromSlot(hoveredSlot) : pendingWall;
    if (!wall) return null;

    return { wall, isValid: isValidWall(wall) };
  }, [canPlace, hoveredSlot, pendingWall, isValidWall]);

  useEffect(() => {
    if (!canPlace) setPendingWall(null);
  }, [canPlace]);

  const handleMove = useCallback((position: Position) => {
    movePawn(position);
  }, []);

  const handleWallHover = useCallback((position: Position) => {
    setHoveredSlot(position);
  }, []);

  const handleWallLeave = useCallback(() => {
    setHoveredSlot(null);
  }, []);

  const confirmWall = useCallback(
    (wall: Wall) => {
      if (!isValidWall(wall)) return;

      setHoveredSlot(null);
      setPendingWall(null);
      placeWall(wall);
    },
    [isValidWall]
  );

  const handleWallSelect = useCallback(
    (position: Position, isTouch: boolean) => {
      if (!isTouch) {
        confirmWall(getWallFromSlot(position));
        return;
      }

      if (pendingWall && containsPosition(getWallCells(pendingWall), position)) {
        confirmWall(pendingWall);
        return;
      }

      setPendingWall(getWallFromSlot(position));
    },
    [confirmWall, pendingWall]
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
