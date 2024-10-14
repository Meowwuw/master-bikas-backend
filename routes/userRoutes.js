import express from 'express';
import pool from '../db.js';
import verifyToken from '../middleware/verifyToken.js'; 

const router = express.Router();

// Obtener los puntos del usuario
router.get('/points', verifyToken, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT points FROM users WHERE id = ?', [req.user.id]);

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    res.status(200).json({ points: rows[0].points });
  } catch (error) {
    console.error('Error al obtener los puntos:', error);
    res.status(500).json({ message: 'Error al obtener los puntos' });
  }
});

// Actualizar los puntos del usuario
router.post('/points/update', verifyToken, async (req, res) => {
  const { newPoints } = req.body;

  try {
    const [result] = await pool.query('UPDATE users SET points = ? WHERE id = ?', [newPoints, req.user.id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    res.status(200).json({ message: 'Puntos actualizados correctamente' });
  } catch (error) {
    console.error('Error al actualizar los puntos:', error);
    res.status(500).json({ message: 'Error al actualizar los puntos' });
  }
});

router.get('/top-points', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT username, points FROM users ORDER BY points DESC LIMIT 3');
    res.status(200).json(rows); // Devuelve los 3 mejores usuarios
  } catch (error) {
    console.error('Error al obtener los usuarios con más puntos:', error);
    res.status(500).json({ message: 'Error al obtener los usuarios con más puntos' });
  }
});


// Obtener los intentos restantes
router.get('/attempts', verifyToken, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT remaining_attempts FROM users WHERE id = ?', [req.user.id]);

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    res.status(200).json({ remaining_attempts: rows[0].remaining_attempts });
  } catch (error) {
    console.error('Error al obtener los intentos:', error);
    res.status(500).json({ message: 'Error al obtener los intentos' });
  }
});

// Reducir los intentos
router.post('/attempts/use', verifyToken, async (req, res) => {
  try {
    // Verificar los intentos restantes
    const [user] = await pool.query('SELECT remaining_attempts FROM users WHERE id = ?', [req.user.id]);

    if (user.length === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    if (user[0].remaining_attempts > 0) {
      // Reducir los intentos en 1
      const [result] = await pool.query('UPDATE users SET remaining_attempts = remaining_attempts - 1 WHERE id = ?', [req.user.id]);

      if (result.affectedRows === 0) {
        return res.status(500).json({ message: 'Error al reducir los intentos' });
      }

      res.status(200).json({ message: 'Intento usado con éxito', remaining_attempts: user[0].remaining_attempts - 1 });
    } else {
      // Si no hay intentos restantes
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
      const [user] = await pool.query('SELECT email FROM users WHERE id = ?', [userId]);

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
