import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createConnectSession, getBridgeConfig, mintAccessToken } from '../../src/bridge';
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

  const { userUuid, userEmail, callbackUrl } = req.body ?? {};
  if (typeof userUuid !== 'string' || !userUuid) {
    res.status(400).json({ error: 'invalid_request', message: 'userUuid manquant.' });
    return;
  }
  if (typeof userEmail !== 'string' || !userEmail) {
    res.status(400).json({ error: 'invalid_request', message: 'userEmail manquant.' });
    return;
  }
  if (typeof callbackUrl !== 'string' || !callbackUrl) {
    res.status(400).json({ error: 'invalid_request', message: 'callbackUrl manquant.' });
    return;
  }

  try {
    const config = getBridgeConfig();
    const { accessToken } = await mintAccessToken(config, userUuid);
    const { connectUrl } = await createConnectSession(config, accessToken, userEmail, callbackUrl);

    res.status(200).json({ connectUrl });
  } catch (error) {
    sendError(res, error);
  }
}
