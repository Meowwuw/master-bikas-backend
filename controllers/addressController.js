import pool from "../config/db.js";

// Obtener todos los departamentos
export const getDepartments = async (req, res) => {
  try {
    const [departments] = await pool.query(
      "SELECT DISTINCT DEPARTMENT FROM ADDRESS"
    );
    res.status(200).json(departments);
  } catch (error) {
    console.error("Error al obtener los departamentos:", error);
    res.status(500).json({ message: "Error al obtener los departamentos." });
  }
};

// Obtener provincias según el departamento
export const getProvinces = async (req, res) => {
  const { department } = req.params;
  try {
    const [provinces] = await pool.query(
      "SELECT DISTINCT PROVINCE FROM ADDRESS WHERE DEPARTMENT = ?",
      [department]
    );
    res.status(200).json(provinces);
  } catch (error) {
    console.error("Error al obtener las provincias:", error);
    res.status(500).json({ message: "Error al obtener las provincias." });
  }
};

// Obtener distritos según la provincia
export const getDistricts = async (req, res) => {
  const { province } = req.params;
  try {
    const [districts] = await pool.query(
      "SELECT DISTINCT DISTRICT FROM ADDRESS WHERE PROVINCE = ?",
      [province]
    );
    res.status(200).json(districts);
  } catch (error) {
    console.error("Error al obtener los distritos:", error);
    res.status(500).json({ message: "Error al obtener los distritos." });
  }
};

// Obtener el ADDRESS_ID según departamento, provincia y distrito
export const getAddressId = async (req, res) => {
  const { department, province, district } = req.body;
  try {
    const [address] = await pool.query(
      "SELECT ADDRESS_ID FROM ADDRESS WHERE DEPARTMENT = ? AND PROVINCE = ? AND DISTRICT = ?",
      [department, province, district]
    );

    if (address.length === 0) {
      return res.status(404).json({ message: "Dirección no encontrada." });
    }

    res.status(200).json(address[0]);
  } catch (error) {
    console.error("Error al obtener el ADDRESS_ID:", error);
    res.status(500).json({ message: "Error al obtener el ADDRESS_ID." });
  }
};
