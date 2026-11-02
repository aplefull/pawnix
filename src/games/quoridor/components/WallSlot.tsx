// LIBRARIES
import cx from 'clsx';
import { memo, type PointerEvent, useRef } from 'react';
// STORE
import type { Position } from '../types';
// UTILS
import { getElementType, getGridPlacement } from '../utils';
// CONSTANTS
import { ELEMENTS } from '../constants';
// STYLES
import styles from '@styles/games/quoridor/wall-slot.module.scss';

type TWallSlotProps = {
  position: Position;
  isFlipped: boolean;
  onHover: (position: Position) => void;
  onLeave: () => void;
  onSelect: (position: Position, isTouch: boolean) => void;
};

export const WallSlot = memo(({ position, isFlipped, onHover, onLeave, onSelect }: TWallSlotProps) => {
  const isTouchRef = useRef(false);
  const isHorizontal = getElementType(position) === ELEMENTS.HORIZONTAL_WALL;

  const handlePointerDown = (event: PointerEvent<HTMLButtonElement>) => {
    isTouchRef.current = event.pointerType === 'touch';
  };

  const handlePointerEnter = (event: PointerEvent<HTMLButtonElement>) => {
    if (event.pointerType !== 'touch') onHover(position);
  };

  const handlePointerLeave = (event: PointerEvent<HTMLButtonElement>) => {
    if (event.pointerType !== 'touch') onLeave();
  };

  const handleClick = () => {
    onSelect(position, isTouchRef.current);
  };

  return (
    <button
      type="button"
      tabIndex={-1}
      aria-label="Place wall"
      className={cx(styles.slot, isHorizontal ? styles.horizontal : styles.vertical)}
      style={getGridPlacement(position, isFlipped)}
      onPointerDown={handlePointerDown}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      onClick={handleClick}
    />
  );
});
