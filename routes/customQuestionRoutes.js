import express from "express";
import multer from "multer";
import { verifyToken } from "../middleware/authMiddleware.js";
import { uploadCustomQuestionImage } from "../controllers/customQuestionController.js";

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, 
});

// Ruta para subir la pregunta personalizada
router.post(
  "/upload-question",
  verifyToken,
  upload.single("file"),
  uploadCustomQuestionImage
);

export default router;
