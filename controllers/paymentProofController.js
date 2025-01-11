import { v4 as uuidv4 } from "uuid";
import { s3 } from "../config/awsConfig.js";
import pool from "../config/db.js"; 

export const uploadPaymentProof = async (req, res) => {
  const userId = req.user.id; 

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

    const query = `
      UPDATE CUSTOM_QUESTION
      SET CUSTOM_PAYMENT_URL = ?
      WHERE ID_USER = ?
    `;
    await pool.execute(query, [fileUrl, userId]);

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
