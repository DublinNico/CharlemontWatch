export const MOCK_INCIDENT = {
  _id: 'abc123def456abc123def456',
  shortId: 'CW-ABC123',
  incidentType: 'graffiti',
  location: 'Block A, Charlemont Street',
  description: 'Large graffiti tag on the south wall',
  status: 'NEW',
  reportedDate: '2026-05-31T10:00:00.000Z',
  createdAt: '2026-05-31T10:00:00.000Z',
  photos: [],
  surfaceType: 'Wall',
  isProfane: false,
};

export const MOCK_INCIDENT_WITH_PHOTO = {
  ...MOCK_INCIDENT,
  shortId: 'CW-PHOTO1',
  photos: [
    {
      _id: 'photo1',
      url: 'https://picsum.photos/seed/charlemont/400/300',
      approved: true,
    },
  ],
};

export const MOCK_INCIDENTS = [
  MOCK_INCIDENT,
  {
    ...MOCK_INCIDENT,
    _id: 'bbb123def456abc123def456',
    shortId: 'CW-DEF456',
    incidentType: 'antisocial',
    location: 'Charlemont Gate, Block C',
    description: 'Loud noise disturbance at night',
    status: 'IN_PROGRESS',
  },
  {
    ...MOCK_INCIDENT,
    _id: 'ccc123def456abc123def456',
    shortId: 'CW-GHI789',
    incidentType: 'maintenance',
    location: 'Stairwell B',
    description: 'Broken door lock on level 3',
    status: 'RESOLVED',
  },
];

export const MOCK_LOGIN_RESPONSE = {
  success: true,
  token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiJhZG1pbjEiLCJlbWFpbCI6ImFkbWluQHRlc3QuY29tIiwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzE3MTQ0MDAwLCJleHAiOjk5OTk5OTk5OTl9.mock',
  user: { _id: 'admin1', email: 'admin@test.com', name: 'Admin', role: 'admin' },
};
