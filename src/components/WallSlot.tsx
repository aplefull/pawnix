// LIBRARIES
import cx from 'classnames';
import { memo } from 'react';
// REDUX
import { Position } from '@redux';
// UTILS
import { getElementType, getGridPlacement } from '@utils';
// CONSTANTS
import { ELEMENTS } from '@constants';
// STYLES
import styles from '@styles/components/wall-slot.module.scss';

type TWallSlotProps = {
  position: Position;
  isFlipped: boolean;
  onHover: (position: Position) => void;
  onLeave: () => void;
  onSelect: (position: Position) => void;
};

export const WallSlot = memo(({ position, isFlipped, onHover, onLeave, onSelect }: TWallSlotProps) => {
  const isHorizontal = getElementType(position) === ELEMENTS.HORIZONTAL_WALL;

  const handlePointerEnter = () => {
    onHover(position);
  };

  const handleClick = () => {
    onSelect(position);
  };

  return (
    <div
      className={cx(styles.slot, isHorizontal ? styles.horizontal : styles.vertical)}
      style={getGridPlacement(position, isFlipped)}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={onLeave}
      onClick={handleClick}
    />
  );
});
