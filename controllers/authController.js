import jwt from "jsonwebtoken";
import pool from "../config/db.js";
import bcrypt from "bcrypt";
import axios from "axios";
import nodemailer from 'nodemailer';


export const login = async (req, res) => {
  const { email, password, recaptchaToken } = req.body;

  // Verificar reCAPTCHA
  try {
    const recaptchaResponse = await axios.post(
      `https://www.google.com/recaptcha/api/siteverify`,
      null,
      {
        params: {
          secret: process.env.RECAPTCHA_SECRET_KEY,
          response: recaptchaToken,
        },
      }
    );

    if (!recaptchaResponse.data.success) {
      return res
        .status(400)
        .json({ error: "Captcha inválido. Intenta nuevamente." });
    }
  } catch (error) {
    console.error("Error al verificar reCAPTCHA:", error);
    return res.status(500).json({ error: "Error al verificar el captcha." });
  }

  // Buscar usuario en la base de datos
  try {
    const [rows] = await pool.query(
      "SELECT ID_USER, NAMES, EMAIL, PASSWORD, VERIFIED, IS_ADMIN FROM USERS WHERE EMAIL = ?",
      [email]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Usuario no encontrado." });
    }

    const user = rows[0];

    // Verificar si el correo está verificado
    if (!user.VERIFIED) {
      return res.status(400).json({
        error:
          "Correo no verificado. Por favor, verifica tu correo antes de iniciar sesión.",
      });
    }

    // Validar contraseña
    const isPasswordValid = await bcrypt.compare(password, user.PASSWORD);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Contraseña incorrecta." });
    }

    // Actualizar el campo LAST_LOGIN con la hora de Perú
    const peruTime = new Date(
      new Date().toLocaleString("en-US", { timeZone: "America/Lima" })
    );

    try {
      await pool.query("UPDATE USERS SET LAST_LOGIN = ? WHERE ID_USER = ?", [
        peruTime,
        user.ID_USER,
      ]);
      console.log(
        `Última fecha de inicio de sesión actualizada para el usuario ${user.ID_USER}`
      );
    } catch (error) {
      console.error(
        "Error al actualizar la última fecha de inicio de sesión:",
        error
      );
    }

    // Generar token JWT
    const token = jwt.sign(
      { id: user.ID_USER, email: user.EMAIL, isAdmin: user.IS_ADMIN },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );


    return res.status(200).json({
      token,
      username: user.NAMES,
      isAdmin: user.IS_ADMIN, 
    });
  } catch (error) {
    console.error("Error al iniciar sesión:", error);
    return res.status(500).json({ error: "Error interno del servidor." });
  }
};

export const getUserPoints = async (req, res) => {
  try {
    const userId = req.user.id;
    const [rows] = await pool.query(
      "SELECT POINTS FROM USERS WHERE ID_USER = ?",
      [userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    res.status(200).json({ points: rows[0].POINTS });
  } catch (error) {
    console.error("Error al obtener los puntos del usuario:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// Cerrar sesion
export const logout = (req, res) => {
  try {
    res.status(200).json({ message: "Sesión cerrada correctamente" });
  } catch (error) {
    console.error("Error al cerrar sesión:", error);
    res.status(500).json({ error: "Error al cerrar sesión" });
  }
};

// Solicitar restablecimiento de contraseña
export const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const [rows] = await pool.query("SELECT * FROM USERS WHERE EMAIL = ?", [email]);

    if (rows.length === 0) {
      return res.status(404).json({ error: "No se encontró un usuario con ese correo" });
    }

    const user = rows[0];

    // Generar el token de restablecimiento de contraseña
    const resetToken = jwt.sign(
      { id: user.ID_USER }, 
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
    

    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Correo a HTML
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Restablece tu contraseña - MASTER BIKAS",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Restablecer contraseña - MASTER BIKAS</title>
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
                          Restablece tu contraseña
                        </h1>
                        <p style="color: #4b5563; font-size: 16px; line-height: 24px; margin: 0 0 20px;">
                          Hemos recibido una solicitud para restablecer la contraseña de tu cuenta Master Bikas. Si no has solicitado este cambio, por favor ignora este mensaje.
                        </p>
                        
                        <!-- Button -->
                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                          <tr>
                            <td align="center" style="padding: 30px 0;">
                              <a href="${resetLink}" 
                                 target="_blank"
                                 style="background-color: #0cc0df; color: white; padding: 12px 30px; border-radius: 6px; text-decoration: none; font-weight: bold; display: inline-block; font-size: 16px;">
                                Restablecer contraseña
                              </a>
                            </td>
                          </tr>
                        </table>
                        
                        <p style="color: #6b7280; font-size: 14px; text-align: center; margin: 20px 0 0;">
                          Por seguridad, este enlace expirará en 1 hora. Si necesitas un nuevo enlace, vuelve a solicitar el restablecimiento de contraseña.
                        </p>
    
                        <p style="color: #4b5563; font-size: 14px; line-height: 20px; margin: 20px 0 0; padding: 20px; background-color: #f9fafb; border-radius: 6px;">
                          <strong style="color: #1a1a1a;">Consejos de seguridad:</strong><br>
                          • Nunca compartas tu contraseña con nadie<br>
                          • Usa una contraseña única y fuerte<br>
                        </p>
                      </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                      <td style="background-color: #f9fafb; padding: 20px 40px; border-radius: 0 0 8px 8px;">
                        <p style="color: #6b7280; font-size: 12px; text-align: center; margin: 0;">
                          Si no has solicitado restablecer tu contraseña, por favor contacta con nuestro equipo de soporte.
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
                          © ${new Date().getFullYear()} Master Bikas. Todos los derechos reservados.
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
        </html>
      `
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: "Correo enviado para restablecer la contraseña" });
  } catch (error) {
    console.error("Error al enviar el correo de recuperación:", error);
    res.status(500).json({ error: "Error al enviar el correo de recuperación" });
  }
};

// Restablecer contraseña
export const resetPassword = async (req, res) => {
  const { token, password } = req.body;

  try {
    // Verificar el token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded.id) {
      return res.status(400).json({ error: "Token inválido" });
    }

    // Encriptar la nueva contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Actualizar la contraseña en la base de datos
    const [result] = await pool.query(
      "UPDATE USERS SET PASSWORD = ? WHERE ID_USER = ?",
      [hashedPassword, decoded.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    res.status(200).json({ message: "Contraseña actualizada correctamente" });
  } catch (error) {
    console.error("Error al restablecer la contraseña:", error);
    res.status(500).json({ error: "Error al restablecer la contraseña" });
  }
};

