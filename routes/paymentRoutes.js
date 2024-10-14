import express from 'express';
import nodemailer from 'nodemailer';
import pool from '../db.js';
import verifyToken from '../middleware/verifyToken.js';

const router = express.Router();

// Ruta para manejar el pago
router.post('/confirm', verifyToken, async (req, res) => {
  const { amount } = req.body;

  if (!req.user || !req.user.id) {
    return res.status(401).json({ message: 'Usuario no autenticado.' });
  }

  if (!amount || isNaN(amount) || amount <= 0) {
    return res.status(400).json({ message: 'Monto no válido.' });
  }

  try {
    // Inserta el pago en la base de datos
    const [result] = await pool.query(
      'INSERT INTO payments (user_id, amount, status) VALUES (?, ?, ?)', 
      [req.user.id, amount, 'pendiente'] // Inserta el pago con el monto y estado 'pendiente'
    );

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
    return res.status(200).json({ message: 'Pago registrado y correo enviado. Espera 5 minutos para la confirmación.' });
  } catch (error) {
    console.error('Error al procesar el pago:', error);
    return res.status(500).json({ message: 'Hubo un error al procesar el pago.' });
  }
});

router.get('/payments', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT payments.id, users.email, payments.status, payments.amount FROM payments JOIN users ON payments.user_id = users.id');
    res.status(200).json(rows);
  } catch (error) {
    console.error('Error al obtener los pagos:', error);
    res.status(500).json({ message: 'Error al obtener los pagos' });
  }
});


router.post('/update-payment', async (req, res) => {
  const { id, status, amount } = req.body;

  try {
    const [result] = await pool.query('UPDATE payments SET status = ?, amount = ? WHERE id = ?', [status, amount, id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Pago no encontrado' });
    }

    res.status(200).json({ message: 'Pago actualizado correctamente' });
  } catch (error) {
    console.error('Error al actualizar el pago:', error);
    res.status(500).json({ message: 'Error al actualizar el pago' });
  }
});


router.get('/check-payment-status', verifyToken, async (req, res) => {
  try {
      const [result] = await pool.query(
          'SELECT status FROM payments WHERE user_id = ? ORDER BY created_at DESC LIMIT 1', 
          [req.user.id]
      );

      if (result.length > 0 && result[0].status === 'confirmado') {
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
