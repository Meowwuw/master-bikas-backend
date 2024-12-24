import express from "express";
import pool from "../db.js";
import { s3 } from "../config/awsConfig.js";
import verifyToken from "../middleware/verifyToken.js";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";
const storage = multer.memoryStorage();
const upload = multer({ storage });

const router = express.Router();

// Obtener todos los cursos
router.get("/courses", async (req, res) => {
  try {
    const [courses] = await pool.query(
      "SELECT COURSE_ID, COURSE_NAME, IMAGE_URL, COURSE_DESCRIPTION FROM COURSES"
    );
    res.status(200).json(courses);
  } catch (error) {
    console.error("Error al obtener los cursos:", error);
    res.status(500).json({ error: "Error al obtener los cursos" });
  }
});

// Crear un nuevo curso
router.post("/courses", async (req, res) => {
  const { name } = req.body;

  if (!name) {
    return res.status(400).json({ error: "El nombre del curso es requerido." });
  }

  try {
    const [result] = await pool.query(
      "INSERT INTO COURSES (COURSE_NAME) VALUES (?)",
      [name]
    );
    res.status(201).json({
      message: "Curso creado exitosamente",
      courseId: result.insertId,
    });
  } catch (error) {
    console.error("Error al crear el curso:", error);
    res.status(500).json({ error: "Error al crear el curso" });
  }
});

router.get("/courses/:courseId", async (req, res) => {
  const { courseId } = req.params;

  try {
    const [course] = await pool.query(
      "SELECT COURSE_ID, COURSE_NAME, IMAGE_URL, COURSE_DESCRIPTION FROM COURSES WHERE COURSE_ID = ?",
      [courseId]
    );

    if (course.length === 0) {
      return res.status(404).json({ message: "Curso no encontrado" });
    }

    res.status(200).json(course[0]); 
  } catch (error) {
    console.error("Error al obtener el curso:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});


// Obtener temas por ID de curso
router.get("/courses/:courseId/topics", async (req, res) => {
  const { courseId } = req.params;

  try {
    const [topics] = await pool.query(
      "SELECT TOPIC_ID, TOPIC_NAME, START_DATE, VIEWS FROM TOPIC WHERE COURSE_ID = ?",
      [courseId]
    );

    if (topics.length === 0) {
      return res.status(404).json({ message: "No se encontraron temas para este curso." });
    }

    res.status(200).json(topics);
  } catch (error) {
    console.error("Error al obtener los temas:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// Obtener todas las preguntas por ID de tema
router.get("/topics/:topicId/questions", async (req, res) => {
  const { topicId } = req.params;

  try {
    const [questions] = await pool.query(
      "SELECT QUESTION_ID, QUESTION_TEXT, QUESTION_IMAGE, POINTS, VIEWS, CREATED_AT FROM QUESTION WHERE TOPIC_ID = ?",
      [topicId]
    );

    if (questions.length === 0) {
      return res.status(404).json({ message: "No se encontraron preguntas para este tema." });
    }

    res.status(200).json(questions);
  } catch (error) {
    console.error("Error al obtener las preguntas:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});


// Obtener detalles de una pregunta por ID
router.get("/questions/:questionId", async (req, res) => {
  const { questionId } = req.params;

  try {
    const [questions] = await pool.query(
      "SELECT QUESTION_ID, QUESTION_TEXT, QUESTION_IMAGE, POINTS, VIEWS, AMOUNT, CREATED_AT FROM QUESTION WHERE QUESTION_ID = ?",
      [questionId]
    );

    if (questions.length === 0) {
      return res.status(404).json({ message: "Pregunta no encontrada." });
    }

    res.status(200).json(questions[0]);
  } catch (error) {
    console.error("Error al obtener la pregunta:", error);
    res.status(500).json({ message: "Error interno del servidor." });
  }
});

//Mostrar respuestas
router.get('/answers/:questionId', async (req, res) => {
  const { questionId } = req.params;
  console.log('Recibido questionId:', questionId);

  try {
    const [rows] = await pool.query(
      'SELECT LINK FROM ANSWER WHERE QUESTION_ID = ?',
      [questionId]
    );

    console.log('Resultados de la consulta:', rows);

    if (rows.length === 0) {
      return res.status(404).json({ message: 'No se encontró una respuesta para esta pregunta.' });
    }

    res.status(200).json(rows[0]); // Devuelve la respuesta encontrada
  } catch (error) {
    console.error('Error al obtener la respuesta:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});



// Backend: courses/create-with-image
router.post("/courses/create-with-image", upload.single("image"), async (req, res) => {
  const { name, description, code } = req.body;

  if (!name || !description || !code) {
    return res.status(400).json({ error: "Nombre, descripción y código son obligatorios." });
  }

  const params = {
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    Key: `${uuidv4()}-${req.file.originalname}`,
    Body: req.file.buffer,
    ContentType: req.file.mimetype,
  };

  try {
    // Subir imagen a S3
    const uploadResult = await s3.upload(params).promise();
    const imageUrl = uploadResult.Location;

    // Insertar curso en la base de datos
    const [result] = await pool.query(
      "INSERT INTO COURSES (COURSE_NAME, COURSE_DESCRIPTION, COURSE_CODE, IMAGE_URL) VALUES (?, ?, ?, ?)",
      [name, description, code, imageUrl]
    );

    res.status(201).json({
      message: "Curso creado exitosamente.",
      courseId: result.insertId,
      name,
      description,
      code,
      imageUrl,
    });
  } catch (error) {
    console.error("Error al crear el curso con imagen:", error);
    res.status(500).json({ error: "Error al crear el curso con imagen." });
  }
});


router.post(
  "/courses/upload-image",
  upload.single("image"),
  async (req, res) => {
    const { courseId } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: "No se proporcionó una imagen." });
    }

    const params = {
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: `${uuidv4()}-${req.file.originalname}`,
      Body: req.file.buffer,
      ContentType: req.file.mimetype,
    };

    try {
      // Subir la imagen a S3
      const uploadResult = await s3.upload(params).promise();
      const imageUrl = uploadResult.Location;

      // Guardar la URL en la base de datos
      await pool.query("UPDATE COURSES SET IMAGE_URL = ? WHERE COURSE_ID = ?", [
        imageUrl,
        courseId,
      ]);

      res.status(200).json({
        message: "Imagen subida correctamente",
        imageUrl,
        courseId,
      });
    } catch (error) {
      console.error("Error al subir la imagen:", error);
      res.status(500).json({ error: "Error al subir la imagen." });
    }
  }
);


export default router;
