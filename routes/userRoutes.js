import express from "express";
import { verifyToken } from "../middleware/authMiddleware.js";
import {
  registerUser,
  verifyEmail,
  getUserProfile,
  updateUserProfile,
  getTopUsersByPoints,
} from "../controllers/userController.js";

const router = express.Router();

// Ruta para registrar un usuario
router.post("/register", registerUser);

// Ruta para verificar el correo electrónico
router.get("/verify-email", verifyEmail);   

// Ruta para obtener el perfil del usuario
router.get("/profile", verifyToken, getUserProfile);

// Ruta para actualizar el perfil del usuario
router.put("/profile", verifyToken, updateUserProfile);

// Ruta para obtener usuarios con mas puntos
router.get("/top-points", getTopUsersByPoints);

export default router;
