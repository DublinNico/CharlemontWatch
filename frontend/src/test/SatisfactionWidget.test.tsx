import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, beforeEach, describe, test, expect } from 'vitest';

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
    } as any);

    render(<SatisfactionWidget />);
    expect(screen.getByText(/No votes yet/i)).toBeInTheDocument();
  });

  test('FT-015-B: renders correct percentages from the summary', () => {
    mockUseApp.mockReturnValue({
      satisfactionSummary: { low: 2, medium: 3, high: 5, total: 10 },
      submitSatisfactionVote: vi.fn(),
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
    } as any);

    render(<SatisfactionWidget />);
    expect(screen.getByText(/1 vote so far/)).toBeInTheDocument();
  });
});

// ─── FT-016: voting ────────────────────────────────────────────────────────────

describe('SatisfactionWidget — submitting a vote', () => {
  test('FT-016-A: shows an error when submitting without selecting a rating', async () => {
    mockUseApp.mockReturnValue({
      satisfactionSummary: { low: 0, medium: 0, high: 0, total: 0 },
      submitSatisfactionVote: vi.fn(),
    } as any);

    render(<SatisfactionWidget />);
    fireEvent.change(screen.getByLabelText(/Your Email/i), { target: { value: 'jane@example.com' } });
    fireEvent.submit(screen.getByRole('button', { name: /Submit Vote/i }).closest('form')!);

    await waitFor(() => {
      expect(screen.getByText(/provide your email and select a rating/i)).toBeInTheDocument();
    });
  });

  test('FT-016-B: shows an error when submitting without an email', async () => {
    mockUseApp.mockReturnValue({
      satisfactionSummary: { low: 0, medium: 0, high: 0, total: 0 },
      submitSatisfactionVote: vi.fn(),
    } as any);

    render(<SatisfactionWidget />);
    fireEvent.click(screen.getByRole('button', { name: /^High$/i }));
    fireEvent.submit(screen.getByRole('button', { name: /Submit Vote/i }).closest('form')!);

    await waitFor(() => {
      expect(screen.getByText(/provide your email and select a rating/i)).toBeInTheDocument();
    });
  });

  test('FT-016-C: calls submitSatisfactionVote with the selected rating and email', async () => {
    const mockSubmit = vi.fn().mockResolvedValue(undefined);
    mockUseApp.mockReturnValue({
      satisfactionSummary: { low: 0, medium: 0, high: 0, total: 0 },
      submitSatisfactionVote: mockSubmit,
    } as any);

    render(<SatisfactionWidget />);
    fireEvent.click(screen.getByRole('button', { name: /^Medium$/i }));
    fireEvent.change(screen.getByLabelText(/Your Email/i), { target: { value: 'jane@example.com' } });
    fireEvent.submit(screen.getByRole('button', { name: /Submit Vote/i }).closest('form')!);

    await waitFor(() => {
      expect(mockSubmit).toHaveBeenCalledWith('jane@example.com', 'medium');
    });
  });

  test('FT-016-D: shows a confirmation and switches the button to "Update Vote" after a successful submit', async () => {
    const mockSubmit = vi.fn().mockResolvedValue(undefined);
    mockUseApp.mockReturnValue({
      satisfactionSummary: { low: 0, medium: 0, high: 0, total: 0 },
      submitSatisfactionVote: mockSubmit,
    } as any);

    render(<SatisfactionWidget />);
    fireEvent.click(screen.getByRole('button', { name: /^Low$/i }));
    fireEvent.change(screen.getByLabelText(/Your Email/i), { target: { value: 'jane@example.com' } });
    fireEvent.submit(screen.getByRole('button', { name: /Submit Vote/i }).closest('form')!);

    await waitFor(() => {
      expect(screen.getByText(/your vote has been recorded/i)).toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: /Update Vote/i })).toBeInTheDocument();
  });

  test('FT-016-E: shows an error message when submitSatisfactionVote rejects', async () => {
    const mockSubmit = vi.fn().mockRejectedValue(new Error('Network error'));
    mockUseApp.mockReturnValue({
      satisfactionSummary: { low: 0, medium: 0, high: 0, total: 0 },
      submitSatisfactionVote: mockSubmit,
    } as any);

    render(<SatisfactionWidget />);
    fireEvent.click(screen.getByRole('button', { name: /^High$/i }));
    fireEvent.change(screen.getByLabelText(/Your Email/i), { target: { value: 'jane@example.com' } });
    fireEvent.submit(screen.getByRole('button', { name: /Submit Vote/i }).closest('form')!);

    await waitFor(() => {
      expect(screen.getByText(/Failed to submit your vote/i)).toBeInTheDocument();
    });
  });
});
