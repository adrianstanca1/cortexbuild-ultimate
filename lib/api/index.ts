import express from 'express';
import cors from 'cors';
import type { Request, Response, NextFunction } from 'express';

const app = express();
const PORT = process.env.API_PORT || 3001;

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
  });
});

app.use('/api/projects', (req: Request, res: Response, next: NextFunction) => {
  require('./routes/projects')(req, res, next);
});

app.use('/api/tasks', (req: Request, res: Response, next: NextFunction) => {
  require('./routes/tasks')(req, res, next);
});

app.use('/api/rfis', (req: Request, res: Response, next: NextFunction) => {
  require('./routes/rfis')(req, res, next);
});

app.use('/api/submittals', (req: Request, res: Response, next: NextFunction) => {
  require('./routes/submittals')(req, res, next);
});

app.use('/api/change-orders', (req: Request, res: Response, next: NextFunction) => {
  require('./routes/change-orders')(req, res, next);
});

app.use('/api/daily-reports', (req: Request, res: Response, next: NextFunction) => {
  require('./routes/daily-reports')(req, res, next);
});

app.use('/api/safety', (req: Request, res: Response, next: NextFunction) => {
  require('./routes/safety')(req, res, next);
});

app.use('/api/equipment', (req: Request, res: Response, next: NextFunction) => {
  require('./routes/equipment')(req, res, next);
});

app.use('/api/documents', (req: Request, res: Response, next: NextFunction) => {
  require('./routes/documents')(req, res, next);
});

app.use('/api/organizations', (req: Request, res: Response, next: NextFunction) => {
  require('./routes/organizations')(req, res, next);
});

app.use('/api/users', (req: Request, res: Response, next: NextFunction) => {
  require('./routes/users')(req, res, next);
});

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('API Error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Not Found' });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Express API server running on port ${PORT}`);
  });
}

export default app;
