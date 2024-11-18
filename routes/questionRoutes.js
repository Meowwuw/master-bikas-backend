import express from "express";
import { v4 as uuidv4 } from "uuid";
import pool from "../db.js";
import verifyToken from "../middleware/verifyToken.js"; 
import multer from "multer";
import { s3 } from "../config/awsConfig.js";


const storage = multer.memoryStorage();
const upload = multer({ storage });


const router = express.Router();

// Ruta para obtener las preguntas semanales
router.get("/weekly-questions", verifyToken, async (req, res) => {
    try {
      const [questions] = await pool.query(`
        SELECT q.QUESTION_W_ID, q.TOPIC_NAME, q.POINTS, q.QUESTION_IMAGE, 
        (SELECT COUNT(*) FROM WEEKLY_ANSWERS a WHERE a.QUESTION_W_ID = q.QUESTION_W_ID) AS RESPONSE_COUNT
        FROM WEEKLY_QUESTIONS q
      `);
  
      res.status(200).json({ questions });
    } catch (error) {
      console.error("Error al obtener las preguntas semanales:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

// Subir imagen de una pregunta semanal
router.post(
  "/upload-weekly-question",
  verifyToken,
  upload.single("file"),
  async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: "No se proporcionó un archivo." });
    }

    const params = {
      Bucket: process.env.AWS_S3_BUCKET_NAME3,
      Key: `Preguntas/${uuidv4()}-${req.file.originalname}`,
      Body: req.file.buffer,
      ContentType: req.file.mimetype,
    };

    try {
      const uploadResult = await s3.upload(params).promise();
      const fileUrl = uploadResult.Location;

      res.status(200).json({
        message: "Pregunta semanal subida exitosamente.",
        url: fileUrl,
      });
    } catch (error) {
      console.error("Error al subir la pregunta semanal:", error);
      res.status(500).json({ message: "Error al subir la pregunta semanal." });
    }
  }
);

  
// Subir imagen de una respuesta semanal
router.post(
    "/upload-weekly-answer",
    verifyToken,
    upload.single("file"),
    async (req, res) => {
      const { QUESTION_W_ID } = req.body;
  
      if (!req.file) {
        return res.status(400).json({ error: "No se proporcionó un archivo." });
      }
  
      if (!QUESTION_W_ID) {
        return res.status(400).json({ error: "Falta el ID de la pregunta semanal." });
      }
  
      try {
        // Verificar si el usuario ya envió una respuesta para esta pregunta
        const [existingAnswer] = await pool.query(
          "SELECT * FROM WEEKLY_ANSWERS WHERE QUESTION_W_ID = ? AND ID_USER = ?",
          [QUESTION_W_ID, req.user.ID_USER]
        );
  
        if (existingAnswer.length > 0) {
          return res
            .status(400)
            .json({ message: "Ya has enviado una respuesta para esta pregunta." });
        }
  
        const params = {
          Bucket: process.env.AWS_S3_BUCKET_NAME3,
          Key: `Respuestas/${QUESTION_W_ID}/${uuidv4()}-${req.file.originalname}`,
          Body: req.file.buffer,
          ContentType: req.file.mimetype,
        };
  
        const uploadResult = await s3.upload(params).promise();
        const fileUrl = uploadResult.Location;
  
        const [result] = await pool.query(
          `INSERT INTO WEEKLY_ANSWERS (QUESTION_W_ID, ID_USER, RESPONSE_URL) VALUES (?, ?, ?)`,
          [QUESTION_W_ID, req.user.ID_USER, fileUrl]
        );
  
        res.status(200).json({
          message: "Respuesta semanal subida exitosamente.",
          url: fileUrl,
          answerId: result.insertId,
        });
      } catch (error) {
        console.error("Error al subir la respuesta semanal:", error);
        res.status(500).json({ message: "Error al subir la respuesta semanal." });
      }
    }
  );
  

export default router;
