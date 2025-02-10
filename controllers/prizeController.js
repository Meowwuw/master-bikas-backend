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
          ORDER BY CREATED_AT DESC
        `); 
    res.status(200).json({ prizes: results });
  } catch (error) {
    console.error("Error al obtener los premios:", error);
    res.status(500).json({ error: "Error al obtener los premios." });
  }
};


export const claimPrize = async (req, res) => {
  const { prizeId } = req.body;
  const userId = req.user.id;

  if (!prizeId) {
    return res.status(400).json({ message: "ID del premio es requerido." });
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // Obtener puntos del usuario
    const [userResult] = await connection.query(
      "SELECT POINTS FROM USERS WHERE ID_USER = ? FOR UPDATE",
      [userId]
    );

    if (userResult.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: "Usuario no encontrado." });
    }

    const userPoints = userResult[0].POINTS;

    // Obtener detalles del premio
    const [prizeResult] = await connection.query(
      "SELECT PRIZE_NAME, POINTS_REQUIRED, STOCK FROM PRIZE WHERE PRIZE_ID = ? FOR UPDATE",
      [prizeId]
    );

    if (prizeResult.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: "Premio no encontrado." });
    }

    const { PRIZE_NAME: prizeName, POINTS_REQUIRED: pointsRequired, STOCK: stock } = prizeResult[0];

    // Validar stock disponible
    if (stock <= 0) {
      await connection.rollback();
      return res.status(400).json({ message: "El premio no está disponible." });
    }

    // Validar puntos suficientes
    if (userPoints < pointsRequired) {
      await connection.rollback();
      return res.status(400).json({
        message: "No tienes suficientes puntos para reclamar este premio.",
      });
    }

    // Restar puntos al usuario
    await connection.query(
      "UPDATE USERS SET POINTS = POINTS - ? WHERE ID_USER = ?",
      [pointsRequired, userId]
    );

    // Reducir el stock del premio
    await connection.query(
      "UPDATE PRIZE SET STOCK = STOCK - 1 WHERE PRIZE_ID = ?",
      [prizeId]
    );

    // Validar que el stock se actualizó correctamente
    const [updatedStock] = await connection.query(
      "SELECT STOCK FROM PRIZE WHERE PRIZE_ID = ?",
      [prizeId]
    );

    if (updatedStock[0].STOCK < 0) {
      await connection.rollback();
      return res.status(500).json({ message: "Error en la actualización del stock." });
    }

    // Obtener la hora actual de Perú en formato compatible con MySQL
    const peruTime = new Date(
      new Date().toLocaleString("en-US", { timeZone: "America/Lima" })
    ).toISOString().slice(0, 19).replace("T", " ");

    // Registrar en REDEEMED_PRIZES
    await connection.query(
      "INSERT INTO REDEEMED_PRIZES (ID_USER, PRIZE_ID, REDEEM_DATE) VALUES (?, ?, ?)",
      [userId, prizeId, peruTime]
    );

    await connection.commit();

    res.status(200).json({
      success: true,
      message: "Premio reclamado exitosamente.",
      prize: { id: prizeId, name: prizeName, updatedStock: updatedStock[0].STOCK },
    });
  } catch (error) {
    await connection.rollback();
    console.error("Error al reclamar premio:", error);
    res.status(500).json({ error: "Error al reclamar el premio." });
  } finally {
    connection.release();
  }
};





