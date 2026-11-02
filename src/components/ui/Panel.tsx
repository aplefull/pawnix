// LIBRARIES
import cx from 'classnames';
import { HTMLAttributes } from 'react';
// STYLES
import styles from '@styles/components/ui/panel.module.scss';

export const Panel = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => {
  return <div className={cx(styles.panel, className)} {...props} />;
};
