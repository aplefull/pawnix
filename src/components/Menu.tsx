// LIBRARIES
import { type ChangeEvent, memo, useState } from 'react';
import { useNavigate } from 'react-router';
// GAMES
import { GAME_ID, INITIAL_GAME_STATE, type Player, PLAYER_NAMES, PLAYERS, Pawn, SEATS } from '@games/quoridor';
// COMPONENTS
import { Button, Panel, Spinner, TextInput } from '@components';
// CONSTANTS
import { MENU_STATES, ROOM_CODE_LENGTH } from '@constants';
// UTILS
import { getSeatOf, isRoomCode, isRoomFull, logger, normalizeRoomCode } from '@utils';
// SERVICES
import { createRoom, ensureSignedIn, fetchRoom } from '@services';
// STYLES
import styles from '@styles/components/menu.module.scss';

type TMenuState = keyof typeof MENU_STATES;

type TMenuContentSwitchProps = {
  menuState: TMenuState;
  handleStateChange: (state: TMenuState) => void;
};

const JoinRoom = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCodeInput = async (e: ChangeEvent<HTMLInputElement>) => {
    const roomId = normalizeRoomCode(e.target.value);
    setError(null);

    if (!isRoomCode(roomId)) return;

    setLoading(true);

    try {
      const user = await ensureSignedIn();
      const room = await fetchRoom(roomId);

      if (!room) {
        setError("This room doesn't exist. Check the code and try again.");
        return;
      }

      if (isRoomFull(room.players) && !getSeatOf(room.players, user.uid)) {
        setError('This room is full.');
        return;
      }

      navigate(`/play/${roomId}`);
    } catch (err) {
      logger.error(err);
      setError("Couldn't join this room. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.section}>
      <TextInput
        label="Room code"
        placeholder="Enter the room code"
        autoComplete="off"
        autoCapitalize="characters"
        spellCheck={false}
        maxLength={ROOM_CODE_LENGTH}
        className={styles.codeInput}
        autoFocus
        onChange={handleCodeInput}
        disabled={loading}
        error={error}
      />
      {loading && (
        <div className={styles.waiting}>
          <Spinner size="sm" />
          <span>Joining room...</span>
        </div>
      )}
    </div>
  );
};

const SelectPlayer = () => {
  const navigate = useNavigate();

  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePlayerSelect = (value: Player) => async () => {
    setCreating(true);
    setError(null);

    try {
      const roomId = await createRoom({ game: GAME_ID, seats: SEATS, seat: value, state: INITIAL_GAME_STATE });
      navigate(`/play/${roomId}`);
    } catch (err) {
      logger.error(err);
      setError("Couldn't create a room. Try again.");
      setCreating(false);
    }
  };

  if (creating) {
    return (
      <div className={styles.waiting}>
        <Spinner size="sm" />
        <span>Creating room...</span>
      </div>
    );
  }

  return (
    <div className={styles.section}>
      <p className={styles.hint}>Pick your pawn</p>
      <div className={styles.pawnChoice}>
        {[PLAYERS.PLAYER_1, PLAYERS.PLAYER_2].map((value) => (
          <button key={value} type="button" className={styles.pawnOption} onClick={handlePlayerSelect(value)}>
            <Pawn player={value} className={styles.pawnPreview} />
            <span className={styles.pawnName}>{PLAYER_NAMES[value]}</span>
            <span className={styles.pawnOrder}>{value === PLAYERS.PLAYER_1 ? 'Moves first' : 'Moves second'}</span>
          </button>
        ))}
      </div>
      {error && <p className={styles.error}>{error}</p>}
    </div>
  );
};

const MenuContentSwitch = memo(({ menuState, handleStateChange }: TMenuContentSwitchProps) => {
  switch (menuState) {
    case MENU_STATES.INITIAL:
      return (
        <div className={styles.actions}>
          <Button size="lg" fullWidth onClick={() => handleStateChange(MENU_STATES.SELECT_PLAYER)}>
            Create room
          </Button>
          <Button size="lg" variant="secondary" fullWidth onClick={() => handleStateChange(MENU_STATES.JOIN_ROOM)}>
            Join room
          </Button>
        </div>
      );

    case MENU_STATES.SELECT_PLAYER:
      return <SelectPlayer />;

    case MENU_STATES.JOIN_ROOM:
      return <JoinRoom />;

    default:
      return null;
  }
});

export const Menu = memo(() => {
  const [menuState, setMenuState] = useState<TMenuState>(MENU_STATES.INITIAL);

  const handleReturn = () => {
    setMenuState(MENU_STATES.INITIAL);
  };

  const canReturn = menuState === MENU_STATES.SELECT_PLAYER || menuState === MENU_STATES.JOIN_ROOM;

  return (
    <Panel className={styles.menu}>
      <header className={styles.header}>
        <h1 className={styles.title}>Quoridor</h1>
        {menuState === MENU_STATES.INITIAL && (
          <p className={styles.tagline}>Reach the far side first. Use walls to slow your opponent down.</p>
        )}
      </header>

      <MenuContentSwitch handleStateChange={setMenuState} menuState={menuState} />

      {canReturn && (
        <Button variant="ghost" size="sm" className={styles.back} onClick={handleReturn}>
          Back
        </Button>
      )}
    </Panel>
  );
});
