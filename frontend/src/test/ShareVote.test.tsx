import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, afterEach, describe, test, expect } from 'vitest';
import { ShareVote } from '../app/components/ShareVote';

afterEach(() => {
  vi.restoreAllMocks();
});

// ─── Sharing the Túath satisfaction vote ──────────────────────────────────────

describe('ShareVote', () => {
  test('WhatsApp link carries the vote count and the /vote URL', () => {
    render(<ShareVote total={42} />);
    const href = decodeURIComponent(screen.getByRole('link', { name: /WhatsApp/i }).getAttribute('href')!);
    expect(href).toContain('42 votes so far');
    expect(href).toContain('https://charlemontwatch.ie/vote');
  });

  test('omits the vote count when there are no votes yet', () => {
    render(<ShareVote total={0} />);
    const href = decodeURIComponent(screen.getByRole('link', { name: /WhatsApp/i }).getAttribute('href')!);
    expect(href).not.toContain('so far');
  });

  test('Facebook link shares the /vote URL', () => {
    render(<ShareVote total={3} />);
    const href = screen.getByRole('link', { name: /Facebook/i }).getAttribute('href')!;
    expect(href).toContain(encodeURIComponent('https://charlemontwatch.ie/vote'));
  });

  test('Copy link writes the URL to the clipboard and confirms', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });

    render(<ShareVote total={3} />);
    fireEvent.click(screen.getByRole('button', { name: /Copy link/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Link copied/i })).toBeInTheDocument();
    });
    expect(writeText).toHaveBeenCalledWith('https://charlemontwatch.ie/vote');
  });

  test('shows the link as text when the clipboard is unavailable', async () => {
    const writeText = vi.fn().mockRejectedValue(new Error('denied'));
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });

    render(<ShareVote total={3} />);
    fireEvent.click(screen.getByRole('button', { name: /Copy link/i }));

    await waitFor(() => {
      expect(screen.getByText(/Couldn't copy automatically/i)).toBeInTheDocument();
    });
  });
});
