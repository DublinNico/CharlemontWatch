// Named with a "mock" prefix so Jest's module-hoisting allows referencing it
// inside the jest.mock() factory below.
const mockResendSend = jest.fn().mockResolvedValue({ data: { id: 'mock-id' }, error: null });
jest.mock('resend', () => ({ Resend: jest.fn().mockImplementation(() => ({ emails: { send: mockResendSend } })) }));

process.env.RESEND_API_KEY = 'test-key';
process.env.ADMIN_EMAIL = 'admin@charlemontwatch.ie';

const request = require('supertest');
const app = require('../../app');

const validBody = {
  name: 'Jane Resident',
  email: 'jane@example.com',
  message: 'Hello, I have a question about the site.',
};

beforeEach(() => {
  jest.clearAllMocks();
  mockResendSend.mockResolvedValue({ data: { id: 'mock-id' }, error: null });
});

describe('POST /api/contact', () => {
  test('IT-045: sends an email and returns 200 for a valid submission', async () => {
    const res = await request(app).post('/api/contact').send(validBody);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(mockResendSend).toHaveBeenCalledTimes(1);
    const msg = mockResendSend.mock.calls[0][0];
    expect(msg.to).toContain('admin@charlemontwatch.ie');
    expect(msg.replyTo).toBe('jane@example.com');
  });

  test('IT-046: 400 when name is missing', async () => {
    const res = await request(app).post('/api/contact').send({ ...validBody, name: '' });
    expect(res.status).toBe(400);
    expect(mockResendSend).not.toHaveBeenCalled();
  });

  test('IT-047: 400 when email is missing or invalid', async () => {
    const res = await request(app).post('/api/contact').send({ ...validBody, email: 'not-an-email' });
    expect(res.status).toBe(400);
    expect(mockResendSend).not.toHaveBeenCalled();
  });

  test('IT-048: 400 when message is missing', async () => {
    const res = await request(app).post('/api/contact').send({ ...validBody, message: '' });
    expect(res.status).toBe(400);
    expect(mockResendSend).not.toHaveBeenCalled();
  });

  test('IT-049: 400 when message exceeds the max length', async () => {
    const res = await request(app).post('/api/contact').send({ ...validBody, message: 'x'.repeat(5001) });
    expect(res.status).toBe(400);
    expect(mockResendSend).not.toHaveBeenCalled();
  });

  test('IT-050: honeypot field silently drops the submission without sending an email', async () => {
    const res = await request(app).post('/api/contact').send({ ...validBody, website: 'http://spam.example.com' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(mockResendSend).not.toHaveBeenCalled();
  });

  test('IT-051: HTML-special chars in the message are escaped in the email body', async () => {
    await request(app).post('/api/contact').send({ ...validBody, message: '<script>alert(1)</script>' });
    const msg = mockResendSend.mock.calls[0][0];
    expect(msg.html).not.toContain('<script>');
    expect(msg.html).toContain('&lt;script&gt;');
  });
});
