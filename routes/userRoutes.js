import express from 'express';
import pool from '../db.js';
import verifyToken from '../middleware/verifyToken.js'; 

const router = express.Router();

// Obtener los puntos del usuario
router.get('/points', verifyToken, async (req, res) => {
  console.log("Usuario autenticado:", req.user); 
  try {
    const [rows] = await pool.query('SELECT POINTS FROM USERS WHERE ID_USER = ?', [req.user.ID_USER]);

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    res.status(200).json({ points: rows[0].POINTS });
  } catch (error) {
    console.error('Error al obtener los puntos:', error);
    res.status(500).json({ message: 'Error al obtener los puntos' });
  }
});


// Actualizar los puntos del usuario
router.post('/points/update', verifyToken, async (req, res) => {
  const { newPoints } = req.body;

  try {
    const [result] = await pool.query('UPDATE USERS SET POINTS = ? WHERE ID_USER = ?', [newPoints, req.user.ID_USER]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    res.status(200).json({ message: 'Puntos actualizados correctamente' });
  } catch (error) {
    console.error('Error al actualizar los puntos:', error);
    res.status(500).json({ message: 'Error al actualizar los puntos' });
  }
});


// Obtener los usuarios con más puntos
router.get('/top-points', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT NAMES, POINTS FROM USERS ORDER BY POINTS DESC LIMIT 3');
    res.status(200).json(rows);
  } catch (error) {
    console.error('Error al obtener los usuarios con más puntos:', error);
    res.status(500).json({ message: 'Error al obtener los usuarios con más puntos' });
  }
});


// Obtener intentos restantes
router.get('/attempts', verifyToken, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT REMAINING_ATTEMPTS FROM USERS WHERE ID_USER = ?', [req.user.ID_USER]);

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    res.status(200).json({ remaining_attempts: rows[0].REMAINING_ATTEMPTS });
  } catch (error) {
    console.error('Error al obtener los intentos:', error);
    res.status(500).json({ message: 'Error al obtener los intentos' });
  }
});


// Reducir intentos
router.post('/attempts/use', verifyToken, async (req, res) => {
  try {
    const [user] = await pool.query('SELECT REMAINING_ATTEMPTS FROM USERS WHERE ID_USER = ?', [req.user.ID_USER]);

    if (user.length === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    if (user[0].REMAINING_ATTEMPTS > 0) {
      const [result] = await pool.query('UPDATE USERS SET REMAINING_ATTEMPTS = REMAINING_ATTEMPTS - 1 WHERE ID_USER = ?', [req.user.ID_USER]);

      if (result.affectedRows === 0) {
        return res.status(500).json({ message: 'Error al reducir los intentos' });
      }

      res.status(200).json({ message: 'Intento usado con éxito', remaining_attempts: user[0].REMAINING_ATTEMPTS - 1 });
    } else {
      res.status(403).json({ message: 'No tienes más intentos. Debes realizar un pago para continuar.' });
    }
  } catch (error) {
    console.error('Error al reducir los intentos:', error);
    res.status(500).json({ message: 'Error al reducir los intentos' });
  }
});

router.get('/:userId', verifyToken, async (req, res) => {
  const { userId } = req.params;
  try {
      const [user] = await pool.query('SELECT EMAIL FROM USERS WHERE ID_USER = ?', [userId]);

      if (user.length === 0) {
          return res.status(404).json({ message: 'Usuario no encontrado' });
      }

      res.status(200).json(user[0]); // Devuelve el usuario
  } catch (error) {
      console.error('Error al obtener el usuario:', error);
      res.status(500).json({ message: 'Error al obtener el usuario' });
  }
});


export default router;
