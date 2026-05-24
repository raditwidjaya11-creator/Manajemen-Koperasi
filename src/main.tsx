import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { CooperativeProvider } from './store/cooperativeStore';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <CooperativeProvider>
      <App />
    </CooperativeProvider>
  </StrictMode>,
);
