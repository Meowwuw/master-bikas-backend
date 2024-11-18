import pool from './db.js';

const testConnection = async () => {
  try {
    const [rows] = await pool.query('SELECT NOW() AS currentTime;');
    console.log('Conexión exitosa:', rows[0]);
  } catch (error) {
    console.error('Error al conectarse a la base de datos:', error);
  }
};

testConnection();
