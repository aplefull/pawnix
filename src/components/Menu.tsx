// LIBRARIES
import { type ChangeEvent, memo, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { doc, getDoc } from 'firebase/firestore';
// GAMES
import { type Player, PLAYER_NAMES, PLAYERS, Pawn, type RoomData, useGameStore } from '@games/quoridor';
// COMPONENTS
import { Button, Panel, Spinner, TextInput } from '@components';
// CONSTANTS
import { MENU_STATES } from '@constants';
// UTILS
import { isUuid, logger } from '@utils';
// SERVICES
import { db, ensureSignedIn } from '@services';
// STYLES
import styles from '@styles/components/menu.module.scss';

type TMenuState = keyof typeof MENU_STATES;

type TMenuContentSwitchProps = {
  id: string;
  menuState: TMenuState;
  handleStateChange: (state: TMenuState) => void;
};

const JoinRoom = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleIdInput = async (e: ChangeEvent<HTMLInputElement>) => {
    const roomId = e.target.value.trim();
    setError(null);

    if (!isUuid(roomId)) return;

    setLoading(true);

    try {
      const user = await ensureSignedIn();
      const docSnap = await getDoc(doc(db, 'rooms', roomId));

      if (!docSnap.exists()) {
        setError("This room doesn't exist. Check the code and try again.");
        return;
      }

      const { players } = docSnap.data() as RoomData;
      const isSeated = players.One === user.uid || players.Two === user.uid;

      if (players.One && players.Two && !isSeated) {
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
        placeholder="Paste the room code"
        autoComplete="off"
        spellCheck={false}
        autoFocus
        onChange={handleIdInput}
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

const SelectPlayer = ({ id }: { id: string }) => {
  const navigate = useNavigate();
  const createRoom = useGameStore((state) => state.createRoom);

  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePlayerSelect = (value: Player) => async () => {
    setCreating(true);
    setError(null);

    try {
      await createRoom(id, value);
      navigate(`/play/${id}`);
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

const MenuContentSwitch = memo(({ id, menuState, handleStateChange }: TMenuContentSwitchProps) => {
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
      return <SelectPlayer id={id} />;

    case MENU_STATES.JOIN_ROOM:
      return <JoinRoom />;

    default:
      return null;
  }
});

export const Menu = memo(() => {
  const [menuState, setMenuState] = useState<TMenuState>(MENU_STATES.INITIAL);

  const id = useMemo(() => crypto.randomUUID(), []);

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

      <MenuContentSwitch handleStateChange={setMenuState} menuState={menuState} id={id} />

      {canReturn && (
        <Button variant="ghost" size="sm" className={styles.back} onClick={handleReturn}>
          Back
        </Button>
      )}
    </Panel>
  );
});
