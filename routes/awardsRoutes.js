import express from 'express';
import pool from '../db.js';
import verifyToken from '../middleware/verifyToken.js';

const router = express.Router();

// Ruta para obtener la lista de premios
router.get("/prizes", verifyToken, async (req, res) => {
  console.log("Solicitud recibida en /prizes con token:", req.headers.authorization);
  try {
    const [results] = await pool.query(`
      SELECT 
        PRIZE_ID as id,
        PRIZE_NAME as name,
        PRIZE_DESCRIPTION as description,
        PRIZE_CATEGORY as category,
        EXPIRATION_DATE as expirationDate,
        POINTS_REQUIRED as pointsRequired,
        STOCK as stock,
        IMAGE_URL as imageUrl
      FROM PRIZE
      WHERE STOCK > 0 AND EXPIRATION_DATE >= CURDATE()
      ORDER BY CREATED_AT DESC
    `);
    console.log("Premios obtenidos:", results);
    res.status(200).json(results);
  } catch (error) {
    console.error("Error al obtener los premios:", error);
    res.status(500).json({ error: "Error al obtener los premios" });
  }
});



export default router;

