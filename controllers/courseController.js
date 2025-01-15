import pool from "../config/db.js";

// Obtener todos los cursos
export const getCourses = async (req, res) => {
  try {
    const [courses] = await pool.query(`
      SELECT COURSE_ID as id, COURSE_NAME as name, IMAGE_URL as imageUrl, COURSE_DESCRIPTION as description 
      FROM COURSES
    `);

    res.status(200).json(courses);
  } catch (error) {
    console.error("Error al obtener los cursos:", error);
    res.status(500).json({ error: "Error al obtener los cursos." });
  }
};

// Obtener un curso por ID
export const getCourseById = async (req, res) => {
  const { courseId } = req.params;

  try {
    const [course] = await pool.query(`
      SELECT COURSE_ID as id, COURSE_NAME as name, IMAGE_URL as imageUrl, COURSE_DESCRIPTION as description 
      FROM COURSES
      WHERE COURSE_ID = ?
    `, [courseId]);

    if (course.length === 0) {
      return res.status(404).json({ error: "Curso no encontrado." });
    }

    res.status(200).json(course[0]);
  } catch (error) {
    console.error("Error al obtener el curso por ID:", error);
    res.status(500).json({ error: "Error al obtener el curso." });
  }
};

// Obtener temas por ID de curso
export const getTopicsByCourseId = async (req, res) => {
  const { courseId } = req.params;

  try {
    const [topics] = await pool.query(`
      SELECT TOPIC_ID as id, TOPIC_NAME as name, START_DATE as startDate
      FROM TOPIC
      WHERE COURSE_ID = ?
    `, [courseId]);

    res.status(200).json(topics);
  } catch (error) {
    console.error("Error al obtener los temas:", error);
    res.status(500).json({ error: "Error al obtener los temas." });
  }
};

// Obtener preguntas por ID de tema
export const getQuestionsByTopicId = async (req, res) => {
  const { topicId } = req.params;

  try {
    const [questions] = await pool.query(`
      SELECT QUESTION_ID as id, QUESTION_TEXT as text, QUESTION_IMAGE as image, POINTS as points, AMOUNT as amount, CREATED_AT as createdAt 
      FROM QUESTION
      WHERE TOPIC_ID = ?
    `, [topicId]);

    res.status(200).json(questions);
  } catch (error) {
    console.error("Error al obtener las preguntas:", error);
    res.status(500).json({ error: "Error al obtener las preguntas." });
  }
};

// Obtener detalles de una pregunta por ID
export const getQuestionById = async (req, res) => {
  const { questionId } = req.params;

  try {
    const [question] = await pool.query(`
      SELECT QUESTION_ID as id, QUESTION_TEXT as text, QUESTION_IMAGE as image, POINTS as points, AMOUNT as amount, CREATED_AT as createdAt 
      FROM QUESTION
      WHERE QUESTION_ID = ?
    `, [questionId]);

    if (question.length === 0) {
      return res.status(404).json({ error: "Pregunta no encontrada." });
    }

    res.status(200).json(question[0]);
  } catch (error) {
    console.error("Error al obtener la pregunta por ID:", error);
    res.status(500).json({ error: "Error al obtener la pregunta." });
  }
};
