import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, beforeEach, describe, test, expect } from 'vitest';
import { MemoryRouter } from 'react-router';

vi.mock('../app/context/AppContext', () => ({
  useApp: vi.fn(),
}));

vi.mock('axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

// StatsCard fetches data independently — stub it out
vi.mock('../app/components/StatsCard', () => ({
  StatsCard: () => null,
}));

// Header uses useApp and useNavigate — stub it out
vi.mock('../app/components/Header', () => ({
  Header: () => <header data-testid="header" />,
}));

import { useApp } from '../app/context/AppContext';
import axios from 'axios';
import { TrackReport } from '../app/pages/TrackReport';

const mockUseApp = vi.mocked(useApp);
const ax = axios as any;

const mockIncident = {
  id: 'CW-ABC123',
  type: 'Graffiti' as const,
  location: 'Block A, Charlemont Street',
  description: 'Graffiti on the south wall',
  status: 'NEW' as const,
  date: '2026-05-31T10:00:00Z',
  photos: [],
};

beforeEach(() => {
  vi.clearAllMocks();
  mockUseApp.mockReturnValue({
    getIncidentById: vi.fn().mockReturnValue(undefined),
    incidents: [],
  } as any);
});

function renderTrackReport() {
  return render(<MemoryRouter><TrackReport /></MemoryRouter>);
}

describe('TrackReport — successful search', () => {
  test('FT-009: displays incident card when API returns a matching incident', async () => {
    ax.get.mockResolvedValueOnce({
      data: {
        shortId: 'CW-ABC123',
        incidentType: 'graffiti',
        location: 'Block A, Charlemont Street',
        description: 'Graffiti on the south wall',
        status: 'NEW',
        reportedDate: '2026-05-31T10:00:00Z',
        photos: [],
      },
    });

    renderTrackReport();

    fireEvent.change(screen.getByPlaceholderText(/Enter Incident ID/i), {
      target: { value: 'CW-ABC123' },
    });
    fireEvent.submit(screen.getByRole('button', { name: /search/i }).closest('form')!);

    await waitFor(() => {
      expect(screen.getByText('Block A, Charlemont Street')).toBeInTheDocument();
    });
  });

  test('FT-009-B: uses cached incident from context when available (no API call)', async () => {
    mockUseApp.mockReturnValue({
      getIncidentById: vi.fn().mockReturnValue(mockIncident),
      incidents: [mockIncident],
    } as any);

    renderTrackReport();

    fireEvent.change(screen.getByPlaceholderText(/Enter Incident ID/i), {
      target: { value: 'CW-ABC123' },
    });
    fireEvent.submit(screen.getByRole('button', { name: /search/i }).closest('form')!);

    await waitFor(() => {
      expect(screen.getByText('Block A, Charlemont Street')).toBeInTheDocument();
    });
    expect(ax.get).not.toHaveBeenCalled();
  });
});

describe('TrackReport — not found', () => {
  test('FT-010: shows "not found" message when API returns 404', async () => {
    ax.get.mockRejectedValueOnce({ response: { status: 404 } });

    renderTrackReport();

    fireEvent.change(screen.getByPlaceholderText(/Enter Incident ID/i), {
      target: { value: 'CW-XXXXXX' },
    });
    fireEvent.submit(screen.getByRole('button', { name: /search/i }).closest('form')!);

    await waitFor(() => {
      expect(screen.getByText(/No incident found/i)).toBeInTheDocument();
    });
  });

  test('FT-010-B: shows connection error message on network failure', async () => {
    ax.get.mockRejectedValueOnce(new Error('Network Error'));

    renderTrackReport();

    fireEvent.change(screen.getByPlaceholderText(/Enter Incident ID/i), {
      target: { value: 'CW-XXXXXX' },
    });
    fireEvent.submit(screen.getByRole('button', { name: /search/i }).closest('form')!);

    await waitFor(() => {
      expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument();
    });
  });
});
