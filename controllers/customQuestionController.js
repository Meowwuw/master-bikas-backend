import { Upload } from "@aws-sdk/lib-storage";
import { v4 as uuidv4 } from "uuid";
import pool from "../config/db.js";
import { s3 } from "../config/awsConfig.js"; // Importar el cliente configurado

export const uploadCustomQuestionImage = async (req, res) => {
  const userId = req.user.id;

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
    // Usar el método Upload para subir el archivo
    const upload = new Upload({
      client: s3,
      params,
    });

    const uploadResult = await upload.done();
    const fileUrl = uploadResult.Location;

    // Actualizar la base de datos con la URL del archivo
    const query = `
      UPDATE CUSTOM_QUESTION
      SET CUSTOM_QUESTION_URL = ?
      WHERE ID_USER = ?
    `;
    await pool.execute(query, [fileUrl, userId]);

    res.status(200).json({
      message: "Imagen de la pregunta subida exitosamente.",
      url: fileUrl,
    });
  } catch (error) {
    console.error("Error al subir la imagen de la pregunta:", error);
    res.status(500).json({
      message: "Error al subir la imagen de la pregunta.",
    });
  }
};
