import pool from "../config/db.js";

export const getRemainingAttempts = async (req, res) => {
  try {
    const [user] = await pool.query(
      "SELECT REMAINING_ATTEMPTS FROM USERS WHERE ID_USER = ?",
      [req.user.id]
    );

    if (user.length === 0) {
      return res.status(404).json({ message: "Usuario no encontrado." });
    }

    res.status(200).json({ remaining_attempts: user[0].REMAINING_ATTEMPTS });
  } catch (error) {
    console.error("Error al obtener los intentos restantes:", error);
    res
      .status(500)
      .json({ message: "Error al obtener los intentos restantes." });
  }
};

export const useAttempt = async (req, res) => {
  try {
    const [user] = await pool.query(
      "SELECT REMAINING_ATTEMPTS FROM USERS WHERE ID_USER = ?",
      [req.user.id]
    );

    if (user.length === 0) {
      return res.status(404).json({ message: "Usuario no encontrado." });
    }

    if (user[0].REMAINING_ATTEMPTS > 0) {
      const [result] = await pool.query(
        "UPDATE USERS SET REMAINING_ATTEMPTS = REMAINING_ATTEMPTS - 1 WHERE ID_USER = ?",
        [req.user.ID_USER]
      );

      if (result.affectedRows === 0) {
        return res
          .status(500)
          .json({ message: "Error al reducir los intentos." });
      }

      res.status(200).json({
        message: "Intento usado con éxito.",
        remaining_attempts: user[0].REMAINING_ATTEMPTS - 1,
      });
    } else {
      res.status(403).json({
        message:
          "No tienes más intentos. Debes realizar un pago para continuar.",
      });
    }
  } catch (error) {
    console.error("Error al usar intento:", error);
    res.status(500).json({ message: "Error al usar intento." });
  }
};

export const useAttemptToUnlock = async (req, res) => {
  const { questionId } = req.params;
  const userId = req.user.id;

  try {
    const [attempts] = await pool.query(
      "SELECT REMAINING_ATTEMPTS FROM USERS WHERE ID_USER = ?",
      [userId]
    );

    if (attempts.length === 0 || attempts[0].REMAINING_ATTEMPTS <= 0) {
      return res
        .status(403)
        .json({ message: "No tienes intentos disponibles. Realiza un pago." });
    }

    await pool.query(
      "UPDATE USERS SET REMAINING_ATTEMPTS = REMAINING_ATTEMPTS - 1 WHERE ID_USER = ?",
      [userId]
    );

    const [answer] = await pool.query(
      "SELECT LINK FROM ANSWER WHERE QUESTION_ID = ?",
      [questionId]
    );

    if (answer.length === 0) {
      return res
        .status(404)
        .json({ message: "No se encontró la respuesta para esta pregunta." });
    }

    res.status(200).json({
      message: "Respuesta desbloqueada temporalmente usando un intento.",
      answerLink: answer[0].LINK,
    });
  } catch (error) {
    console.error("Error al usar intento para desbloquear respuesta:", error);
    res.status(500).json({
      message: "Error al desbloquear la respuesta usando un intento.",
    });
  }
};


export const getUserEmail = async (req, res) => {
  const { userId } = req.params;

  try {
    const [user] = await pool.query(
      "SELECT EMAIL FROM USERS WHERE ID_USER = ?",
      [userId]
    );

    if (user.length === 0) {
      return res.status(404).json({ message: "Usuario no encontrado." });
    }

    res.status(200).json({ email: user[0].EMAIL });
  } catch (error) {
    console.error("Error al obtener el correo del usuario:", error);
    res
      .status(500)
      .json({ message: "Error al obtener el correo del usuario." });
  }
};
