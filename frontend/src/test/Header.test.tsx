import { render, screen } from '@testing-library/react';
import { vi, describe, test, expect } from 'vitest';
import { MemoryRouter } from 'react-router';
import { Header } from '../app/components/Header';

vi.mock('../app/context/AppContext', () => ({
  useApp: vi.fn(),
}));

import { useApp } from '../app/context/AppContext';
const mockUseApp = vi.mocked(useApp);

function renderHeader() {
  return render(<MemoryRouter><Header /></MemoryRouter>);
}

describe('Header — unauthenticated', () => {
  test('FT-007-A: shows the CharlemontWatch logo and title', () => {
    mockUseApp.mockReturnValue({
      isAuthenticated: false, user: null, logout: vi.fn(),
    } as any);

    renderHeader();

    expect(screen.getByText('CharlemontWatch')).toBeInTheDocument();
  });

  test('FT-007-B: does not show Dashboard or Sign Out buttons when unauthenticated', () => {
    mockUseApp.mockReturnValue({
      isAuthenticated: false, user: null, logout: vi.fn(),
    } as any);

    renderHeader();

    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
    expect(screen.queryByText('Sign Out')).not.toBeInTheDocument();
  });
});

describe('Header — authenticated', () => {
  test('FT-008-A: shows Dashboard and Sign Out buttons when authenticated', () => {
    mockUseApp.mockReturnValue({
      isAuthenticated: true,
      user: { name: 'tony', email: 'admin@test.com' },
      logout: vi.fn(),
    } as any);

    renderHeader();

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Sign Out')).toBeInTheDocument();
  });

  test('FT-008-B: shows the authenticated user name', () => {
    mockUseApp.mockReturnValue({
      isAuthenticated: true,
      user: { name: 'tony', email: 'admin@test.com' },
      logout: vi.fn(),
    } as any);

    renderHeader();

    expect(screen.getByText('tony')).toBeInTheDocument();
  });
});
