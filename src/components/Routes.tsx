// LIBRARIES
import { createBrowserRouter, Navigate, Params, RouterProvider } from 'react-router';
import { doc, getDoc, onSnapshot, updateDoc } from 'firebase/firestore';
// REDUX
import { selectPlayer, setData, setRoomId, store } from '@redux';
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

const playLoader = async ({ params }: { params: Params }) => {
  const promise = new Promise<number>(async (resolve, reject) => {
    const { roomId, player } = params;

    if (!roomId || !isUuid(roomId)) {
      reject(`Invalid room id: ${roomId}`);
      return;
    }

    if (player !== PLAYERS.PLAYER_1 && player !== PLAYERS.PLAYER_2) {
      reject(`Invalid player: ${player}`);
      return;
    }

    const docRef = doc(db, 'rooms', roomId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      reject(`Room ${roomId} does not exist`);
      return;
    }

    await updateDoc(docRef, {
      isGameStarted: true,
    });

    store.dispatch(selectPlayer(player));
    store.dispatch(setRoomId(roomId));

    onSnapshot(docRef, (doc) => {
      store.dispatch(setData(doc.data()));
    });

    resolve(1);
  });

  return { promise };
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
