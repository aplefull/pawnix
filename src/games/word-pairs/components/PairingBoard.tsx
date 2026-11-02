// LIBRARIES
import cx from 'clsx';
import { memo, useState } from 'react';
// STYLES
import styles from '@styles/games/word-pairs/board.module.scss';

export type Pairing = (number | null)[];

type TPairingBoardProps = {
  nouns: string[];
  adjectives: string[];
  pairing: Pairing;
  onChange?: (pairing: Pairing) => void;
};

const findNextFree = (pairing: Pairing, from: number) => {
  for (let step = 1; step <= pairing.length; step++) {
    const index = (from + step) % pairing.length;
    if (pairing[index] === null) return index;
  }

  return null;
};

export const PairingBoard = memo(({ nouns, adjectives, pairing, onChange }: TPairingBoardProps) => {
  const [selected, setSelected] = useState<number | null>(null);

  const isReadOnly = !onChange;

  const handleNounClick = (noun: number) => () => {
    setSelected((current) => (current === noun ? null : noun));
  };

  const handleAdjectiveClick = (adjective: number) => () => {
    if (!onChange) return;

    const target = selected ?? (pairing.includes(adjective) ? null : pairing.indexOf(null));
    const cleared = pairing.map((value) => (value === adjective ? null : value));

    if (target === null || target === -1) {
      onChange(cleared);
      return;
    }

    if (pairing[target] === adjective) {
      onChange(cleared);
      setSelected(null);
      return;
    }

    const next = cleared.map((value, noun) => (noun === target ? adjective : value));

    onChange(next);
    setSelected(selected === null ? null : findNextFree(next, target));
  };

  return (
    <div className={styles.board}>
      <ol className={styles.nouns}>
        {nouns.map((noun, index) => {
          const adjective = pairing[index];

          return (
            <li key={noun}>
              <button
                type="button"
                className={cx(styles.noun, {
                  [styles.selected]: selected === index,
                  [styles.paired]: adjective !== null,
                })}
                disabled={isReadOnly}
                aria-pressed={selected === index}
                onClick={handleNounClick(index)}
              >
                <span className={styles.slot}>{adjective === null ? '?' : adjectives[adjective]}</span>
                <span className={styles.nounWord}>{noun}</span>
              </button>
            </li>
          );
        })}
      </ol>

      <div className={styles.adjectives}>
        {adjectives.map((adjective, index) => (
          <button
            key={adjective}
            type="button"
            className={cx(styles.adjective, { [styles.used]: pairing.includes(index) })}
            disabled={isReadOnly}
            onClick={handleAdjectiveClick(index)}
          >
            {adjective}
          </button>
        ))}
      </div>
    </div>
  );
});
