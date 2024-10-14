import express from 'express';
import bcrypt from 'bcryptjs';
import pool from '../db.js';
import jwt from 'jsonwebtoken';
import axios from 'axios';

const router = express.Router();

router.post('/login', async (req, res) => {
  const { email, password, recaptchaToken } = req.body;

  if (!recaptchaToken) {
    return res.status(400).json({ error: 'El token de reCAPTCHA es requerido.' });
  }

  // Verificar el token de reCAPTCHA con Google
  try {
    const recaptchaResponse = await axios.post(
      `https://www.google.com/recaptcha/api/siteverify?secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${recaptchaToken}`
    );

    if (!recaptchaResponse.data.success) {
      return res.status(400).json({ error: 'Error de verificación reCAPTCHA. Inténtalo de nuevo.' });
    }


    // Continuar con el proceso de autenticación
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no válido, favor de registrarse' });
    }

    const user = rows[0];

    if (!user.verified) {
      return res.status(401).json({ error: 'Correo no verificado. Por favor, verifica tu correo antes de iniciar sesión.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ error: 'Contraseña incorrecta' });
    }

    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.status(200).json({
      message: 'Login exitoso',
      token,
      username: user.username
    });
  } catch (error) {
    console.error('Error al iniciar sesión:', error);
    res.status(500).json({ error: 'Error al iniciar sesión' });
  }
});

export default router;
