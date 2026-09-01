import crypto from 'node:crypto';
import {createHetznerMultipart,signHetznerParts,completeHetznerMultipart,signedHetznerDownload,deleteHetznerObjects} from './_hetzner.js';

export function storageProvider(){return process.env.ORPHEUS_STORAGE_PROVIDER==='r2'?'r2':'hetzner';}

function config() {
  const workerUrl = process.env.R2_WORKER_URL;
  const secret = process.env.R2_WORKER_SECRET;
  if (!workerUrl || !secret) throw new Error('R2 storage is not configured.');
  return { workerUrl: workerUrl.replace(/\/$/, ''), secret };
}

async function worker(path, body) {
  const { workerUrl, secret } = config();
  const response = await fetch(`${workerUrl}${path}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${secret}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || 'Storage request failed.');
  return result;
}

function signature(message) {
  return crypto.createHmac('sha256', config().secret).update(message).digest('hex');
}

export function createR2Multipart(pathname, contentType) {
  if(storageProvider()==='hetzner')return createHetznerMultipart(pathname,contentType);
  return worker('/init', { key: pathname, contentType });
}

export async function signR2Parts(pathname, uploadId, partNumbers) {
  if(storageProvider()==='hetzner')return signHetznerParts(pathname,uploadId,partNumbers);
  const { workerUrl } = config();
  const expires = Date.now() + 15 * 60 * 1000;
  return partNumbers.map((partNumber) => {
    const message = `PUT\npart\n${pathname}\n${uploadId}\n${partNumber}\n${expires}`;
    const params = new URLSearchParams({ key: pathname, uploadId, part: String(partNumber), expires: String(expires), sig: signature(message) });
    return { partNumber, url: `${workerUrl}/part?${params}` };
  });
}

export function completeR2Multipart(pathname, uploadId, parts) {
  if(storageProvider()==='hetzner')return completeHetznerMultipart(pathname,uploadId,parts);
  return worker('/complete', { key: pathname, uploadId, parts });
}

export function signedR2Download(pathname, filename) {
  if(storageProvider()==='hetzner')return signedHetznerDownload(pathname,filename);
  const { workerUrl } = config();
  const expires = Date.now() + 5 * 60 * 1000;
  const message = `GET\ndownload\n${pathname}\n${filename}\n${expires}`;
  const params = new URLSearchParams({ key: pathname, name: filename, expires: String(expires), sig: signature(message) });
  return `${workerUrl}/download?${params}`;
}

export function signedR2View(pathname) {
  const { workerUrl } = config();
  const expires = Date.now() + 30 * 60 * 1000;
  const message = `GET\nview\n${pathname}\n${expires}`;
  const params = new URLSearchParams({ key: pathname, expires: String(expires), sig: signature(message) });
  return `${workerUrl}/view?${params}`;
}

export function deleteR2Objects(keys) {
  if (!keys.length) return;
  if(storageProvider()==='hetzner')return deleteHetznerObjects(keys);
  return worker('/delete', { keys });
}
