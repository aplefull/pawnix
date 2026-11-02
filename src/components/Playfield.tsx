// LIBRARIES
import { memo, useCallback, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
// REDUX
import { move, place, AppDispatch, Player, Position, RootState } from '@redux';
// UTILS
import {
  availableMovesWithPlayer,
  containsPosition,
  doesPlayerHaveWalls,
  getElementType,
  getWallCoords,
  isBlockingPath,
  isCurrentPlayerTurn,
  isLegalWallPlacement,
  isSamePosition,
} from '@utils';
// COMPONENTS
import { Cell, WallLayer, WallSlot } from '@components';
// CONSTANTS
import { ELEMENTS, PLAYERS, PLAYFIELD_INITIAL_STATE, PLAYFIELD_SIZE } from '@constants';
// STYLES
import styles from '@styles/components/playfield.module.scss';

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
  const dispatch = useDispatch<AppDispatch>();
  const [hoveredSlot, setHoveredSlot] = useState<Position | null>(null);
  const { placed, turn, player, playerOneWallsLeft, playerTwoWallsLeft, playerOnePos, playerTwoPos } = useSelector(
    (state: RootState) => state.playfield
  );

  const isFlipped = player === PLAYERS.PLAYER_2;
  const isCurrentTurn = isCurrentPlayerTurn(turn, player);
  const canPlace = isCurrentTurn && doesPlayerHaveWalls(player, playerOneWallsLeft, playerTwoWallsLeft);

  const availableMoves = useMemo(() => {
    if (!isCurrentTurn) return [];
    return availableMovesWithPlayer(playerOnePos, playerTwoPos, player, placed);
  }, [isCurrentTurn, playerOnePos, playerTwoPos, player, placed]);

  const getWallPlacement = useCallback(
    (position: Position) => {
      const coords = getWallCoords(position, getElementType(position));
      const isValid =
        isLegalWallPlacement(coords, placed) && !isBlockingPath(playerOnePos, playerTwoPos, coords, placed);

      return { coords, isValid };
    },
    [placed, playerOnePos, playerTwoPos]
  );

  const wallPreview = useMemo(() => {
    if (!canPlace || !hoveredSlot) return null;
    return getWallPlacement(hoveredSlot);
  }, [canPlace, hoveredSlot, getWallPlacement]);

  const handleMove = useCallback(
    (position: Position) => {
      dispatch(move(position));
    },
    [dispatch]
  );

  const handleWallHover = useCallback((position: Position) => {
    setHoveredSlot(position);
  }, []);

  const handleWallLeave = useCallback(() => {
    setHoveredSlot(null);
  }, []);

  const handleWallSelect = useCallback(
    (position: Position) => {
      const { coords, isValid } = getWallPlacement(position);
      if (!isValid) return;

      setHoveredSlot(null);
      dispatch(place(coords));
    },
    [dispatch, getWallPlacement]
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

      <WallLayer positions={placed} isFlipped={isFlipped} variant="placed" />

      {wallPreview && (
        <WallLayer
          positions={wallPreview.coords}
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
