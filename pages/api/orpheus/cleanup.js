import { del } from '@vercel/blob';
import { ensureSchema, sql } from '../../../lib/orpheus/_db.js';
import { json } from '../../../lib/orpheus/_security.js';
import { deleteR2Objects } from '../../../lib/orpheus/_r2.js';

export default async function handler(req, res) {
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) return json(res, 401, { error: 'Unauthorized.' });
  await ensureSchema();
  const files = await sql`SELECT f.pathname, f.storage_provider FROM transfer_files f JOIN transfers t ON t.id = f.transfer_id
    WHERE t.expires_at <= NOW() AND t.status <> 'deleted' AND f.uploaded_at IS NOT NULL LIMIT 500`;
  const blobFiles = files.filter((file) => file.storage_provider === 'blob').map((file) => file.pathname);
  const r2Files = files.filter((file) => file.storage_provider === 'r2').map((file) => file.pathname);
  if (blobFiles.length) await del(blobFiles);
  if (r2Files.length) await deleteR2Objects(r2Files);
  await sql`UPDATE transfers SET status = 'deleted' WHERE expires_at <= NOW() AND status <> 'deleted'`;
  return json(res, 200, { deleted: files.length });
}
