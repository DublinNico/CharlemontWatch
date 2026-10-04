import { render, screen, fireEvent } from '@testing-library/react';
import { vi, beforeEach, describe, test, expect } from 'vitest';
import { MemoryRouter } from 'react-router';

vi.mock('axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

// Header uses useApp and useNavigate — stub it out, unrelated to this page
vi.mock('../app/components/Header', () => ({
  Header: () => <header data-testid="header" />,
}));

import axios from 'axios';
import { DeleteComment } from '../app/pages/DeleteComment';

const ax = axios as any;
const TOKEN = 'a'.repeat(64);

const renderAt = (url: string) => render(
  <MemoryRouter initialEntries={[url]}>
    <DeleteComment />
  </MemoryRouter>,
);

beforeEach(() => {
  vi.clearAllMocks();
});

// ─── Commenter deletes their own comment via the emailed link ─────────────────

describe('DeleteComment page', () => {
  test('shows the comment and only deletes after the button is clicked', async () => {
    ax.post.mockResolvedValueOnce({ data: { name: 'Jane', text: 'Lights are out again.', status: 'approved', createdAt: '2026-10-01T10:00:00Z' } });
    renderAt(`/comment/delete?token=${TOKEN}`);

    expect(await screen.findByText('Lights are out again.')).toBeInTheDocument();
    expect(screen.getByText(/is published/i)).toBeInTheDocument();
    expect(ax.post).toHaveBeenCalledTimes(1);
    expect(ax.post).toHaveBeenCalledWith(expect.stringContaining('/comments/mine'), { token: TOKEN });

    ax.post.mockResolvedValueOnce({ data: { success: true } });
    fireEvent.click(screen.getByRole('button', { name: /Delete my comment/i }));

    expect(await screen.findByText(/Your comment has been deleted/i)).toBeInTheDocument();
    expect(ax.post).toHaveBeenLastCalledWith(expect.stringContaining('/comments/mine/delete'), { token: TOKEN });
  });

  test('an unknown or used link says so', async () => {
    ax.post.mockRejectedValueOnce({ response: { status: 404 } });
    renderAt(`/comment/delete?token=${TOKEN}`);
    expect(await screen.findByText(/isn't valid, or the comment has already been deleted/i)).toBeInTheDocument();
  });

  test('a link with no token says so without calling the server', async () => {
    renderAt('/comment/delete');
    expect(await screen.findByText(/isn't valid/i)).toBeInTheDocument();
    expect(ax.post).not.toHaveBeenCalled();
  });
});
