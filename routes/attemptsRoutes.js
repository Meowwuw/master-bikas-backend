import express from "express";
import { getRemainingAttempts, useAttempt, getUserEmail } from "../controllers/attemptsController.js";
import { verifyToken } from "../middleware/authMiddleware.js";


const router = express.Router();

// Ruta protegida para obtener intentos restantes
router.get("/attempts", verifyToken, getRemainingAttempts);

// Ruta protegida para usar un intento
router.post("/attempts/use", verifyToken, useAttempt);

// Obtener correo del usuario por ID
router.get("/users/:userId/email", getUserEmail);

export default router;
