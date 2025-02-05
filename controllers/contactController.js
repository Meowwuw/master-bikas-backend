import pool from "../config/db.js";

export const createContactRequest = async (req, res) => {
  const { firstName, lastName, email, phoneNumber } = req.body;

  if (!firstName || !lastName || !email) {
    return res.status(400).json({ message: "Faltan datos obligatorios." });
  }

  try {
    const query = `
      INSERT INTO CONTACT_REQUESTS (FIRST_NAME, LAST_NAME, EMAIL, PHONE_NUMBER, STATUS, CREATED_AT)
      VALUES (?, ?, ?, ?, 'PENDIENTE', CONVERT_TZ(NOW(), '+00:00', '-05:00'))
    `;
    const [result] = await pool.query(query, [
      firstName,
      lastName,
      email,
      phoneNumber || null,
    ]);

    res.status(201).json({
      message: "Solicitud de contacto creada exitosamente.",
      requestId: result.insertId,
    });
  } catch (error) {
    console.error("Error al crear la solicitud de contacto:", error);
    res.status(500).json({ message: "Error interno del servidor." });
  }
};
