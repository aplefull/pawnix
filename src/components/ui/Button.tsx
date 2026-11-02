// LIBRARIES
import cx from 'classnames';
import { ButtonHTMLAttributes } from 'react';
// STYLES
import styles from '@styles/components/ui/button.module.scss';

type TButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
};

export const Button = ({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  type = 'button',
  className,
  ...props
}: TButtonProps) => {
  return (
    <button
      type={type}
      className={cx(styles.button, styles[variant], styles[size], { [styles.fullWidth]: fullWidth }, className)}
      {...props}
    />
  );
};
