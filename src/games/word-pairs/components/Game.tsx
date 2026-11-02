// LIBRARIES
import { useEffect, useMemo, useState } from 'react';
import { useShallow } from 'zustand/shallow';
// STORE
import type { Seats } from '@store';
import { scoreRound, startNextRound, submitGuess, submitPairing, useWordPairs } from '../store';
// HOOKS
import { useLive, usePublishLive } from '@hooks';
import { useSecret } from '../hooks';
// COMPONENTS
import { Button, Panel, Spinner, WaitingPanel } from '@components';
import { EndScreen } from './EndScreen';
import { PairingBoard } from './PairingBoard';
import { RevealList } from './RevealList';
import { Scoreboard } from './Scoreboard';
// UTILS
import { isRoomFull, logger, notNull } from '@utils';
import { countCorrect, decodePicks, encodePicks, getOtherSeat } from '../utils';
// CONSTANTS
import { PHASES, WORDS_PER_ROUND } from '../constants';
// TYPES
import type { Live, Pairing, Phase, Seat } from '../types';
// STYLES
import styles from '@styles/games/word-pairs/game.module.scss';

type TRoundProps = {
  roomId: string;
  seat: Seat;
  players: Seats;
  names: Seats;
  round: number;
  totalRounds: number;
  phase: Phase;
  matcher: Seat;
  nouns: string[];
  adjectives: string[];
  guess: number[] | null;
  scored: boolean;
  synced: boolean;
};

const EMPTY_PAIRING: Pairing = Array.from({ length: WORDS_PER_ROUND }, () => null);

