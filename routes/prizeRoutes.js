import express from "express";
import { getAvailablePrizes, claimPrize } from "../controllers/prizeController.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

// Ruta para obtener premios disponibles
router.get("/prizes", verifyToken, getAvailablePrizes);

// Ruta para reclamar un premio
router.post("/prizes/claim", verifyToken, claimPrize);

export default router;
