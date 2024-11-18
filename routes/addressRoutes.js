import express from "express";
import pool from "../db.js";

const router = express.Router();

// Obtener departamentos
router.get("/departments", async (req, res) => {
  try {
    const [departments] = await pool.query(
      "SELECT DISTINCT DEPARTMENT FROM ADDRESS"
    );
    res.status(200).json(departments);
  } catch (error) {
    console.error("Error al obtener departamentos:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
});

// Obtener provincias
router.get("/provinces/:department", async (req, res) => {
    const { department } = req.params;
  
    try {
      const [provinces] = await pool.query(
        "SELECT DISTINCT PROVINCE FROM ADDRESS WHERE DEPARTMENT = ?",
        [department]
      );
      res.status(200).json(provinces);
    } catch (error) {
      console.error("Error al obtener provincias:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });
  

// Obtener distritos
router.get("/districts/:province", async (req, res) => {
  const { province } = req.params;

  try {
    const [districts] = await pool.query(
      "SELECT DISTINCT DISTRICT FROM ADDRESS WHERE PROVINCE = ?",
      [province]
    );
    res.status(200).json(districts);
  } catch (error) {
    console.error("Error al obtener distritos:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
});

// Obtener ADDRESS_ID
router.get("/address-id", async (req, res) => {
  const { department, province, district } = req.query;

  try {
    const [address] = await pool.query(
      "SELECT ADDRESS_ID FROM ADDRESS WHERE DEPARTMENT = ? AND PROVINCE = ? AND DISTRICT = ?",
      [department, province, district]
    );

    if (address.length === 0) {
      return res.status(404).json({ message: "Dirección no encontrada" });
    }

    res.status(200).json({ addressId: address[0].ADDRESS_ID });
  } catch (error) {
    console.error("Error al obtener ADDRESS_ID:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
});

export default router;
