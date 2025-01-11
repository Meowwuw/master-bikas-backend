import express from "express";
import { verifyToken } from "../middleware/authMiddleware.js";
import { createCustomQuestion, getCustomQuestions } from "../controllers/questionController.js";

const router = express.Router();

// Ruta para crear preguntas personalizadas
router.post("/pregunta", verifyToken, createCustomQuestion);
router.get("/preguntas-personalizadas", verifyToken, getCustomQuestions);


export default router;
