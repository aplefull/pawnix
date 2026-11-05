// LIBRARIES
import cx from 'clsx';
import { memo, useState } from 'react';
// UTILS
import { HIDDEN_PAIR } from '../utils';
// TYPES
import type { Pairing } from '../types';
// STYLES
import styles from '@styles/games/word-pairs/board.module.scss';

const getSlotText = (adjective: number | null, adjectives: string[]) => {
  if (adjective === null) return '?';
  if (adjective === HIDDEN_PAIR) return 'paired';
  return adjectives[adjective];
};

type TPairingBoardProps = {
  nouns: string[];
  adjectives: string[];
  pairing: Pairing;
  onChange?: (pairing: Pairing) => void;
};

export const PairingBoard = memo(({ nouns, adjectives, pairing, onChange }: TPairingBoardProps) => {
  const [selected, setSelected] = useState<number | null>(null);

  const isReadOnly = !onChange;

  const handleNounClick = (noun: number) => () => {
    if (!onChange) return;

    const current = pairing[noun];

    if (selected === null) {
      if (current === null || current === HIDDEN_PAIR) return;

      onChange(pairing.map((value, index) => (index === noun ? null : value)));
      setSelected(current);
      return;
    }

    onChange(pairing.map((value, index) => (index === noun ? selected : value === selected ? null : value)));
    setSelected(null);
  };

  const handleAdjectiveClick = (adjective: number) => () => {
    setSelected((current) => (current === adjective ? null : adjective));
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
                  [styles.targetable]: selected !== null,
                  [styles.paired]: adjective !== null,
                })}
                disabled={isReadOnly}
                onClick={handleNounClick(index)}
              >
                <span className={cx(styles.slot, { [styles.hidden]: adjective === HIDDEN_PAIR })}>
                  {getSlotText(adjective, adjectives)}
                </span>
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
            className={cx(styles.adjective, {
              [styles.used]: pairing.includes(index),
              [styles.selected]: selected === index,
            })}
            disabled={isReadOnly}
            aria-pressed={selected === index}
            onClick={handleAdjectiveClick(index)}
          >
            {adjective}
          </button>
        ))}
      </div>
    </div>
  );
});
