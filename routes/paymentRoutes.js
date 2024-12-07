import express from 'express';
import nodemailer from 'nodemailer';
import pool from '../db.js';
import verifyToken from '../middleware/verifyToken.js';

const router = express.Router();

router.post('/payments-confirm', verifyToken, async (req, res) => {
  const { question_id, payment_method, currency, description } = req.body;

  if (!req.user || !req.user.ID_USER) {
    return res.status(401).json({ message: 'Usuario no autenticado.' });
  }

  if (!question_id) {
    return res.status(400).json({ message: 'ID de la pregunta es obligatorio.' });
  }

  try {
    // Cambiar ID por QUESTION_ID
    const [question] = await pool.query('SELECT AMOUNT FROM QUESTION WHERE QUESTION_ID = ?', [question_id]);

    if (question.length === 0) {
      return res.status(404).json({ message: 'Pregunta no encontrada.' });
    }

    const amount = question[0].AMOUNT;

    // Insertar el pago en la base de datos
    const [result] = await pool.query(
      `INSERT INTO PAYMENTS (ID_USER, AMOUNT, PAYMENT_METHOD, CURRENCY, STATUS, DESCRIPTION_PAYMENT, QUESTION_ID, DATESTAMP) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.user.ID_USER,
        amount,
        payment_method || 'YAPE',
        currency || 'PEN',
        'pendiente',
        description || 'Pago Yape',
        question_id,
        new Date(), // Fecha y hora actual
      ]
    );
    

    console.log("Pago registrado en la base de datos:", result);

    // Configuración del correo
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.ADMIN_EMAIL, // El correo del administrador
      subject: 'Nuevo pago pendiente de aprobación',
      text: `El usuario con el correo ${req.user.email} ha realizado un pago de ${amount} y está en espera de confirmación.`,
    };

    await transporter.sendMail(mailOptions);

    return res.status(200).json({
      message: 'Pago registrado y correo enviado. Espera 5 minutos para la confirmación.',
    });
  } catch (error) {
    console.error('Error al procesar el pago:', error);
    return res.status(500).json({ message: 'Hubo un error al procesar el pago.' });
  }
});


router.get('/payments', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        PAYMENTS.PAYMENT_ID AS id, 
        USERS.EMAIL AS email, 
        PAYMENTS.STATUS AS status, 
        PAYMENTS.AMOUNT AS amount 
      FROM PAYMENTS 
      JOIN USERS ON PAYMENTS.ID_USER = USERS.ID_USER
    `);
    res.status(200).json(rows);
  } catch (error) {
    console.error('Error al obtener los pagos:', error);
    res.status(500).json({ message: 'Error al obtener los pagos' });
  }
});
router.put('/payments/:id', async (req, res) => {
  const { id } = req.params;
  const { status, amount, description } = req.body;

  // Define los valores válidos para el estado
  const validStatuses = ['PENDIENTE', 'PAGADO', 'CANCELADO', 'DEVOLUCION'];

  if (!validStatuses.includes(status)) {
    return res.status(400).json({ message: 'Estado no válido. Usa: PENDIENTE, PAGADO, CANCELADO o DEVOLUCION.' });
  }

  try {
    const [result] = await pool.query(
      `UPDATE PAYMENTS 
       SET STATUS = ?, AMOUNT = ?, DESCRIPTION_PAYMENT = ? 
       WHERE PAYMENT_ID = ?`,
      [status, parseFloat(amount).toFixed(3), description || 'Actualización del pago', id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Pago no encontrado.' });
    }

    res.status(200).json({ message: 'Pago actualizado correctamente.' });
  } catch (error) {
    console.error('Error al actualizar el pago:', error);
    res.status(500).json({ message: 'Error al actualizar el pago.' });
  }
});

router.delete('/payments/:id', async (req, res) => {
  const { id } = req.params;

  try {
    // Attempt to delete the payment
    const [result] = await pool.query('DELETE FROM PAYMENTS WHERE PAYMENT_ID = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Pago no encontrado.' });
    }

    res.status(200).json({ message: 'Pago eliminado correctamente.' });
  } catch (error) {
    console.error('Error al eliminar el pago:', error);
    res.status(500).json({ message: 'Error al eliminar el pago.' });
  }
});

router.get('/check-payment-status', verifyToken, async (req, res) => {
  try {
    const [result] = await pool.query(
      'SELECT STATUS, QUESTION_ID FROM PAYMENTS WHERE ID_USER = ? ORDER BY UPDATED_AT DESC LIMIT 1',
      [req.user.ID_USER]
    );

    if (result.length > 0 && (result[0].STATUS === 'confirmado' || result[0].STATUS === 'PAGADO')) {
      return res.status(200).json({ status: 'confirmado', questionId: result[0].QUESTION_ID });
    } else {
      return res.status(200).json({ status: 'pendiente' });
    }
  } catch (error) {
    console.error('Error al verificar el estado del pago:', error);
    return res.status(500).json({ message: 'Error al verificar el estado del pago.' });
  }
});


router.get('/check-payment-status/:questionId', verifyToken, async (req, res) => {
  const { questionId } = req.params;

  try {
    const [result] = await pool.query(
      'SELECT STATUS FROM PAYMENTS WHERE ID_USER = ? AND QUESTION_ID = ? ORDER BY UPDATED_AT DESC LIMIT 1',
      [req.user.ID_USER, questionId]
    );

    if (result.length > 0 && (result[0].STATUS === 'confirmado' || result[0].STATUS === 'PAGADO')) {
      return res.status(200).json({ status: 'confirmado' });
    } else {
      return res.status(200).json({ status: 'pendiente' });
    }
  } catch (error) {
    console.error('Error al verificar el estado del pago:', error);
    return res.status(500).json({ message: 'Error al verificar el estado del pago.' });
  }
});


export default router;
