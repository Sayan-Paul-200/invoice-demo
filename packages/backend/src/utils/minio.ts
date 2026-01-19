import * as Minio from 'minio';

// Configuration matches the docker-compose values
export const minioClient = new Minio.Client({
  endPoint: process.env.MINIO_ENDPOINT || 'localhost',
  port: parseInt(process.env.MINIO_PORT || '9000'),
  useSSL: process.env.MINIO_USE_SSL === 'true',
  accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
  secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
});

export const BUCKET_NAME = process.env.MINIO_BUCKET_NAME || 'invoice-system-files';

// Helper to ensure bucket exists on startup
export const ensureBucketExists = async () => {
  try {
    const exists = await minioClient.bucketExists(BUCKET_NAME);
    if (!exists) {
      await minioClient.makeBucket(BUCKET_NAME, 'us-east-1'); // Region is required but often ignored by MinIO local
      console.log(`🪣 Bucket '${BUCKET_NAME}' created successfully.`);
    }
  } catch (err) {
    console.error('MinIO Connection Error:', err);
  }
};