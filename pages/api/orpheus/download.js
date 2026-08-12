import { getDownloadUrl, issueSignedToken, presignUrl } from '@vercel/blob';
import { ensureSchema, sql } from '../../../lib/orpheus/_db.js';
import { json } from '../../../lib/orpheus/_security.js';
import { signedR2Download } from '../../../lib/orpheus/_r2.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return json(res, 405, { error: 'Method not allowed.' });
  try {
    await ensureSchema();
    const code = String(req.query.code || '');
    const fileId = String(req.query.file || req.query.fileId || '');
    if (!/^[A-Za-z0-9_-]{6,32}$/.test(code) || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(fileId)) {
      return json(res, 400, { error: 'Invalid download link.' });
    }
    const rows = await sql`UPDATE transfer_files f SET download_count = download_count + 1
      FROM transfers t WHERE t.id = f.transfer_id AND t.code = ${code} AND f.id = ${fileId}
      AND f.uploaded_at IS NOT NULL AND f.download_count < 20 AND t.status = 'ready' AND t.expires_at > NOW()
      RETURNING f.pathname, f.name, f.storage_provider`;
    if (!rows[0]) return json(res, 404, { error: 'File not found or transfer expired.' });
    if (rows[0].storage_provider === 'r2') {
      res.statusCode = 302;
      res.setHeader('Location', await signedR2Download(rows[0].pathname, rows[0].name));
      res.setHeader('Cache-Control', 'no-store');
      return res.end();
    }
    const validUntil = Date.now() + 5 * 60 * 1000;
    const token = await issueSignedToken({ pathname: rows[0].pathname, operations: ['get'], validUntil });
    const { presignedUrl } = await presignUrl(token, { access: 'private', operation: 'get', pathname: rows[0].pathname, validUntil });
    res.statusCode = 302;
    res.setHeader('Location', getDownloadUrl(presignedUrl));
    res.setHeader('Cache-Control', 'no-store');
    return res.end();
  } catch (error) {
    console.error('download_error', error);
    return json(res, 500, { error: 'Download unavailable.' });
  }
}
