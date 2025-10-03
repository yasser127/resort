import mysql from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();

let pool = null;

export default async function getPool() {
  if (pool) return pool;
  pool = mysql.createPool({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASS || "",
    database: process.env.DB_NAME || "resort",
    waitForConnections: true,
    connectionLimit: 10,
    timezone: "+00:00",
    decimalNumbers: true
  });
  return pool;
}
