import { completeR2Multipart } from '../../../lib/orpheus/_r2.js';
import { ensureSchema, sql } from '../../../lib/orpheus/_db.js';
import { hash, json } from '../../../lib/orpheus/_security.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed.' });
  try {
    await ensureSchema();
    const { transferId, fileId, uploadKey, uploadId, parts } = req.body || {};
    if (!Array.isArray(parts) || !parts.length || parts.length > 10000) return json(res, 400, { error: 'Invalid completed parts.' });
    const rows = await sql`SELECT t.upload_key_hash, t.expires_at, f.pathname, f.r2_upload_id
      FROM transfers t JOIN transfer_files f ON f.transfer_id = t.id
      WHERE t.id = ${transferId} AND f.id = ${fileId} LIMIT 1`;
    const file = rows[0];
    if (!file || file.r2_upload_id !== uploadId || hash(uploadKey || '') !== file.upload_key_hash || new Date(file.expires_at) <= new Date()) return json(res, 403, { error: 'Upload authorization failed.' });
    await completeR2Multipart(file.pathname, uploadId, parts);
    await sql`UPDATE transfer_files SET blob_url = ${`r2://${file.pathname}`}, uploaded_at = NOW() WHERE id = ${fileId} AND transfer_id = ${transferId}`;
    return json(res, 200, { id: fileId, pathname: file.pathname, url: `r2://${file.pathname}` });
  } catch (error) {
    console.error('r2_complete_error', error);
    return json(res, 500, { error: error.message || 'Could not complete upload.' });
  }
}
