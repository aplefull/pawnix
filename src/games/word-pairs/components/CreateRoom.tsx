// LIBRARIES
import { useState } from 'react';
// GAMES
import type { TCreateRoomProps } from '@games';
// COMPONENTS
import { Button, SegmentedControl } from '@components';
// UTILS
import { createInitialState } from '../utils';
// CONSTANTS
import { DEFAULT_ROUNDS, LANGUAGES, ROUND_OPTIONS, SEATS } from '../constants';
// TYPES
import type { Language } from '../types';
// STYLES
import styles from '@styles/games/word-pairs/create-room.module.scss';

const ROUND_CHOICES = ROUND_OPTIONS.map((value) => ({ value: value as number, label: String(value) }));

const LANGUAGE_CHOICES = (Object.keys(LANGUAGES) as Language[]).map((value) => ({ value, label: LANGUAGES[value] }));

export const CreateRoom = ({ onCreate }: TCreateRoomProps) => {
  const [rounds, setRounds] = useState<number>(DEFAULT_ROUNDS);
  const [language, setLanguage] = useState<Language>('ru');

  const handleCreate = () => {
    onCreate({ seat: SEATS[0], state: createInitialState(language, rounds) });
  };

  return (
    <div className={styles.settings}>
      <SegmentedControl label="Rounds" options={ROUND_CHOICES} value={rounds} onChange={setRounds} />
      <SegmentedControl label="Words" options={LANGUAGE_CHOICES} value={language} onChange={setLanguage} />
      <Button size="lg" fullWidth onClick={handleCreate}>
        Create room
      </Button>
    </div>
  );
};
