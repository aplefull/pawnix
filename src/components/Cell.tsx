// LIBRARIES
import { memo } from 'react';
import classNames from 'classnames';
import { useDispatch, useSelector } from 'react-redux';
// REDUX
import { move, Position, AppDispatch, RootState } from '@redux';
// UTILS
import { availableMovesWithPlayer, containsPosition, isCurrentPlayerTurn } from '@utils';
// STYLES
import styles from '@styles/components/cell.module.scss';

export type TCellProps = {
  containsPlayerOne: boolean;
  containsPlayerTwo: boolean;
  canGoHere: boolean;
  isCurrentTurn: boolean;
  position: Position;
  size: number;
};

export const Cell = memo(
  ({ containsPlayerOne, containsPlayerTwo, canGoHere, isCurrentTurn, position, size }: TCellProps) => {
    const dispatch = useDispatch<AppDispatch>();
    const { playerOnePos, playerTwoPos, player, placed, turn } = useSelector((state: RootState) => state.playfield);

    const handleClick = () => {
      if (
        containsPosition(availableMovesWithPlayer(playerOnePos, playerTwoPos, player, placed), position) &&
        isCurrentPlayerTurn(turn, player)
      ) {
        dispatch(move(position));
      }
    };

    const style = {
      width: `${size}px`,
      height: `${size}px`,
    };

    return (
      <div
        style={style}
        onClick={handleClick}
        className={classNames(styles.tile, { [styles.canGo]: canGoHere, [styles.active]: isCurrentTurn })}
      >
        {containsPlayerOne && <div className={styles.playerOne} />}
        {containsPlayerTwo && <div className={styles.playerTwo} />}
      </div>
    );
  }
);
