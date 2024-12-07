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
    countryCode = '+51', // Valor por defecto
    telephone,
    birthdate,
    password,
  } = req.body;

  try {
    // Verificar si el correo ya está registrado
    const [existingUser] = await pool.query('SELECT * FROM USERS WHERE EMAIL = ?', [email]);
    if (existingUser.length > 0) {
      return res.status(400).json({ error: 'El correo ya está registrado.' });
    }

    // Verificar si el número de teléfono ya está registrado
    const [existingPhone] = await pool.query('SELECT * FROM USERS WHERE TELEPHONE = ?', [telephone]);
    if (existingPhone.length > 0) {
      return res.status(400).json({ error: 'El número de teléfono ya está registrado.' });
    }

    // Encriptar la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generar el apodo
    const nickname = `${names.charAt(0).toUpperCase()}${lastName.split(' ')[0]}`;
    console.log('Apodo generado:', nickname);

    console.log("Datos a insertar:", {
      names,
      lastName,
      nickname,
      gender,
      email,
      countryCode,
      telephone,
      birthdate,
      hashedPassword
      
    });
    

    // Insertar el nuevo usuario en la base de datos
    const [result] = await pool.query(
      `INSERT INTO USERS 
      (NAMES, LAST_NAME, NICKNAME,GENDER, EMAIL, COUNTRY_CODE, TELEPHONE, BIRTHDATE, PASSWORD, POINTS, STATUS, CREATED_AT, UPDATED_AT) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), ?)`,
      [
        names,
        lastName,
        nickname, 
        gender,
        email,
        countryCode,
        telephone,
        birthdate,
        hashedPassword,
        0, // Puntos iniciales
        1, // Estado activo por defecto
        
      ]
    );

    console.log('Usuario insertado con ID:', result.insertId);

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
    console.error('Error al registrar el usuario:', error);
    res.status(500).json({ error: 'Error al registrar el usuario.' });
  }
});

export default router;
