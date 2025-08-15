import axios from 'axios';
import { config } from '@/config/index.js';

export type CloudinaryResourceType = 'image' | 'video' | 'raw';

async function sha1Hex(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const subtle = (globalThis as any).crypto?.subtle;
  if (!subtle) {
    throw new Error('Web Crypto API is not available to compute signature');
  }
  const digest = await subtle.digest('SHA-1', data);
  const bytes = new Uint8Array(digest);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

async function buildSignature(
  params: Record<string, string | number | undefined>,
  apiSecret: string
): Promise<string> {
  const keys = Object.keys(params)
    .filter((k) => params[k] !== undefined && params[k] !== null && params[k] !== '')
    .sort();
  const toSign = keys.map((k) => `${k}=${params[k]}`).join('&');
  return sha1Hex(toSign + apiSecret);
}

export async function uploadToCloudinary(options: {
  file: string; // base64 string or data URL
  resourceType: CloudinaryResourceType;
  folder?: string;
  publicId?: string;
}): Promise<string> {
  const cloudName = config.CLOUDINARY_CLOUD_NAME;
  const apiKey = config.CLOUDINARY_API_KEY;
  const apiSecret = config.CLOUDINARY_API_SECRET;

  if (!cloudName) {
    throw new Error('CLOUDINARY_CLOUD_NAME is not configured');
  }

  const endpoint = `https://api.cloudinary.com/v1_1/${cloudName}/${options.resourceType}/upload`;

  const timestamp = Math.floor(Date.now() / 1000);
  const folder = config.CLOUDINARY_FOLDER;

  // Prefer signed uploads if apiKey and apiSecret are set; otherwise fall back to unsigned with preset
  let body: URLSearchParams;
  if (apiKey && apiSecret) {
    const paramsForSignature: Record<string, string | number | undefined> = {
      folder,
      public_id: options.publicId,
      timestamp,
    };

    const signature = await buildSignature(paramsForSignature, apiSecret);

    body = new URLSearchParams();
    body.append('file', options.file);
    body.append('api_key', apiKey);
    body.append('timestamp', String(timestamp));
    if (folder) body.append('folder', folder);
    if (options.publicId) body.append('public_id', options.publicId);
    body.append('signature', signature);
  } else {
    throw new Error(
      'Cloudinary is not configured for uploads. Set API key/secret or an upload preset.'
    );
  }

  const response = await axios.post(endpoint, body.toString(), {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    maxBodyLength: Infinity,
    maxContentLength: Infinity,
  });

  const secureUrl: string | undefined = response?.data?.secure_url || response?.data?.url;
  if (!secureUrl) {
    throw new Error('Cloudinary upload failed: no URL returned');
  }
  return secureUrl;
}
