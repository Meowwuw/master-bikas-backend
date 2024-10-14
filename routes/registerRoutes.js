import express from 'express';
import bcrypt from 'bcryptjs';
import pool from '../db.js';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';

const router = express.Router();

router.post('/register', async (req, res) => {
  const { username, email, password } = req.body;

  try {

    const [existingUser] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);

    if (existingUser.length > 0) {
      return res.status(400).json({ error: 'El correo ya está registrado.' });
    }

    // Encriptar la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insertar el nuevo usuario en la base de datos (sin activar la cuenta todavía)
    const [result] = await pool.query('INSERT INTO users (username, email, password, points) VALUES (?, ?, ?, ?)', [username, email, hashedPassword, 0]);

    
    // Generar un token de verificación
    const verificationToken = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '1h' });

    // Crear el enlace de verificación
    const verificationLink = `http://localhost:3000/verify-email?token=${verificationToken}`;

    // Configurar el transporte de nodemailer
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Configurar los detalles del correo
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Verifica tu correo electrónico',
      text: `Haz clic en el siguiente enlace para verificar tu correo electrónico: ${verificationLink}`,
    };

    // Enviar el correo
    await transporter.sendMail(mailOptions);

    res.status(201).json({ message: 'Usuario registrado correctamente. Revisa tu correo para verificar tu cuenta.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al registrar el usuario' });
  }
});

export default router;
