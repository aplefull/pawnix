// LIBRARIES
import { memo } from 'react';
import { Link } from 'react-router';
// GAMES
import { GAMES } from '@games';
// COMPONENTS
import { JoinRoom, Panel } from '@components';
// CONSTANTS
import { SITE_NAME } from '@constants';
// STYLES
import styles from '@styles/components/menu.module.scss';

export const GamePicker = memo(() => {
  return (
    <Panel className={styles.menu}>
      <header className={styles.header}>
        <h1 className={styles.title}>{SITE_NAME}</h1>
      </header>

      <nav className={styles.games}>
        {GAMES.map((game) => (
          <Link key={game.id} to={`/${game.id}`} className={styles.gameCard}>
            <span className={styles.gameName}>{game.name}</span>
            <span className={styles.gameTagline}>{game.tagline}</span>
          </Link>
        ))}
      </nav>

      <JoinRoom label="Have a room code?" />
    </Panel>
  );
});
