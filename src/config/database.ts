import mysql from 'mysql2/promise';

// Configuração simplificada para teste
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'rootpassword',
  database: process.env.DB_NAME || 'water_gas_db',
  waitForConnections: true,
  connectionLimit: 10
});

export default pool;