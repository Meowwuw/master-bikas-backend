import express from 'express';
import pool from '../db.js';

const router = express.Router();

// Obtener todos los testimonios con los nombres de los usuarios
router.get('/testimonials', async (req, res) => {
  console.log('Solicitud a /api/testimonials'); 
  try {
    const query = `
      SELECT 
        t.TESTIMONIAL_ID,
        u.NAMES AS user_name,
        t.CONTENT,
        t.RATING,
        t.CREATED_AT
      FROM TESTIMONIALS t
      INNER JOIN USERS u ON t.ID_USER = u.ID_USER
    `;

    const [rows] = await pool.query(query);
    res.status(200).json(rows);
  } catch (error) {
    console.error('Error al obtener testimonios:', error);
    res.status(500).json({ error: 'Error al obtener testimonios' });
  }
});




// Crear un nuevo testimonio
router.post('/testimonials', async (req, res) => {
  const { id_user, content, rating } = req.body;

  if (!id_user || !content || !rating) {
    return res.status(400).json({ error: 'Todos los campos son requeridos' });
  }

  try {
    const [result] = await pool.query(
      'INSERT INTO TESTIMONIALS (ID_USER, CONTENT, RATING) VALUES (?, ?, ?)',
      [id_user, content, rating]
    );
    res.status(201).json({ message: 'Testimonio agregado exitosamente', id: result.insertId });
  } catch (error) {
    console.error('Error al guardar el testimonio:', error);
    res.status(500).json({ error: 'Error al guardar el testimonio' });
  }
});

// Actualizar un testimonio
router.put('/testimonials/:id', async (req, res) => {
  const { id } = req.params;
  const { id_user, content, rating } = req.body;

  try {
    const [result] = await pool.query(
      'UPDATE TESTIMONIALS SET ID_USER = ?, CONTENT = ?, RATING = ? WHERE TESTIMONIAL_ID = ?',
      [id_user, content, rating, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Testimonio no encontrado' });
    }

    res.status(200).json({ message: 'Testimonio actualizado exitosamente' });
  } catch (error) {
    console.error('Error al actualizar testimonio:', error);
    res.status(500).json({ error: 'Error al actualizar testimonio' });
  }
});

// Eliminar un testimonio
router.delete('/testimonials/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const [result] = await pool.query('DELETE FROM TESTIMONIALS WHERE TESTIMONIAL_ID = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Testimonio no encontrado' });
    }

    res.status(200).json({ message: 'Testimonio eliminado exitosamente' });
  } catch (error) {
    console.error('Error al eliminar testimonio:', error);
    res.status(500).json({ error: 'Error al eliminar testimonio' });
  }
});

export default router;
