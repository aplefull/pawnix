// LIBRARIES
import cx from 'clsx';
import { useId } from 'react';
// STYLES
import styles from '@styles/components/ui/segmented-control.module.scss';

type TSegmentedOption<T extends string | number> = {
  value: T;
  label: string;
};

type TSegmentedControlProps<T extends string | number> = {
  label: string;
  options: readonly TSegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
};

export const SegmentedControl = <T extends string | number>({
  label,
  options,
  value,
  onChange,
  className,
}: TSegmentedControlProps<T>) => {
  const name = useId();

  const handleSelect = (next: T) => () => {
    onChange(next);
  };

  return (
    <fieldset className={cx(styles.field, className)}>
      <legend className={styles.label}>{label}</legend>
      <div className={styles.control}>
        {options.map((option) => {
          const isSelected = option.value === value;

          return (
            <label key={option.value} className={cx(styles.option, { [styles.selected]: isSelected })}>
              <input
                type="radio"
                name={name}
                value={String(option.value)}
                checked={isSelected}
                onChange={handleSelect(option.value)}
                className={styles.input}
              />
              {option.label}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
};
