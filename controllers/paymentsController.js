import pool from "../config/db.js";
import nodemailer from "nodemailer";

// Registrar el pago de la base de datos
export const registerPayment = async (req, res) => {
  console.log("Datos del usuario decodificados:", req.user);
  console.log("ID del usuario para buscar en la base de datos:", req.user.id);

  const { question_id, payment_method, currency, description } = req.body;
  console.log("Datos recibidos en la solicitud:", {
    question_id,
    payment_method,
    currency,
    description,
  });

  try {
    // Obtener el monto de la pregunta
    console.log("Buscando el monto de la pregunta con ID:", question_id);
    const [question] = await pool.query(
      "SELECT AMOUNT FROM QUESTION WHERE QUESTION_ID = ?",
      [question_id]
    );

    if (question.length === 0) {
      console.warn("Pregunta no encontrada:", question_id);
      return res.status(404).json({ message: "Pregunta no encontrada." });
    }

    const amount = question[0].AMOUNT;
    console.log("Monto obtenido para la pregunta:", amount);

    // Obtener información del usuario
    console.log("Buscando información del usuario con ID:", req.user.id); // Cambiado de req.user.ID_USER a req.user.id
    const [profile] = await pool.query(
      "SELECT TELEPHONE, EMAIL FROM USERS WHERE ID_USER = ?",
      [req.user.id] // Cambiado para usar el ID correcto
    );

    if (profile.length === 0) {
      console.warn("Usuario no encontrado:", req.user.id);
      return res.status(404).json({ message: "Usuario no encontrado." });
    }

    const userProfile = profile[0];
    console.log("Información del usuario encontrada:", userProfile);

    const peruTime = new Date(
      new Date().toLocaleString("en-US", { timeZone: "America/Lima" })
    );
    console.log("Hora local de Perú:", peruTime);

    // Registrar el pago
    console.log("Registrando el pago...");
    const [result] = await pool.query(
      `INSERT INTO PAYMENTS (ID_USER, AMOUNT, PAYMENT_METHOD, CURRENCY, STATUS, DESCRIPTION_PAYMENT, QUESTION_ID, DATESTAMP) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,

      [
        req.user.id, // Cambiado para usar el ID correcto
        amount,
        payment_method || "YAPE",
        currency || "PEN",
        "PENDIENTE",
        description || "Pago Yape",
        question_id,
        peruTime,
      ]
    );
    console.log("Resultado de la inserción del pago:", result);

    // Enviar correo
    console.log("Preparando el envío del correo de notificación...");
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    let message = `El usuario con el correo ${userProfile.EMAIL} ha realizado un pago de S/ ${amount} y está en espera de confirmación.`;

    if (userProfile.TELEPHONE) {
      const whatsappLink = `https://wa.me/${
        userProfile.TELEPHONE
      }?text=${encodeURIComponent(
        `Hola, estamos procesando tu pago de S/ ${amount}. Por favor, espera nuestra confirmación.`
      )}`;
      message += `\n\nPara contactarlo por WhatsApp, use el siguiente enlace: ${whatsappLink}`;
    }

    console.log("Mensaje del correo:", message);

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.ADMIN_EMAIL,
      subject: "Nuevo pago pendiente de aprobación",
      text: message,
    };

    await transporter.sendMail(mailOptions);
    console.log("Correo enviado exitosamente.");

    return res.status(200).json({
      message:
        "Pago registrado y correo enviado. Espera 5 minutos para la confirmación.",
    });
  } catch (error) {
    console.error("Error al procesar el pago:", error);
    return res
      .status(500)
      .json({ message: "Hubo un error al procesar el pago." });
  }
};

// Obtener el pago de la base de datos
export const getPayments = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT 
          PAYMENTS.PAYMENT_ID AS id, 
          USERS.EMAIL AS email, 
          PAYMENTS.STATUS AS status, 
          PAYMENTS.AMOUNT AS amount 
         FROM PAYMENTS 
         JOIN USERS ON PAYMENTS.ID_USER = USERS.ID_USER`
    );
    res.status(200).json(rows);
  } catch (error) {
    console.error("Error al obtener los pagos:", error);
    res.status(500).json({ message: "Error al obtener los pagos." });
  }
};

