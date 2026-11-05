// LIBRARIES
import { memo } from 'react';

const ICON_PATHS = {
  check: 'M20 6 9 17l-5-5',
  cross: 'M18 6 6 18M6 6l12 12',
};

export type TIconName = keyof typeof ICON_PATHS;

type TIconProps = {
  name: TIconName;
  className?: string;
};

export const Icon = memo(({ name, className }: TIconProps) => {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      width="1em"
      height="1em"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={ICON_PATHS[name]} />
    </svg>
  );
});
