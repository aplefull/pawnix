// LIBRARIES
import { memo } from 'react';
import { useLoaderData } from 'react-router';
// COMPONENTS
import { GameMenu } from '@components';
// TYPES
import type { gameLoader } from './loaders';
// STYLES
import styles from '@styles/pages/menu-page.module.scss';

export const GamePage = memo(() => {
  const { game, gameModule } = useLoaderData<typeof gameLoader>();

  return (
    <div className={styles.wrapper}>
      <GameMenu key={game.id} game={game} gameModule={gameModule} />
    </div>
  );
});
