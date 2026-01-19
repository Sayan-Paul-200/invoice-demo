import { Router, Request, Response } from 'express';
import multer from 'multer';
import { minioClient, BUCKET_NAME } from '../../../utils/minio';
import { addContext } from '../../../utils/middlewares';

const router = Router();

const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Limit 5MB
});

// 1. POST /api/v1/storage/upload -> PROTECTED
// We add 'addContext' here so only logged-in users can upload.
router.post('/upload', addContext, upload.single('file'), async (req: Request, res: Response) => {
  if (!req.file) {
    res.status(400).json({ error: 'No file provided' });
    return;
  }

  try {
    const fileExtension = req.file.originalname.split('.').pop();
    const objectName = `${Date.now()}-${Math.round(Math.random() * 1e9)}.${fileExtension}`;

    await minioClient.putObject(
      BUCKET_NAME,
      objectName,
      req.file.buffer,
      req.file.size,
      { 'Content-Type': req.file.mimetype }
    );

    const relativeUrl = `/api/v1/storage/file/${objectName}`;
    
    res.json({ 
      url: relativeUrl, 
      key: objectName,
      originalName: req.file.originalname 
    });

  } catch (error) {
    console.error('File Upload Error:', error);
    res.status(500).json({ error: 'Failed to upload file' });
  }
});

// 2. GET /api/v1/storage/file/:objectName -> PUBLIC
// No middleware here! This allows <img> tags to load the image.
router.get('/file/:objectName', async (req: Request, res: Response) => {
  const { objectName } = req.params;

  try {
    const stat = await minioClient.statObject(BUCKET_NAME, objectName);
    
    if (stat.metaData && stat.metaData['content-type']) {
      res.setHeader('Content-Type', stat.metaData['content-type']);
    }

    const dataStream = await minioClient.getObject(BUCKET_NAME, objectName);
    dataStream.pipe(res);
    
  } catch (error) {
    console.error('File Retrieval Error:', error);
    res.status(404).json({ error: 'File not found' });
  }
});

export { router as storageRouter };