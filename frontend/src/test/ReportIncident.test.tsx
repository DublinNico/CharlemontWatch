import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, beforeEach, describe, test, expect } from 'vitest';
import { MemoryRouter } from 'react-router';

// Mock Radix-based Select with a plain <select> so jsdom can interact with it
vi.mock('../app/components/ui/select', () => ({
  Select: ({ value, onValueChange, children, required }: any) => (
    <select
      value={value}
      required={required}
      onChange={e => onValueChange?.(e.target.value)}
      data-testid="select"
    >
      {children}
    </select>
  ),
  SelectTrigger: ({ children }: any) => <>{children}</>,
  SelectValue: ({ placeholder }: any) => <option value="">{placeholder}</option>,
  SelectContent: ({ children }: any) => <>{children}</>,
  SelectItem: ({ value, children }: any) => <option value={value}>{children}</option>,
}));

vi.mock('../app/context/AppContext', () => ({
  useApp: vi.fn(),
}));

vi.mock('../app/components/ui/checkbox', () => ({
  Checkbox: ({ id, checked, onCheckedChange }: any) => (
    <input
      type="checkbox"
      id={id}
      checked={checked}
      onChange={e => onCheckedChange?.(e.target.checked)}
    />
  ),
}));

import { useApp } from '../app/context/AppContext';
import { ReportIncident } from '../app/pages/ReportIncident';

const mockUseApp = vi.mocked(useApp);
const mockNavigate = vi.fn();

vi.mock('react-router', async (importOriginal) => {
  const actual = await importOriginal() as any;
  return { ...actual, useNavigate: () => mockNavigate };
});

// jsdom doesn't have URL.createObjectURL
beforeEach(() => {
  vi.clearAllMocks();
  (URL as any).createObjectURL = vi.fn(() => 'blob:mock-url');
  mockUseApp.mockReturnValue({
    addIncident: vi.fn().mockResolvedValue('CW-NEW001'),
  } as any);
});

function renderForm() {
  return render(<MemoryRouter><ReportIncident /></MemoryRouter>);
}

// ─── helper: fill the common required fields ──────────────────────────────────

function fillCommonFields() {
  // Incident type — first select in the form
  const selects = screen.getAllByTestId('select');
  fireEvent.change(selects[0], { target: { value: 'Graffiti' } });

  fireEvent.change(screen.getByPlaceholderText(/e\.g\. Charlemont/i), {
    target: { value: 'Block A, Charlemont Street' },
  });
  fireEvent.change(screen.getByPlaceholderText(/Describe what you observed/i), {
    target: { value: 'Large graffiti tag on the south wall' },
  });

  // Your Details — always required regardless of complaint checkboxes
  fireEvent.change(screen.getByPlaceholderText(/Your full name/i), {
    target: { value: 'Jane Resident' },
  });
  fireEvent.change(screen.getByPlaceholderText(/Apt 12, Charlemont Street/i), {
    target: { value: 'Apt 12, Charlemont Street, Dublin 2' },
  });
  fireEvent.change(screen.getByPlaceholderText(/your\.email@example\.com/i), {
    target: { value: 'jane@example.com' },
  });

  // Untick complaint checkboxes — default is checked, tests cover report submission only
  const tuathCheckbox = document.getElementById('send-tuath') as HTMLInputElement;
  const dccCheckbox = document.getElementById('send-dcc') as HTMLInputElement;
  if (tuathCheckbox?.checked) fireEvent.click(tuathCheckbox);
  if (dccCheckbox?.checked) fireEvent.click(dccCheckbox);
}

// ─── FT-013: graffiti submit calls addIncident with correct payload ───────────

describe('ReportIncident — graffiti submission', () => {
  test('FT-013: submitting graffiti form calls addIncident with correct type and fields', async () => {
    const mockAddIncident = vi.fn().mockResolvedValue('CW-NEW001');
    mockUseApp.mockReturnValue({ addIncident: mockAddIncident } as any);

    renderForm();
    fillCommonFields();

    // Graffiti-specific fields appear after type selection
    await waitFor(() => {
      expect(screen.getByText('Graffiti Details')).toBeInTheDocument();
    });

    // Select surface type (second select rendered after type selection)
    const selects = screen.getAllByTestId('select');
    fireEvent.change(selects[1], { target: { value: 'Wall' } });

    // Tick the profane checkbox
    fireEvent.click(screen.getByLabelText(/offensive or profane/i));

    fireEvent.submit(screen.getByRole('button', { name: /Submit Report/i }).closest('form')!);

    await waitFor(() => {
      expect(mockAddIncident).toHaveBeenCalledTimes(1);
    });

    const call = mockAddIncident.mock.calls[0][0];
    expect(call.type).toBe('Graffiti');
    expect(call.location).toBe('Block A, Charlemont Street');
    expect(call.description).toBe('Large graffiti tag on the south wall');
    expect(call.typeSpecificData.surfaceType).toBe('Wall');
    expect(call.typeSpecificData.isProfane).toBe(true);
  });

  test('FT-013-B: navigates to success page with the returned incident ID', async () => {
    const mockAddIncident = vi.fn().mockResolvedValue('CW-NEW001');
    mockUseApp.mockReturnValue({ addIncident: mockAddIncident } as any);

    renderForm();
    fillCommonFields();

    fireEvent.submit(screen.getByRole('button', { name: /Submit Report/i }).closest('form')!);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith(expect.stringContaining('/success/CW-NEW001'));
    });
  });

  test('FT-013-C: shows error message when addIncident throws', async () => {
    const mockAddIncident = vi.fn().mockRejectedValue(new Error('Network error'));
    mockUseApp.mockReturnValue({ addIncident: mockAddIncident } as any);

    renderForm();
    fillCommonFields();

    fireEvent.submit(screen.getByRole('button', { name: /Submit Report/i }).closest('form')!);

    await waitFor(() => {
      expect(screen.getByText(/Failed to submit report/i)).toBeInTheDocument();
    });
    expect(mockNavigate).not.toHaveBeenCalledWith(expect.stringContaining('/success'));
  });
});

// ─── FT-014: submit button disabled until type is selected ───────────────────

describe('ReportIncident — validation', () => {
  test('FT-014: Submit button is disabled when no incident type is selected', () => {
    renderForm();

    const submitBtn = screen.getByRole('button', { name: /Submit Report/i });
    expect(submitBtn).toBeDisabled();
  });

  test('FT-014-B: Submit button enables once a type is selected', async () => {
    renderForm();

    const selects = screen.getAllByTestId('select');
    fireEvent.change(selects[0], { target: { value: 'Graffiti' } });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Submit Report/i })).not.toBeDisabled();
    });
  });

  test('FT-014-C: addIncident is NOT called when type is missing and form is submitted', async () => {
    const mockAddIncident = vi.fn();
    mockUseApp.mockReturnValue({ addIncident: mockAddIncident } as any);

    renderForm();

    // Fill location and description but not type
    fireEvent.change(screen.getByPlaceholderText(/e\.g\. Charlemont/i), {
      target: { value: 'Block A' },
    });
    fireEvent.change(screen.getByPlaceholderText(/Describe what you observed/i), {
      target: { value: 'Test description' },
    });

    // Submit is disabled without type, but guard also returns early in handleSubmit
    const form = screen.getByRole('button', { name: /Submit Report/i }).closest('form')!;
    fireEvent.submit(form);

    // Give any async work a chance to run
    await new Promise(r => setTimeout(r, 50));
    expect(mockAddIncident).not.toHaveBeenCalled();
  });
});
