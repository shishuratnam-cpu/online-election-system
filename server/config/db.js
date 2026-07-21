const mysql = require('mysql2/promise');
require('dotenv').config();

// Create connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'online_election_db',
  port: process.env.DB_PORT || 3306,

  // Add this line
  dateStrings: true,

  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test connection
(async () => {
  try {
    const connection = await pool.getConnection();
    console.log('Database connected successfully to MySQL.');
    connection.release();
  } catch (error) {
    console.error('Database connection failed:', error.message);
    console.error('Make sure MySQL service is running and credentials in .env are correct.');
  }
})();

module.exports = pool;
