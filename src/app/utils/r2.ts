import {
  CopyObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import config from "../config";

/**
 * Cloudflare R2 is S3-compatible, so we talk to it with the AWS S3 client
 * pointed at the R2 endpoint. Region is always "auto" for R2.
 */
export const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${config.r2_account_id}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: config.r2_account_id ? (config.r2_access_key_id as string) : "",
    secretAccessKey: config.r2_account_id
      ? (config.r2_secret_access_key as string)
      : "",
  },
});

export const R2_BUCKET = config.r2_bucket as string;

// Public base URL used to build the browser-facing image URL. Trailing slash
// trimmed so we can safely do `${R2_PUBLIC_URL}/${key}`.
export const R2_PUBLIC_URL = String(config.r2_public_url || "").replace(
  /\/+$/,
  ""
);

export const isR2Configured = () =>
  Boolean(
    config.r2_account_id &&
      config.r2_access_key_id &&
      config.r2_secret_access_key &&
      config.r2_bucket
  );

/** Public URL for a stored object key. */
export const r2PublicUrl = (key: string) =>
  `${R2_PUBLIC_URL}/${String(key).replace(/^\/+/, "")}`;

/** Does an object with this key already exist? (used for filename de-dup) */
export const r2KeyExists = async (key: string): Promise<boolean> => {
  try {
    await r2.send(new HeadObjectCommand({ Bucket: R2_BUCKET, Key: key }));
    return true;
  } catch {
    return false;
  }
};

export {
  CopyObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
};
