import express from 'express';
import bcrypt from 'bcryptjs';
import pool from '../db.js';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';

const router = express.Router();

router.post('/register', async (req, res) => {
  const {
    names,
    lastName,
    gender,
    email,
    countryCode,
    telephone,
    birthdate,
    password,
  } = req.body;

  try {
    // Verificar si el correo ya está registrado
    const [existingUser] = await pool.query('SELECT * FROM USERS WHERE email = ?', [email]);

    if (existingUser.length > 0) {
      return res.status(400).json({ error: 'El correo ya está registrado.' });
    }

    // Verificar si el número de teléfono ya está registrado
    const [existingPhone] = await pool.query('SELECT * FROM USERS WHERE telephone = ?', [telephone]);

    if (existingPhone.length > 0) {
      return res.status(400).json({ error: 'El número de teléfono ya está registrado.' });
    }

    // Encriptar la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insertar el nuevo usuario en la base de datos
    const [result] = await pool.query(
      `INSERT INTO USERS 
      (names, last_name, gender, email, country_code, telephone, birthdate, password, points, status, created_at, updated_at) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        names,
        lastName,
        gender,
        email,
        countryCode,
        telephone,
        birthdate,
        hashedPassword,
        0, // Points inicial
        1, // Status activo por defecto
      ]
    );

    // Generar un token de verificación
    const verificationToken = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '1h' });

    // Crear el enlace de verificación
    const verificationLink = `http://54.165.220.109:3000/api/users/verify-email?token=${verificationToken}`;

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

    res.status(201).json({
      message: 'Usuario registrado correctamente. Revisa tu correo para verificar tu cuenta.',
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al registrar el usuario' });
  }
});

export default router;
