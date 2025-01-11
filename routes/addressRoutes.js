import express from "express";
import {
  getDepartments,
  getProvinces,
  getDistricts,
  getAddressId,
} from "../controllers/addressController.js";

const router = express.Router();

// Obtener departamentos
router.get("/departments", getDepartments);

// Obtener provincias por departamento
router.get("/provinces/:department", getProvinces);

// Obtener distritos por provincia
router.get("/districts/:province", getDistricts);

// Obtener ADDRESS_ID por departamento, provincia y distrito
router.post("/address-id", getAddressId);

export default router;
