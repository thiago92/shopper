import pool from './config/database';

async function testDB() {
  try {
    const [rows] = await pool.query('SELECT 1 + 1 AS result');
    console.log('✅ Teste de banco OK. Resultado:', rows);
  } catch (error) {
    console.error('❌ Erro no teste do banco:');
    console.error(error);
  } finally {
    await pool.end();
  }
}

testDB();