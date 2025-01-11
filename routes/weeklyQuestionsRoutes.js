import express from "express";
import multer from "multer";
import { verifyToken } from "../middleware/authMiddleware.js";
import { 
  getWeeklyQuestions, 
  getWeeklyAnswers ,
  uploadWeeklyAnswer, 
  uploadWeeklyQuestionImage 
} from "../controllers/weeklyQuestionsController.js";

const router = express.Router();
const upload = multer();

// Ruta para obtener preguntas semanales
router.get("/weekly-questions", verifyToken, getWeeklyQuestions);

// Ruta para obtener respuestas semanales
router.get("/weekly-answers", verifyToken, getWeeklyAnswers );

// Ruta para subir una respuesta semanal
router.post("/upload-weekly-answer", verifyToken, upload.single("file"), uploadWeeklyAnswer);

// Ruta para subir la imagen de una pregunta semanal
router.post("/upload-weekly-question", verifyToken, upload.single("file"), uploadWeeklyQuestionImage);

export default router;
