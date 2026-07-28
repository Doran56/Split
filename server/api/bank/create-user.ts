import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createUser, getBridgeConfig } from '../../src/bridge';
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
    const { uuid } = await createUser(config);

    res.status(200).json({ userUuid: uuid });
  } catch (error) {
    sendError(res, error);
  }
}