// Actualizar el pago de la base de datos con manejo de transacciones
export const updatePayment = async (req, res) => {
  const { id } = req.params;
  const { status, amount, description } = req.body;

  const validStatuses = ["PENDIENTE", "PAGADO", "CANCELADO", "DEVOLUCION"];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ message: "Estado no válido." });
  }

  const connection = await pool.getConnection(); 

  try {
    await connection.beginTransaction();

    // Verificar si el pago existe
    const [payment] = await connection.query(
      "SELECT ID_USER, QUESTION_ID FROM PAYMENTS WHERE PAYMENT_ID = ?",
      [id]
    );

    if (payment.length === 0) {
      throw new Error("Pago no encontrado.");
    }

    const { ID_USER, QUESTION_ID } = payment[0];

    // Actualizar el estado del pago
    const [result] = await connection.query(
      `UPDATE PAYMENTS 
         SET STATUS = ?, AMOUNT = ?, DESCRIPTION_PAYMENT = ? 
         WHERE PAYMENT_ID = ?`,
      [
        status,
        parseFloat(amount).toFixed(3),
        description || "Actualización del pago",
        id,
      ]
    );

    if (result.affectedRows === 0) {
      throw new Error("No se pudo actualizar el pago.");
    }

    // Si el estado del pago es PAGADO, asignar puntos al usuario
    if (status === "PAGADO") {
      const [question] = await connection.query(
        "SELECT POINTS FROM QUESTION WHERE QUESTION_ID = ?",
        [QUESTION_ID]
      );

      if (question.length === 0) {
        throw new Error("No se encontraron puntos para la pregunta asociada.");
      }

      const points = question[0].POINTS;

      const [updateUserPoints] = await connection.query(
        "UPDATE USERS SET POINTS = POINTS + ? WHERE ID_USER = ?",
        [points, ID_USER]
      );

      if (updateUserPoints.affectedRows === 0) {
        throw new Error("No se pudo asignar los puntos al usuario.");
      }
    }

    await connection.commit();

    res.status(200).json({ message: "Pago actualizado correctamente." });
  } catch (error) {
    await connection.rollback();
    console.error("Error al actualizar el pago:", error.message);
    res.status(500).json({ message: `Error al actualizar el pago: ${error.message}` });
  } finally {
    connection.release(); 
  }
};


// Eliminar el pago de la base de datos
export const deletePayment = async (req, res) => {
  const { id } = req.params;

  try {
    const [result] = await pool.query(
      "DELETE FROM PAYMENTS WHERE PAYMENT_ID = ?",
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Pago no encontrado." });
    }

    res.status(200).json({ message: "Pago eliminado correctamente." });
  } catch (error) {
    console.error("Error al eliminar el pago:", error);
    res.status(500).json({ message: "Error al eliminar el pago." });
  }
};

// Estado del pago de la base de datos
export const checkPaymentStatus = async (req, res) => {
  try {
    const [result] = await pool.query(
      `
        SELECT 
          p.STATUS, 
          p.QUESTION_ID, 
          q.TOPIC_ID, 
          t.COURSE_ID
        FROM 
          PAYMENTS p
        INNER JOIN 
          QUESTION q ON p.QUESTION_ID = q.QUESTION_ID
        INNER JOIN 
          TOPIC t ON q.TOPIC_ID = t.TOPIC_ID
        WHERE 
          p.ID_USER = ?
        ORDER BY 
          p.UPDATED_AT DESC
        LIMIT 1
        `,
      [req.user.id]
    );

    if (result.length === 0) {
      return res
        .status(404)
        .json({ message: "No se encontraron pagos para este usuario." });
    }

    const status =
      result[0].STATUS === "PAGADO" ? "confirmado" : result[0].STATUS;

    res.status(200).json({
      status,
      questionId: result[0].QUESTION_ID,
      topicId: result[0].TOPIC_ID,
      courseId: result[0].COURSE_ID,
    });
  } catch (error) {
    console.error("Error al verificar el estado del pago:", error);
    res.status(500).json({ message: "Error al verificar el estado del pago." });
  }
};

export const checkPaymentStatusByQuestion = async (req, res) => {
  const { questionId } = req.params;

  try {
    const [result] = await pool.query(
      "SELECT STATUS FROM PAYMENTS WHERE ID_USER = ? AND QUESTION_ID = ? ORDER BY UPDATED_AT DESC LIMIT 1",
      [req.user.id, questionId]
    );

    if (result.length === 0) {
      return res
        .status(404)
        .json({ message: "No se encontró el pago para esta pregunta." });
    }

    res.status(200).json(result[0]);
  } catch (error) {
    console.error("Error al verificar el estado del pago por pregunta:", error);
    res
      .status(500)
      .json({ message: "Error al verificar el estado del pago por pregunta." });
  }
};

export const getPaidAnswers = async (req, res) => {
  const userId = req.user.id;

  try {
    const [paidQuestions] = await pool.query(
      `
      SELECT a.LINK, q.QUESTION_ID 
      FROM PAYMENTS p
      INNER JOIN QUESTION q ON p.QUESTION_ID = q.QUESTION_ID
      INNER JOIN ANSWER a ON q.QUESTION_ID = a.QUESTION_ID
      WHERE p.ID_USER = ? AND p.STATUS = 'PAGADO'
      `,
      [userId]
    );

    if (paidQuestions.length === 0) {
      return res
        .status(404)
        .json({ message: "No se encontraron preguntas pagadas." });
    }

    res.status(200).json(paidQuestions);
  } catch (error) {
    console.error("Error al obtener respuestas pagadas:", error);
    res.status(500).json({
      message: "Error al obtener respuestas de preguntas pagadas.",
    });
  }
};
