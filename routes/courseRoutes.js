import express from 'express';
import pool from '../db.js';  // Asegúrate de que tu archivo de conexión a la base de datos esté correctamente configurado

const router = express.Router();

// Crear un nuevo curso
router.post('/courses', async (req, res) => {
  const { name } = req.body;
  
  if (!name) {
    return res.status(400).json({ error: 'El nombre del curso es requerido.' });
  }

  try {
    const [result] = await pool.query('INSERT INTO courses (name) VALUES (?)', [name]);
    res.status(201).json({ message: 'Curso creado exitosamente', courseId: result.insertId });
  } catch (error) {
    console.error('Error al crear el curso:', error);
    res.status(500).json({ error: 'Error al crear el curso' });
  }
});

// Crear un nuevo tema vinculado a un curso
router.post('/courses/:courseId/topics', async (req, res) => {
  const { name } = req.body;
  const { courseId } = req.params;

  if (!name) {
    return res.status(400).json({ error: 'El nombre del tema es requerido.' });
  }

  try {
    const [course] = await pool.query('SELECT * FROM courses WHERE id = ?', [courseId]);

    if (course.length === 0) {
      return res.status(404).json({ error: 'Curso no encontrado.' });
    }

    const [result] = await pool.query('INSERT INTO topics (course_id, name) VALUES (?, ?)', [courseId, name]);
    res.status(201).json({ message: 'Tema creado exitosamente', topicId: result.insertId });
  } catch (error) {
    console.error('Error al crear el tema:', error);
    res.status(500).json({ error: 'Error al crear el tema' });
  }
});

// Crear una nueva pregunta vinculada a un tema y asignarle un precio
router.post('/topics/:topicId/questions', async (req, res) => {
  const { text, price } = req.body;
  const { topicId } = req.params;

  if (!text || price === undefined) {
    return res.status(400).json({ error: 'La pregunta y el precio son requeridos.' });
  }

  try {
    const [topic] = await pool.query('SELECT * FROM topics WHERE id = ?', [topicId]);

    if (topic.length === 0) {
      return res.status(404).json({ error: 'Tema no encontrado.' });
    }

    const [result] = await pool.query('INSERT INTO questions (topic_id, text, price) VALUES (?, ?, ?)', [topicId, text, price]);
    res.status(201).json({ message: 'Pregunta creada exitosamente', questionId: result.insertId });
  } catch (error) {
    console.error('Error al crear la pregunta:', error);
    res.status(500).json({ error: 'Error al crear la pregunta' });
  }
});

// Obtener todos los cursos, con temas y preguntas asociados
router.get('/courses', async (req, res) => {
  try {
    const [courses] = await pool.query('SELECT * FROM courses');

    const courseData = await Promise.all(courses.map(async (course) => {
      const [topics] = await pool.query('SELECT * FROM topics WHERE course_id = ?', [course.id]);

      const topicData = await Promise.all(topics.map(async (topic) => {
        const [questions] = await pool.query('SELECT * FROM questions WHERE topic_id = ?', [topic.id]);

        return {
          ...topic,
          questions: questions.map(q => ({ id: q.id, text: q.text, price: q.price }))
        };
      }));

      return {
        ...course,
        topics: topicData
      };
    }));

    res.status(200).json(courseData);
  } catch (error) {
    console.error('Error al obtener los cursos:', error);
    res.status(500).json({ error: 'Error al obtener los cursos' });
  }
});

// Eliminar un curso (y sus temas y preguntas)
router.delete('/courses/:courseId', async (req, res) => {
    const { courseId } = req.params;
  
    try {
      // Primero eliminamos las preguntas relacionadas con los temas del curso
      await pool.query('DELETE q FROM questions q JOIN topics t ON q.topic_id = t.id WHERE t.course_id = ?', [courseId]);
  
      // Luego eliminamos los temas relacionados con el curso
      await pool.query('DELETE FROM topics WHERE course_id = ?', [courseId]);
  
      // Finalmente, eliminamos el curso
      const [result] = await pool.query('DELETE FROM courses WHERE id = ?', [courseId]);
  
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Curso no encontrado.' });
      }
  
      res.status(200).json({ message: 'Curso eliminado exitosamente' });
    } catch (error) {
      console.error('Error al eliminar el curso:', error);
      res.status(500).json({ error: 'Error al eliminar el curso' });
    }
  });

  // Obtener los temas de un curso específico
router.get('/courses/:courseId/topics', async (req, res) => {
  const { courseId } = req.params;

  try {
    const [topics] = await pool.query('SELECT * FROM topics WHERE course_id = ?', [courseId]);

    if (topics.length === 0) {
      return res.status(404).json({ error: 'No se encontraron temas para este curso.' });
    }

    res.status(200).json(topics);
  } catch (error) {
    console.error('Error al obtener los temas:', error);
    res.status(500).json({ error: 'Error al obtener los temas.' });
  }
});

// Obtener las preguntas de un tema específico
router.get('/topics/:topicId/questions', async (req, res) => {
  const { topicId } = req.params;

  try {
    const [questions] = await pool.query('SELECT * FROM questions WHERE topic_id = ?', [topicId]);

    if (questions.length === 0) {
      return res.status(404).json({ error: 'No se encontraron preguntas para este tema.' });
    }

    res.status(200).json(questions);
  } catch (error) {
    console.error('Error al obtener las preguntas:', error);
    res.status(500).json({ error: 'Error al obtener las preguntas.' });
  }
});


  
  // Eliminar un tema (y sus preguntas)
router.delete('/topics/:topicId', async (req, res) => {
    const { topicId } = req.params;
  
    try {
      // Primero eliminamos las preguntas relacionadas con el tema
      await pool.query('DELETE FROM questions WHERE topic_id = ?', [topicId]);
  
      // Luego eliminamos el tema
      const [result] = await pool.query('DELETE FROM topics WHERE id = ?', [topicId]);
  
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Tema no encontrado.' });
      }
  
      res.status(200).json({ message: 'Tema eliminado exitosamente' });
    } catch (error) {
      console.error('Error al eliminar el tema:', error);
      res.status(500).json({ error: 'Error al eliminar el tema' });
    }
  });

  // Eliminar una pregunta
// Obtener una pregunta por su ID
router.get('/questions/:questionId', async (req, res) => {
  const { questionId } = req.params;
  
  try {
    const [question] = await pool.query('SELECT * FROM questions WHERE id = ?', [questionId]);

    if (question.length === 0) {
      return res.status(404).json({ error: 'Pregunta no encontrada.' });
    }

    res.status(200).json(question[0]); // Asegúrate de devolver solo el primer elemento
  } catch (error) {
    console.error('Error al obtener la pregunta:', error);
    res.status(500).json({ error: 'Error al obtener la pregunta.' });
  }
});

  
  
  
export default router;
