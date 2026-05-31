import { render, RenderOptions } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { AppProvider } from '../app/context/AppContext';

export function renderWithProviders(ui: React.ReactElement, options?: RenderOptions) {
  return render(ui, {
    wrapper: ({ children }) => (
      <MemoryRouter>
        <AppProvider>{children}</AppProvider>
      </MemoryRouter>
    ),
    ...options,
  });
}

