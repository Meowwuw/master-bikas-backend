import express from "express";
import { 
  getCourses,
  getCourseById,
  getTopicsByCourseId,
  getQuestionsByTopicId,
  getQuestionById
} from "../controllers/courseController.js";

const router = express.Router();

// Rutas para cursos
router.get("/courses", getCourses);
router.get("/courses/:courseId", getCourseById);

// Rutas para temas
router.get("/courses/:courseId/topics", getTopicsByCourseId);

// Rutas para preguntas
router.get("/topics/:topicId/questions", getQuestionsByTopicId);

router.get("/questions/:questionId", getQuestionById);

export default router;
