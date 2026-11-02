// LIBRARIES
import { createBrowserRouter, Navigate, type Params, RouterProvider, redirect } from 'react-router';
import type { Unsubscribe } from 'firebase/firestore';
// STORE
import { useRoomStore } from '@store';
// SERVICES
import { claimSeat, ensureSignedIn, subscribeRoom } from '@services';
// PAGES
import { IndexPage, ErrorPage, PlayPage } from '@pages';
// COMPONENTS
import { PageSpinner } from '@components';
// UTILS
import { isRoomCode, normalizeRoomCode } from '@utils';

let unsubscribeRoom: Unsubscribe | null = null;

const joinGame = async (roomId: string) => {
  const user = await ensureSignedIn();
  const seat = await claimSeat(roomId, user.uid);
  const { enterRoom, setRoom } = useRoomStore.getState();

  enterRoom(roomId, seat);

  unsubscribeRoom?.();

  await new Promise<void>((resolve, reject) => {
    unsubscribeRoom = subscribeRoom(
      roomId,
      (room) => {
        if (room) {
          setRoom(room);
        }
        resolve();
      },
      reject
    );
  });
};

const playLoader = ({ params }: { params: Params }) => {
  const roomId = normalizeRoomCode(params.roomId ?? '');

  if (!isRoomCode(roomId)) {
    throw new Error(`Invalid room code: ${params.roomId}`);
  }

  if (roomId !== params.roomId) {
    throw redirect(`/play/${roomId}`);
  }

  return { promise: joinGame(roomId) };
};

const router = createBrowserRouter([
  {
    path: '/',
    element: <IndexPage />,
    errorElement: <ErrorPage />,
  },
  {
    path: '/play/:roomId',
    element: <PlayPage />,
    errorElement: <ErrorPage />,
    hydrateFallbackElement: <PageSpinner />,
    loader: playLoader,
  },
  {
    path: '*',
    element: <Navigate to="/" />,
  },
]);

export const Routes = () => {
  return <RouterProvider router={router} />;
};
