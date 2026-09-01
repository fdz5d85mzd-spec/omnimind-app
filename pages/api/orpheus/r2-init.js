import { createR2Multipart } from '../../../lib/orpheus/_r2.js';
import { ensureSchema, sql } from '../../../lib/orpheus/_db.js';
import { hash, json } from '../../../lib/orpheus/_security.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed.' });
  try {
    await ensureSchema();
    const { transferId, fileId, uploadKey } = req.body || {};
    const rows = await sql`SELECT t.upload_key_hash, t.expires_at, f.pathname, f.content_type, f.size
      FROM transfers t JOIN transfer_files f ON f.transfer_id = t.id
      WHERE t.id = ${transferId} AND f.id = ${fileId} AND f.storage_provider IN ('r2','hetzner') LIMIT 1`;
    const file = rows[0];
    if (!file || hash(uploadKey || '') !== file.upload_key_hash || new Date(file.expires_at) <= new Date()) return json(res, 403, { error: 'Upload authorization failed.' });
    const result = await createR2Multipart(file.pathname, file.content_type || 'application/octet-stream');
    await sql`UPDATE transfer_files SET r2_upload_id = ${result.uploadId} WHERE id = ${fileId} AND transfer_id = ${transferId}`;
    return json(res, 200, { uploadId: result.uploadId, pathname: file.pathname, partSize: 128 * 1024 * 1024, size: Number(file.size) });
  } catch (error) {
    console.error('r2_init_error', error);
    return json(res, 500, { error: error.message || 'Could not start upload.' });
  }
}
