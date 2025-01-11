import pool from "../config/db.js";

export const getVideos = async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM VIDEOS_MARKETING");

    if (rows.length === 0) {
      return res.status(404).json({ message: "No se encontraron videos." });
    }

    res.status(200).json(rows);
  } catch (error) {
    console.error("Error al obtener los videos:", error);
    res.status(500).json({ message: "Error interno del servidor." });
  }
};
