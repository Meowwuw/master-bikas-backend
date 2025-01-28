import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import pool from "../config/db.js";

// Controlador para registrar un usuario
export const registerUser = async (req, res) => {
  const {
    names,
    lastName,
    gender,
    email,
    countryCode = "+51",
    telephone,
    birthdate,
    password,
  } = req.body;

  try {
    // Verificar si el correo ya está registrado
    const [existingUser] = await pool.query(
      "SELECT * FROM USERS WHERE EMAIL = ?",
      [email]
    );
    if (existingUser.length > 0) {
      return res.status(400).json({ error: "El correo ya está registrado." });
    }

    // Verificar si el número de teléfono ya está registrado
    const [existingPhone] = await pool.query(
      "SELECT * FROM USERS WHERE TELEPHONE = ?",
      [telephone]
    );
    if (existingPhone.length > 0) {
      return res
        .status(400)
        .json({ error: "El número de teléfono ya está registrado." });
    }

    // Encriptar la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generar el apodo
    const nickname = `${names.charAt(0).toUpperCase()}${
      lastName.split(" ")[0]
    }`;

    // Obtener la fecha actual en la zona horaria de Perú
    const now = new Date();
    const peruDate = new Date(
      now.toLocaleString("en-US", { timeZone: "America/Lima" })
    );
    const formattedPeruTime =
      peruDate.getFullYear() +
      "-" +
      String(peruDate.getMonth() + 1).padStart(2, "0") +
      "-" +
      String(peruDate.getDate()).padStart(2, "0") +
      " " +
      String(peruDate.getHours()).padStart(2, "0") +
      ":" +
      String(peruDate.getMinutes()).padStart(2, "0") +
      ":" +
      String(peruDate.getSeconds()).padStart(2, "0");

    console.log("Hora actual de Perú:", formattedPeruTime);

    // Insertar el nuevo usuario en la base de datos
    const [result] = await pool.query(
      `INSERT INTO USERS 
      (NAMES, LAST_NAME, NICKNAME, GENDER, EMAIL, COUNTRY_CODE, TELEPHONE, BIRTHDATE, PASSWORD, POINTS, STATUS, 
      REMAINING_ATTEMPTS, VERIFIED, CREATED_AT, UPDATED_AT) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
        1, // Estado activo
        2, // Intentos restantes
        0, // Cuenta no verificada
        formattedPeruTime, // Hora de creación
        formattedPeruTime, // Hora de actualización
      ]
    );

    console.log("Usuario insertado con ID:", result.insertId);

    // Generar un token de verificación
    const verificationToken = jwt.sign(
      { id: result.insertId, email },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    // Crear el enlace de verificación
    const verificationLink = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;

    // Configurar el transporte de nodemailer
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Correo Html
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Bienvenido a Master Bikas - Verifica tu correo electrónico",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Verificación de correo - MASTER BIKAS</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: Arial, sans-serif;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
  <tr>
    <td align="center" style="padding: 40px 0;">
      <table role="presentation" style="max-width: 600px; width: 100%; background: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
        
        <!-- Main Content -->
        <tr>
          <td style="padding: 20px 40px;">
            <h1 style="color: #1a1a1a; font-size: 24px; margin: 0 0 20px; text-align: center;">
              ¡Bienvenido a MASTER BIKAS!
            </h1>
            <p style="color: #4b5563; font-size: 16px; line-height: 24px; margin: 0 0 20px;">
              Gracias por unirte a nuestra comunidad. Para comenzar a disfrutar de todos los beneficios, por favor verifica tu dirección de correo electrónico.
            </p>
            
            <!-- Button -->
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
              <tr>
                <td align="center" style="padding: 30px 0;">
                  <a href="${verificationLink}" 
                     target="_blank"
                     style="background-color: #0cc0df; color: white; padding: 12px 30px; border-radius: 6px; text-decoration: none; font-weight: bold; display: inline-block; font-size: 16px;">
                    Verificar mi correo
                  </a>
                </td>
              </tr>
            </table>
            
            <p style="color: #6b7280; font-size: 14px; text-align: center; margin: 20px 0 0;">
              Este enlace expirará en 1 hora por motivos de seguridad.
            </p>
          </td>
        </tr>
        
        <!-- Footer -->
        <tr>
          <td style="background-color: #f9fafb; padding: 20px 40px; border-radius: 0 0 8px 8px;">
            <p style="color: #6b7280; font-size: 12px; text-align: center; margin: 0;">
              Si no has solicitado esta verificación, puedes ignorar este correo.
            </p>
            <div style="text-align: center; margin-top: 20px;">
              <a href="wa.me/+51921346549" style="color: #0cc0df; text-decoration: none; margin: 0 10px;">Whatsapp</a>
              <a href="https://www.facebook.com/profile.php?id=61566966383351" style="color: #0cc0df; text-decoration: none; margin: 0 10px;">Facebook</a>
              <a href="https://www.instagram.com/master.bikas/" style="color: #0cc0df; text-decoration: none; margin: 0 10px;">Instagram</a>
            </div>
          </td>
        </tr>
      </table>
      
      <!-- Legal Footer -->
      <table role="presentation" style="max-width: 600px; width: 100%;">
        <tr>
          <td style="padding: 20px 40px;">
            <p style="color: #6b7280; font-size: 12px; text-align: center; margin: 0;">
              © ${new Date().getFullYear()}Master Bikas. Todos los derechos reservados.
            </p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
        </html>
      `,
    };

    // Enviar el correo
    await transporter.sendMail(mailOptions);

    res.status(201).json({
      message:
        "Usuario registrado correctamente. Revisa tu correo para verificar tu cuenta.",
    });
  } catch (error) {
    console.error("Error al registrar el usuario:", error);
    res.status(500).json({ error: "Error al registrar el usuario." });
  }
};

