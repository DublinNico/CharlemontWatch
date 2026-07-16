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

// Header uses useApp and useNavigate — stub it out, unrelated to this page
vi.mock('../app/components/Header', () => ({
  Header: () => <header data-testid="header" />,
}));

import axios from 'axios';
import { Contact } from '../app/pages/Contact';

const ax = axios as any;

beforeEach(() => {
  vi.clearAllMocks();
});

function fillForm() {
  fireEvent.change(screen.getByLabelText(/Name/i), { target: { value: 'Jane Resident' } });
  fireEvent.change(screen.getByLabelText(/^Email$/i), { target: { value: 'jane@example.com' } });
  fireEvent.change(screen.getByLabelText(/Message/i), { target: { value: 'Hello, I have a question.' } });
}

function submitForm() {
  fireEvent.submit(screen.getByRole('button', { name: /Send Message/i }).closest('form')!);
}

describe('Contact — submitting a message', () => {
  test('FT-017-A: calls POST /contact with name, email, message, and empty honeypot field', async () => {
    ax.post.mockResolvedValueOnce({ data: { success: true } });

    render(<Contact />);
    fillForm();
    submitForm();

    await waitFor(() => {
      expect(ax.post).toHaveBeenCalledWith(
        expect.stringContaining('/contact'),
        { name: 'Jane Resident', email: 'jane@example.com', message: 'Hello, I have a question.', website: '' }
      );
    });
  });

  test('FT-017-B: shows a "Message Sent" confirmation after a successful submit', async () => {
    ax.post.mockResolvedValueOnce({ data: { success: true } });

    render(<Contact />);
    fillForm();
    submitForm();

    await waitFor(() => {
      expect(screen.getByText(/Message Sent/i)).toBeInTheDocument();
    });
  });

  test('FT-017-C: shows the server-provided error message when the request is rejected', async () => {
    ax.post.mockRejectedValueOnce({ response: { data: { error: 'a valid email is required' } } });

    render(<Contact />);
    fillForm();
    submitForm();

    await waitFor(() => {
      expect(screen.getByText(/a valid email is required/i)).toBeInTheDocument();
    });
  });

  test('FT-017-D: shows a generic error message on network failure', async () => {
    ax.post.mockRejectedValueOnce(new Error('Network Error'));

    render(<Contact />);
    fillForm();
    submitForm();

    await waitFor(() => {
      expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument();
    });
  });

  test('FT-017-E: disables the submit button and shows "Sending…" while the request is in flight', async () => {
    let resolvePost: (value: unknown) => void;
    ax.post.mockReturnValueOnce(new Promise((resolve) => { resolvePost = resolve; }));

    render(<Contact />);
    fillForm();
    submitForm();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Sending…/i })).toBeDisabled();
    });

    resolvePost!({ data: { success: true } });
    await waitFor(() => {
      expect(screen.getByText(/Message Sent/i)).toBeInTheDocument();
    });
  });
});
