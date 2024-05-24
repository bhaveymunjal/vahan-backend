const mysql = require('mysql2/promise');
const dotenv = require("dotenv").config();

const dbName = process.env.DB_NAME || "vahanassignment";
const dbUser = process.env.DB_USER || "root";
const dbPassword = process.env.DB_PASSWORD || "1234"
const dbHost = process.env.DB_HOST || "localhost"
;
const con =  mysql.createPool({
  host: dbHost,
  user: dbUser,
  password: dbPassword,
  database: dbName,
});

(async () => {
  try {
    const connection = await con.getConnection();
    console.log("Database connected.");
    connection.release();
  } catch (err) {
    console.error("Unable to connect to the database:", err);
  }
})();

module.exports = con;