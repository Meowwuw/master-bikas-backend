import express from "express";
import pool from "../db.js";

const router = express.Router();

router.post("/contact-request", async (req, res) => {
  const { firstName, lastName, email, phoneNumber } = req.body;

  // Validar que se envíen los datos obligatorios
  if (!firstName || !lastName || !email) {
    return res
      .status(400)
      .json({ message: "Nombre, Apellido y Correo son obligatorios" });
  }

  try {
    // Query de inserción en la tabla CONTACT_REQUESTS
    const query = `
      INSERT INTO CONTACT_REQUESTS (FIRST_NAME, LAST_NAME, EMAIL, PHONE_NUMBER, STATUS)
      VALUES (?, ?, ?, ?, 'PENDIENTE')
    `;

    // Ejecutar query con parámetros
    const [result] = await pool.query(query, [
      firstName,
      lastName,
      email,
      phoneNumber || null, // Si no se envía el número, lo dejamos como null
    ]);

    // Responder con éxito
    res.status(201).json({
      message: "Solicitud de contacto creada exitosamente",
      contactId: result.insertId,
    });
  } catch (error) {
    console.error("Error al insertar solicitud de contacto:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
});

export default router;
