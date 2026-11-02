// STYLES
import '@styles/index.scss';
// LIBRARIES
import { createRoot } from 'react-dom/client';
// COMPONENTS
import { App } from '@components';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element not found');
}

createRoot(rootElement).render(<App />);
