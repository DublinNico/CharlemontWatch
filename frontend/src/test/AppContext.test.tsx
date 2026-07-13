import { renderHook, act, waitFor } from '@testing-library/react';
import { vi, beforeEach, describe, test, expect } from 'vitest';
import { MemoryRouter } from 'react-router';
import { AppProvider, useApp } from '../app/context/AppContext';

vi.mock('axios', () => ({
  default: {
    get: vi.fn().mockResolvedValue({ data: [] }),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

import axios from 'axios';
const ax = axios as any;

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <MemoryRouter><AppProvider>{children}</AppProvider></MemoryRouter>
);

const mockApiIncident = {
  _id: 'abc123',
  shortId: 'CW-ABC123',
  incidentType: 'graffiti',
  location: 'Block A',
  description: 'Test graffiti',
  status: 'NEW',
  reportedDate: '2026-05-31T10:00:00Z',
  photos: [],
};

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  ax.get.mockResolvedValue({ data: [] });
});

// ─── refreshIncidents ─────────────────────────────────────────────────────────

describe('AppContext — refreshIncidents', () => {
  test('FT-001: fetches incidents and maps API shape to frontend Incident type', async () => {
    // Use mockResolvedValue (not Once) — the AppProvider fires an initial fetch on mount
    // which would consume a One-shot mock before the test's own call.
    ax.get.mockResolvedValue({ data: [mockApiIncident] });
    const { result } = renderHook(() => useApp(), { wrapper });

    await waitFor(() => expect(result.current.incidents).toHaveLength(1));

    const incident = result.current.incidents[0];
    expect(incident.id).toBe('CW-ABC123');
    expect(incident.type).toBe('Graffiti');
    expect(incident.location).toBe('Block A');
    expect(incident.status).toBe('NEW');
  });
});

// ─── addIncident ──────────────────────────────────────────────────────────────

describe('AppContext — addIncident', () => {
  test('FT-002: POSTs to /api/incidents/report and returns the incidentId', async () => {
    ax.post.mockResolvedValueOnce({ data: { incidentId: 'CW-NEW001' } });
    const { result } = renderHook(() => useApp(), { wrapper });

    let returnedId: string;
    await act(async () => {
      returnedId = await result.current.addIncident({
        type: 'Graffiti',
        location: 'Block B',
        description: 'New graffiti',
        reporterEmail: 'jane@example.com',
        status: 'PENDING_REVIEW',
        photos: [],
      });
    });

    expect(ax.post).toHaveBeenCalledWith(
      expect.stringContaining('/incidents/report'),
      expect.any(FormData),
      expect.objectContaining({ headers: expect.objectContaining({ 'Content-Type': 'multipart/form-data' }) })
    );
    expect(returnedId!).toBe('CW-NEW001');
  });

  test('FT-002-B: FormData includes mapped incidentType (frontend label → API value)', async () => {
    ax.post.mockResolvedValueOnce({ data: { incidentId: 'CW-NEW002' } });
    const { result } = renderHook(() => useApp(), { wrapper });

    await act(async () => {
      await result.current.addIncident({
        type: 'Anti-Social Behaviour',
        location: 'Block C',
        description: 'Noise issue',
        reporterEmail: 'jane@example.com',
        status: 'PENDING_REVIEW',
        photos: [],
      });
    });

    const formData: FormData = ax.post.mock.calls[0][1];
    expect(formData.get('incidentType')).toBe('antisocial');
  });
});

// ─── login / logout ───────────────────────────────────────────────────────────

describe('AppContext — login', () => {
  test('FT-003: stores JWT in localStorage and sets isAuthenticated on success', async () => {
    ax.post.mockResolvedValueOnce({ data: { token: 'test-jwt', user: { name: 'Admin' } } });
    const { result } = renderHook(() => useApp(), { wrapper });

    let success: boolean;
    await act(async () => {
      success = await result.current.login('admin@test.com', 'pass');
    });

    expect(success!).toBe(true);
    expect(result.current.isAuthenticated).toBe(true);
    expect(localStorage.getItem('token')).toBe('test-jwt');
  });

  test('FT-003-B: returns false and does not set token when credentials are wrong', async () => {
    ax.post.mockRejectedValueOnce(new Error('401'));
    const { result } = renderHook(() => useApp(), { wrapper });

    let success: boolean;
    await act(async () => {
      success = await result.current.login('bad@test.com', 'wrong');
    });

    expect(success!).toBe(false);
    expect(result.current.isAuthenticated).toBe(false);
    expect(localStorage.getItem('token')).toBeNull();
  });
});

describe('AppContext — logout', () => {
  test('FT-004: clears token and user from localStorage and sets isAuthenticated to false', async () => {
    ax.post.mockResolvedValueOnce({ data: { token: 'test-jwt', user: { name: 'Admin' } } });
    const { result } = renderHook(() => useApp(), { wrapper });

    await act(async () => { await result.current.login('admin@test.com', 'pass'); });
    expect(result.current.isAuthenticated).toBe(true);

    act(() => { result.current.logout(); });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('charlemont-user')).toBeNull();
  });
});

// ─── updateIncidentStatus ─────────────────────────────────────────────────────

describe('AppContext — updateIncidentStatus', () => {
  test('FT-005: PATCHes status endpoint and updates incident in local state', async () => {
    ax.get.mockResolvedValue({ data: [mockApiIncident] });
    ax.patch.mockResolvedValueOnce({ data: {} });
    const { result } = renderHook(() => useApp(), { wrapper });

    await waitFor(() => expect(result.current.incidents).toHaveLength(1));
    expect(result.current.incidents[0].status).toBe('NEW');

    await act(async () => {
      await result.current.updateIncidentStatus('CW-ABC123', 'IN_PROGRESS');
    });

    expect(ax.patch).toHaveBeenCalledWith(
      expect.stringContaining('/incidents/admin/CW-ABC123/status'),
      { status: 'IN_PROGRESS' },
      expect.any(Object)
    );
    expect(result.current.incidents[0].status).toBe('IN_PROGRESS');
  });
});

// ─── deleteIncident ───────────────────────────────────────────────────────────

describe('AppContext — deleteIncident', () => {
  test('FT-006: DELETEs incident and removes it from local state', async () => {
    ax.get.mockResolvedValue({ data: [mockApiIncident] });
    ax.delete.mockResolvedValueOnce({ data: {} });
    const { result } = renderHook(() => useApp(), { wrapper });

    await waitFor(() => expect(result.current.incidents).toHaveLength(1));

    await act(async () => {
      await result.current.deleteIncident('CW-ABC123');
    });

    expect(ax.delete).toHaveBeenCalledWith(
      expect.stringContaining('/incidents/admin/CW-ABC123'),
      expect.any(Object)
    );
    expect(result.current.incidents).toHaveLength(0);
  });
});
