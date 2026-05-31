import { RouterProvider } from 'react-router';
import { router } from './routes';
import { AppProvider } from './context/AppContext';
import { ErrorBoundary } from './components/ErrorBoundary';

export default function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <RouterProvider router={router} />
      </AppProvider>
    </ErrorBoundary>
  );
}
