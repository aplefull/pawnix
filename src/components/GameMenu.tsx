// LIBRARIES
import { memo, useState } from 'react';
import { useNavigate } from 'react-router';
// GAMES
import type { GameEntry, GameModule, TCreateRoomOptions } from '@games';
// COMPONENTS
import { Button, JoinRoom, Panel, Spinner } from '@components';
// CONSTANTS
import { MENU_STATES } from '@constants';
// UTILS
import { logger } from '@utils';
// SERVICES
import { createRoom } from '@services';
// STYLES
import styles from '@styles/components/menu.module.scss';

type TMenuState = keyof typeof MENU_STATES;

type TGameMenuProps = {
  game: GameEntry;
  gameModule: GameModule;
};

type TMenuContentSwitchProps = TGameMenuProps & {
  menuState: TMenuState;
  handleStateChange: (state: TMenuState) => void;
};

const CreateRoomStep = ({ game, gameModule }: TGameMenuProps) => {
  const navigate = useNavigate();

  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async ({ seat, state }: TCreateRoomOptions) => {
    setCreating(true);
    setError(null);

    try {
      const roomId = await createRoom({ game: game.id, seats: game.seats, seat, state });
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
      <gameModule.CreateRoom onCreate={handleCreate} />
      {error && <p className={styles.error}>{error}</p>}
    </div>
  );
};

const MenuContentSwitch = memo(({ game, gameModule, menuState, handleStateChange }: TMenuContentSwitchProps) => {
  switch (menuState) {
    case MENU_STATES.INITIAL:
      return (
        <div className={styles.actions}>
          <Button size="lg" fullWidth onClick={() => handleStateChange(MENU_STATES.CREATE_ROOM)}>
            Create room
          </Button>
          <Button size="lg" variant="secondary" fullWidth onClick={() => handleStateChange(MENU_STATES.JOIN_ROOM)}>
            Join room
          </Button>
        </div>
      );

    case MENU_STATES.CREATE_ROOM:
      return <CreateRoomStep game={game} gameModule={gameModule} />;

    case MENU_STATES.JOIN_ROOM:
      return <JoinRoom autoFocus />;

    default:
      return null;
  }
});

export const GameMenu = memo(({ game, gameModule }: TGameMenuProps) => {
  const navigate = useNavigate();

  const [menuState, setMenuState] = useState<TMenuState>(MENU_STATES.INITIAL);

  const handleReturn = () => {
    if (menuState === MENU_STATES.INITIAL) {
      navigate('/');
      return;
    }

    setMenuState(MENU_STATES.INITIAL);
  };

  return (
    <Panel className={styles.menu}>
      <header className={styles.header}>
        <h1 className={styles.title}>{game.name}</h1>
        {menuState === MENU_STATES.INITIAL && <p className={styles.tagline}>{game.tagline}</p>}
      </header>

      <MenuContentSwitch game={game} gameModule={gameModule} handleStateChange={setMenuState} menuState={menuState} />

      <Button variant="ghost" size="sm" className={styles.back} onClick={handleReturn}>
        {menuState === MENU_STATES.INITIAL ? 'All games' : 'Back'}
      </Button>
    </Panel>
  );
});
