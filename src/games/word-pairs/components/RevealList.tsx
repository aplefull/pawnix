// LIBRARIES
import cx from 'clsx';
import { memo } from 'react';
// COMPONENTS
import { Icon } from '@components';
// TYPES
import type { Pairing } from '../types';
// STYLES
import styles from '@styles/games/word-pairs/board.module.scss';

type TRevealListProps = {
  nouns: string[];
  adjectives: string[];
  pairing: number[];
  guess: Pairing;
  guesserName: string;
};

const getVerdict = (pick: number | null, isCorrect: boolean, adjectives: string[], guesserName: string) => {
  if (pick === null) return '...';

  if (isCorrect) {
    return (
      <>
        <Icon name="check" />
        Guessed
      </>
    );
  }

  return (
    <>
      <Icon name="cross" />
      {guesserName} picked {adjectives[pick]}
    </>
  );
};

export const RevealList = memo(({ nouns, adjectives, pairing, guess, guesserName }: TRevealListProps) => {
  return (
    <ol className={styles.reveal}>
      {nouns.map((noun, index) => {
        const pick = guess[index] ?? null;
        const isCorrect = pick === pairing[index];

        return (
          <li
            key={noun}
            className={cx(styles.revealRow, {
              [styles.correct]: pick !== null && isCorrect,
              [styles.wrong]: pick !== null && !isCorrect,
            })}
          >
            <span className={styles.phrase}>
              <span className={styles.slot}>{adjectives[pairing[index]]}</span>
              <span className={styles.nounWord}>{noun}</span>
            </span>
            <span className={cx(styles.verdict, { [styles.pending]: pick === null })}>
              {getVerdict(pick, isCorrect, adjectives, guesserName)}
            </span>
          </li>
        );
      })}
    </ol>
  );
});
