import { jest } from '@jest/globals';
import { listAlerts, createAlert, acknowledgeAlert } from '../controllers/alertController';
import { Pool } from 'pg';

// Mock the pg Pool
jest.mock('pg', () => {
  const mPool = {
    query: jest.fn(),
  };
  return { Pool: jest.fn(() => mPool) };
});

describe('Alert Controller', () => {
  let req, res, pool;

  beforeEach(() => {
    req = {
      query: {},
      body: {},
      params: {},
      app: { get: jest.fn(() => ({ emit: jest.fn() })) },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    pool = new Pool();
    jest.clearAllMocks();
  });

  describe('listAlerts', () => {
    it('should return alerts from the database', async () => {
      const mockAlerts = [{ id: 1, message: 'Test alert' }];
      pool.query.mockResolvedValueOnce({ rows: mockAlerts });

      await listAlerts(req, res);

      expect(pool.query).toHaveBeenCalledWith('SELECT * FROM alerts ORDER BY created_at DESC');
      expect(res.json).toHaveBeenCalledWith(mockAlerts);
    });

    it('should handle errors when fetching alerts', async () => {
      pool.query.mockRejectedValueOnce(new Error('DB Error'));

      await listAlerts(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Failed to fetch alerts' });
    });
  });

  describe('createAlert', () => {
    it('should insert alert and emit event', async () => {
      const newAlert = { message: 'New alert' };
      req.body = newAlert;
      pool.query.mockResolvedValueOnce({ rows: [{ id: 1, ...newAlert }] });

      await createAlert(req, res);

      expect(pool.query).toHaveBeenCalledWith(
        'INSERT INTO alerts (message) VALUES ($1) RETURNING *',
        [newAlert.message]
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ id: 1, ...newAlert });
    });

    it('should handle insert errors', async () => {
      req.body = { message: 'Error alert' };
      pool.query.mockRejectedValueOnce(new Error('DB Insert Error'));

      await createAlert(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Failed to create alert' });
    });
  });

  describe('acknowledgeAlert', () => {
    it('should update alert status to acknowledged', async () => {
      req.params = { id: 1 };
      pool.query.mockResolvedValueOnce({ rowCount: 1 });

      await acknowledgeAlert(req, res);

      expect(pool.query).toHaveBeenCalledWith(
        'UPDATE alerts SET acknowledged = TRUE WHERE id = $1',
        [1]
      );
      expect(res.json).toHaveBeenCalledWith({ message: 'Alert acknowledged' });
    });

    it('should return 404 if alert not found', async () => {
      req.params = { id: 999 };
      pool.query.mockResolvedValueOnce({ rowCount: 0 });

      await acknowledgeAlert(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Alert not found' });
    });

    it('should handle update errors', async () => {
      req.params = { id: 1 };
      pool.query.mockRejectedValueOnce(new Error('DB Update Error'));

      await acknowledgeAlert(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Failed to acknowledge alert' });
    });
  });
});
