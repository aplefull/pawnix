// LIBRARIES
import cx from 'clsx';
import { memo } from 'react';
// STYLES
import styles from '@styles/games/word-pairs/board.module.scss';

type TRevealListProps = {
  nouns: string[];
  adjectives: string[];
  pairing: number[];
  guess: number[];
  guesserName: string;
};

export const RevealList = memo(({ nouns, adjectives, pairing, guess, guesserName }: TRevealListProps) => {
  return (
    <ol className={styles.reveal}>
      {nouns.map((noun, index) => {
        const isCorrect = guess[index] === pairing[index];

        return (
          <li key={noun} className={cx(styles.revealRow, isCorrect ? styles.correct : styles.wrong)}>
            <span className={styles.phrase}>
              <span className={styles.slot}>{adjectives[pairing[index]]}</span>
              <span className={styles.nounWord}>{noun}</span>
            </span>
            <span className={styles.verdict}>
              {isCorrect ? '✓ Guessed' : `✗ ${guesserName} said ${adjectives[guess[index]]}`}
            </span>
          </li>
        );
      })}
    </ol>
  );
});
