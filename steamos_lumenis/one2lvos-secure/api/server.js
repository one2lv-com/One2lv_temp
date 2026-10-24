// one2lvOs Secure Stack — Lumenis_0x73
// JWT-authenticated Node.js API

import express from 'express';
import fs from 'fs';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import winston from 'winston';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

const app = express();

// Security headers
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
  next();
});
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'one2lv-secure-jwt-secret-change-in-production';
const ADMIN_USER = process.env.ADMIN_USER || 'one2lv';
const ADMIN_PASS = process.env.ADMIN_PASS || '';

if (!fs.existsSync('./logs')) fs.mkdirSync('./logs', { recursive: true });

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: './logs/node.log' }),
    new winston.transports.Console({ format: winston.format.simple() })
  ]
});

// Generate live hash on startup — password never hardcoded
let LIVE_HASH = '';
(async () => {
  LIVE_HASH = await bcrypt.hash(ADMIN_PASS, 10);
  logger.info(`Lumenis_0x73 ready. User: ${ADMIN_USER}`);
})();

app.use(cors());
app.use(express.json());
app.use(rateLimit({ windowMs: 60_000, max: 100, message: { error: 'Rate limit exceeded' } }));

// ── AUTH MIDDLEWARE ──
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access Denied: Token Missing' });
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Access Denied: Invalid Token' });
    req.user = user;
    next();
  });
}

// ── PUBLIC ROUTES ──

app.get('/api/status', (req, res) => {
  res.json({
    node: 'Lumenis_0x73',
    security: 'active',
    status: 'operational',
    frequency: '73.0 Hz',
    timestamp: new Date().toISOString()
  });
});

app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Username and password required' });
  if (username !== ADMIN_USER) return res.status(400).json({ error: 'User not found' });
  if (!LIVE_HASH) return res.status(503).json({ error: 'Server initializing — try again' });

  const valid = await bcrypt.compare(password, LIVE_HASH);
  if (!valid) return res.status(403).json({ error: 'Invalid credentials' });

  const token = jwt.sign({ id: 1, user: username, role: 'admin' }, JWT_SECRET, { expiresIn: '9999h' });
  logger.info(`Login: ${username}`);
  res.json({ token, message: 'Authentication successful', node: 'Lumenis_0x73' });
});

// ── PROTECTED ROUTES ──

app.post('/api/deploy', authenticateToken, (req, res) => {
  const entry = `[${new Date().toISOString()}] DEPLOY BY ${req.user.role.toUpperCase()} (${req.user.user})\n`;
  fs.appendFileSync('./logs/deploy.log', entry);
  logger.info(`Deployment triggered by ${req.user.user}`);
  res.json({ success: true, message: 'Deployment initiated and logged.', timestamp: new Date().toISOString() });
});

app.get('/api/logs', authenticateToken, (req, res) => {
  try {
    const lines = fs.existsSync('./logs/deploy.log')
      ? fs.readFileSync('./logs/deploy.log', 'utf8').trim().split('\n').slice(-20)
      : [];
    res.json({ logs: lines });
  } catch {
    res.json({ logs: [] });
  }
});

app.get('/api/mesh/status', authenticateToken, (req, res) => {
  res.json({
    node: 'Lumenis_0x73',
    frequency: '73.0 Hz',
    layer: 'L0/L1/L2',
    mesh: 'active',
    peers: parseInt(process.env.MESH_PEERS_COUNT || '0'),
    timestamp: new Date().toISOString()
  });
});

app.post('/api/mesh/broadcast', authenticateToken, (req, res) => {
  const { event } = req.body;
  if (!event) return res.status(400).json({ error: 'event required' });
  logger.info(`Mesh broadcast: ${JSON.stringify(event)}`);
  res.json({ success: true, broadcast: event, timestamp: new Date().toISOString() });
});

app.listen(PORT, 'localhost', () => {
  console.log('');
  console.log('╔══════════════════════════════════════════╗');
  console.log('║    one2lvOs Secure Stack — Lumenis_0x73  ║');
  console.log('╠══════════════════════════════════════════╣');
  console.log(`║  API:  http://localhost:${PORT}               ║`);
  console.log(`║  Freq: 73.0 Hz                           ║`);
  console.log(`║  Auth: JWT ✓  Rate-limit ✓  Logging ✓   ║`);
  console.log('╚══════════════════════════════════════════╝');
});
