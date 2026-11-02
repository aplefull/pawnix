// LIBRARIES
import cx from 'classnames';
import { InputHTMLAttributes } from 'react';
// STYLES
import styles from '@styles/components/ui/text-input.module.scss';

type TTextInputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string | null;
};

export const TextInput = ({ label, error, className, ...props }: TTextInputProps) => {
  return (
    <label className={cx(styles.field, className)}>
      <span className={styles.label}>{label}</span>
      <input className={cx(styles.input, { [styles.invalid]: error })} aria-invalid={!!error} {...props} />
      {error && <span className={styles.error}>{error}</span>}
    </label>
  );
};
