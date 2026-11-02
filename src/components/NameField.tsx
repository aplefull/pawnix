// LIBRARIES
import type { ChangeEvent } from 'react';
// COMPONENTS
import { TextInput } from '@components';
// CONSTANTS
import { NAME_MAX_LENGTH } from '@constants';

type TNameFieldProps = {
  value: string;
  onChange: (value: string) => void;
  autoFocus?: boolean;
};

export const NameField = ({ value, onChange, autoFocus = false }: TNameFieldProps) => {
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  return (
    <TextInput
      label="Your name"
      placeholder="How the other player sees you"
      autoComplete="nickname"
      maxLength={NAME_MAX_LENGTH}
      value={value}
      onChange={handleChange}
      autoFocus={autoFocus}
    />
  );
};
