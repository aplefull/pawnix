// LIBRARIES
import cx from 'clsx';
import { memo } from 'react';
// STORE
import type { Wall } from '@store';
// UTILS
import { toDisplayPosition } from '@utils';
// STYLES
import styles from '@styles/components/wall-layer.module.scss';

type TWallLayerProps = {
  walls: Wall[];
  isFlipped: boolean;
  variant: 'placed' | 'preview' | 'invalid';
};

const getWallPlacement = (wall: Wall, isFlipped: boolean) => {
  const { row, col } = toDisplayPosition(wall, isFlipped);

  if (wall.orientation === 'horizontal') {
    return { gridRow: row + 1, gridColumn: `${col} / span 3` };
  }

  return { gridRow: `${row} / span 3`, gridColumn: col + 1 };
};

export const WallLayer = memo(({ walls, isFlipped, variant }: TWallLayerProps) => {
  return (
    <div className={cx(styles.layer, styles[variant])} aria-hidden>
      {walls.map((wall) => (
        <div key={`${wall.row}-${wall.col}`} className={styles.wall} style={getWallPlacement(wall, isFlipped)} />
      ))}
    </div>
  );
});
