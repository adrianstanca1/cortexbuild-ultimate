import { v4 as uuidv4 } from 'uuid';
import path from 'path';

const BUCKET_NAME = process.env.AWS_S3_BUCKET || 'cortexbuild-files';
const LOCAL_STORAGE_PATH = process.env.LOCAL_STORAGE_PATH || './uploads';

interface UploadFileParams {
  key: string;
  body: Buffer | Uint8Array | string;
  contentType?: string;
  metadata?: Record<string, string>;
}

async function uploadFile({
  key,
  body,
  contentType = 'application/octet-stream',
  metadata,
}: UploadFileParams): Promise<{ key: string; url: string }> {
  if (process.env.AWS_ACCESS_KEY_ID) {
    const region = process.env.AWS_REGION || 'us-east-1';
    const url = `https://${BUCKET_NAME}.s3.${region}.amazonaws.com/${key}`;

    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': contentType,
        ...Object.fromEntries(
          Object.entries(metadata || {}).map(([k, v]) => [`x-amz-meta-${k}`, v])
        ),
      },
      body: Buffer.from(body),
    });

    if (!response.ok) {
      throw new Error(`Failed to upload to S3: ${response.statusText}`);
    }

    return { key, url };
  }

  const fs = await import('fs');
  const localPath = path.join(LOCAL_STORAGE_PATH, key);
  const dir = path.dirname(localPath);

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(localPath, body);
  const fileUrl = `/uploads/${key}`;
  return { key, url: fileUrl };
}

interface GetSignedUrlParams {
  key: string;
  expiresIn?: number;
  contentType?: string;
}

async function getSignedUploadUrl({
  key,
  expiresIn = 3600,
  contentType,
}: GetSignedUrlParams): Promise<string> {
  if (process.env.AWS_ACCESS_KEY_ID) {
    const region = process.env.AWS_REGION || 'us-east-1';
    const url = `https://${BUCKET_NAME}.s3.${region}.amazonaws.com/${key}`;
    const expiresAt = Math.floor(Date.now() / 1000) + expiresIn;

    const params = new URLSearchParams({
      'X-Amz-Algorithm': 'AWS4-HMAC-SHA256',
      'X-Amz-Expires': expiresIn.toString(),
      'X-Amz-Credential': `${process.env.AWS_ACCESS_KEY_ID}/${new Date().toISOString().slice(0, 8)}/${region}/s3/aws4_request`,
      'X-Amz-SignedHeaders': 'host',
    });

    if (contentType) {
      params.set('Content-Type', contentType);
    }

    return `${url}?${params.toString()}`;
  }

  return `/api/upload?key=${encodeURIComponent(key)}`;
}

async function getSignedDownloadUrl(key: string, expiresIn = 3600): Promise<string> {
  if (process.env.AWS_ACCESS_KEY_ID) {
    const region = process.env.AWS_REGION || 'us-east-1';
    const url = `https://${BUCKET_NAME}.s3.${region}.amazonaws.com/${key}`;
    const expiresAt = Math.floor(Date.now() / 1000) + expiresIn;

    const params = new URLSearchParams({
      'X-Amz-Algorithm': 'AWS4-HMAC-SHA256',
      'X-Amz-Expires': expiresIn.toString(),
      'X-Amz-Credential': `${process.env.AWS_ACCESS_KEY_ID}/${new Date().toISOString().slice(0, 8)}/${region}/s3/aws4_request`,
      'X-Amz-SignedHeaders': 'host',
    });

    return `${url}?${params.toString()}`;
  }

  return `/api/download?key=${encodeURIComponent(key)}`;
}

async function deleteFile(key: string): Promise<void> {
  if (process.env.AWS_ACCESS_KEY_ID) {
    const region = process.env.AWS_REGION || 'us-east-1';
    const url = `https://${BUCKET_NAME}.s3.${region}.amazonaws.com/${key}`;

    const response = await fetch(url, {
      method: 'DELETE',
    });

    if (!response.ok && response.status !== 404) {
      throw new Error(`Failed to delete from S3: ${response.statusText}`);
    }
    return;
  }

  const fs = await import('fs');
  const localPath = path.join(LOCAL_STORAGE_PATH, key);

  if (fs.existsSync(localPath)) {
    fs.unlinkSync(localPath);
  }
}

async function listFiles(prefix: string = ''): Promise<string[]> {
  if (process.env.AWS_ACCESS_KEY_ID) {
    const region = process.env.AWS_REGION || 'us-east-1';
    const url = `https://${BUCKET_NAME}.s3.${region}.amazonaws.com/?list-type=2&prefix=${encodeURIComponent(prefix)}`;

    const response = await fetch(url, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error(`Failed to list S3 files: ${response.statusText}`);
    }

    const text = await response.text();
    const keys: string[] = [];
    const matches = text.matchAll(/<Key>([^<]+)<\/Key>/g);
    for (const match of matches) {
      keys.push(match[1]);
    }
    return keys;
  }

  const fs = await import('fs');
  const localPath = path.join(LOCAL_STORAGE_PATH, prefix);

  if (!fs.existsSync(localPath)) {
    return [];
  }

  const files = fs.readdirSync(localPath, { withFileTypes: true });
  return files
    .filter((file: { isFile: () => boolean }) => file.isFile())
    .map((file: { name: string }) => path.join(prefix, file.name));
}

async function getFile(key: string): Promise<Buffer | null> {
  if (process.env.AWS_ACCESS_KEY_ID) {
    const region = process.env.AWS_REGION || 'us-east-1';
    const url = `https://${BUCKET_NAME}.s3.${region}.amazonaws.com/${key}`;

    const response = await fetch(url);

    if (!response.ok) {
      return null;
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  const fs = await import('fs');
  const localPath = path.join(LOCAL_STORAGE_PATH, key);

  if (!fs.existsSync(localPath)) {
    return null;
  }

  return fs.readFileSync(localPath);
}

function generateFileKey(
  projectId: string,
  fileName: string,
  folder?: string
): string {
  const ext = path.extname(fileName);
  const id = uuidv4();
  const baseName = path.basename(fileName, ext).replace(/[^a-zA-Z0-9-_]/g, '_');

  const folderPath = folder
    ? `${projectId}/${folder}/`
    : `${projectId}/`;

  return `${folderPath}${baseName}_${id}${ext}`;
}

async function copyFile(sourceKey: string, destKey: string): Promise<void> {
  const content = await getFile(sourceKey);
  if (content) {
    await uploadFile({ key: destKey, body: content });
  }
}

function getPublicUrl(key: string): string {
  if (process.env.AWS_ACCESS_KEY_ID) {
    const region = process.env.AWS_REGION || 'us-east-1';
    return `https://${BUCKET_NAME}.s3.${region}.amazonaws.com/${key}`;
  }

  return `/uploads/${key}`;
}

export {
  uploadFile,
  getSignedUploadUrl,
  getSignedDownloadUrl,
  deleteFile,
  listFiles,
  getFile,
  generateFileKey,
  copyFile,
  getPublicUrl,
  uuidv4,
};
