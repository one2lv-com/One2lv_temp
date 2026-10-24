import { Router, type IRouter, type Request, type Response, type NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { verifyCredentials, signToken, verifyToken } from '../lib/auth';
import { supabase, supabaseEnabled } from '../lib/supabase';

const router: IRouter = Router();

interface AuthRequest extends Request {
  authUser?: jwt.JwtPayload;
}

function authenticate(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(' ')[1];
  if (!token) { res.status(401).json({ error: 'Token missing' }); return; }
  const user = verifyToken(token);
  if (!user)  { res.status(403).json({ error: 'Invalid token' }); return; }
  req.authUser = user;
  next();
}

router.post('/login', async (req, res) => {
  const parsed = z.object({ username: z.string(), password: z.string() }).safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: 'Invalid body' }); return; }

  const { username, password } = parsed.data;
  const ok = await verifyCredentials(username, password);
  if (!ok) { res.status(403).json({ error: 'Invalid credentials' }); return; }

  const token = signToken({ id: 1, role: 'admin', user: username });
  req.log.info({ username }, 'login success');
  res.json({ token, message: 'Authentication successful' });
});

router.get('/status', (_req, res) => {
  res.json({
    node:      'Lumenis_0x73',
    security:  'active',
    status:    'operational',
    equation:  '= ++ | √∆π ⊃ (+•+³)∆⁹v',
    supabase:  supabaseEnabled,
    timestamp: new Date().toISOString(),
  });
});

router.post('/deploy', (req: AuthRequest, res: Response, next: NextFunction) => authenticate(req, res, next), async (req: AuthRequest, res: Response) => {
  const role = req.authUser?.role ?? 'unknown';
  const user = req.authUser?.user ?? '?';
  const message = 'Deployment initiated by ' + user;

  req.log.info({ role, message }, 'deploy triggered');

  if (supabaseEnabled) {
    const { error } = await supabase.from('deploy_log').insert({ role, message });
    if (error) {
      req.log.error({ err: error.message }, 'supabase deploy_log insert failed');
    }
  }

  res.json({ success: true, message, ts: new Date().toISOString() });
});

router.get('/deploy/log', (req: AuthRequest, res: Response, next: NextFunction) => authenticate(req, res, next), async (_req, res) => {
  if (supabaseEnabled) {
    const { data, error } = await supabase
      .from('deploy_log')
      .select('id, role, message, created_at')
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }
    res.json(data ?? []);
    return;
  }

  res.json([]);
});

export default router;
