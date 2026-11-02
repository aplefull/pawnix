// LIBRARIES
import { createBrowserRouter, Navigate, type Params, RouterProvider } from 'react-router';
import { doc, getDoc, onSnapshot, type Unsubscribe, updateDoc } from 'firebase/firestore';
// STORE
import { type RoomData, useGameStore } from '@store';
// SERVICES
import { db } from '@services';
// PAGES
import { IndexPage, ErrorPage, PlayPage } from '@pages';
// COMPONENTS
import { PageSpinner } from '@components';
// CONSTANTS
import { PLAYERS } from '@constants';
// UTILS
import { isUuid } from '@utils';

let unsubscribeRoom: Unsubscribe | null = null;

const joinGame = async ({ roomId, player }: Params) => {
  if (!roomId || !isUuid(roomId)) {
    throw new Error(`Invalid room id: ${roomId}`);
  }

  if (player !== PLAYERS.PLAYER_1 && player !== PLAYERS.PLAYER_2) {
    throw new Error(`Invalid player: ${player}`);
  }

  const docRef = doc(db, 'rooms', roomId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    throw new Error(`Room ${roomId} does not exist`);
  }

  await updateDoc(docRef, {
    isGameStarted: true,
  });

  const { enterRoom, setData } = useGameStore.getState();

  enterRoom(roomId, player);

  unsubscribeRoom?.();
  unsubscribeRoom = onSnapshot(docRef, (doc) => {
    if (doc.exists()) {
      setData(doc.data() as RoomData);
    }
  });
};

const playLoader = ({ params }: { params: Params }) => {
  return { promise: joinGame(params) };
};

const router = createBrowserRouter([
  {
    path: '/',
    element: <IndexPage />,
    errorElement: <ErrorPage />,
  },
  {
    path: '/play/:roomId/:player',
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
