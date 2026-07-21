import { render, screen } from '@testing-library/react';
import { describe, test, expect } from 'vitest';

import { IncidentCard } from '../app/components/IncidentCard';
import { Incident } from '../app/context/AppContext';

const baseIncident: Incident = {
  id: 'CW-ABC123',
  type: 'Graffiti',
  location: 'Block A, Charlemont Street',
  description: 'Graffiti on the south wall',
  status: 'NEW',
  date: '2026-07-01T10:00:00Z',
  photos: [],
};

// ─── FT-018: complaint delivery failure banner ────────────────────────────────

describe('IncidentCard — complaint delivery failure banner', () => {
  test('FT-018-A: shows no banner when complaintDeliveryIssues is absent', () => {
    render(<IncidentCard incident={baseIncident} showFullDetails />);
    expect(screen.queryByText(/could not be delivered/i)).not.toBeInTheDocument();
  });

  test('FT-018-B: shows no banner when complaintDeliveryIssues is empty', () => {
    render(<IncidentCard incident={{ ...baseIncident, complaintDeliveryIssues: [] }} showFullDetails />);
    expect(screen.queryByText(/could not be delivered/i)).not.toBeInTheDocument();
  });

  test('FT-018-C: shows a bounced-delivery warning naming Túath Housing', () => {
    render(
      <IncidentCard
        incident={{
          ...baseIncident,
          complaintDeliveryIssues: [
            { recipientType: 'tuath', eventType: 'email.bounced', occurredAt: '2026-07-21T09:00:00Z' },
          ],
        }}
        showFullDetails
      />
    );
    expect(screen.getByText(/Túath Housing/)).toBeInTheDocument();
    expect(screen.getByText(/could not be delivered/i)).toBeInTheDocument();
  });

  test('FT-018-D: shows one line per distinct recipient (Túath and DCC both failed)', () => {
    render(
      <IncidentCard
        incident={{
          ...baseIncident,
          complaintDeliveryIssues: [
            { recipientType: 'tuath', eventType: 'email.bounced', occurredAt: '2026-07-21T09:00:00Z' },
            { recipientType: 'dcc', eventType: 'email.complained', occurredAt: '2026-07-21T09:05:00Z' },
          ],
        }}
        showFullDetails
      />
    );
    expect(screen.getByText(/Túath Housing/)).toBeInTheDocument();
    expect(screen.getByText(/Dublin City Council/)).toBeInTheDocument();
    expect(screen.getByText(/marked as spam/i)).toBeInTheDocument();
  });

  test('FT-018-E: deduplicates to the most recent issue when the same recipient fires twice', () => {
    render(
      <IncidentCard
        incident={{
          ...baseIncident,
          complaintDeliveryIssues: [
            { recipientType: 'tuath', eventType: 'email.delivery_delayed', occurredAt: '2026-07-21T09:00:00Z' },
            { recipientType: 'tuath', eventType: 'email.bounced', occurredAt: '2026-07-21T09:30:00Z' },
          ],
        }}
        showFullDetails
      />
    );
    expect(screen.getAllByText(/Túath Housing/)).toHaveLength(1);
    expect(screen.getByText(/could not be delivered/i)).toBeInTheDocument();
    expect(screen.queryByText(/is delayed/i)).not.toBeInTheDocument();
  });

  test('FT-018-F: banner is not shown when showFullDetails is false, even with issues present', () => {
    render(
      <IncidentCard
        incident={{
          ...baseIncident,
          complaintDeliveryIssues: [
            { recipientType: 'dcc', eventType: 'email.bounced', occurredAt: '2026-07-21T09:00:00Z' },
          ],
        }}
      />
    );
    expect(screen.queryByText(/could not be delivered/i)).not.toBeInTheDocument();
  });
});
