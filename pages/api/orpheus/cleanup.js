import { del } from '@vercel/blob';
import { ensureSchema, sql } from '../../../lib/orpheus/_db.js';
import { json } from '../../../lib/orpheus/_security.js';
import { deleteR2Objects, storageProvider } from '../../../lib/orpheus/_r2.js';
import { deleteHetznerObjects } from '../../../lib/orpheus/_hetzner.js';

export default async function handler(req, res) {
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) return json(res, 401, { error: 'Unauthorized.' });
  await ensureSchema();
  const files = await sql`SELECT f.pathname, f.storage_provider FROM transfer_files f JOIN transfers t ON t.id = f.transfer_id
    WHERE t.expires_at <= NOW() AND t.status <> 'deleted' AND f.uploaded_at IS NOT NULL LIMIT 500`;
  const blobFiles = files.filter((file) => file.storage_provider === 'blob').map((file) => file.pathname);
  const r2Files = files.filter((file) => file.storage_provider === 'r2').map((file) => file.pathname);
  const hetznerFiles = files.filter((file) => file.storage_provider === 'hetzner').map((file) => file.pathname);
  let legacyBlobRetained=0;
  if (blobFiles.length && process.env.BLOB_READ_WRITE_TOKEN) await del(blobFiles);
  else legacyBlobRetained=blobFiles.length;
  let legacyR2Retained=0;
  if (r2Files.length && storageProvider()==='r2') await deleteR2Objects(r2Files); else legacyR2Retained=r2Files.length;
  if (hetznerFiles.length) await deleteHetznerObjects(hetznerFiles);
  await sql`UPDATE transfers SET status = 'deleted' WHERE expires_at <= NOW() AND status <> 'deleted'
    AND NOT EXISTS (SELECT 1 FROM transfer_files f WHERE f.transfer_id=transfers.id AND ((f.storage_provider='blob' AND ${legacyBlobRetained>0}) OR (f.storage_provider='r2' AND ${legacyR2Retained>0})))`;
  return json(res, 200, { deleted: files.length-legacyBlobRetained-legacyR2Retained, legacyBlobRetained, legacyR2Retained });
}
