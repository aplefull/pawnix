// LIBRARIES
import { ReactNode } from 'react';
import { createTheme, MantineProvider } from '@mantine/core';

type TProvidersProps = {
  children: ReactNode;
};

const theme = createTheme({
  defaultRadius: 'sm',
});

export const Providers = ({ children }: TProvidersProps) => {
  return (
    <MantineProvider defaultColorScheme="dark" theme={theme}>
      {children}
    </MantineProvider>
  );
};
