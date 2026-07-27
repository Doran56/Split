import type { VercelRequest, VercelResponse } from '@vercel/node';
import { randomUUID } from 'node:crypto';
import { getBridgeConfig, mintAccessToken } from '../../src/bridge';
import { applyCors, sendError } from '../../src/http';

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  applyCors(res);
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method_not_allowed' });
    return;
  }

  try {
    const config = getBridgeConfig();
    const userUuid = randomUUID();
    // Bridge's token endpoint creates the user on first call for a new user_uuid, so this
    // both registers the user with Bridge and validates our credentials in one round trip.
    await mintAccessToken(config, userUuid);

    res.status(200).json({ userUuid });
  } catch (error) {
    sendError(res, error);
  }
}