// Controlador para verificar el correo electrónico
export const verifyEmail = async (req, res) => {
  const { token } = req.query;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const email = decoded.email;

    const [result] = await pool.query(
      "UPDATE USERS SET VERIFIED = 1 WHERE EMAIL = ?",
      [email]
    );

    if (result.affectedRows === 0) {
      return res.status(400).json({
        error: "Usuario no encontrado o ya ha sido verificado.",
      });
    }

    res.status(200).json({ message: "Correo verificado exitosamente." });
  } catch (error) {
    console.error("Error al verificar el correo:", error);
    res
      .status(400)
      .json({ error: "Enlace de verificación inválido o expirado." });
  }
};

// Controlador para obtener el perfil del usuario
export const getUserProfile = async (req, res) => {
  const userId = req.user.id;

  try {
    const [profile] = await pool.query(
      `SELECT NAMES, LAST_NAME, GENDER, EMAIL, TELEPHONE, BIRTHDATE, NICKNAME, SCHOOL_NAME, ADDRESS_ID 
       FROM USERS WHERE ID_USER = ?`,
      [userId]
    );

    if (profile.length === 0) {
      return res.status(404).json({ message: "Usuario no encontrado." });
    }

    const userProfile = profile[0];

    if (userProfile.ADDRESS_ID) {
      const [address] = await pool.query(
        `SELECT DEPARTMENT, PROVINCE, DISTRICT 
         FROM ADDRESS WHERE ADDRESS_ID = ?`,
        [userProfile.ADDRESS_ID]
      );

      if (address.length > 0) {
        userProfile.DEPARTMENT = address[0].DEPARTMENT;
        userProfile.PROVINCE = address[0].PROVINCE;
        userProfile.DISTRICT = address[0].DISTRICT;
      }
    }

    res.status(200).json(userProfile);
  } catch (error) {
    console.error("Error al obtener el perfil del usuario:", error);
    res
      .status(500)
      .json({ message: "Error al obtener el perfil del usuario." });
  }
};

//Controlador para actualizar el perfil del usuario
export const updateUserProfile = async (req, res) => {
  const userId = req.user.id; // Obtén el ID del usuario desde el middleware
  const {
    NAMES,
    LAST_NAME,
    EMAIL,
    TELEPHONE,
    BIRTHDATE,
    GENDER,
    NICKNAME,
    SCHOOL_NAME,
    ADDRESS_ID,
  } = req.body;

  try {
    // Verificar si el usuario existe y si ya recibió el bono
    const [user] = await pool.query(
      "SELECT BONUS FROM USERS WHERE ID_USER = ?",
      [userId]
    );

    if (user.length === 0) {
      return res.status(404).json({ message: "Usuario no encontrado." });
    }

    const hasBonus = user[0].BONUS;

    // Actualizar el perfil del usuario
    const query = `
        UPDATE USERS
        SET 
          NAMES = ?,
          LAST_NAME = ?,
          EMAIL = ?,
          TELEPHONE = ?,
          BIRTHDATE = ?,
          GENDER = ?,
          NICKNAME = ?,
          SCHOOL_NAME = ?,
          ADDRESS_ID = ?,
          UPDATED_AT = CURRENT_TIMESTAMP
        WHERE ID_USER = ?`;

    const values = [
      NAMES || null,
      LAST_NAME || null,
      EMAIL || null,
      TELEPHONE || null,
      BIRTHDATE || null,
      GENDER || null,
      NICKNAME || null,
      SCHOOL_NAME || null,
      ADDRESS_ID || null,
      userId,
    ];

    await pool.query(query, values);

    // Si el usuario no ha recibido el bono, asignar 10 puntos
    if (!hasBonus) {
      const bonusQuery = `
          UPDATE USERS 
          SET POINTS = POINTS + 10, BONUS = 1
          WHERE ID_USER = ?`;
      await pool.query(bonusQuery, [userId]);

      return res.status(200).json({
        message: "Perfil completado y se asignaron 10 puntos.",
      });
    }

    res.status(200).json({ message: "Perfil actualizado exitosamente." });
  } catch (error) {
    console.error("Error al actualizar el perfil del usuario:", error);
    res
      .status(500)
      .json({ message: "Error al actualizar el perfil del usuario." });
  }
};

export const getTopUsersByPoints = async (req, res) => {
  try {
    // Consulta para obtener los 3 usuarios con más puntos
    const [rows] = await pool.query(
      "SELECT NAMES, POINTS FROM USERS ORDER BY POINTS DESC LIMIT 3"
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "No se encontraron usuarios." });
    }

    res.status(200).json(rows);
  } catch (error) {
    console.error("Error al obtener los usuarios con más puntos:", error);
    res.status(500).json({ message: "Error interno del servidor." });
  }
};
