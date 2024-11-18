import express from "express";
import pool from "../db.js"; 

const router = express.Router();

// Obtener todos los videos de la tabla VIDEOS_MARKETING
router.get("/videos", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM VIDEOS_MARKETING");
    res.status(200).json(rows);
  } catch (error) {
    console.error("Error al obtener los videos:", error);
    res.status(500).json({ error: "Error al obtener los videos." });
  }
});

export default router;
