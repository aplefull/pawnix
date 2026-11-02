// STYLES
import '@mantine/core/styles.css';
// LIBRARIES
import { getFirestore } from 'firebase/firestore';
import { createRoot } from 'react-dom/client';
import { initializeApp } from 'firebase/app';
import { Provider } from 'react-redux';
// REDUX
import { store } from '@redux';
// COMPONENTS
import { App } from '@components';
// CONSTANTS
import { FIREBASE_CONFIG } from '@constants';
// STYLES
import '@styles/index.scss';

const rootElement = document.getElementById('root');
const root = createRoot(rootElement!);

initializeApp(FIREBASE_CONFIG);
export const db = getFirestore();

// TODO investigate why moving provider inside App breaks hmr
root.render(
  <Provider store={store}>
    <App />
  </Provider>
);
