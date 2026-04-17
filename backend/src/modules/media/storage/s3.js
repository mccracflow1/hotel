'use strict';

function loadS3() {
  try {
    // eslint-disable-next-line import/no-extraneous-dependencies, global-require
    return require('@aws-sdk/client-s3');
  } catch (e) {
    const err = new Error('STORAGE_PROVIDER=s3 requires dependency @aws-sdk/client-s3 (npm install)');
    err.code = 'S3_DEPENDENCY_MISSING';
    throw err;
  }
}

/**
 * @param {{ id: string, originalExt: string, originalBuffer: Buffer, thumbBuffer: Buffer | null, contentType: string }} opts
 */
async function saveOriginalAndThumb(opts) {
  const { S3Client, PutObjectCommand } = loadS3();
  const region = process.env.AWS_REGION;
  const bucket = process.env.AWS_BUCKET_NAME;
  if (!region || !bucket) {
    const err = new Error('AWS_REGION and AWS_BUCKET_NAME are required for S3 storage');
    err.code = 'S3_CONFIG';
    throw err;
  }
  const client = new S3Client({ region });
  const base = `media/${opts.id}`;
  const origKey = `${base}/original${opts.originalExt}`;
  const thumbKey = `${base}/thumb.webp`;

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: origKey,
      Body: opts.originalBuffer,
      ContentType: opts.contentType || 'application/octet-stream',
    })
  );

  let thumbnailUrl = null;
  if (opts.thumbBuffer && opts.thumbBuffer.length) {
    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: thumbKey,
        Body: opts.thumbBuffer,
        ContentType: 'image/webp',
      })
    );
    thumbnailUrl = publicObjectUrl(bucket, region, thumbKey);
  }

  const originalUrl = publicObjectUrl(bucket, region, origKey);
  return { originalUrl, thumbnailUrl };
}

function publicObjectUrl(bucket, region, key) {
  const cdn = (process.env.AWS_PUBLIC_BASE_URL || '').replace(/\/$/, '');
  if (cdn) return `${cdn}/${key}`;
  return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
}

async function removeFiles() {
  // MVP: objetos huérfanos se limpian con job externo; no bloquear DELETE API
}

module.exports = { saveOriginalAndThumb, removeFiles };