const Round = ({
  roomId,
  seat,
  players,
  names,
  round,
  totalRounds,
  phase,
  matcher,
  nouns,
  adjectives,
  guess,
  scored,
  synced,
}: TRoundProps) => {
  const [pairing, setPairing] = useState<Pairing>(EMPTY_PAIRING);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const guesser = getOtherSeat(matcher);
  const isMatcher = seat === matcher;
  const matcherName = names[matcher] ?? 'Your friend';
  const guesserName = names[guesser] ?? 'Your friend';

  const canSeeSecret = (phase === PHASES.GUESSING && isMatcher) || phase === PHASES.REVEAL;
  const secretSeat = canSeeSecret && synced ? matcher : null;
  const secret = useSecret(roomId, secretSeat, round);

  const isComplete = pairing.every(notNull);

  const isPicking = (phase === PHASES.MATCHING && isMatcher) || (phase === PHASES.GUESSING && !isMatcher);
  const watchedSeat = phase === PHASES.MATCHING ? matcher : guesser;
  const isWatching = !isPicking && (phase === PHASES.MATCHING || phase === PHASES.GUESSING);

  const ownLive = useMemo<Live | null>(
    () => (isPicking ? { round, phase, picks: encodePicks(pairing, isMatcher) } : null),
    [isPicking, round, phase, pairing, isMatcher]
  );

  usePublishLive(roomId, isPicking ? players[seat] : null, ownLive);

  const watched = useLive<Live>(roomId, isWatching ? players[watchedSeat] : null);
  const livePairing = watched?.round === round && watched.phase === phase ? decodePicks(watched.picks) : EMPTY_PAIRING;
  const liveCount = livePairing.filter(notNull).length;

  useEffect(() => {
    if (phase !== PHASES.REVEAL || scored || !secret) return;

    scoreRound(secret.pairing).catch(() => {});
  }, [phase, scored, secret]);

  const run = (action: () => Promise<void>) => async () => {
    setSubmitting(true);
    setError(null);

    try {
      await action();
    } catch (err) {
      logger.error(err);
      setError('Something went wrong. Try again.');
      setSubmitting(false);
    }
  };

  const handleSubmitPairing = run(() => submitPairing(pairing.filter(notNull)));
  const handleSubmitGuess = run(() => submitGuess(pairing.filter(notNull)));
  const handleNextRound = run(startNextRound);

  if (phase === PHASES.MATCHING && isMatcher) {
    return (
      <Panel className={styles.table}>
        <h2 className={styles.title}>Pair the words</h2>
        <PairingBoard nouns={nouns} adjectives={adjectives} pairing={pairing} onChange={setPairing} />
        {error && <p className={styles.error}>{error}</p>}
        <Button size="lg" fullWidth disabled={!isComplete || submitting} onClick={handleSubmitPairing}>
          Lock in pairs
        </Button>
      </Panel>
    );
  }

  if (phase === PHASES.MATCHING) {
    return (
      <Panel className={styles.table}>
        <h2 className={styles.title}>
          {matcherName} is pairing the words... {liveCount}/{WORDS_PER_ROUND}
        </h2>
        <PairingBoard nouns={nouns} adjectives={adjectives} pairing={livePairing} />
      </Panel>
    );
  }

  if (phase === PHASES.GUESSING && !isMatcher) {
    return (
      <Panel className={styles.table}>
        <h2 className={styles.title}>Guess how {matcherName} paired them</h2>
        <PairingBoard nouns={nouns} adjectives={adjectives} pairing={pairing} onChange={setPairing} />
        {error && <p className={styles.error}>{error}</p>}
        <Button size="lg" fullWidth disabled={!isComplete || submitting} onClick={handleSubmitGuess}>
          Submit guess
        </Button>
      </Panel>
    );
  }

  if (phase === PHASES.GUESSING) {
    return (
      <Panel className={styles.table}>
        <h2 className={styles.title}>
          {guesserName} is guessing... {liveCount}/{WORDS_PER_ROUND}
        </h2>
        {secret ? (
          <RevealList
            nouns={nouns}
            adjectives={adjectives}
            pairing={secret.pairing}
            guess={livePairing}
            guesserName={guesserName}
          />
        ) : (
          <div className={styles.loading}>
            <Spinner />
          </div>
        )}
      </Panel>
    );
  }

  if (!secret || !guess) {
    return (
      <Panel className={styles.loading}>
        <Spinner />
      </Panel>
    );
  }

  const correct = countCorrect(secret.pairing, guess);
  const isLastRound = round >= totalRounds;

  return (
    <Panel className={styles.table}>
      <h2 className={styles.title}>
        {isMatcher
          ? `${guesserName} guessed ${correct} of ${WORDS_PER_ROUND}`
          : `You guessed ${correct} of ${WORDS_PER_ROUND}`}
      </h2>
      <RevealList
        nouns={nouns}
        adjectives={adjectives}
        pairing={secret.pairing}
        guess={guess}
        guesserName={isMatcher ? guesserName : 'You'}
      />
      {error && <p className={styles.error}>{error}</p>}
      <Button size="lg" fullWidth disabled={!scored || submitting} onClick={handleNextRound}>
        {isLastRound ? 'See results' : 'Next round'}
      </Button>
    </Panel>
  );
};

export const Game = () => {
  const view = useWordPairs(
    useShallow((state) => ({
      roomId: state.roomId,
      seat: state.seat,
      players: state.players,
      names: state.names,
      round: state.round,
      totalRounds: state.totalRounds,
      phase: state.phase,
      matcher: state.matcher,
      nouns: state.nouns,
      adjectives: state.adjectives,
      guess: state.guess,
      scores: state.scores,
      scored: state.scored,
      synced: state.synced,
    }))
  );

  const { roomId, seat, players, names, round, totalRounds, phase, matcher, scores } = view;

  const isWaiting = !isRoomFull(players);
  const activeSeat = phase === PHASES.MATCHING ? matcher : phase === PHASES.GUESSING ? getOtherSeat(matcher) : null;

  const renderContent = () => {
    if (!roomId) return null;

    if (isWaiting) {
      return (
        <div className={styles.center}>
          <WaitingPanel roomId={roomId} />
        </div>
      );
    }

    if (phase === PHASES.FINISHED) {
      return <EndScreen seat={seat} names={names} scores={scores} />;
    }

    return <Round key={`${round}-${phase}`} {...view} roomId={roomId} />;
  };

  return (
    <div className={styles.page}>
      <Scoreboard
        round={round}
        totalRounds={totalRounds}
        players={players}
        names={names}
        scores={scores}
        seat={seat}
        activeSeat={isWaiting ? null : activeSeat}
      />
      {renderContent()}
    </div>
  );
};
