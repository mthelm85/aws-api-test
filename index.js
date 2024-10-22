// index.js
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json()); // For parsing application/json

// Create a pool to manage connections
const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  ssl: {
    rejectUnauthorized: false // you might need this for RDS
  }
});

// Define a route for querying data
app.get('/api/cases', async (req, res) => {
  const {
    findings_start_date,
    findings_end_date,
    trade_nm,
    legal_nm,
    cty_nm,
    st_cd,
    zip_cd,
    naic_cd,
  } = req.query;

  // Construct the SQL query with filtering
  let query = 'SELECT * FROM whd_enforcement WHERE 1=1';
  const params = [];

  if (findings_start_date) {
    query += ' AND findings_start_date >= $' + (params.length + 1);
    params.push(findings_start_date);
  }
  if (findings_end_date) {
    query += ' AND findings_end_date <= $' + (params.length + 1);
    params.push(findings_end_date);
  }
  if (trade_nm) {
    query += ' AND trade_nm ILIKE $' + (params.length + 1);
    params.push(`%${trade_nm}%`); // Use ILIKE for case-insensitive matching
  }
  if (legal_nm) {
    query += ' AND legal_name ILIKE $' + (params.length + 1);
    params.push(`%${legal_nm}%`);
  }
  if (cty_nm) {
    query += ' AND cty_nm ILIKE $' + (params.length + 1);
    params.push(`%${cty_nm}%`);
  }
  if (st_cd) {
    query += ' AND st_cd = $' + (params.length + 1);
    params.push(st_cd);
  }
  if (zip_cd) {
    query += ' AND zip_cd = $' + (params.length + 1);
    params.push(zip_cd);
  }
  if (naic_cd) {
    query += ' AND naic_cd = $' + (params.length + 1);
    params.push(naic_cd);
  }

  try {
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

app.get('/health', (req, res) => {
  console.log('Health check endpoint hit');
  res.status(200).send('OK');
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
