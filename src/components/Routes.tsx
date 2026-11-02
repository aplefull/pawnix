// LIBRARIES
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router';
// PAGES
import { ErrorPage, GamePage, gameLoader, IndexPage, PlayPage, playLoader } from '@pages';
// COMPONENTS
import { PageSpinner } from '@components';

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
    path: '/:gameId',
    element: <GamePage />,
    errorElement: <ErrorPage />,
    hydrateFallbackElement: <PageSpinner />,
    loader: gameLoader,
  },
  {
    path: '*',
    element: <Navigate to="/" />,
  },
]);

export const Routes = () => {
  return <RouterProvider router={router} />;
};
