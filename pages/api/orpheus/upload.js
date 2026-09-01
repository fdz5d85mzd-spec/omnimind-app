import { json } from '../../../lib/orpheus/_security.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed.' });
  return json(res, 410, {
    error: 'The legacy Vercel Blob upload endpoint is retired. Use the multipart object-storage endpoints.',
    initEndpoint: '/api/orpheus/r2-init',
  });
}
