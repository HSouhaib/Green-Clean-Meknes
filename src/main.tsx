import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import '@fontsource-variable/inter';
import '@fontsource-variable/noto-sans-arabic';
import './index.css';
import App from './App';
import { TRPCProvider } from '@/providers/trpc';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { ErrorModalProvider } from '@/providers/ErrorModalProvider';
import { Toaster } from '@/components/ui/sonner';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <TRPCProvider>
        <LanguageProvider>
          <ErrorModalProvider>
            <App />
            <Toaster />
          </ErrorModalProvider>
        </LanguageProvider>
      </TRPCProvider>
    </BrowserRouter>
  </StrictMode>,
);
