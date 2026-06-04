const mockSend = jest.fn().mockResolvedValue({ data: { id: 'mock-id' }, error: null });

const Resend = jest.fn().mockImplementation(() => ({
  emails: { send: mockSend },
}));

module.exports = { Resend };
