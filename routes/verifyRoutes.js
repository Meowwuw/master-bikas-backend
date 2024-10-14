import express from 'express';
import pool from '../db.js';
import jwt from 'jsonwebtoken';

const router = express.Router();

router.get('/verify-email', async (req, res) => {
  const { token } = req.query;

  try {
    // Verificar el token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Actualizar el estado del usuario en la base de datos
    const [result] = await pool.query('UPDATE users SET verified = ? WHERE email = ?', [true, decoded.email]);

    if (result.affectedRows === 0) {
      return res.status(400).json({ message: 'Usuario no encontrado o ya verificado.' });
    }

    res.status(200).json({ message: 'Correo verificado correctamente. Ahora puedes iniciar sesión.' });
  } catch (error) {
    console.error('Error al verificar el token:', error);
    res.status(400).json({ message: 'El enlace de verificación es inválido o ha expirado.' });
  }
});

export default router;
