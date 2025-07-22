import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

const DATASET_PATH = path.resolve(__dirname, '../data/segment_videos');
const FINGERSPELL_PATH = path.resolve(__dirname, '../data/fingerspell');


// ASL Gloss transformation rules
function transformToASLGloss(phrase) {
  let words = phrase.trim().toLowerCase().split(/\s+/);
  
  // Remove articles, copulas, prepositions, and conjunctions (words that don't exist in ASL or are minimal)
  const wordsToRemove = [
    'the', 'a', 'an', 'is', 'are', 'am', 'was', 'were', 'be', 'being', 'been',
    'to', 'at', 'in', 'on', 'of', 'for', 'with', 'by', 'from', 'up', 'about',
    'into', 'through', 'during', 'before', 'after', 'above', 'below', 'between',
    'and', 'or', 'but', 'so', 'yet', 'nor'
  ];
  words = words.filter(word => !wordsToRemove.includes(word));
  
  // Transform verb tenses to base forms (ASL uses context for tense)
  words = words.map(word => {
    // Handle -ing endings more carefully
    if (word.endsWith('ing') && word.length > 4) {
      // Don't remove -ing from words where it's part of the root (ring, king, thing, etc.)
      const withoutIng = word.slice(0, -3);
      
      // List of words where -ing is part of the root word, not a suffix
      const ingRootWords = ['r', 'k', 'th', 'str', 'spr', 'sw', 'cl', 'br', 'dr', 'fl', 'sl', 'st', 'tr', 'tw'];
      const isRootWord = ingRootWords.some(root => withoutIng === root);
      
      if (isRootWord) {
        return word; // Keep the original word (ring, king, etc.)
      }
      
      // Check if removing -ing creates a valid base word
      // Handle doubled consonants (running -> run, sitting -> sit)
      if (withoutIng.length > 2 && withoutIng[withoutIng.length-1] === withoutIng[withoutIng.length-2]) {
        const singleConsonant = withoutIng.slice(0, -1);
        // Common patterns where we double consonants when adding -ing
        if (['run', 'sit', 'get', 'put', 'cut', 'hit', 'let', 'set', 'bet', 'fit'].includes(singleConsonant)) {
          return singleConsonant;
        }
      }
      
      return withoutIng;
    }
    
    if (word.endsWith('ed') && word.length > 3) {
      // Handle -ed endings
      const base = word.slice(0, -2);
      // Handle -ied endings (tried -> try)
      if (word.endsWith('ied')) {
        return word.slice(0, -3) + 'y';
      }
      return base;
    }
    
    if (word.endsWith('s') && word.length > 3) {
      // Remove plural 's' and third person 's'
      const base = word.slice(0, -1);
      // Handle -ies endings (flies -> fly)
      if (word.endsWith('ies')) {
        return word.slice(0, -3) + 'y';
      }
      // Handle -es endings (boxes -> box)
      if (word.endsWith('es')) {
        return word.slice(0, -2);
      }
      return base;
    }
    
    return word;
  });
  
  // Remove auxiliary verbs and modal verbs
  const auxiliaryVerbs = ['do', 'does', 'did', 'have', 'has', 'had', 'will', 'would', 'could', 'should', 'can', 'may', 'might', 'must', 'shall'];
  words = words.filter(word => !auxiliaryVerbs.includes(word));
  
  // Convert common contractions
  words = words.map(word => {
    switch(word) {
      case "don't": case "doesn't": case "didn't": return "not";
      case "won't": return "not";
      case "can't": return "not";
      case "i'm": return "i";
      case "you're": case "we're": case "they're": return word.split("'")[0];
      case "it's": case "he's": case "she's": return word.split("'")[0];
      default: return word;
    }
  });
  
  // Remove empty strings and duplicates
  words = words.filter((word, index, arr) => word.length > 0 && arr.indexOf(word) === index);
  
  return words;
}

router.get('/play/:phrase', async (req, res) => {
  const phrase = req.params.phrase;
  const aslWords = transformToASLGloss(phrase);
  const animations = [];

  for (const word of aslWords) {
    const files = fs.readdirSync(DATASET_PATH);
    const prefix = word.toUpperCase() + '_';
    const matchFile = files.find(f => f.startsWith(prefix) && f.endsWith('.mp4'));
    if (matchFile) {
      animations.push({ type: 'video', url: `/api/v1/asl/file/${matchFile}`, word });
    } else {
      // Fallback to fingerspelling
      for (const letter of word) {
        if (/[A-Za-z]/.test(letter)) { // Only fingerspell letters
          const letterFile = `${letter.toUpperCase()}.mp4`;
          animations.push({ 
            type: 'fingerspell', 
            letter: letter.toUpperCase(),
            url: `/api/v1/asl/fingerspell/${letterFile}`
          });
        }
      }
    }
  }
  
  res.json({ success: true, animations, originalPhrase: phrase, aslGloss: aslWords.join(' ') });
});

// ...existing code...
router.get('/file/:fileName', (req, res) => {
  const fileName = req.params.fileName;
  const filePath = path.join(DATASET_PATH, fileName);
  // console.log('Requested file:', filePath);
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).send('File not found');
  }
});

// Serve fingerspell video files
router.get('/fingerspell/:fileName', (req, res) => {
  const fileName = req.params.fileName;
  const filePath = path.join(FINGERSPELL_PATH, fileName);
  //console.log('Requested fingerspell file:', filePath);
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).send('Fingerspell file not found');
  }
});

export default router;