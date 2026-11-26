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
  test('FT-016-A: asks for a rating when only an email is given', async () => {
    mockUseApp.mockReturnValue({
      satisfactionSummary: { low: 0, medium: 0, high: 0, total: 0 },
      submitSatisfactionVote: vi.fn(),
    } as any);

    render(<SatisfactionWidget />);
    fireEvent.change(screen.getByLabelText(/Your Email/i), { target: { value: 'jane@example.com' } });
    fireEvent.submit(screen.getByRole('button', { name: /^Submit$/i }).closest('form')!);

    await waitFor(() => {
      expect(screen.getByText(/Please choose a rating/i)).toBeInTheDocument();
    });
  });

  test('FT-016-B: shows an error when submitting without an email', async () => {
    mockUseApp.mockReturnValue({
      satisfactionSummary: { low: 0, medium: 0, high: 0, total: 0 },
      submitSatisfactionVote: vi.fn(),
    } as any);

    render(<SatisfactionWidget />);
    fireEvent.click(screen.getByRole('button', { name: /^High$/i }));
    fireEvent.submit(screen.getByRole('button', { name: /^Submit$/i }).closest('form')!);

    await waitFor(() => {
      expect(screen.getByText(/Please enter your email/i)).toBeInTheDocument();
    });
  });

  test('FT-016-F: blocks submitting until the ffrench-Mullen House box is ticked', async () => {
    const mockSubmit = vi.fn();
    mockUseApp.mockReturnValue({
      satisfactionSummary: { low: 0, medium: 0, high: 0, total: 0 },
      submitSatisfactionVote: mockSubmit,
    } as any);

    render(<SatisfactionWidget />);
    fireEvent.click(screen.getByRole('button', { name: /^High$/i }));
    fireEvent.change(screen.getByLabelText(/Your Email/i), { target: { value: 'jane@example.com' } });
    fireEvent.submit(screen.getByRole('button', { name: /^Submit$/i }).closest('form')!);

    await waitFor(() => {
      expect(screen.getByText(/Please confirm you live in ffrench-Mullen House/i)).toBeInTheDocument();
    });
    expect(mockSubmit).not.toHaveBeenCalled();
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
    fireEvent.click(screen.getByLabelText(/I live in ffrench-Mullen House/i));
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
    } as any);

    render(<SatisfactionWidget />);
    fireEvent.click(screen.getByRole('button', { name: /^Low$/i }));
    fireEvent.change(screen.getByLabelText(/Your Email/i), { target: { value: 'jane@example.com' } });
    fireEvent.click(screen.getByLabelText(/I live in ffrench-Mullen House/i));
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
    } as any);

    render(<SatisfactionWidget />);
    fireEvent.click(screen.getByRole('button', { name: /^High$/i }));
    fireEvent.change(screen.getByLabelText(/Your Email/i), { target: { value: 'jane@example.com' } });
    fireEvent.click(screen.getByLabelText(/I live in ffrench-Mullen House/i));
    fireEvent.submit(screen.getByRole('button', { name: /^Submit$/i }).closest('form')!);

    await waitFor(() => {
      expect(screen.getByText(/Your vote didn't go through/i)).toBeInTheDocument();
    });
  });
});

describe('SatisfactionWidget — thank-you placement', () => {
  test('the thank-you message replaces the share buttons on the left, outside the form', async () => {
    mockUseApp.mockReturnValue({
      satisfactionSummary: { low: 0, medium: 0, high: 0, total: 0 },
      submitSatisfactionVote: vi.fn().mockResolvedValue(undefined),
    } as any);

    render(<SatisfactionWidget />);
    expect(screen.getByText('Share this vote')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /^High$/i }));
    fireEvent.change(screen.getByLabelText(/Your Email/i), { target: { value: 'jane@example.com' } });
    fireEvent.click(screen.getByLabelText(/I live in ffrench-Mullen House/i));
    const form = screen.getByRole('button', { name: /^Submit$/i }).closest('form')!;
    fireEvent.submit(form);

    const thanks = await screen.findByRole('status');
    expect(thanks).toHaveTextContent(/Now ask a neighbour/i);
    expect(form.contains(thanks)).toBe(false);
    expect(screen.queryByText('Share this vote')).not.toBeInTheDocument();
  });
});

describe('SatisfactionWidget — no comments', () => {
  test('has no comment box', () => {
    mockUseApp.mockReturnValue({
      satisfactionSummary: { low: 0, medium: 0, high: 0, total: 0 },
      submitSatisfactionVote: vi.fn(),
    } as any);

    render(<SatisfactionWidget />);
    expect(screen.queryByLabelText(/Your Comment/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/comment/i)).not.toBeInTheDocument();
  });
});
