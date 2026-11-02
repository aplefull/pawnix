// LIBRARIES
import { Suspense } from 'react';
import { Await, useLoaderData, useRevalidator } from 'react-router';
// STORE
import { useRoomStore } from '@store';
// HOOKS
import { usePresenceSync } from '@hooks';
// COMPONENTS
import { NamePrompt, PageSpinner } from '@components';
// TYPES
import type { JoinResult, playLoader } from './loaders';
// STYLES
import styles from '@styles/pages/menu-page.module.scss';

type TJoinedGameProps = {
  result: JoinResult;
};

const JoinedGame = ({ result }: TJoinedGameProps) => {
  const { revalidate } = useRevalidator();
  const roomId = useRoomStore((state) => state.roomId);
  const uid = useRoomStore((state) => (state.seat && state.room ? state.room.players[state.seat] : null));

  usePresenceSync(result.gameModule ? roomId : null, uid);

  if (result.needsName) {
    return (
      <div className={styles.wrapper}>
        <NamePrompt gameName={result.needsName.name} onSubmit={revalidate} />
      </div>
    );
  }

  return <result.gameModule.Game />;
};

export const PlayPage = () => {
  const { promise } = useLoaderData<typeof playLoader>();

  return (
    <Suspense fallback={<PageSpinner />}>
      <Await resolve={promise}>{(result: JoinResult) => <JoinedGame result={result} />}</Await>
    </Suspense>
  );
};
