// LIBRARIES
import { ChangeEvent, memo, useEffect, useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
// REDUX
import { Player, selectPlayer, setRoomId, createNewRoom, AppDispatch } from '@redux';
// COMPONENTS
import { Button, Panel, Pawn, RoomCode, Spinner, TextInput } from '@components';
// CONSTANTS
import { MENU_STATES, PLAYER_NAMES, PLAYERS } from '@constants';
// UTILS
import { isUuid, logger } from '@utils';
// SERVICES
import { db } from '@services';
// STYLES
import styles from '@styles/components/menu.module.scss';

type TMenuState = keyof typeof MENU_STATES;

type TMenuContentSwitchProps = {
  id: string;
  menuState: TMenuState;
  handleStateChange: (state: TMenuState) => void;
};

const WaitingRoom = ({ id }: { id: string }) => {
  const navigate = useNavigate();

  useEffect(() => {
    const docRef = doc(db, 'rooms', id);

    const unsubscribe = onSnapshot(docRef, (doc) => {
      if (!doc.exists()) {
        logger.error(`Room ${id} does not exist`);
        return;
      }

      const { isGameStarted, initialPlayer } = doc.data();

      if (isGameStarted) {
        navigate(`/play/${id}/${initialPlayer}`);
      }
    });

    return unsubscribe;
  }, [id, navigate]);

  return (
    <div className={styles.section}>
      <div className={styles.waiting}>
        <Spinner size="sm" />
        <span>Waiting for your opponent to join...</span>
      </div>
      <p className={styles.hint}>Send them this room code:</p>
      <RoomCode code={id} />
    </div>
  );
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

    const docSnap = await getDoc(doc(db, 'rooms', roomId));

    setLoading(false);

    if (!docSnap.exists()) {
      setError("This room doesn't exist. Check the code and try again.");
      return;
    }

    const { initialPlayer } = docSnap.data();
    const player = initialPlayer === PLAYERS.PLAYER_1 ? PLAYERS.PLAYER_2 : PLAYERS.PLAYER_1;

    navigate(`/play/${roomId}/${player}`);
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

const MenuContentSwitch = memo(({ id, menuState, handleStateChange }: TMenuContentSwitchProps) => {
  const dispatch = useDispatch<AppDispatch>();

  const handlePlayerSelect = (value: Player) => () => {
    dispatch(selectPlayer(value));
    dispatch(setRoomId(id));
    dispatch(
      createNewRoom({
        roomId: id,
        initialPlayer: value,
      })
    );
    handleStateChange(MENU_STATES.WAITING);
  };

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
        </div>
      );

    case MENU_STATES.JOIN_ROOM:
      return <JoinRoom />;

    case MENU_STATES.WAITING:
      return <WaitingRoom id={id} />;

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
