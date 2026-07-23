const fs = require("fs");
const path = require("path");
const mysql = require("mysql2/promise");
require("dotenv").config();

(async () => {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT,
      multipleStatements: true
    });

    let sql = fs.readFileSync(
      path.join(__dirname, "../database/election.sql"),
      "utf8"
    );

    // Remove database creation commands
    sql = sql.replace(/CREATE DATABASE[\s\S]*?;/i, "");
    sql = sql.replace(/USE[\s\S]*?;/i, "");

    await connection.query(sql);

    console.log("✅ Database initialized successfully!");

    await connection.end();
  } catch (err) {
    console.error(err);
  }
})();