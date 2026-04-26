/**
 * APNs dispatcher tests
 * Tests token lifecycle, multi-device fan-out, and error handling
 */

// Set DATABASE_URL to prevent db.js from calling process.exit
process.env.DATABASE_URL = 'postgresql://localhost/test';

const mockPool = {
  query: vi.fn(),
};

vi.mock('../db', () => ({
  default: mockPool,
  ...mockPool,
}));

vi.mock('../lib/push/apns-client', () => ({
  sendApnsNotification: vi.fn(),
  isApnsConfigured: vi.fn(() => true),
}));

const { sendPushToUser } = require('../lib/push/dispatcher');
const apnsClient = require('../lib/push/apns-client');

describe('Push Dispatcher (APNs)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fan out to multiple iOS tokens', async () => {
    const tokens = [
      { id: 't1', platform: 'ios', device_token: 'token1' },
      { id: 't2', platform: 'ios', device_token: 'token2' },
    ];

    mockPool.query
      .mockResolvedValueOnce({ rows: tokens }) // SELECT tokens
      .mockResolvedValueOnce({ rowCount: 1 }) // UPDATE t1
      .mockResolvedValueOnce({ rowCount: 1 }); // UPDATE t2

    apnsClient.sendApnsNotification
      .mockResolvedValueOnce({ ok: true })
      .mockResolvedValueOnce({ ok: true });

    const payload = { title: 'Test', body: 'Message' };
    await sendPushToUser('user-123', payload);

    expect(apnsClient.sendApnsNotification).toHaveBeenCalledTimes(2);
    expect(apnsClient.sendApnsNotification).toHaveBeenNthCalledWith(1, 'token1', payload);
    expect(apnsClient.sendApnsNotification).toHaveBeenNthCalledWith(2, 'token2', payload);
  });

  it('should filter tokens by 90-day last_seen_at', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [] });

    await sendPushToUser('user-123', { title: 'Test' });

    expect(mockPool.query).toHaveBeenCalledWith(
      expect.stringContaining('90 days'),
      expect.arrayContaining(['user-123'])
    );
  });

  it('should remove token on BadDeviceToken error', async () => {
    mockPool.query.mockResolvedValueOnce({
      rows: [{ id: 't1', platform: 'ios', device_token: 'bad-token' }],
    });

    apnsClient.sendApnsNotification.mockResolvedValueOnce({
      ok: false,
      reason: 'BadDeviceToken',
    });

    mockPool.query.mockResolvedValueOnce({ rowCount: 1 }); // DELETE

    await sendPushToUser('user-123', { title: 'Test' });

    expect(mockPool.query).toHaveBeenCalledWith(
      expect.stringContaining('DELETE FROM push_tokens'),
      expect.arrayContaining(['t1'])
    );
  });

  it('should remove token on Unregistered error', async () => {
    mockPool.query.mockResolvedValueOnce({
      rows: [{ id: 't2', platform: 'ios', device_token: 'unregistered-token' }],
    });

    apnsClient.sendApnsNotification.mockResolvedValueOnce({
      ok: false,
      reason: 'Unregistered',
    });

    mockPool.query.mockResolvedValueOnce({ rowCount: 1 }); // DELETE

    await sendPushToUser('user-123', { title: 'Test' });

    expect(mockPool.query).toHaveBeenCalledWith(
      expect.stringContaining('DELETE FROM push_tokens'),
      expect.anything()
    );
  });

  it('should remove token on InvalidProviderToken error', async () => {
    mockPool.query.mockResolvedValueOnce({
      rows: [{ id: 't3', platform: 'ios', device_token: 'invalid-provider' }],
    });

    apnsClient.sendApnsNotification.mockResolvedValueOnce({
      ok: false,
      reason: 'InvalidProviderToken',
    });

    mockPool.query.mockResolvedValueOnce({ rowCount: 1 }); // DELETE

    await sendPushToUser('user-123', { title: 'Test' });

    expect(mockPool.query).toHaveBeenCalledWith(
      expect.stringContaining('DELETE FROM push_tokens'),
      expect.anything()
    );
  });

  it('should update last_seen_at on successful send', async () => {
    mockPool.query.mockResolvedValueOnce({
      rows: [{ id: 't1', platform: 'ios', device_token: 'token1' }],
    });

    apnsClient.sendApnsNotification.mockResolvedValueOnce({ ok: true });

    mockPool.query.mockResolvedValueOnce({ rowCount: 1 }); // UPDATE last_seen_at

    await sendPushToUser('user-123', { title: 'Test' });

    const updateCall = mockPool.query.mock.calls.find(call =>
      call[0].includes('UPDATE push_tokens SET last_seen_at')
    );

    expect(updateCall).toBeDefined();
    expect(updateCall[1]).toContain('t1');
  });

  it('should skip push if user has no tokens', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [] });

    await sendPushToUser('user-no-tokens', { title: 'Test' });

    expect(apnsClient.sendApnsNotification).not.toHaveBeenCalled();
  });

  it('should handle missing userId gracefully', async () => {
    await sendPushToUser(null, { title: 'Test' });

    expect(mockPool.query).not.toHaveBeenCalled();
    expect(apnsClient.sendApnsNotification).not.toHaveBeenCalled();
  });

  it('should log and continue on individual token send errors', async () => {
    mockPool.query.mockResolvedValueOnce({
      rows: [
        { id: 't1', platform: 'ios', device_token: 'token1' },
        { id: 't2', platform: 'ios', device_token: 'token2' },
      ],
    });

    // First token fails with generic error, second succeeds
    apnsClient.sendApnsNotification
      .mockResolvedValueOnce({ ok: false, reason: 'SomeError', error: 'unknown error' })
      .mockResolvedValueOnce({ ok: true });

    mockPool.query
      .mockResolvedValueOnce({ rowCount: 1 }); // Attempt update for t2

    await sendPushToUser('user-123', { title: 'Test' });

    // Should still call UPDATE on second token even though first failed
    expect(apnsClient.sendApnsNotification).toHaveBeenCalledTimes(2);
  });

  it('should handle APNs not configured', async () => {
    apnsClient.isApnsConfigured.mockReturnValueOnce(false);

    await sendPushToUser('user-123', { title: 'Test' });

    expect(mockPool.query).not.toHaveBeenCalled();
    expect(apnsClient.sendApnsNotification).not.toHaveBeenCalled();
  });
});
