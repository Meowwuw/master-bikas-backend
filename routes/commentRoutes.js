import express from 'express';
import pool from '../db.js';
import verifyToken from '../middleware/verifyToken.js'; // Middleware para verificar el token

const router = express.Router();

// Ruta para agregar un comentario
router.post('/comments', verifyToken, async (req, res) => {
  const { questionName, commentText } = req.body;
  const userId = req.user.id;

  if (!commentText || !questionName) {
    return res.status(400).json({ message: 'El comentario o el nombre de la pregunta es requerido' });
  }

  try {
    const [result] = await pool.query(
      'INSERT INTO comments (question_name, comment_text, user_id) VALUES (?, ?, ?)',
      [questionName, commentText, userId]
    );

    if (result.affectedRows > 0) {
      res.status(201).json({ message: 'Comentario guardado exitosamente' });
    } else {
      res.status(500).json({ message: 'Error al guardar el comentario' });
    }
  } catch (error) {
    console.error('Error al guardar el comentario:', error);
    res.status(500).json({ message: 'Error al guardar el comentario' });
  }
});

// Ruta para obtener comentarios por pregunta
router.get('/comments/:questionName', async (req, res) => {
  const { questionName } = req.params;

  try {
    const [rows] = await pool.query('SELECT * FROM comments WHERE question_name = ?', [questionName]);
    res.status(200).json(rows);
  } catch (error) {
    console.error('Error al obtener los comentarios:', error);
    res.status(500).json({ message: 'Error al obtener los comentarios' });
  }
});

export default router;
