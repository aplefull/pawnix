// LIBRARIES
import { createBrowserRouter, Navigate, type Params, RouterProvider } from 'react-router';
import { doc, onSnapshot, runTransaction, type Unsubscribe } from 'firebase/firestore';
// GAMES
import { type Player, PLAYERS, type RoomData, useGameStore } from '@games/quoridor';
// SERVICES
import { db, ensureSignedIn } from '@services';
// PAGES
import { IndexPage, ErrorPage, PlayPage } from '@pages';
// COMPONENTS
import { PageSpinner } from '@components';
// UTILS
import { isUuid } from '@utils';

let unsubscribeRoom: Unsubscribe | null = null;

const takeSeat = async (roomId: string, uid: string) => {
  const docRef = doc(db, 'rooms', roomId);

  return runTransaction(db, async (transaction) => {
    const docSnap = await transaction.get(docRef);

    if (!docSnap.exists()) {
      throw new Error(`Room ${roomId} does not exist`);
    }

    const { players } = docSnap.data() as RoomData;
    const seats: Player[] = [PLAYERS.PLAYER_1, PLAYERS.PLAYER_2];

    const ownSeat = seats.find((seat) => players[seat] === uid);
    if (ownSeat) return ownSeat;

    const freeSeat = seats.find((seat) => players[seat] === null);
    if (!freeSeat) throw new Error('This room is full. Both seats are already taken.');

    transaction.update(docRef, { [`players.${freeSeat}`]: uid });
    return freeSeat;
  });
};

const joinGame = async ({ roomId }: Params) => {
  if (!roomId || !isUuid(roomId)) {
    throw new Error(`Invalid room id: ${roomId}`);
  }

  const user = await ensureSignedIn();
  const seat = await takeSeat(roomId, user.uid);
  const { enterRoom, setData } = useGameStore.getState();

  enterRoom(roomId, seat);

  unsubscribeRoom?.();

  await new Promise<void>((resolve, reject) => {
    unsubscribeRoom = onSnapshot(
      doc(db, 'rooms', roomId),
      (docSnap) => {
        if (docSnap.exists()) {
          setData(docSnap.data() as RoomData);
        }
        resolve();
      },
      reject
    );
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
