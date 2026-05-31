import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, beforeEach, describe, test, expect } from 'vitest';
import { MemoryRouter } from 'react-router';

vi.mock('../app/context/AppContext', () => ({
  useApp: vi.fn(),
}));

vi.mock('../app/components/Header', () => ({
  Header: () => <header data-testid="header" />,
}));

import { useApp } from '../app/context/AppContext';
import { AdminDashboard } from '../app/pages/AdminDashboard';

const mockUseApp = vi.mocked(useApp);

const mockIncident = {
  id: 'CW-MANAGE1',
  type: 'Graffiti' as const,
  location: 'Block A',
  description: 'Graffiti on south wall',
  status: 'NEW' as const,
  date: '2026-05-31T10:00:00Z',
  photos: [],
};

const defaultContext = {
  incidents: [mockIncident],
  pendingIncidents: [],
  isLoadingIncidents: false,
  refreshIncidents: vi.fn().mockResolvedValue(undefined),
  refreshPendingIncidents: vi.fn().mockResolvedValue(undefined),
  updateIncidentStatus: vi.fn().mockResolvedValue(undefined),
  deleteIncident: vi.fn().mockResolvedValue(undefined),
  reviewIncident: vi.fn().mockResolvedValue(undefined),
  reviewPhoto: vi.fn().mockResolvedValue(undefined),
  user: { name: 'Admin', email: 'admin@test.com' },
  isAuthenticated: true,
  token: 'test-token',
};

beforeEach(() => {
  vi.clearAllMocks();
  mockUseApp.mockReturnValue(defaultContext as any);
});

function renderAdminDashboard() {
  return render(<MemoryRouter><AdminDashboard /></MemoryRouter>);
}

describe('AdminDashboard — incidents list', () => {
  test('FT-011: renders the incident location in the manage tab', async () => {
    renderAdminDashboard();

    // Click the "Manage Incidents" tab
    fireEvent.click(screen.getByText(/Manage Incidents/i));

    await waitFor(() => {
      expect(screen.getByText('Block A')).toBeInTheDocument();
    });
  });

  test('FT-011-B: shows the incident ID badge', async () => {
    renderAdminDashboard();
    fireEvent.click(screen.getByText(/Manage Incidents/i));

    await waitFor(() => {
      expect(screen.getByText('CW-MANAGE1')).toBeInTheDocument();
    });
  });
});

describe('AdminDashboard — status update', () => {
  test('FT-012: selecting a new status and confirming calls updateIncidentStatus', async () => {
    renderAdminDashboard();
    fireEvent.click(screen.getByText(/Manage Incidents/i));

    // Open the status update modal by clicking the row's Update Status button
    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: /Update Status/i }).length).toBeGreaterThan(0);
    });
    fireEvent.click(screen.getAllByRole('button', { name: /Update Status/i })[0]);

    // The modal renders a <select> — change it to IN_PROGRESS
    await waitFor(() => {
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });
    fireEvent.change(screen.getByRole('combobox'), {
      target: { value: 'IN_PROGRESS' },
    });

    // Click the modal's confirm button (last "Update Status" button in the DOM)
    const allUpdateBtns = screen.getAllByRole('button', { name: /Update Status/i });
    fireEvent.click(allUpdateBtns[allUpdateBtns.length - 1]);

    await waitFor(() => {
      expect(defaultContext.updateIncidentStatus).toHaveBeenCalledWith('CW-MANAGE1', 'IN_PROGRESS');
    });
  });
});
