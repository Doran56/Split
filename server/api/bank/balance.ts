import type { VercelRequest, VercelResponse } from '@vercel/node';
import { aggregateBalance, getAccounts, getBridgeConfig, mintAccessToken } from '../../src/bridge';
import { applyCors, sendError } from '../../src/http';

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  applyCors(res);
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'method_not_allowed' });
    return;
  }

  const userUuid = req.query.userUuid;
  if (typeof userUuid !== 'string' || !userUuid) {
    res.status(400).json({ error: 'invalid_request', message: 'userUuid manquant.' });
    return;
  }

  try {
    const config = getBridgeConfig();
    const { accessToken } = await mintAccessToken(config, userUuid);
    const accounts = await getAccounts(config, accessToken);

    res.status(200).json(aggregateBalance(accounts));
  } catch (error) {
    sendError(res, error);
  }
}
