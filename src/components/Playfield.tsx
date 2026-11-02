// LIBRARIES
import cx from 'classnames';
import { useSelector } from 'react-redux';
import { memo, useCallback, useMemo, useState } from 'react';
// REDUX
import { RootState, Position } from '@redux';
// UTILS
import {
  availableMovesWithPlayer,
  containsPosition,
  doesPlayerHaveWalls,
  isCurrentPlayerTurn,
  isHorizontalIntersection,
  isVerticalIntersection,
} from '@utils';
// HOOKS
import { useWindowSize } from '@hooks';
// COMPONENTS
import { PlayfieldElement } from '@components';
// CONSTANTS
import { PLAYERS, PLAYFIELD_INITIAL_STATE } from '@constants';
// STYLES
import styles from '@styles/components/playfield.module.scss';

export const Playfield = memo(() => {
  const { width } = useWindowSize();
  const [hovered, setHovered] = useState<Position[]>([]);
  const { placed, turn, player, playerOneWallsLeft, playerTwoWallsLeft, playerOnePos, playerTwoPos } = useSelector(
    (state: RootState) => state.playfield
  );

  const availableMoves = useMemo(() => {
    return availableMovesWithPlayer(playerOnePos, playerTwoPos, player, placed);
  }, [playerOnePos, playerTwoPos, player, placed]);

  const grid = PLAYFIELD_INITIAL_STATE.flat();

  const getRowCol = (index: number) => {
    const row = Math.floor(index / 17);
    const col = index % 17;

    return { row, col };
  };

  const handleHover = useCallback((pos: Position[]) => {
    setHovered(pos);
  }, []);

  const cellsInRowCount = 9;
  const cellsInColumnCount = 9;
  const verticalWallsInRowCount = 8;
  const horizontalWallsInColumnCount = 8;
  const totalMargin = 4;
  const totalPlayfieldPadding = 30;

  const playfieldSize = width > 763 ? 700 : width * 0.9;
  const adjustedPlayfieldSize = playfieldSize - totalPlayfieldPadding;

  const cellSize = adjustedPlayfieldSize / 11;
  const verticalWallWidth =
    (adjustedPlayfieldSize - cellSize * cellsInRowCount) / verticalWallsInRowCount - totalMargin;
  const verticalWallHeight = cellSize;
  const horizontalWallWidth = cellSize;
  const horizontalWallHeight =
    (adjustedPlayfieldSize - cellSize * cellsInColumnCount) / horizontalWallsInColumnCount - totalMargin;

  const sizes = useMemo(() => {
    return {
      cellSize: Math.floor(cellSize),
      verticalWallWidth: Math.floor(verticalWallWidth),
      verticalWallHeight: Math.floor(verticalWallHeight),
      horizontalWallWidth: Math.floor(horizontalWallWidth),
      horizontalWallHeight: Math.floor(horizontalWallHeight),
    };
  }, [cellSize, verticalWallWidth, verticalWallHeight, horizontalWallWidth, horizontalWallHeight]);

  const style = {
    width: `${playfieldSize}px`,
    height: `${playfieldSize}px`,
  };

  const isCurrentTurn = isCurrentPlayerTurn(turn, player);
  const canPlace = doesPlayerHaveWalls(player, playerOneWallsLeft, playerTwoWallsLeft) && isCurrentTurn;
  const placedAndHovered = hovered.concat(placed);

  return (
    <div className={cx(styles.playfield, { [styles.upsideDown]: player === PLAYERS.PLAYER_2 })} style={style}>
      {grid.map((el, i) => {
        const position = useMemo(() => getRowCol(i), [i]);
        const { row, col } = position;

        const isHovered = containsPosition(hovered, position);
        const isPlaced = containsPosition(placed, position);
        const canGoHere = containsPosition(availableMoves, position);

        const isVertIntersection = isVerticalIntersection(position, placedAndHovered);
        const isHorIntersection = isHorizontalIntersection(position, placedAndHovered);

        const containsPlayerOne = row === playerOnePos.row && col === playerOnePos.col;
        const containsPlayerTwo = row === playerTwoPos.row && col === playerTwoPos.col;

        return (
          <PlayfieldElement
            key={i}
            type={el}
            position={position}
            isHovered={isHovered}
            canPlace={canPlace}
            isPlaced={isPlaced}
            onHover={handleHover}
            containsPlayerOne={containsPlayerOne}
            containsPlayerTwo={containsPlayerTwo}
            canGoHere={canGoHere}
            isCurrentTurn={isCurrentTurn}
            isVerticalIntersection={isVertIntersection}
            isHorizontalIntersection={isHorIntersection}
            sizes={sizes}
          />
        );
      })}
    </div>
  );
});
