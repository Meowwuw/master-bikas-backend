import { v4 as uuidv4 } from "uuid";
import pool from "../config/db.js";
import { s3 } from "../config/awsConfig.js";

export const getWeeklyQuestions = async (req, res) => {
  try {
    const [questions] = await pool.query(`
        SELECT 
          q.QUESTION_W_ID, 
          q.TOPIC_NAME, 
          q.POINTS, 
          q.QUESTION_IMAGE, 
          (SELECT COUNT(*) FROM WEEKLY_ANSWERS a WHERE a.QUESTION_W_ID = q.QUESTION_W_ID) AS RESPONSE_COUNT
        FROM WEEKLY_QUESTIONS q
      `);

    res.status(200).json(questions);
  } catch (error) {
    console.error("Error al obtener las preguntas semanales:", error);
    res
      .status(500)
      .json({ message: "Error al obtener las preguntas semanales." });
  }
};

export const getWeeklyAnswers = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        a.ANSWER_W_ID AS ID, 
        CONCAT(u.NAMES, ' ', u.LAST_NAME) AS FULL_NAME,
        u.EMAIL AS EMAIL,
        u.TELEPHONE AS TELEPHONE,
        q.QUESTION_IMAGE AS QUESTION_IMAGE,
        a.RESPONSE_URL AS SOLUTION_URL,
        a.CREATED_AT AS ANSWER_DATE
      FROM WEEKLY_ANSWERS a
      JOIN WEEKLY_QUESTIONS q ON a.QUESTION_W_ID = q.QUESTION_W_ID
      JOIN USERS u ON a.ID_USER = u.ID_USER
      ORDER BY a.CREATED_AT DESC
    `);

    if (rows.length === 0) {
      return res.status(404).json({ message: "No se encontraron respuestas semanales." });
    }

    res.status(200).json(rows);
  } catch (error) {
    console.error("Error al obtener respuestas semanales:", error);
    res.status(500).json({ message: "Error interno del servidor." });
  }
};

export const uploadWeeklyAnswer = async (req, res) => {
  const { QUESTION_W_ID } = req.body;

  if (!req.file) {
    return res.status(400).json({ error: "No se proporcionó un archivo." });
  }

  try {
    const [existingAnswer] = await pool.query(
      "SELECT * FROM WEEKLY_ANSWERS WHERE QUESTION_W_ID = ? AND ID_USER = ?",
      [QUESTION_W_ID, req.user.id]
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
      [QUESTION_W_ID, req.user.id, fileUrl]
    );

    res.status(201).json({
      message: "Respuesta semanal subida exitosamente.",
      url: fileUrl,
    });
  } catch (error) {
    console.error("Error al subir la respuesta semanal:", error);
    res.status(500).json({ message: "Error al subir la respuesta semanal." });
  }
};

export const uploadWeeklyQuestionImage = async (req, res) => {
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
};
