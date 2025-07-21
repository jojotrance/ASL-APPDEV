import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

const DATASET_PATH = path.resolve(__dirname, '../data/segment_videos');

router.get('/play/:phrase', async (req, res) => {
  const phrase = req.params.phrase;
  const words = phrase.trim().split(/\s+/);
  const animations = [];

  for (const word of words) {
    const files = fs.readdirSync(DATASET_PATH);
    const prefix = word.toUpperCase() + '_';
    const matchFile = files.find(f => f.startsWith(prefix) && f.endsWith('.mp4'));
    if (matchFile) {
    animations.push({ type: 'video', url: `/api/v1/asl/file/${matchFile}`, word });
    } else {
        for (const letter of word) {
            animations.push({ type: 'fingerspell', letter });
        }
    }
  }
  res.json({ success: true, animations });
});

// Serve video files
router.get('/file/:fileName', (req, res) => {
  const fileName = req.params.fileName;
  const filePath = path.join(DATASET_PATH, fileName);
  console.log('Requested file:', filePath);
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).send('File not found');
  }
});

export default router;