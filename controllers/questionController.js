import pool from "../config/db.js";

export const createCustomQuestion = async (req, res) => {
  const {
    COURSE_ID,
    USER_COURSE,
    SCHOOL_CATEGORY,
    SCHOOL_NAME,
    CUSTOM_QUESTION_URL,
    CUSTOM_PAYMENT_URL,
    WHATSAPP_OPTION,
  } = req.body;

  const userId = req.user.id;

  console.log("Datos recibidos en el backend:", {
    COURSE_ID,
    USER_COURSE,
    SCHOOL_CATEGORY,
    SCHOOL_NAME,
    CUSTOM_QUESTION_URL,
    CUSTOM_PAYMENT_URL,
    WHATSAPP_OPTION,
  });

  if (!COURSE_ID && !USER_COURSE) {
    return res.status(400).json({
      message: "Se requiere un COURSE_ID o un USER_COURSE válido.",
    });
  }

  if (!SCHOOL_CATEGORY || (!CUSTOM_QUESTION_URL && !WHATSAPP_OPTION)) {
    return res.status(400).json({
      message: "Faltan datos obligatorios.",
    });
  }

  const amount =
    SCHOOL_CATEGORY.toLowerCase() === "colegio" ||
    SCHOOL_CATEGORY.toLowerCase() === "academia"
      ? 1
      : SCHOOL_CATEGORY.toLowerCase() === "instituto" ||
        SCHOOL_CATEGORY.toLowerCase() === "universidad"
      ? 3
      : null;

  if (amount === null) {
    return res.status(400).json({ message: "Categoría de escuela inválida." });
  }

  try {
    let courseName = null;

    if (COURSE_ID) {
      const [rows] = await pool.query(
        `SELECT COURSE_NAME FROM COURSES WHERE COURSE_ID = ?`,
        [COURSE_ID]
      );

      if (rows.length === 0) {
        return res
          .status(404)
          .json({ message: `No se encontró un curso con ID ${COURSE_ID}.` });
      }

      courseName = rows[0].COURSE_NAME;
    }

    const peruTime = new Date(
      new Date().toLocaleString("en-US", { timeZone: "America/Lima" })
    );

    const today = peruTime.toISOString().split("T")[0];

    const [ticketCount] = await pool.query(
      `SELECT COUNT(*) AS count FROM CUSTOM_QUESTION WHERE DATE(CREATED_AT) = ?`,
      [today]
    );

    const dailyTicketNumber = ticketCount[0].count + 1;

    const query = `
      INSERT INTO CUSTOM_QUESTION 
      (ID_USER, COURSE_ID, USER_COURSE, COURSE_NAME, SCHOOL_CATEGORY, SCHOOL_NAME, AMOUNT, CUSTOM_QUESTION_URL, CUSTOM_PAYMENT_URL, WHATSAPP_OPTION, CREATED_AT) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    const [result] = await pool.query(query, [
      userId,
      COURSE_ID || null,
      USER_COURSE || null,
      courseName || USER_COURSE || null,
      SCHOOL_CATEGORY,
      SCHOOL_NAME || null,
      amount,
      CUSTOM_QUESTION_URL || null,
      CUSTOM_PAYMENT_URL || null,
      WHATSAPP_OPTION || false,
      peruTime,
    ]);

    const ticketId = `${today.replace(/-/g, "")}-${dailyTicketNumber}`;

    res.status(201).json({
      message: "Pregunta creada exitosamente",
      ticketId,
    });
  } catch (error) {
    console.error("Error al crear la pregunta personalizada:", error);
    res.status(500).json({ message: "Error interno del servidor." });
  }
};

export const getCustomQuestions = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        cq.CUSTOM_ID AS ID,
        u.NAMES AS NAMES,
        u.EMAIL AS EMAIL,
        u.TELEPHONE AS TELEPHONE,
        cq.CUSTOM_QUESTION_URL AS QUESTION,
        cq.CUSTOM_PAYMENT_URL AS PAYMENT_EVIDENCE,
        cq.WHATSAPP_OPTION AS WHATSAPP,
        cq.CREATED_AT AS CREATED_AT
      FROM CUSTOM_QUESTION cq
      LEFT JOIN USERS u ON cq.ID_USER = u.ID_USER
      ORDER BY cq.CREATED_AT DESC
    `);

    if (rows.length === 0) {
      return res.status(404).json({ message: "No se encontraron preguntas personalizadas." });
    }

    res.status(200).json(rows);
  } catch (error) {
    console.error("Error al obtener preguntas personalizadas:", error);
    res.status(500).json({ message: "Error interno del servidor." });
  }
};



