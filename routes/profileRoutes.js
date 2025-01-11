import express from "express";
import pool from "../db.js";
import verifyToken from "../middleware/verifyToken.js";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";
import { s3 } from "../config/awsConfig.js";

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Manejar intentos de desbloqueo
router.post("/users/attempts/use", verifyToken, async (req, res) => {
  const userId = req.user.ID_USER;

  try {
    const [user] = await pool.query(
      "SELECT ATTEMPTS FROM USERS WHERE ID_USER = ?",
      [userId]
    );

    if (user.length === 0) {
      return res.status(404).json({ message: "Usuario no encontrado." });
    }

    if (user[0].ATTEMPTS <= 0) {
      return res.status(403).json({ message: "No tienes intentos restantes." });
    }

    // Reducir intentos en 1
    await pool.query("UPDATE USERS SET ATTEMPTS = ATTEMPTS - 1 WHERE ID_USER = ?", [userId]);

    const remainingAttempts = user[0].ATTEMPTS - 1;

    res.status(200).json({ message: "Intento utilizado.", remaining_attempts: remainingAttempts });
  } catch (error) {
    console.error("Error al utilizar intentos:", error);
    res.status(500).json({ message: "Error interno del servidor." });
  }
});

router.put("/perfil/add-points", verifyToken, async (req, res) => {
  const userId = req.user.ID_USER;
  const { points } = req.body;

  if (!points) {
    return res.status(400).json({ message: "Los puntos son obligatorios." });
  }

  try {
    const query = `
      UPDATE USERS 
      SET POINTS = COALESCE(POINTS, 0) + ? 
      WHERE ID_USER = ?`;
    const values = [points, userId];

    const [result] = await pool.query(query, values);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Usuario no encontrado." });
    }

    res.status(200).json({ message: "Puntos asignados correctamente." });
  } catch (error) {
    console.error("Error al asignar puntos:", error);
    res.status(500).json({ message: "Error interno del servidor." });
  }
});





export default router;
