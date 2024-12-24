import express from 'express';
import pool from '../db.js';

const router = express.Router();

// Ruta para obtener la lista de premios (sin autenticación)
router.get("/prizes", async (req, res) => {
  console.log("Solicitud recibida en /prizes");
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

router.post("/prizes/claim", verifyToken, async (req, res) => {
  const { prizeId } = req.body; 
  const userId = req.user.ID_USER; // Extraído del token

  try {
    // Obtener los puntos del usuario
    const [userResults] = await pool.query(
      `SELECT POINTS FROM USERS WHERE ID_USER = ?`,
      [userId]
    );

    if (userResults.length === 0) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    const userPoints = userResults[0].POINTS;

    // Obtener información del premio
    const [prizeResults] = await pool.query(
      `SELECT POINTS_REQUIRED, STOCK FROM PRIZE WHERE PRIZE_ID = ?`,
      [prizeId]
    );

    if (prizeResults.length === 0) {
      return res.status(404).json({ message: "Premio no encontrado" });
    }

    const prize = prizeResults[0];

    // Verificar si el usuario tiene suficientes puntos
    if (userPoints < prize.POINTS_REQUIRED) {
      return res.status(400).json({
        message: "No tienes los puntos suficientes para reclamar este premio.",
      });
    }

    // Verificar si hay stock disponible
    if (prize.STOCK <= 0) {
      return res.status(400).json({ message: "El premio ya no tiene stock disponible." });
    }

    // Actualizar los puntos del usuario y el stock del premio
    await pool.query(`UPDATE USERS SET POINTS = POINTS - ? WHERE ID_USER = ?`, [
      prize.POINTS_REQUIRED,
      userId,
    ]);
    await pool.query(`UPDATE PRIZE SET STOCK = STOCK - 1 WHERE PRIZE_ID = ?`, [
      prizeId,
    ]);

    res.status(200).json({ message: "Premio reclamado con éxito." });
  } catch (error) {
    console.error("Error al reclamar el premio:", error);
    res.status(500).json({ error: "Error interno del servidor." });
  }
});



export default router;
