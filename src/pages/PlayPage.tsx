// LIBRARIES
import { Suspense } from 'react';
import { Await, useLoaderData } from 'react-router';
// GAMES
import type { GameModule } from '@games';
// COMPONENTS
import { PageSpinner } from '@components';
// TYPES
import type { playLoader } from './loaders';

export const PlayPage = () => {
  const { promise } = useLoaderData<typeof playLoader>();

  return (
    <Suspense fallback={<PageSpinner />}>
      <Await resolve={promise}>{(gameModule: GameModule) => <gameModule.Game />}</Await>
    </Suspense>
  );
};
