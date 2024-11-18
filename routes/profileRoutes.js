import express from "express";
import pool from "../db.js";
import verifyToken from "../middleware/verifyToken.js";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";
import { s3 } from "../config/awsConfig.js";

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Obtener perfil del usuario
router.get("/perfil", verifyToken, async (req, res) => {
  const userId = req.user.ID_USER;
  try {
    const [profile] = await pool.query(
      `SELECT NAMES, LAST_NAME, GENDER, EMAIL, TELEPHONE, BIRTHDATE, NICKNAME, SCHOOL_NAME, ADDRESS_ID 
       FROM USERS WHERE ID_USER = ?`,
      [userId]
    );

    if (profile.length === 0) {
      return res.status(404).json({ message: "Perfil no encontrado" });
    }

    // Si el usuario tiene un ADDRESS_ID, busca los detalles en la tabla ADDRESS
    const userProfile = profile[0];
    if (userProfile.ADDRESS_ID) {
      const [address] = await pool.query(
        `SELECT DEPARTMENT, PROVINCE, DISTRICT 
         FROM ADDRESS WHERE ADDRESS_ID = ?`,
        [userProfile.ADDRESS_ID]
      );
      if (address.length > 0) {
        userProfile.DEPARTMENT = address[0].DEPARTMENT;
        userProfile.PROVINCE = address[0].PROVINCE;
        userProfile.DISTRICT = address[0].DISTRICT;
      }
    }

    res.status(200).json(userProfile);
  } catch (error) {
    console.error("Error al obtener el perfil:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
});



router.put("/perfil", verifyToken, async (req, res) => {
  const userId = req.user.ID_USER;
  const {
    NAMES,
    LAST_NAME,
    EMAIL,
    TELEPHONE,
    BIRTHDATE,
    GENDER,
    NICKNAME,
    SCHOOL_NAME,
    ADDRESS_ID,
  } = req.body;

  if (!ADDRESS_ID) {
    return res.status(400).json({ message: "ADDRESS_ID es obligatorio." });
  }

  try {
    const query = `
      UPDATE USERS
      SET 
        NAMES = ?,
        LAST_NAME = ?,
        EMAIL = ?,
        TELEPHONE = ?,
        BIRTHDATE = ?,
        GENDER = ?,
        NICKNAME = ?,
        SCHOOL_NAME = ?,
        ADDRESS_ID = ?
      WHERE ID_USER = ?
    `;

    // Convertir valores vacíos a NULL
    const values = [
      NAMES || null,
      LAST_NAME || null,
      EMAIL || null,
      TELEPHONE || null,
      BIRTHDATE || null,
      GENDER || null,
      NICKNAME || null,
      SCHOOL_NAME || null,
      ADDRESS_ID || null,
      userId,
    ];

    const [result] = await pool.query(query, values);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Usuario no encontrado." });
    }

    res.status(200).json({ message: "Perfil actualizado exitosamente." });
  } catch (error) {
    console.error("Error al actualizar el perfil:", error);
    res.status(500).json({ message: "Error interno del servidor." });
  }
});

router.put("/perfil/add-points", verifyToken, async (req, res) => {
  const userId = req.user.ID_USER;
  const { points } = req.body; // Recibe los puntos desde el frontend

  if (!points) {
    return res.status(400).json({ message: "Los puntos son obligatorios." });
  }

  try {
    // Incrementar los puntos del usuario en la base de datos
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

// Subir comprobante de pago
router.post(
  "/upload-payment-proof",
  verifyToken,
  upload.single("file"),
  async (req, res) => {
    const userId = req.user.ID_USER;

    if (!req.file) {
      return res.status(400).json({ error: "No se proporcionó un archivo." });
    }

    const params = {
      Bucket: process.env.AWS_S3_BUCKET_NAME2,
      Key: `payment-proofs/${uuidv4()}-${req.file.originalname}`,
      Body: req.file.buffer,
      ContentType: req.file.mimetype,
    };

    try {
      const uploadResult = await s3.upload(params).promise();
      const fileUrl = uploadResult.Location;

      res.status(200).json({ message: "Comprobante subido exitosamente.", url: fileUrl });
    } catch (error) {
      console.error("Error al subir el comprobante:", error);
      res.status(500).json({ message: "Error al subir el comprobante de pago." });
    }
  }
);

// Subir imagen de la pregunta
router.post(
  "/upload-question",
  verifyToken,
  upload.single("file"),
  async (req, res) => {
    const userId = req.user.ID_USER;

    if (!req.file) {
      return res.status(400).json({ error: "No se proporcionó un archivo." });
    }

    const params = {
      Bucket: process.env.AWS_S3_BUCKET_NAME2,
      Key: `questions/${uuidv4()}-${req.file.originalname}`,
      Body: req.file.buffer,
      ContentType: req.file.mimetype,
    };

    try {
      const uploadResult = await s3.upload(params).promise();
      const fileUrl = uploadResult.Location;

      res.status(200).json({ message: "Imagen de la pregunta subida exitosamente.", url: fileUrl });
    } catch (error) {
      console.error("Error al subir la imagen de la pregunta:", error);
      res.status(500).json({ message: "Error al subir la imagen de la pregunta." });
    }
  }
);

// Registrar pregunta personalizada
router.post("/pregunta", verifyToken, async (req, res) => {
  const {
    COURSE_ID,
    SCHOOL_CATEGORY,
    SCHOOL_NAME,
    CUSTOM_QUESTION_URL,
    CUSTOM_PAYMENT_URL,
    WHATSAPP_OPTION, // Nuevo campo para WhatsApp
  } = req.body;

  const userId = req.user.ID_USER;

  // Validación de datos obligatorios
  if (!COURSE_ID || !SCHOOL_CATEGORY || (!CUSTOM_QUESTION_URL && !WHATSAPP_OPTION)) {
    return res.status(400).json({ message: "Faltan datos obligatorios." });
  }

  const amount =
    SCHOOL_CATEGORY.toLowerCase() === "colegio" || SCHOOL_CATEGORY.toLowerCase() === "academia"
      ? 1
      : SCHOOL_CATEGORY.toLowerCase() === "instituto" || SCHOOL_CATEGORY.toLowerCase() === "universidad"
      ? 3
      : null;

  if (amount === null) {
    return res.status(400).json({ message: "Categoría de escuela inválida." });
  }

  try {
    // Inserción de datos en la base de datos
    const [result] = await pool.query(
      `INSERT INTO CUSTOM_QUESTION 
        (ID_USER, COURSE_ID, SCHOOL_CATEGORY, SCHOOL_NAME, AMOUNT, CUSTOM_QUESTION_URL, CUSTOM_PAYMENT_URL, WHATSAPP_OPTION) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        COURSE_ID,
        SCHOOL_CATEGORY,
        SCHOOL_NAME || null,
        amount,
        CUSTOM_QUESTION_URL || null,
        CUSTOM_PAYMENT_URL || null,
        WHATSAPP_OPTION || false, // Registrar la opción de WhatsApp
      ]
    );

    // Generación del número de ticket
    const ticketId = `SOL-${result.insertId}`;
    res.status(201).json({ message: "Pregunta creada exitosamente", ticketId });
  } catch (error) {
    console.error("Error al crear la pregunta personalizada:", error);
    res.status(500).json({ message: "Error interno del servidor." });
  }
});
  

export default router;
