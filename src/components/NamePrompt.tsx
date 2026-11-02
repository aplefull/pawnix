// LIBRARIES
import type { FormEvent } from 'react';
// COMPONENTS
import { Button, NameField, Panel } from '@components';
// HOOKS
import { usePlayerName } from '@hooks';
// STYLES
import styles from '@styles/components/menu.module.scss';

type TNamePromptProps = {
  gameName: string;
  onSubmit: () => void;
};

export const NamePrompt = ({ gameName, onSubmit }: TNamePromptProps) => {
  const { name, setName, isValid } = usePlayerName();

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isValid) return;

    onSubmit();
  };

  return (
    <Panel className={styles.menu}>
      <header className={styles.header}>
        <h1 className={styles.title}>{gameName}</h1>
        <p className={styles.tagline}>Pick a name so the other player knows who you are.</p>
      </header>

      <form className={styles.actions} onSubmit={handleSubmit}>
        <NameField value={name} onChange={setName} autoFocus />
        <Button type="submit" size="lg" fullWidth disabled={!isValid}>
          Join room
        </Button>
      </form>
    </Panel>
  );
};
