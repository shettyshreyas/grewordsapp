const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const multer = require('multer');
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        file.mimetype === 'application/vnd.ms-excel') {
      cb(null, true);
    } else {
      cb(new Error('Only Excel files are allowed'));
    }
  }
});

// Add health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Update CORS configuration
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://shreyasshetty.github.io',
    'https://shreyasshetty.github.io/grewordsapp'
  ],
  credentials: true
}));

// Function to fetch word details from Free Dictionary API
async function fetchWordDetails(word) {
  try {
    const response = await axios.get(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
    const entry = response.data[0];
    
    // Get the first meaning
    const meaning = entry.meanings[0]?.definitions[0]?.definition || 'No definition available';
    
    // Get the first example sentence
    const example = entry.meanings[0]?.definitions[0]?.example || 
                   entry.meanings[0]?.definitions[0]?.example || 
                   `Example sentence for ${word}`;
    
    return { meaning, example };
  } catch (error) {
    console.error(`Error fetching details for word ${word}:`, error.message);
    return {
      meaning: 'Definition not available',
      example: `Example sentence for ${word}`
    };
  }
}

// Add file upload endpoint
app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const workbook = XLSX.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    // Process each row
    for (const row of data) {
      const { word, group_name } = row;

      // Fetch word details from dictionary API
      const { meaning, example } = await fetchWordDetails(word);

      // Insert or get group
      const groupResult = await pool.query(
        'INSERT INTO groups (name) VALUES ($1) ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING id',
        [group_name]
      );
      const groupId = groupResult.rows[0].id;

      // Insert word with fetched details
      await pool.query(
        'INSERT INTO words (word, meaning, example, group_id) VALUES ($1, $2, $3, $4) ON CONFLICT (word) DO UPDATE SET meaning = EXCLUDED.meaning, example = EXCLUDED.example, group_id = EXCLUDED.group_id',
        [word, meaning, example, groupId]
      );
    }

    // Clean up uploaded file
    fs.unlinkSync(req.file.path);

    res.json({ message: 'File processed successfully' });
  } catch (error) {
    console.error('Error processing file:', error);
    res.status(500).json({ error: 'Error processing file' });
  }
});

// Add endpoint to fetch all words with search and filter
app.get('/api/words', async (req, res) => {
  try {
    const { search, group, meaning } = req.query;
    
    let query = `
      SELECT w.*, g.name as group_name 
      FROM words w 
      JOIN groups g ON w.group_id = g.id 
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    if (search) {
      query += ` AND (w.word ILIKE $${paramCount} OR w.meaning ILIKE $${paramCount})`;
      params.push(`%${search}%`);
      paramCount++;
    }

    if (group) {
      query += ` AND g.name ILIKE $${paramCount}`;
      params.push(`%${group}%`);
      paramCount++;
    }

    if (meaning) {
      query += ` AND w.meaning ILIKE $${paramCount}`;
      params.push(`%${meaning}%`);
      paramCount++;
    }

    query += ` ORDER BY w.word ASC`;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching words:', error);
    res.status(500).json({ error: 'Error fetching words' });
  }
}); 