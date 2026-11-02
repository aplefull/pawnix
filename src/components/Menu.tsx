// LIBRARIES
import { ChangeEvent, memo, useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { Button, Loader, Paper, TextInput } from '@mantine/core';
// REDUX
import { Player, selectPlayer, setRoomId, createNewRoom, AppDispatch } from '@redux';
// CONSTANTS
import { MENU_STATES, PLAYERS } from '@constants';
// UTILS
import { isUuid } from '@utils';
// STYLES
import styles from '@styles/components/menu.module.scss';
// FIREBASE
import { db } from '@main';

type TMenuContentSwitchProps = {
  id: string;
  menuState: keyof typeof MENU_STATES;
  handleStateChange: (state: keyof typeof MENU_STATES) => void;
};

const MenuContentSwitch = memo(({ id, menuState, handleStateChange }: TMenuContentSwitchProps) => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  const [loading, setLoading] = useState(false);

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

  const handleIdInput = async (e: ChangeEvent<HTMLInputElement>) => {
    if (isUuid(e.target.value)) {
      setLoading(true);

      const docRef = doc(db, 'rooms', e.target.value);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        throw new Error(`Room ${e.target.value} does not exist`);
      }

      const data = docSnap.data();

      const { initialPlayer } = data;

      setLoading(false);

      const player = initialPlayer === PLAYERS.PLAYER_1 ? PLAYERS.PLAYER_2 : PLAYERS.PLAYER_1;

      navigate(`/play/${e.target.value}/${player}`);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(id);
  };

  switch (menuState) {
    case MENU_STATES.INITIAL:
      return (
        <>
          <Button radius="lg" className={styles.createNew} onClick={() => handleStateChange(MENU_STATES.SELECT_PLAYER)}>
            Create new room
          </Button>
          <Button radius="lg" className={styles.join} onClick={() => handleStateChange(MENU_STATES.JOIN_ROOM)}>
            Join room
          </Button>
        </>
      );

    case MENU_STATES.SELECT_PLAYER:
      return (
        <>
          <p className={styles.playerSelectText}>Select your color. (Whites go first)</p>
          <div className={styles.playerSelect}>
            <div className={styles.white} onClick={handlePlayerSelect(PLAYERS.PLAYER_1)} />
            <div className={styles.black} onClick={handlePlayerSelect(PLAYERS.PLAYER_2)} />
          </div>
        </>
      );

    case MENU_STATES.JOIN_ROOM:
      return (
        <div className={styles.joinContainer}>
          <p>Paste in your code:</p>
          <TextInput autoComplete="off" onChange={handleIdInput} disabled={loading} />
          {loading && <Loader mt={20} size="md" />}
        </div>
      );

    case MENU_STATES.WAITING:
      const docRef = doc(db, 'rooms', id);

      const unsub = onSnapshot(docRef, (doc) => {
        if (!doc.exists()) {
          throw new Error(`Room ${id} does not exist`);
        }
        const { isGameStarted, initialPlayer } = doc.data();

        if (isGameStarted) {
          navigate(`/play/${id}/${initialPlayer}`);
          unsub();
        }
      });

      return (
        <div className={styles.waiting}>
          <p>Waiting for second player to join...</p>
          <p>Copy this code and send to second player:</p>
          <div>
            <p className={styles.id}>{id}</p>
            <Button onClick={handleCopy}>Copy</Button>
          </div>
        </div>
      );
    default:
      return null;
  }
});

export const Menu = memo(() => {
  const [menuState, setMenuState] = useState<keyof typeof MENU_STATES>(MENU_STATES.INITIAL);

  const id = useMemo(() => crypto.randomUUID(), []);

  const handleReturn = () => {
    setMenuState(MENU_STATES.INITIAL);
  };

  return (
    <div className={styles.menu}>
      <Paper className={styles.innerContainer} shadow="sm" radius="md" p="sm" withBorder>
        <MenuContentSwitch handleStateChange={setMenuState} menuState={menuState} id={id} />
      </Paper>
      {menuState !== MENU_STATES.INITIAL && menuState !== MENU_STATES.WAITING && (
        <span className={styles.return} onClick={handleReturn}>
          Return
        </span>
      )}
    </div>
  );
});
