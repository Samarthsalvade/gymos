import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import slowDown from 'express-slow-down';
import routes from './routes';

const app = express();
const PORT = process.env.PORT || 3001;

// ── Security headers ──────────────────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false, // handled by frontend
}));

// ── CORS ─────────────────────────────────────────────────────────────────────
const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:5173').split(',');
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

// ── Body parsing ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Global API rate limit (100 req / 15 min per IP) ──────────────────────────
app.use('/api', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
}));

// ── Slow down repeated requests on auth endpoints ────────────────────────────
app.use('/api/auth/login', slowDown({
  windowMs: 2 * 60 * 1000,
  delayAfter: 3,
  delayMs: (hits) => hits * 500,
}));

// ── Strict rate limit on login (10 per 2 min per IP, app-level lockout is DB) ─
app.use('/api/auth/login', rateLimit({
  windowMs: 2 * 60 * 1000,
  max: 10,
  message: { error: 'Too many login attempts from this IP. Wait 2 minutes.' },
}));

// ── Health check ─────────────────────────────────────────────────────────────
app.get('/health', (_, res) => res.json({
  status: 'ok',
  db: 'postgresql',
  timestamp: new Date().toISOString(),
}));

app.use('/api', routes);

// ── Global error handler ─────────────────────────────────────────────────────
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[Error]', err.message);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`🏋️  GymOS API running at http://localhost:${PORT}`);
  console.log(`🐘 Database: PostgreSQL`);
  console.log(`🔒 Security: Helmet + Rate limiting active`);
});
