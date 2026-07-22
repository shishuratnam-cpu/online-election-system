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
// Test connection
(async () => {
  console.log("===== RAILWAY ENV CHECK =====");
  console.log("DB_HOST =", process.env.DB_HOST);
  console.log("DB_PORT =", process.env.DB_PORT);
  console.log("DB_NAME =", process.env.DB_NAME);
  console.log("DB_USER =", process.env.DB_USER);
  console.log("NODE_ENV =", process.env.NODE_ENV);

  try {
    const connection = await pool.getConnection();
    console.log("✅ Database connected successfully.");
    connection.release();
  } catch (error) {
    console.error("========== DATABASE ERROR ==========");
    console.error(error);
    console.error("Message:", error.message);
    console.error("Code:", error.code);
  }
})();
module.exports = pool;
