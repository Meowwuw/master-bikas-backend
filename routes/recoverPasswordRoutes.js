import express from 'express';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import pool from '../db.js';
import bcrypt from 'bcryptjs'; 


const router = express.Router();

router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;
  
    try {
      const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
  
      if (rows.length === 0) {
        return res.status(404).json({ error: 'No se encontró un usuario con ese correo' });
      }
  
      const user = rows[0];
  
      // Crear un token de restablecimiento de contraseña
      const resetToken = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
  
      // Crear enlace para restablecer la contraseña
      const resetLink = `http://localhost:3000/reset-password?token=${resetToken}`;
  
      // Configurar y enviar el correo electrónico
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });
  
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Restablecer contraseña',
        text: `Haz clic en el siguiente enlace para restablecer tu contraseña: ${resetLink}`,
      };
  
      await transporter.sendMail(mailOptions);
  
      res.status(200).json({ message: 'Correo enviado para restablecer la contraseña' });
    } catch (error) {
      console.error('Error al enviar el correo de recuperación:', error);
      res.status(500).json({ error: 'Error al enviar el correo de recuperación' });
    }
  });
  

  router.post('/reset-password', async (req, res) => {
    const { token, password } = req.body;
  
    try {
      // Verificar el token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
  
      // Encriptar la nueva contraseña
      const hashedPassword = await bcrypt.hash(password, 10);
  
      // Actualizar la contraseña en la base de datos
      const [result] = await pool.query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, decoded.id]);
  
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }
  
      res.status(200).json({ message: 'Contraseña actualizada correctamente' });
    } catch (error) {
      console.error('Error al restablecer la contraseña:', error);
      res.status(500).json({ error: 'Error al restablecer la contraseña' });
    }
  });
  
  

export default router;
