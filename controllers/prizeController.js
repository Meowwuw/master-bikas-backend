import pool from "../config/db.js";

// Obtener premios disponibles
export const getAvailablePrizes = async (req, res) => {
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
          WHERE STOCK > 0 
          ORDER BY CREATED_AT DESC
        `);
    res.status(200).json({ prizes: results });
  } catch (error) {
    console.error("Error al obtener los premios:", error);
    res.status(500).json({ error: "Error al obtener los premios." });
  }
};

// Reclamar un premio
export const claimPrize = async (req, res) => {
  const { prizeId } = req.body;
  const userId = req.user.id; 

  try {
    // Obtener puntos del usuario
    const [userResult] = await pool.query(
      "SELECT POINTS FROM USERS WHERE ID_USER = ?",
      [userId]
    );

    if (userResult.length === 0) {
      return res.status(404).json({ message: "Usuario no encontrado." });
    }

    const userPoints = userResult[0].POINTS;

    // Obtener detalles del premio
    const [prizeResult] = await pool.query(
      "SELECT POINTS_REQUIRED, STOCK FROM PRIZE WHERE PRIZE_ID = ?",
      [prizeId]
    );

    if (prizeResult.length === 0) {
      return res.status(404).json({ message: "Premio no encontrado." });
    }

    const { POINTS_REQUIRED: pointsRequired, STOCK: stock } = prizeResult[0];

    if (stock <= 0) {
      return res.status(400).json({ message: "El premio no está disponible." });
    }

    if (userPoints < pointsRequired) {
      return res
        .status(400)
        .json({
          message: "No tienes suficientes puntos para reclamar este premio.",
        });
    }

    // Actualizar puntos del usuario y reducir el stock del premio
    await pool.query("UPDATE USERS SET POINTS = POINTS - ? WHERE ID_USER = ?", [
      pointsRequired,
      userId,
    ]);
    await pool.query("UPDATE PRIZE SET STOCK = STOCK - 1 WHERE PRIZE_ID = ?", [
      prizeId,
    ]);

    res.status(200).json({ message: "Premio reclamado exitosamente." });
  } catch (error) {
    console.error("Error al reclamar premio:", error);
    res.status(500).json({ error: "Error al reclamar el premio." });
  }
};
