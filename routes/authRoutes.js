import express from "express";
import { login } from "../controllers/authController.js";
import { getUserPoints, logout, forgotPassword, resetPassword  } from "../controllers/authController.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

// Ruta para el inicio de sesion
router.post("/login", login);

// Ruta para obtener los puntos del usuario
router.get("/points", verifyToken, getUserPoints);

// Ruta para el logout
router.post("/logout", verifyToken, logout);

// Ruta para solicitar restablecimiento de contraseña
router.post("/forgot-password", forgotPassword);

// Ruta para restablecer contraseña
router.post("/reset-password", resetPassword);

export default router;
