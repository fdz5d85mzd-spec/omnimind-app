import { handleUploadPresigned } from '@vercel/blob/client';
import { issueSignedToken } from '@vercel/blob';
import { ensureSchema, sql } from '../../../lib/orpheus/_db.js';
import { hash, json } from '../../../lib/orpheus/_security.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed.' });
  try {
    await ensureSchema();
    const result = await handleUploadPresigned({
      request: req,
      body: req.body,
      getSignedToken: async (pathname, clientPayload) => {
        let payload;
        try { payload = JSON.parse(clientPayload || '{}'); } catch { throw new Error('Invalid upload payload.'); }
        const rows = await sql`SELECT t.upload_key_hash, t.expires_at, f.pathname, f.size, f.content_type
          FROM transfers t JOIN transfer_files f ON f.transfer_id = t.id
          WHERE t.id = ${payload.transferId} AND f.id = ${payload.fileId} LIMIT 1`;
        const record = rows[0];
        if (!record || record.pathname !== pathname || hash(payload.uploadKey || '') !== record.upload_key_hash || new Date(record.expires_at) <= new Date()) {
          throw new Error('Upload authorization failed.');
        }
        const token = await issueSignedToken({
          pathname,
          operations: ['put'],
          maximumSizeInBytes: Number(record.size),
          allowedContentTypes: [record.content_type || 'application/octet-stream'],
          validUntil: Date.now() + 60 * 60 * 1000,
        });
        return {
          token,
          urlOptions: {
            maximumSizeInBytes: Number(record.size),
            allowedContentTypes: [record.content_type || 'application/octet-stream'],
            tokenPayload: JSON.stringify({ transferId: payload.transferId, fileId: payload.fileId }),
            cacheControlMaxAge: 60,
          },
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        const payload = JSON.parse(tokenPayload || '{}');
        await sql`UPDATE transfer_files SET blob_url = ${blob.url}, pathname = ${blob.pathname}, uploaded_at = NOW()
          WHERE id = ${payload.fileId} AND transfer_id = ${payload.transferId}`;
      },
    });
    return json(res, 200, result);
  } catch (error) {
    console.error('upload_error', error);
    return json(res, 400, { error: error.message || 'Upload failed.' });
  }
}
