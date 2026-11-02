// LIBRARIES
import { memo } from 'react';
// COMPONENTS
import { GamePicker } from '@components';
// STYLES
import styles from '@styles/pages/menu-page.module.scss';

export const IndexPage = memo(() => {
  return (
    <div className={styles.wrapper}>
      <GamePicker />
    </div>
  );
});
