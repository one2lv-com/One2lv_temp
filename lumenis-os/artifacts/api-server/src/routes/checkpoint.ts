import { Router, type IRouter } from 'express';
import { z } from 'zod';
import { supabase, supabaseEnabled } from '../lib/supabase';

const router: IRouter = Router();

const CheckpointBody = z.object({
  tag:       z.string().default('heartbeat'),
  baseline:  z.coerce.number().default(18.0),
  resonance: z.coerce.number().default(73.0),
  state: z.object({
    system: z.string().default('unknown'),
    agents: z.string().default('unknown'),
  }).default({}),
  timestamp: z.string().datetime({ offset: true }).optional(),
});

router.post('/checkpoint', async (req, res) => {
  const parsed = CheckpointBody.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({ error: 'invalid payload', details: parsed.error.flatten() });
    return;
  }

  const { tag, baseline, resonance, state, timestamp } = parsed.data;
  req.log.info({ tag, baseline, resonance, state, timestamp }, 'checkpoint received');

  if (supabaseEnabled) {
    const { error } = await supabase.from('checkpoints').insert({
      tag,
      baseline,
      resonance,
      system_state: state.system,
      agents_state: state.agents,
      created_at:   timestamp ?? new Date().toISOString(),
    });
    if (error) {
      req.log.error({ err: error.message }, 'supabase checkpoint insert failed');
    }
  }

  res.json({ ok: true });
});

router.get('/checkpoint/status', (_req, res) => {
  res.json({ status: 'ok', supabase: supabaseEnabled });
});

export default router;
