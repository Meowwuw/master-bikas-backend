import { Upload } from "@aws-sdk/lib-storage";
import { v4 as uuidv4 } from "uuid";
import { s3 } from "../config/awsConfig.js";
import pool from "../config/db.js";

export const uploadPaymentProof = async (req, res) => {
  const userId = req.user.id; // ID del usuario autenticado

  // Validar si se proporcionó un archivo
  if (!req.file) {
    return res.status(400).json({ error: "No se proporcionó un archivo." });
  }

  // Parámetros para la subida a S3
  const params = {
    Bucket: process.env.AWS_S3_BUCKET_NAME2, // Nombre del bucket
    Key: `payment-proofs/${uuidv4()}-${req.file.originalname}`, // Nombre único del archivo
    Body: req.file.buffer, // Contenido del archivo
    ContentType: req.file.mimetype, // Tipo de contenido
  };

  try {
    // Subir archivo usando @aws-sdk/lib-storage
    const upload = new Upload({
      client: s3, // Cliente configurado
      params,
    });

    const uploadResult = await upload.done(); // Esperar la subida
    const fileUrl = uploadResult.Location; // Obtener la URL del archivo

    // Actualizar la base de datos con la URL del archivo
    const query = `
      UPDATE CUSTOM_QUESTION
      SET CUSTOM_PAYMENT_URL = ?
      WHERE ID_USER = ?
    `;
    await pool.execute(query, [fileUrl, userId]);

    // Responder con éxito
    res.status(200).json({
      message: "Comprobante de pago subido exitosamente.",
      url: fileUrl,
    });
  } catch (error) {
    console.error("Error al subir el comprobante de pago:", error);
    res.status(500).json({
      message: "Error al subir el comprobante de pago.",
    });
  }
};
