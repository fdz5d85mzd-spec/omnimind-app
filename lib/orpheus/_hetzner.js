import {S3Client,CreateMultipartUploadCommand,UploadPartCommand,CompleteMultipartUploadCommand,GetObjectCommand,DeleteObjectsCommand} from '@aws-sdk/client-s3';
import {getSignedUrl} from '@aws-sdk/s3-request-presigner';

function config(){
  const endpoint=process.env.HETZNER_S3_ENDPOINT,bucket=process.env.HETZNER_S3_BUCKET,accessKeyId=process.env.HETZNER_S3_ACCESS_KEY,secretAccessKey=process.env.HETZNER_S3_SECRET_KEY;
  if(!endpoint||!bucket||!accessKeyId||!secretAccessKey)throw new Error('Hetzner Object Storage is not configured.');
  return{bucket,prefix:(process.env.HETZNER_S3_PREFIX||'omnimind').replace(/^\/+|\/+$/g,''),client:new S3Client({endpoint,region:process.env.HETZNER_S3_REGION||'hel1',forcePathStyle:true,credentials:{accessKeyId,secretAccessKey}})};
}
function key(pathname){const{prefix}=config();return `${prefix}/${pathname}`;}
export async function createHetznerMultipart(pathname,contentType){const{client,bucket}=config();return{uploadId:(await client.send(new CreateMultipartUploadCommand({Bucket:bucket,Key:key(pathname),ContentType:contentType}))).UploadId};}
export async function signHetznerParts(pathname,uploadId,partNumbers){const{client,bucket}=config();return Promise.all(partNumbers.map(async partNumber=>({partNumber,url:await getSignedUrl(client,new UploadPartCommand({Bucket:bucket,Key:key(pathname),UploadId:uploadId,PartNumber:partNumber}),{expiresIn:900})})));}
export async function completeHetznerMultipart(pathname,uploadId,parts){const{client,bucket}=config();await client.send(new CompleteMultipartUploadCommand({Bucket:bucket,Key:key(pathname),UploadId:uploadId,MultipartUpload:{Parts:parts.map(p=>({ETag:p.etag??p.ETag,PartNumber:p.partNumber??p.PartNumber}))}}));}
export async function signedHetznerDownload(pathname,filename){const{client,bucket}=config();return getSignedUrl(client,new GetObjectCommand({Bucket:bucket,Key:key(pathname),ResponseContentDisposition:`attachment; filename="${String(filename).replace(/["\r\n]/g,'_')}"`}),{expiresIn:300});}
export async function deleteHetznerObjects(paths){if(!paths.length)return;const{client,bucket}=config();await client.send(new DeleteObjectsCommand({Bucket:bucket,Delete:{Objects:paths.map(path=>({Key:key(path)})),Quiet:true}}));}
