// LIBRARIES
import cx from 'clsx';
// STYLES
import styles from '@styles/components/ui/spinner.module.scss';

type TSpinnerProps = {
  size?: 'sm' | 'md';
  className?: string;
};

export const Spinner = ({ size = 'md', className }: TSpinnerProps) => {
  return <span className={cx(styles.spinner, styles[size], className)} role="status" aria-label="Loading" />;
};

export const PageSpinner = () => {
  return (
    <div className={styles.page}>
      <Spinner />
    </div>
  );
};
