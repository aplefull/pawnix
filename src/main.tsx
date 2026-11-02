// STYLES
import '@styles/index.scss';
// LIBRARIES
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
// REDUX
import { store } from '@redux';
// COMPONENTS
import { App } from '@components';

const rootElement = document.getElementById('root');
const root = createRoot(rootElement!);

// TODO investigate why moving provider inside App breaks hmr
root.render(
  <Provider store={store}>
    <App />
  </Provider>
);
