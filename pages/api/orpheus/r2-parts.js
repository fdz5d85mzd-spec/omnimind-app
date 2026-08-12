import { signR2Parts } from '../../../lib/orpheus/_r2.js';
import { ensureSchema, sql } from '../../../lib/orpheus/_db.js';
import { hash, json } from '../../../lib/orpheus/_security.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed.' });
  try {
    await ensureSchema();
    const { transferId, fileId, uploadKey, uploadId, partNumbers } = req.body || {};
    if (!Array.isArray(partNumbers) || !partNumbers.length || partNumbers.length > 50 || partNumbers.some((value) => !Number.isInteger(value) || value < 1 || value > 10000)) return json(res, 400, { error: 'Invalid parts.' });
    const rows = await sql`SELECT t.upload_key_hash, t.expires_at, f.pathname, f.r2_upload_id
      FROM transfers t JOIN transfer_files f ON f.transfer_id = t.id
      WHERE t.id = ${transferId} AND f.id = ${fileId} LIMIT 1`;
    const file = rows[0];
    if (!file || file.r2_upload_id !== uploadId || hash(uploadKey || '') !== file.upload_key_hash || new Date(file.expires_at) <= new Date()) return json(res, 403, { error: 'Upload authorization failed.' });
    return json(res, 200, { parts: await signR2Parts(file.pathname, uploadId, partNumbers) });
  } catch (error) {
    console.error('r2_parts_error', error);
    return json(res, 500, { error: 'Could not authorize upload parts.' });
  }
}
