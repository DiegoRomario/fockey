import React from 'react';
import { createRoot } from 'react-dom/client';
import Options from './Options';
import { I18nProvider } from '@/shared/i18n';
import '@/shared/styles/globals.css';

const root = document.getElementById('root');
if (root) {
  createRoot(root).render(
    <React.StrictMode>
      <I18nProvider>
        <Options />
      </I18nProvider>
    </React.StrictMode>
  );
}
