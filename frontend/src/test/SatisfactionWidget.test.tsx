import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, beforeEach, describe, test, expect } from 'vitest';

// The approved-comments list inside the card fetches with axios
vi.mock('axios', () => ({
  default: { get: vi.fn().mockResolvedValue({ data: [] }) },
}));

vi.mock('../app/context/AppContext', () => ({
  useApp: vi.fn(),
}));

import { useApp } from '../app/context/AppContext';
import { SatisfactionWidget } from '../app/components/SatisfactionWidget';

const mockUseApp = vi.mocked(useApp);

beforeEach(() => {
  vi.clearAllMocks();
});

// ─── FT-015: results display ──────────────────────────────────────────────────

describe('SatisfactionWidget — results display', () => {
  test('FT-015-A: shows "No votes yet" when total is zero', () => {
    mockUseApp.mockReturnValue({
      satisfactionSummary: { low: 0, medium: 0, high: 0, total: 0 },
      submitSatisfactionVote: vi.fn(),
      submitVoteComment: vi.fn(),
    } as any);

    render(<SatisfactionWidget />);
    expect(screen.getByText(/No votes yet/i)).toBeInTheDocument();
  });

  test('FT-015-B: renders correct percentages from the summary', () => {
    mockUseApp.mockReturnValue({
      satisfactionSummary: { low: 2, medium: 3, high: 5, total: 10 },
      submitSatisfactionVote: vi.fn(),
      submitVoteComment: vi.fn(),
    } as any);

    render(<SatisfactionWidget />);
    expect(screen.getByText(/Low: 20% \(2\)/)).toBeInTheDocument();
    expect(screen.getByText(/Medium: 30% \(3\)/)).toBeInTheDocument();
    expect(screen.getByText(/High: 50% \(5\)/)).toBeInTheDocument();
    expect(screen.getByText(/10 votes so far/)).toBeInTheDocument();
  });

  test('FT-015-C: uses singular "vote" when total is 1', () => {
    mockUseApp.mockReturnValue({
      satisfactionSummary: { low: 0, medium: 0, high: 1, total: 1 },
      submitSatisfactionVote: vi.fn(),
      submitVoteComment: vi.fn(),
    } as any);

    render(<SatisfactionWidget />);
    expect(screen.getByText(/1 vote so far/)).toBeInTheDocument();
  });
});

// ─── FT-016: voting ────────────────────────────────────────────────────────────

