import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, beforeEach, describe, test, expect } from 'vitest';

vi.mock('axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('../app/context/AppContext', () => ({
  useApp: vi.fn(() => ({ token: 'admin-token' })),
}));

import axios from 'axios';
import { VoteComments } from '../app/components/VoteComments';
import { CommentModeration } from '../app/components/CommentModeration';

const ax = axios as any;

beforeEach(() => {
  vi.clearAllMocks();
});

// ─── Public comments under the vote ───────────────────────────────────────────

describe('VoteComments', () => {
  test('lists approved comments', async () => {
    ax.get.mockResolvedValue({ data: [{ _id: '1', name: 'Jane', text: 'Lights are out again.', createdAt: '2026-10-01T10:00:00Z' }] });
    render(<VoteComments />);
    expect(await screen.findByText('Lights are out again.')).toBeInTheDocument();
    expect(screen.getByText('Jane')).toBeInTheDocument();
  });

  test('shows an empty state when there are no comments', async () => {
    ax.get.mockResolvedValue({ data: [] });
    render(<VoteComments />);
    expect(await screen.findByText(/No comments yet/i)).toBeInTheDocument();
  });
});

// ─── Admin moderation tab ─────────────────────────────────────────────────────

describe('CommentModeration', () => {
  const pending = { _id: 'p1', name: 'Jane', email: 'jane@example.com', text: 'Pending comment', status: 'pending', createdAt: '2026-10-01T10:00:00Z' };
  const approved = { _id: 'a1', name: 'Tom', email: 'tom@example.com', text: 'Published comment', status: 'approved', createdAt: '2026-09-30T10:00:00Z' };

  test('splits comments into awaiting approval and published', async () => {
    ax.get.mockResolvedValue({ data: [pending, approved] });
    render(<CommentModeration />);
    expect(await screen.findByText(/Awaiting approval \(1\)/)).toBeInTheDocument();
    expect(screen.getByText(/Published \(1\)/)).toBeInTheDocument();
    expect(ax.get).toHaveBeenCalledWith(expect.stringContaining('/comments/admin'), { headers: { Authorization: 'Bearer admin-token' } });
  });

  test('approving moves a comment to published', async () => {
    ax.get.mockResolvedValue({ data: [pending] });
    ax.patch.mockResolvedValue({ data: {} });
    render(<CommentModeration />);
    fireEvent.click(await screen.findByRole('button', { name: /Approve/i }));

    await waitFor(() => expect(screen.getByText(/Published \(1\)/)).toBeInTheDocument());
    expect(ax.patch).toHaveBeenCalledWith(expect.stringContaining('/comments/admin/p1/approve'), {}, expect.anything());
  });

  test('deleting needs a confirm click, then removes the comment', async () => {
    ax.get.mockResolvedValue({ data: [approved] });
    ax.delete.mockResolvedValue({ data: {} });
    render(<CommentModeration />);
    fireEvent.click(await screen.findByRole('button', { name: /^Delete$/i }));
    expect(ax.delete).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: /Confirm delete/i }));
    await waitFor(() => expect(screen.queryByText('Published comment')).not.toBeInTheDocument());
    expect(ax.delete).toHaveBeenCalledWith(expect.stringContaining('/comments/admin/a1'), expect.anything());
  });
});
