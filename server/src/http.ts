import type { VercelResponse } from '@vercel/node';
import { BridgeApiError, BridgeConfigError } from './bridge';

export function applyCors(res: VercelResponse): void {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

export function sendError(res: VercelResponse, error: unknown): void {
  if (error instanceof BridgeConfigError) {
    res.status(500).json({ error: 'server_misconfigured', message: error.message });
    return;
  }
  if (error instanceof BridgeApiError) {
    res.status(error.status >= 400 && error.status < 600 ? error.status : 502).json({
      error: 'bridge_api_error',
      message: error.message,
    });
    return;
  }
  const message = error instanceof Error ? error.message : 'Erreur inattendue.';
  res.status(500).json({ error: 'internal_error', message });
}
