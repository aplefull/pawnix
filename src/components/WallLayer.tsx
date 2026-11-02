// LIBRARIES
import cx from 'classnames';
import { memo, useMemo } from 'react';
// REDUX
import { Position } from '@redux';
// UTILS
import { containsPosition, getElementType, getGridPlacement, toDisplayPosition } from '@utils';
// CONSTANTS
import { ELEMENTS } from '@constants';
// STYLES
import styles from '@styles/components/wall-layer.module.scss';

type TWallLayerProps = {
  positions: Position[];
  isFlipped: boolean;
  variant: 'placed' | 'preview' | 'invalid';
};

const getSegments = (positions: Position[], isFlipped: boolean) => {
  const displayed = positions.map((position) => toDisplayPosition(position, isFlipped));
  const has = (row: number, col: number) => containsPosition(displayed, { row, col });

  return displayed.map((position) => {
    const { row, col } = position;
    const type = getElementType(position);
    const isHorizontal = type === ELEMENTS.HORIZONTAL_WALL;
    const isVertical = type === ELEMENTS.VERTICAL_WALL;

    return {
      key: `${row}-${col}`,
      position,
      isHorizontal,
      isVertical,
      roundStart: (isHorizontal && !has(row, col - 1)) || (isVertical && !has(row - 1, col)),
      roundEnd: (isHorizontal && !has(row, col + 1)) || (isVertical && !has(row + 1, col)),
    };
  });
};

export const WallLayer = memo(({ positions, isFlipped, variant }: TWallLayerProps) => {
  const segments = useMemo(() => getSegments(positions, isFlipped), [positions, isFlipped]);

  return (
    <div className={cx(styles.layer, styles[variant])} aria-hidden>
      {segments.map(({ key, position, isHorizontal, isVertical, roundStart, roundEnd }) => (
        <div
          key={key}
          className={cx(styles.segment, {
            [styles.horizontal]: isHorizontal,
            [styles.vertical]: isVertical,
            [styles.roundStart]: roundStart,
            [styles.roundEnd]: roundEnd,
          })}
          style={getGridPlacement(position, false)}
        />
      ))}
    </div>
  );
});
