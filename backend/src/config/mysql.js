import mysql from 'mysql2/promise';
import env from './env.js';

const pool = mysql.createPool({
  host: env.mysql.host,
  port: env.mysql.port,
  database: env.mysql.database,
  user: env.mysql.user,
  password: env.mysql.password,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  decimalNumbers: true,
  dateStrings: true,
});

export async function testMysqlConnection() {
  await pool.query('SELECT 1');
}

export default pool;