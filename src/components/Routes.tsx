// LIBRARIES
import { validate } from 'uuid';
import { useDispatch } from 'react-redux';
import { createBrowserRouter, Navigate, Params, RouterProvider } from 'react-router';
import { doc, getDoc, onSnapshot, updateDoc } from 'firebase/firestore';
// REDUX
import { selectPlayer, setData, setRoomId, AppDispatch } from '@redux';
// COMPONENTS
import { db } from '@main';
// PAGES
import { IndexPage, ErrorPage, PlayPage } from '@pages';
// CONSTANTS
import { PLAYERS } from '@constants';

export const Routes = () => {
  const dispatch = useDispatch<AppDispatch>();

  const loader = async ({ params }: { params: Params }) => {
    const promise = new Promise<number>(async (resolve, reject) => {
      const { roomId, player } = params;

      if (!roomId || !validate(roomId)) {
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

      dispatch(selectPlayer(player));
      dispatch(setRoomId(roomId));

      onSnapshot(docRef, (doc) => {
        dispatch(setData(doc.data()));
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
      loader,
    },
    {
      path: '*',
      element: <Navigate to="/" />,
    },
  ]);

  return <RouterProvider router={router} />;
};
