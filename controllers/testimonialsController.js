import pool from "../config/db.js";

export const getTestimonials = async (req, res) => {
  try {
    const query = `
      SELECT 
        t.TESTIMONIAL_ID,
        u.NAMES AS user_name,
        t.CONTENT,
        t.RATING,
        t.CREATED_AT
      FROM TESTIMONIALS t
      INNER JOIN USERS u ON t.ID_USER = u.ID_USER
    `;
    const [testimonials] = await pool.query(query);

    res.status(200).json(testimonials);
  } catch (error) {
    console.error("Error al obtener los testimonios:", error);
    res.status(500).json({ message: "Error al obtener los testimonios." });
  }
};