describe('SatisfactionWidget — submitting a vote', () => {
  test('FT-016-A: asks for a rating or comment when only an email is given', async () => {
    mockUseApp.mockReturnValue({
      satisfactionSummary: { low: 0, medium: 0, high: 0, total: 0 },
      submitSatisfactionVote: vi.fn(),
      submitVoteComment: vi.fn(),
    } as any);

    render(<SatisfactionWidget />);
    fireEvent.change(screen.getByLabelText(/Your Email/i), { target: { value: 'jane@example.com' } });
    fireEvent.submit(screen.getByRole('button', { name: /^Submit$/i }).closest('form')!);

    await waitFor(() => {
      expect(screen.getByText(/Choose a rating, write a comment, or both/i)).toBeInTheDocument();
    });
  });

  test('FT-016-B: shows an error when submitting without an email', async () => {
    mockUseApp.mockReturnValue({
      satisfactionSummary: { low: 0, medium: 0, high: 0, total: 0 },
      submitSatisfactionVote: vi.fn(),
      submitVoteComment: vi.fn(),
    } as any);

    render(<SatisfactionWidget />);
    fireEvent.click(screen.getByRole('button', { name: /^High$/i }));
    fireEvent.submit(screen.getByRole('button', { name: /^Submit$/i }).closest('form')!);

    await waitFor(() => {
      expect(screen.getByText(/Please enter your email/i)).toBeInTheDocument();
    });
  });

  test('FT-016-C: calls submitSatisfactionVote with the selected rating and email', async () => {
    const mockSubmit = vi.fn().mockResolvedValue(undefined);
    mockUseApp.mockReturnValue({
      satisfactionSummary: { low: 0, medium: 0, high: 0, total: 0 },
      submitSatisfactionVote: mockSubmit,
      submitVoteComment: vi.fn(),
    } as any);

    render(<SatisfactionWidget />);
    fireEvent.click(screen.getByRole('button', { name: /^Medium$/i }));
    fireEvent.change(screen.getByLabelText(/Your Email/i), { target: { value: 'jane@example.com' } });
    fireEvent.submit(screen.getByRole('button', { name: /^Submit$/i }).closest('form')!);

    await waitFor(() => {
      expect(mockSubmit).toHaveBeenCalledWith('jane@example.com', 'medium');
    });
  });

  test('FT-016-D: shows a confirmation after a successful vote', async () => {
    const mockSubmit = vi.fn().mockResolvedValue(undefined);
    mockUseApp.mockReturnValue({
      satisfactionSummary: { low: 0, medium: 0, high: 0, total: 0 },
      submitSatisfactionVote: mockSubmit,
      submitVoteComment: vi.fn(),
    } as any);

    render(<SatisfactionWidget />);
    fireEvent.click(screen.getByRole('button', { name: /^Low$/i }));
    fireEvent.change(screen.getByLabelText(/Your Email/i), { target: { value: 'jane@example.com' } });
    fireEvent.submit(screen.getByRole('button', { name: /^Submit$/i }).closest('form')!);

    await waitFor(() => {
      expect(screen.getByText(/your vote has been recorded/i)).toBeInTheDocument();
    });
  });

  test('FT-016-E: shows an error message when submitSatisfactionVote rejects', async () => {
    const mockSubmit = vi.fn().mockRejectedValue(new Error('Network error'));
    mockUseApp.mockReturnValue({
      satisfactionSummary: { low: 0, medium: 0, high: 0, total: 0 },
      submitSatisfactionVote: mockSubmit,
      submitVoteComment: vi.fn(),
    } as any);

    render(<SatisfactionWidget />);
    fireEvent.click(screen.getByRole('button', { name: /^High$/i }));
    fireEvent.change(screen.getByLabelText(/Your Email/i), { target: { value: 'jane@example.com' } });
    fireEvent.submit(screen.getByRole('button', { name: /^Submit$/i }).closest('form')!);

    await waitFor(() => {
      expect(screen.getByText(/Your vote didn't go through/i)).toBeInTheDocument();
    });
  });
});

// ─── Comments in the same form ────────────────────────────────────────────────

describe('SatisfactionWidget — comments', () => {
  const fillComment = () => {
    fireEvent.change(screen.getByLabelText(/Your Comment/i), { target: { value: 'Lights are out again.' } });
    fireEvent.change(screen.getByLabelText(/Your Email/i), { target: { value: 'jane@example.com' } });
  };

  test('a comment alone can be sent with just an email', async () => {
    const mockVote = vi.fn();
    const mockComment = vi.fn().mockResolvedValue(undefined);
    mockUseApp.mockReturnValue({
      satisfactionSummary: { low: 0, medium: 0, high: 0, total: 0 },
      submitSatisfactionVote: mockVote,
      submitVoteComment: mockComment,
    } as any);

    render(<SatisfactionWidget />);
    fillComment();
    fireEvent.submit(screen.getByRole('button', { name: /^Submit$/i }).closest('form')!);

    await waitFor(() => {
      expect(screen.getByText(/will appear once it's been approved/i)).toBeInTheDocument();
    });
    expect(mockComment).toHaveBeenCalledWith('jane@example.com', 'Lights are out again.', '', '');
    expect(mockVote).not.toHaveBeenCalled();
  });

  test('the name field only appears once a comment is typed, and is sent with it', async () => {
    const mockComment = vi.fn().mockResolvedValue(undefined);
    mockUseApp.mockReturnValue({
      satisfactionSummary: { low: 0, medium: 0, high: 0, total: 0 },
      submitSatisfactionVote: vi.fn(),
      submitVoteComment: mockComment,
    } as any);

    render(<SatisfactionWidget />);
    expect(screen.queryByLabelText(/Name to show/i)).not.toBeInTheDocument();
    fillComment();
    fireEvent.change(screen.getByLabelText(/Name to show/i), { target: { value: 'Jane' } });
    fireEvent.submit(screen.getByRole('button', { name: /^Submit$/i }).closest('form')!);

    await waitFor(() => {
      expect(mockComment).toHaveBeenCalledWith('jane@example.com', 'Lights are out again.', 'Jane', '');
    });
  });

  test('a vote and comment together confirm both', async () => {
    mockUseApp.mockReturnValue({
      satisfactionSummary: { low: 0, medium: 0, high: 0, total: 0 },
      submitSatisfactionVote: vi.fn().mockResolvedValue(undefined),
      submitVoteComment: vi.fn().mockResolvedValue(undefined),
    } as any);

    render(<SatisfactionWidget />);
    fireEvent.click(screen.getByRole('button', { name: /^High$/i }));
    fillComment();
    fireEvent.submit(screen.getByRole('button', { name: /^Submit$/i }).closest('form')!);

    await waitFor(() => {
      expect(screen.getByText(/Your vote has been recorded/i)).toBeInTheDocument();
    });
    expect(screen.getByText(/will appear once it's been approved/i)).toBeInTheDocument();
  });

  test('if only the comment fails, it says the vote was still recorded', async () => {
    mockUseApp.mockReturnValue({
      satisfactionSummary: { low: 0, medium: 0, high: 0, total: 0 },
      submitSatisfactionVote: vi.fn().mockResolvedValue(undefined),
      submitVoteComment: vi.fn().mockRejectedValue({ response: { data: { error: 'Too many comments, please try again later' } } }),
    } as any);

    render(<SatisfactionWidget />);
    fireEvent.click(screen.getByRole('button', { name: /^Low$/i }));
    fillComment();
    fireEvent.submit(screen.getByRole('button', { name: /^Submit$/i }).closest('form')!);

    await waitFor(() => {
      expect(screen.getByText(/Too many comments.*your vote was recorded/i)).toBeInTheDocument();
    });
    expect(screen.getByText(/Your vote has been recorded/i)).toBeInTheDocument();
  });
});

describe('SatisfactionWidget — thank-you placement', () => {
  test('the thank-you message replaces the share buttons on the left, outside the form', async () => {
    mockUseApp.mockReturnValue({
      satisfactionSummary: { low: 0, medium: 0, high: 0, total: 0 },
      submitSatisfactionVote: vi.fn().mockResolvedValue(undefined),
      submitVoteComment: vi.fn(),
    } as any);

    render(<SatisfactionWidget />);
    expect(screen.getByText('Share this vote')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /^High$/i }));
    fireEvent.change(screen.getByLabelText(/Your Email/i), { target: { value: 'jane@example.com' } });
    const form = screen.getByRole('button', { name: /^Submit$/i }).closest('form')!;
    fireEvent.submit(form);

    const thanks = await screen.findByRole('status');
    expect(thanks).toHaveTextContent(/Now ask a neighbour/i);
    expect(form.contains(thanks)).toBe(false);
    expect(screen.queryByText('Share this vote')).not.toBeInTheDocument();
  });
});
